const Grade = require('../models/Grade');
const SavedStudyPlan = require('../models/SavedStudyPlan');
const { CORRELATIVA_STATES } = require('./gradeState');

/**
 * Recalcula un plan de estudios guardado tras cargar/modificar notas.
 *
 * Para cada período transcurrido (pasado según fecha actual):
 * 1. Materias aprobadas → se eliminan del plan (ya están hechas).
 * 2. Materias NO aprobadas → se marcan como "retrasadas".
 * 3. Cascade: toda materia futura que tenga como correlativa una retrasada
 *    también se atrasa un cuatrimestre.
 * 4. Se eliminan períodos vacíos resultantes.
 * 5. Se extiende el plan si los retrasos generan nuevos cuatrimestres.
 *
 * Devuelve { plan, materiasRetrasadas }.
 */
async function recalcularPlanGuardado(studentId, savedPlanId) {
  const plan = await SavedStudyPlan.findOne({ _id: savedPlanId, estudiante: studentId });
  if (!plan) return { plan: null, materiasRetrasadas: [] };

  const grades = await Grade.find({ estudiante: studentId });
  const approvedIds = new Set(
    grades.filter((g) => CORRELATIVA_STATES.includes(g.estado)).map((g) => g.materia.toString())
  );
  const desaprobadasIds = new Set(
    grades.filter((g) => g.estado === 'Desaprobado').map((g) => g.materia.toString())
  );

  const now = new Date();
  const anioActual = now.getFullYear();
  const cuatrimestreActual = now.getMonth() < 6 ? 1 : 2;

  const esTranscurrido = (p) =>
    p.anio < anioActual || (p.anio === anioActual && p.cuatrimestre <= cuatrimestreActual);

  const planMap = new Map();
  plan.periodos.forEach((p) => {
    p.materias.forEach((m) => {
      if (m.materia) planMap.set(m.materia.toString(), m);
    });
  });

  const dependientes = new Map();
  for (const m of planMap.values()) {
    for (const c of m.correlativas || []) {
      const cid = c.toString ? c.toString() : c;
      const arr = dependientes.get(cid) || [];
      arr.push(m.materia.toString());
      dependientes.set(cid, arr);
    }
  }

  const atrasadas = new Set();
  const materiasRetrasadas = [];

  for (const periodo of plan.periodos) {
    const esTrasc = esTranscurrido(periodo);

    for (const materia of periodo.materias) {
      const mId = materia.materia?.toString() || materia.materia;
      if (!mId) continue;

      if (approvedIds.has(mId)) continue;

      // En un período transcurrido: si no está aprobada, está retrasada.
      // En un período futuro: si ya tiene nota Desaprobada, también (ya la perdió y hay que recursar).
      if (!esTrasc && !desaprobadasIds.has(mId)) continue;

      atrasadas.add(mId);
      materiasRetrasadas.push({
        materia: materia.materia,
        nombre: materia.nombre,
        codigo: materia.codigo,
        periodoOrigen: `${periodo.anio}C${periodo.cuatrimestre}`,
        periodoNuevo: 'pendiente'
      });
    }
  }

  if (materiasRetrasadas.length === 0) {
    if (plan.ultimoRecalculo && plan.ultimoRecalculo.materiasRetrasadas &&
        plan.ultimoRecalculo.materiasRetrasadas.length > 0) {
      plan.ultimoRecalculo = { fecha: new Date(), materiasRetrasadas: [] };
      await plan.save();
    }
    return { plan, materiasRetrasadas: [] };
  }

  // Eliminar materias aprobadas de períodos transcurridos
  // (las desaprobadas NO se eliminan aquí; se mueven un período adelante más abajo)
  for (const periodo of plan.periodos) {
    if (!esTranscurrido(periodo)) continue;
    const antes = periodo.materias.length;
    periodo.materias = periodo.materias.filter((m) => {
      const mId = m.materia?.toString() || m.materia;
      return approvedIds.has(mId);
    });
    if (periodo.materias.length < antes) {
      periodo.horasUsadas = periodo.materias.reduce(
        (s, m) => s + (m.horasSemanalesEstimadas || m.creditos || 0), 0
      );
    }
  }

  // Reconstruir timeline desplazando retrasados
  const maxOriginal = plan.periodos.length;
  const timeline = [];
  for (let i = 0; i < maxOriginal + materiasRetrasadas.length; i++) {
    if (i < plan.periodos.length) {
      const p = plan.periodos[i];
      timeline.push({ anio: p.anio, cuatrimestre: p.cuatrimestre, materias: [...p.materias] });
    } else {
      const prev = timeline[i - 1];
      timeline.push(
        prev.cuatrimestre === 1
          ? { anio: prev.anio, cuatrimestre: 2, materias: [] }
          : { anio: prev.anio + 1, cuatrimestre: 1, materias: [] }
      );
    }
  }

  const movidas = new Set();
  for (const mr of materiasRetrasadas) {
    const mId = mr.materia?.toString() || mr.materia;
    if (movidas.has(mId)) continue;

    let idxActual = -1;
    for (let i = 0; i < timeline.length; i++) {
      if (timeline[i].materias.some((m) => (m.materia?.toString() || m.materia) === mId)) {
        idxActual = i;
        break;
      }
    }
    if (idxActual === -1) continue;

    const materiaObj = timeline[idxActual].materias.find(
      (m) => (m.materia?.toString() || m.materia) === mId
    );
    if (!materiaObj) continue;

    const nuevoIdx = idxActual + 1;

    if (nuevoIdx >= timeline.length) {
      const prev = timeline[timeline.length - 1];
      timeline.push(
        prev.cuatrimestre === 1
          ? { anio: prev.anio, cuatrimestre: 2, materias: [] }
          : { anio: prev.anio + 1, cuatrimestre: 1, materias: [] }
      );
    }

    timeline[idxActual].materias = timeline[idxActual].materias.filter(
      (m) => (m.materia?.toString() || m.materia) !== mId
    );
    timeline[nuevoIdx].materias.push(materiaObj);

    mr.periodoNuevo = `${timeline[nuevoIdx].anio}C${timeline[nuevoIdx].cuatrimestre}`;

    // Cascade: empujar dependientes, cada uno al menos 1 período después de su prerequisito
    // posicionesReal tracking the actual period index where each moved subject ended up
    const posicionesReal = new Map();
    posicionesReal.set(mId, nuevoIdx);

    const cola = [mId];
    const visitados = new Set([mId]);
    let guard = 0;
    while (cola.length > 0 && guard++ < 1000) {
      const actual = cola.shift();
      const posPadre = posicionesReal.get(actual);
      const dependientesIds = dependientes.get(actual) || [];
      for (const depId of dependientesIds) {
        if (visitados.has(depId)) continue;
        visitados.add(depId);

        let depIdx = -1;
        for (let i = 0; i < timeline.length; i++) {
          if (timeline[i].materias.some((m) => (m.materia?.toString() || m.materia) === depId)) {
            depIdx = i;
            break;
          }
        }
        if (depIdx === -1) continue;

        const depNuevoIdx = Math.max(depIdx, posPadre + 1);

        if (depNuevoIdx === depIdx) continue;

        while (depNuevoIdx >= timeline.length) {
          const prev = timeline[timeline.length - 1];
          timeline.push(
            prev.cuatrimestre === 1
              ? { anio: prev.anio, cuatrimestre: 2, materias: [] }
              : { anio: prev.anio + 1, cuatrimestre: 1, materias: [] }
          );
        }

        const depMateria = timeline[depIdx].materias.find(
          (m) => (m.materia?.toString() || m.materia) === depId
        );
        if (depMateria) {
          timeline[depIdx].materias = timeline[depIdx].materias.filter(
            (m) => (m.materia?.toString() || m.materia) !== depId
          );
          timeline[depNuevoIdx].materias.push(depMateria);

          materiasRetrasadas.push({
            materia: depMateria.materia,
            nombre: depMateria.nombre,
            codigo: depMateria.codigo,
            periodoOrigen: `${timeline[depIdx].anio}C${timeline[depIdx].cuatrimestre}`,
            periodoNuevo: `${timeline[depNuevoIdx].anio}C${timeline[depNuevoIdx].cuatrimestre}`
          });
          movidas.add(depId);
        }

        posicionesReal.set(depId, depNuevoIdx);
        cola.push(depId);
      }
    }
    movidas.add(mId);
  }

  // Reconstruir periodos finales
  plan.periodos = timeline
    .filter((t) => t.materias.length > 0)
    .map((t) => ({
      anio: t.anio,
      cuatrimestre: t.cuatrimestre,
      horasUsadas: t.materias.reduce(
        (s, m) => s + (m.horasSemanalesEstimadas || m.creditos || 0), 0
      ),
      materias: t.materias
    }));

  plan.ultimoRecalculo = {
    fecha: new Date(),
    materiasRetrasadas
  };

  await plan.save();
  return { plan, materiasRetrasadas };
}

async function recalcularPlanesDelEstudiante(userId) {
  try {
    const planes = await SavedStudyPlan.find({ estudiante: userId });
    for (const plan of planes) {
      await recalcularPlanGuardado(userId, plan._id);
    }
  } catch (_) {
    // Silencioso: el recálculo es best-effort, no debe bloquear la carga de notas.
  }
}

module.exports = { recalcularPlanGuardado, recalcularPlanesDelEstudiante };
