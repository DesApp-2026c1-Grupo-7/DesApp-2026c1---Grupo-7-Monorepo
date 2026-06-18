# Planificador con cascada de correlativas — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que al mover una materia en el planificador del Asistente Académico, el resto se reacomode en cascada (atrasando dependientes o adelantando correlativas) en vez de bloquear, con drag & drop y feedback visual.

**Architecture:** Toda la lógica de movimiento vive en una función pura nueva (`frontend/src/utils/planificadorCascada.ts`), testeada con Vitest. El componente `AcademicAssistant.tsx` la invoca tanto desde los botones ◀▶ como desde un nuevo drag & drop (`@dnd-kit/core`). Sin cambios de backend.

**Tech Stack:** React 19 + TypeScript + Vite, Vitest (nuevo), `@dnd-kit/core` (nuevo), Cypress (existente).

**Spec:** [`docs/superpowers/specs/2026-06-18-planificador-cascada-correlativas-design.md`](../specs/2026-06-18-planificador-cascada-correlativas-design.md)

---

## File Structure

- **Crear** `frontend/src/utils/planificadorCascada.ts` — función pura `moverMateriaConCascada` + helper `planEsValido` + tipos. Única responsabilidad: reacomodar el plan.
- **Crear** `frontend/src/utils/planificadorCascada.test.ts` — tests unitarios de la función pura.
- **Crear** `frontend/vitest.config.ts` — config de Vitest (entorno node, sólo `src/**/*.test.ts`).
- **Modificar** `frontend/package.json` — devDeps (`vitest`, `@dnd-kit/core`) + script `test`.
- **Modificar** `frontend/src/pages/student/AcademicAssistant.tsx` — usar la función pura desde botones y desde drag & drop; resaltado + aviso.
- **Modificar** `frontend/src/styles/AcademicAssistant.css` — clase de pulso para materias reacomodadas + estilos de arrastre.
- **Crear** `frontend/cypress/e2e/cascada.cy.ts` — E2E del reacomodo en cascada vía botones.

---

## Task 1: Configurar Vitest en el frontend

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create (temporal): `frontend/src/utils/smoke.test.ts`

- [ ] **Step 1: Instalar Vitest**

Run:
```bash
cd frontend && npm install -D vitest@^3
```
Expected: se agrega `vitest` a `devDependencies` sin errores de peer deps.

- [ ] **Step 2: Crear la config de Vitest**

Create `frontend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Agregar el script `test`**

Modify `frontend/package.json` — en `"scripts"`, agregar:
```json
"test": "vitest run"
```
(dejar las demás líneas de scripts intactas)

- [ ] **Step 4: Crear un test de humo para verificar el runner**

Create `frontend/src/utils/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('vitest', () => {
  it('corre', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Correr el test de humo**

Run:
```bash
cd frontend && npm test
```
Expected: PASS, 1 test (`vitest > corre`).

- [ ] **Step 6: Borrar el test de humo y commitear**

Run:
```bash
cd frontend && rm src/utils/smoke.test.ts
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts
git commit -m "chore(frontend): agrega Vitest para tests unitarios"
```

---

## Task 2: Función pura `moverMateriaConCascada` (TDD)

**Files:**
- Create: `frontend/src/utils/planificadorCascada.ts`
- Test: `frontend/src/utils/planificadorCascada.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Create `frontend/src/utils/planificadorCascada.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  moverMateriaConCascada,
  planEsValido,
  type MateriaPlanificable,
  type PeriodoPlan,
} from './planificadorCascada';

// Helper: arma un plan a partir de filas de ids. Las correlativas se pasan aparte.
function materia(_id: string, correlativas: string[] = [], extra: Partial<MateriaPlanificable> = {}): MateriaPlanificable {
  return { _id, correlativas, creditos: 4, horasSemanalesEstimadas: 4, ...extra };
}

function plan(filas: MateriaPlanificable[][]): PeriodoPlan<MateriaPlanificable>[] {
  return filas.map((materias, i) => ({
    anio: 2025 + Math.floor(i / 2),
    cuatrimestre: (i % 2) + 1,
    horasUsadas: 0,
    materias,
  }));
}

function indiceDe(periodos: PeriodoPlan<MateriaPlanificable>[], id: string): number {
  return periodos.findIndex((p) => p.materias.some((m) => m._id === id));
}

describe('moverMateriaConCascada', () => {
  it('atrasar arrastra a los dependientes hacia adelante', () => {
    // A -> B -> C (A es correlativa de B, B de C), uno por cuatrimestre
    const A = materia('A');
    const B = materia('B', ['A']);
    const C = materia('C', ['B']);
    const periodos = plan([[A], [B], [C]]);

    const { periodos: out, movidas } = moverMateriaConCascada(periodos, 'A', 1);

    expect(indiceDe(out, 'A')).toBe(1);
    expect(indiceDe(out, 'B')).toBe(2);
    expect(indiceDe(out, 'C')).toBe(3);
    expect(movidas.sort()).toEqual(['A', 'B', 'C']);
    expect(planEsValido(out)).toBe(true);
  });

  it('adelantar arrastra a las correlativas con holgura hacia adelante', () => {
    // A en 0, B en 2, C en 4 (B depende de A, C de B). Adelantar C a 1.
    const A = materia('A');
    const B = materia('B', ['A']);
    const C = materia('C', ['B']);
    const periodos = plan([[A], [], [B], [], [C]]);

    const { periodos: out, movidas } = moverMateriaConCascada(periodos, 'C', 1);

    // C no puede ir antes que su cadena: queda en 2 (lo más temprano posible).
    expect(indiceDe(out, 'C')).toBe(2);
    expect(indiceDe(out, 'B')).toBe(1);
    expect(indiceDe(out, 'A')).toBe(0);
    expect(movidas.sort()).toEqual(['B', 'C']);
    expect(planEsValido(out)).toBe(true);
  });

  it('adelantar frena la materia en su cuatrimestre más temprano factible', () => {
    // A0, B1, C2 ya compacto. Adelantar C a 0 no es posible (necesita A<B<C).
    const A = materia('A');
    const B = materia('B', ['A']);
    const C = materia('C', ['B']);
    const periodos = plan([[A], [B], [C]]);

    const { periodos: out, movidas } = moverMateriaConCascada(periodos, 'C', 0);

    expect(indiceDe(out, 'C')).toBe(2); // no se movió
    expect(movidas).toEqual([]);
    expect(planEsValido(out)).toBe(true);
  });

  it('no mueve materias no relacionadas', () => {
    const A = materia('A');
    const B = materia('B', ['A']);
    const D = materia('D'); // suelta, sin relación
    const periodos = plan([[A, D], [B]]);

    const { periodos: out } = moverMateriaConCascada(periodos, 'A', 1);

    expect(indiceDe(out, 'D')).toBe(0); // D no se movió
    expect(indiceDe(out, 'A')).toBe(1);
    expect(indiceDe(out, 'B')).toBe(2);
  });

  it('respeta el piso de correlativasEnCurso (no cae en el primer cuatrimestre)', () => {
    // X tiene una correlativa EN CURSO: no puede ir al índice 0.
    const X = materia('X', [], { correlativasEnCurso: ['ALGO'] });
    const periodos = plan([[], [X]]);

    const { periodos: out } = moverMateriaConCascada(periodos, 'X', 0);

    expect(indiceDe(out, 'X')).toBe(1); // se queda en 1, no baja a 0
    expect(planEsValido(out, 0)).toBe(true);
  });

  it('recalcula las horas de cada cuatrimestre', () => {
    const A = materia('A', [], { horasSemanalesEstimadas: 6 });
    const B = materia('B', ['A'], { horasSemanalesEstimadas: 5 });
    const periodos = plan([[A], [B]]);

    const { periodos: out } = moverMateriaConCascada(periodos, 'A', 1);

    // A y B terminan en cuatrimestres distintos, 6h y 5h respectivamente.
    expect(out[1].horasUsadas).toBe(6);
    expect(out[2].horasUsadas).toBe(5);
  });
});
```

- [ ] **Step 2: Correr los tests para verificar que fallan**

Run:
```bash
cd frontend && npm test
```
Expected: FAIL — no existe el módulo `./planificadorCascada`.

- [ ] **Step 3: Implementar la función pura**

Create `frontend/src/utils/planificadorCascada.ts`:
```ts
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
```

- [ ] **Step 4: Correr los tests para verificar que pasan**

Run:
```bash
cd frontend && npm test
```
Expected: PASS — 6 tests verdes.

- [ ] **Step 5: Verificar lint y build**

Run:
```bash
cd frontend && npm run lint && npm run build
```
Expected: sin errores de ESLint ni de TypeScript.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/utils/planificadorCascada.ts frontend/src/utils/planificadorCascada.test.ts
git commit -m "feat(planificador): agrega reacomodo en cascada como función pura"
```

---

## Task 3: Cablear la cascada en los botones ◀▶

**Files:**
- Modify: `frontend/src/pages/student/AcademicAssistant.tsx`
- Modify: `frontend/src/styles/AcademicAssistant.css`

- [ ] **Step 1: Importar la función pura**

En `frontend/src/pages/student/AcademicAssistant.tsx`, debajo de `import api from "../../services/api";`, agregar:
```ts
import { moverMateriaConCascada } from "../../utils/planificadorCascada";
```

- [ ] **Step 2: Agregar estado de resaltado**

Junto a los demás `useState` (cerca de la línea 121, después de `const [success, setSuccess] = useState("");`), agregar:
```ts
const [resaltadas, setResaltadas] = useState<string[]>([]);
```

- [ ] **Step 3: Agregar helper de resaltado y el aplicador de movimiento**

Reemplazar la función `moverMateria` completa (actual líneas ~319-350) por:
```ts
  const resaltarMovidas = (ids: string[]) => {
    setResaltadas(ids);
    window.setTimeout(() => setResaltadas([]), 1200);
  };

  const aplicarMovimiento = (materiaId: string, destinoIdx: number) => {
    setError("");
    setSuccess("");
    const primerPeriodoIdx = primerPeriodo
      ? planificador.findIndex(
          (p) => p.anio === primerPeriodo.anio && p.cuatrimestre === primerPeriodo.cuatrimestre
        )
      : 0;
    const { periodos, movidas } = moverMateriaConCascada(planificador, materiaId, destinoIdx, {
      primerPeriodoIdx: primerPeriodoIdx < 0 ? 0 : primerPeriodoIdx,
    });
    if (movidas.length === 0) {
      setSuccess("Sin cambios: la materia ya está en su cuatrimestre más temprano posible");
      return;
    }
    setPlanificador(periodos);
    resaltarMovidas(movidas);
    setSuccess(
      movidas.length > 1
        ? `Se reacomodaron ${movidas.length} materias para mantener las correlatividades`
        : "Materia movida"
    );
  };

  const moverMateria = (periodoIdx: number, materiaId: string, dir: -1 | 1) => {
    const destino = periodoIdx + dir;
    if (destino < 0) return;
    aplicarMovimiento(materiaId, destino);
  };
```

- [ ] **Step 4: Aplicar la clase de resaltado a cada materia**

En el `<li>` del planificador (actual línea ~687), reemplazar:
```tsx
                  <li key={m._id} data-testid="periodo-materia" style={{ justifyContent: "space-between", width: "100%" }}>
```
por:
```tsx
                  <li
                    key={m._id}
                    data-testid="periodo-materia"
                    className={resaltadas.includes(m._id) ? "materia-resaltada" : undefined}
                    style={{ justifyContent: "space-between", width: "100%" }}
                  >
```

- [ ] **Step 5: Agregar el estilo del pulso**

Al final de `frontend/src/styles/AcademicAssistant.css`, agregar:
```css
@keyframes pulso-reacomodo {
  0%   { background-color: #fde68a; }
  100% { background-color: transparent; }
}
.materia-resaltada {
  animation: pulso-reacomodo 1.2s ease-out;
  border-radius: 6px;
}
```

- [ ] **Step 6: Verificar lint y build**

Run:
```bash
cd frontend && npm run lint && npm run build
```
Expected: sin errores.

- [ ] **Step 7: Verificación manual rápida con el preview**

Levantar backend (`cd backend && npm run dev`) y frontend, loguear con `estudiante@universidad.edu` / `estudiante123`, ir a `/student/assistant`, bajar al planificador y mover una materia con ◀▶. Confirmar que: (a) no aparece "No se puede mover"; (b) las materias dependientes se reacomodan con el pulso amarillo; (c) aparece el aviso "Se reacomodaron N materias".

- [ ] **Step 8: Commit**

```bash
git add frontend/src/pages/student/AcademicAssistant.tsx frontend/src/styles/AcademicAssistant.css
git commit -m "feat(planificador): reacomodo en cascada desde los botones con resaltado"
```

---

## Task 4: Drag & drop con @dnd-kit

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/pages/student/AcademicAssistant.tsx`
- Modify: `frontend/src/styles/AcademicAssistant.css`

- [ ] **Step 1: Instalar @dnd-kit/core**

Run:
```bash
cd frontend && npm install @dnd-kit/core@^6
```
Expected: se agrega `@dnd-kit/core` a `dependencies`.

- [ ] **Step 2: Importar las piezas de dnd-kit**

En `AcademicAssistant.tsx`, junto a los imports, agregar:
```ts
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
```

- [ ] **Step 3: Definir componentes internos arrastrable/soltable**

Antes de `const AcademicAssistant = () => {`, agregar dos componentes auxiliares:
```tsx
function MateriaArrastrable({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `materia-${id}` });
  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="materia-drag-handle"
      style={{ cursor: "grab", opacity: isDragging ? 0.4 : 1, touchAction: "none" }}
      aria-label="Arrastrar materia a otro cuatrimestre"
    >
      ⠿ {children}
    </span>
  );
}

function PeriodoSoltable({ idx, children }: { idx: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `periodo-${idx}` });
  return (
    <div ref={setNodeRef} className={isOver ? "periodo-drop-activo" : undefined}>
      {children}
    </div>
  );
}
```
(asegurar `import { useCallback, useEffect, useState } from "react";` siga; agregar `import type React from "react";` si el linter lo pide para `React.ReactNode`, o usar `import { type ReactNode } from "react"` y tipar `children: ReactNode`.)

- [ ] **Step 4: Configurar sensores y el handler de drop**

Dentro del componente, junto a las demás funciones, agregar:
```ts
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const destino = Number(String(over.id).replace("periodo-", ""));
    const materiaId = String(active.id).replace("materia-", "");
    if (Number.isNaN(destino)) return;
    aplicarMovimiento(materiaId, destino);
  };
```

- [ ] **Step 5: Envolver el listado de cuatrimestres en DndContext**

Envolver el `.map` de `planificador` (actual líneas ~677-713) con un `DndContext`, y envolver cada `<div className="projection" ...>` de período con `PeriodoSoltable`, y el nombre de cada materia con `MateriaArrastrable`. Resultado:
```tsx
        <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          {planificador.map((periodo, idx) => {
            const excedido = periodo.horasUsadas > horasPorSemana;
            return (
              <PeriodoSoltable key={`${periodo.anio}-${periodo.cuatrimestre}-${idx}`} idx={idx}>
                <div className="projection" data-testid="periodo">
                  <h4 style={excedido ? { color: "#b91c1c" } : {}}>
                    {periodo.anio} - {periodo.cuatrimestre === 0 ? "Anual" : `${periodo.cuatrimestre}C`}
                    {" "}({periodo.horasUsadas} / {horasPorSemana} h/sem){excedido && " ⚠ sobrecarga"}
                  </h4>
                  <ul>
                    {periodo.materias.map((m) => (
                      <li
                        key={m._id}
                        data-testid="periodo-materia"
                        className={resaltadas.includes(m._id) ? "materia-resaltada" : undefined}
                        style={{ justifyContent: "space-between", width: "100%" }}
                      >
                        <MateriaArrastrable id={m._id}>
                          {m.nombre} ({m.creditos} cr., {m.horasSemanalesEstimadas ?? m.creditos} h/sem)
                        </MateriaArrastrable>
                        <span style={{ display: "inline-flex", gap: 4, marginLeft: "auto" }}>
                          <button
                            className="btn-secondary"
                            aria-label={`Mover ${m.nombre} a un cuatrimestre anterior`}
                            disabled={idx === 0}
                            style={{ padding: "2px 8px" }}
                            onClick={() => moverMateria(idx, m._id, -1)}
                          >
                            ◀
                          </button>
                          <button
                            className="btn-secondary"
                            aria-label={`Mover ${m.nombre} a un cuatrimestre posterior`}
                            style={{ padding: "2px 8px" }}
                            onClick={() => moverMateria(idx, m._id, 1)}
                          >
                            ▶
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </PeriodoSoltable>
            );
          })}
        </DndContext>
```

- [ ] **Step 6: Estilo de la zona de drop activa**

Al final de `frontend/src/styles/AcademicAssistant.css`, agregar:
```css
.periodo-drop-activo {
  outline: 2px dashed #3b82f6;
  outline-offset: 2px;
  border-radius: 12px;
}
.materia-drag-handle {
  user-select: none;
}
```

- [ ] **Step 7: Verificar lint y build**

Run:
```bash
cd frontend && npm run lint && npm run build
```
Expected: sin errores.

- [ ] **Step 8: Verificación manual con el preview**

Con backend y frontend levantados, arrastrar una materia de un cuatrimestre a otro. Confirmar: el cuatrimestre destino se resalta al pasar por encima; al soltar, el plan se reacomoda en cascada con el pulso y el aviso. Probar también con teclado (Tab al handle, Espacio, flechas, Espacio).

- [ ] **Step 9: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/pages/student/AcademicAssistant.tsx frontend/src/styles/AcademicAssistant.css
git commit -m "feat(planificador): arrastrar y soltar materias entre cuatrimestres"
```

---

## Task 5: E2E del reacomodo en cascada (Cypress)

**Files:**
- Create: `frontend/cypress/e2e/cascada.cy.ts`

> Nota: el drag & drop de @dnd-kit es frágil de simular en Cypress; la cobertura del
> algoritmo está en los unitarios (Task 2). Este E2E valida el reacomodo de punta a
> punta usando los botones ◀▶ (que ahora cascadean) sobre los datos del seed.

- [ ] **Step 1: Escribir el test E2E**

Create `frontend/cypress/e2e/cascada.cy.ts`:
```ts
// E2E: el planificador reacomoda en cascada en vez de bloquear.
// Requiere backend (npm run dev) y frontend (npm run dev) levantados con el seed corrido.

const estudiante = { email: "estudiante@universidad.edu", password: "estudiante123" };

function iniciarSesion() {
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get("#email").type(estudiante.email);
  cy.get("#password").type(estudiante.password);
  cy.contains("button", "Iniciar Sesión").click();
  cy.location("pathname").should("eq", "/student");
}

describe("Planificador - reacomodo en cascada", () => {
  beforeEach(() => {
    iniciarSesion();
    cy.visit("/student/assistant");
    cy.get('[data-testid="planificador"]').scrollIntoView().should("be.visible");
  });

  it("nunca bloquea un movimiento y no pierde materias", () => {
    cy.get('[data-testid="periodo-materia"]').then(($m) => {
      const total = $m.length;
      // Mover hacia adelante la primera materia del primer cuatrimestre.
      cy.get('[data-testid="periodo"]').first().within(() => {
        cy.get('[data-testid="periodo-materia"]').first()
          .find('button[aria-label^="Mover"]').last().click();
      });
      // No aparece el viejo aviso de bloqueo.
      cy.get("body").should("not.contain", "No se puede mover");
      // No se pierde ni se duplica ninguna materia.
      cy.get('[data-testid="periodo-materia"]').should("have.length", total);
    });
  });

  it("muestra un aviso cuando reacomoda varias materias", () => {
    // Mover hacia adelante una materia del primer cuatrimestre suele arrastrar dependientes.
    cy.get('[data-testid="periodo"]').first().within(() => {
      cy.get('[data-testid="periodo-materia"]').first()
        .find('button[aria-label^="Mover"]').last().click();
    });
    // Aparece alguno de los avisos esperados (reacomodo, movida o sin cambios).
    cy.get(".assistant-alert.success").should("be.visible");
  });
});
```

- [ ] **Step 2: Correr el E2E (con backend + frontend levantados)**

Run:
```bash
cd frontend && npm run cy:run -- --spec cypress/e2e/cascada.cy.ts
```
Expected: 2 tests verdes.

- [ ] **Step 3: Verificar que no se rompió la suite existente del planificador**

Run:
```bash
cd frontend && npm run cy:run -- --spec cypress/e2e/planificador.cy.ts
```
Expected: los 4 tests siguen verdes (en particular el de mover materia sin perder ninguna).

- [ ] **Step 4: Commit**

```bash
git add frontend/cypress/e2e/cascada.cy.ts
git commit -m "test(planificador): E2E del reacomodo en cascada"
```

---

## Cierre

- [ ] **Verificación final completa**

Run:
```bash
cd frontend && npm run lint && npm run build && npm test
```
Expected: lint sin errores, build OK, unitarios verdes.

- [ ] **Actualizar `AGENTS.md`** con el estado real de esta feature (RULE 0 del proyecto), si corresponde al backlog del sprint.

- [ ] **Abrir PR** de `feature/planificador-cascada-correlativas` hacia `dev` (no `main`).
