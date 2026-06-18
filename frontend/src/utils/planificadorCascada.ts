export interface MateriaPlanificable {
  _id: string;
  correlativas?: string[];
  correlativasEnCurso?: string[];
  creditos: number;
  horasSemanalesEstimadas?: number;
}

export interface PeriodoPlan<M extends MateriaPlanificable> {
  anio: number;
  cuatrimestre: number;
  horasUsadas: number;
  materias: M[];
}

export interface ResultadoMovimiento<M extends MateriaPlanificable> {
  periodos: PeriodoPlan<M>[];
  movidas: string[];
}

/**
 * Reacomoda el plan al mover una materia a un cuatrimestre destino, en cascada:
 * - Atrasar (destino posterior): empuja hacia adelante a las materias que dependen
 *   de la movida, lo mínimo necesario.
 * - Adelantar (destino anterior): trae hacia adelante a sus correlativas; la materia
 *   nunca baja de su cuatrimestre más temprano factible.
 * Las materias no relacionadas no se mueven. El resultado siempre es válido.
 */
export function moverMateriaConCascada<M extends MateriaPlanificable>(
  periodos: PeriodoPlan<M>[],
  materiaId: string,
  destinoIdx: number,
  opciones: { primerPeriodoIdx?: number } = {}
): ResultadoMovimiento<M> {
  const primerPeriodoIdx = opciones.primerPeriodoIdx ?? 0;

  const idxOf = new Map<string, number>();
  const porId = new Map<string, M>();
  const dependientes = new Map<string, string[]>(); // correlativaId -> [materiaId, ...]

  periodos.forEach((p, i) => {
    p.materias.forEach((m) => {
      idxOf.set(m._id, i);
      porId.set(m._id, m);
    });
  });
  for (const m of porId.values()) {
    for (const c of m.correlativas ?? []) {
      if (!porId.has(c)) continue;
      const arr = dependientes.get(c) ?? [];
      arr.push(m._id);
      dependientes.set(c, arr);
    }
  }

  const origen = idxOf.get(materiaId);
  if (origen === undefined) return { periodos, movidas: [] };

  const pisoDe = (id: string): number => {
    const m = porId.get(id);
    return primerPeriodoIdx + (((m?.correlativasEnCurso?.length ?? 0) > 0) ? 1 : 0);
  };

  // Cuatrimestre mínimo absoluto de una materia: profundidad de su cadena de
  // correlativas (dentro del plan) más su piso.
  const memoNivel = new Map<string, number>();
  const nivelMin = (id: string, visitando = new Set<string>()): number => {
    const cacheado = memoNivel.get(id);
    if (cacheado !== undefined) return cacheado;
    if (visitando.has(id)) return pisoDe(id); // guardia anti-ciclo
    visitando.add(id);
    let nivel = pisoDe(id);
    for (const c of porId.get(id)?.correlativas ?? []) {
      if (!porId.has(c)) continue;
      nivel = Math.max(nivel, nivelMin(c, visitando) + 1);
    }
    visitando.delete(id);
    memoNivel.set(id, nivel);
    return nivel;
  };

  const original = new Map(idxOf);
  const destino = Math.max(primerPeriodoIdx, destinoIdx);

  if (destino > origen) {
    // ATRASAR: empujar dependientes hacia adelante.
    idxOf.set(materiaId, destino);
    const cola = [materiaId];
    let guard = 0;
    while (cola.length && guard++ < 100000) {
      const x = cola.shift() as string;
      const need = (idxOf.get(x) as number) + 1;
      for (const d of dependientes.get(x) ?? []) {
        if ((idxOf.get(d) as number) < need) {
          idxOf.set(d, need);
          cola.push(d);
        }
      }
    }
  } else if (destino < origen) {
    // ADELANTAR: traer correlativas hacia adelante; la materia no baja de su nivel mínimo.
    idxOf.set(materiaId, Math.max(destino, nivelMin(materiaId)));
    const guard = { n: 0 };
    const tirar = (x: string): void => {
      if (guard.n++ > 100000) return;
      for (const c of porId.get(x)?.correlativas ?? []) {
        if (!porId.has(c)) continue;
        if ((idxOf.get(c) as number) >= (idxOf.get(x) as number)) {
          idxOf.set(c, (idxOf.get(x) as number) - 1); // garantizado >= nivelMin(c)
          tirar(c);
        }
      }
    };
    tirar(materiaId);
  }

  // Reconstruir el calendario preservando anio/cuatrimestre de los cuatrimestres
  // originales y generando los nuevos al final.
  const maxIdx = Math.max(...idxOf.values());
  const calendario: { anio: number; cuatrimestre: number }[] = [];
  for (let i = 0; i <= maxIdx; i++) {
    if (i < periodos.length) {
      calendario.push({ anio: periodos[i].anio, cuatrimestre: periodos[i].cuatrimestre });
    } else {
      const prev = calendario[i - 1];
      calendario.push(
        prev.cuatrimestre === 1
          ? { anio: prev.anio, cuatrimestre: 2 }
          : { anio: prev.anio + 1, cuatrimestre: 1 }
      );
    }
  }

  const horasDe = (ms: M[]) =>
    ms.reduce((s, m) => s + (m.horasSemanalesEstimadas ?? m.creditos ?? 0), 0);

  const nuevos: PeriodoPlan<M>[] = calendario.map((c) => ({
    ...c,
    horasUsadas: 0,
    materias: [] as M[],
  }));
  for (const [id, i] of idxOf) nuevos[i].materias.push(porId.get(id) as M);
  nuevos.forEach((p) => {
    p.horasUsadas = horasDe(p.materias);
  });
  while (nuevos.length > 1 && nuevos[nuevos.length - 1].materias.length === 0) nuevos.pop();

  const movidas: string[] = [];
  for (const [id, i] of idxOf) if (original.get(id) !== i) movidas.push(id);

  return { periodos: nuevos, movidas };
}

/** Valida que toda correlativa esté en un cuatrimestre estrictamente anterior y que
 * las materias con correlativas en curso no caigan en el primer cuatrimestre. */
export function planEsValido<M extends MateriaPlanificable>(
  periodos: PeriodoPlan<M>[],
  primerPeriodoIdx = 0
): boolean {
  const idxOf = new Map<string, number>();
  periodos.forEach((p, i) => p.materias.forEach((m) => idxOf.set(m._id, i)));
  for (let i = 0; i < periodos.length; i++) {
    for (const m of periodos[i].materias) {
      for (const c of m.correlativas ?? []) {
        if (idxOf.has(c) && (idxOf.get(c) as number) >= i) return false;
      }
      if ((m.correlativasEnCurso?.length ?? 0) > 0 && i === primerPeriodoIdx) return false;
    }
  }
  return true;
}
