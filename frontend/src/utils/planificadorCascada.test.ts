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
    const A = materia('A');
    const B = materia('B', ['A']);
    const C = materia('C', ['B']);
    const periodos = plan([[A], [], [B], [], [C]]);

    const { periodos: out, movidas } = moverMateriaConCascada(periodos, 'C', 1);

    expect(indiceDe(out, 'C')).toBe(2);
    expect(indiceDe(out, 'B')).toBe(1);
    expect(indiceDe(out, 'A')).toBe(0);
    expect(movidas.sort()).toEqual(['B', 'C']);
    expect(planEsValido(out)).toBe(true);
  });

  it('adelantar frena la materia en su cuatrimestre más temprano factible', () => {
    const A = materia('A');
    const B = materia('B', ['A']);
    const C = materia('C', ['B']);
    const periodos = plan([[A], [B], [C]]);

    const { periodos: out, movidas } = moverMateriaConCascada(periodos, 'C', 0);

    expect(indiceDe(out, 'C')).toBe(2);
    expect(movidas).toEqual([]);
    expect(planEsValido(out)).toBe(true);
  });

  it('no mueve materias no relacionadas', () => {
    const A = materia('A');
    const B = materia('B', ['A']);
    const D = materia('D');
    const periodos = plan([[A, D], [B]]);

    const { periodos: out } = moverMateriaConCascada(periodos, 'A', 1);

    expect(indiceDe(out, 'D')).toBe(0);
    expect(indiceDe(out, 'A')).toBe(1);
    expect(indiceDe(out, 'B')).toBe(2);
  });

  it('respeta el piso de correlativasEnCurso (no cae en el primer cuatrimestre)', () => {
    const X = materia('X', [], { correlativasEnCurso: ['ALGO'] });
    const periodos = plan([[], [X]]);

    const { periodos: out } = moverMateriaConCascada(periodos, 'X', 0);

    expect(indiceDe(out, 'X')).toBe(1);
    expect(planEsValido(out, 0)).toBe(true);
  });

  it('recalcula las horas de cada cuatrimestre', () => {
    const A = materia('A', [], { horasSemanalesEstimadas: 6 });
    const B = materia('B', ['A'], { horasSemanalesEstimadas: 5 });
    const periodos = plan([[A], [B]]);

    const { periodos: out } = moverMateriaConCascada(periodos, 'A', 1);

    expect(out[1].horasUsadas).toBe(6);
    expect(out[2].horasUsadas).toBe(5);
  });

  it('no hace nada si la materia no está en el plan', () => {
    const A = materia('A');
    const periodos = plan([[A]]);

    const { periodos: out, movidas } = moverMateriaConCascada(periodos, 'INEXISTENTE', 0);

    expect(movidas).toEqual([]);
    expect(indiceDe(out, 'A')).toBe(0);
  });

  it('respeta un primerPeriodoIdx distinto de cero', () => {
    // Con primerPeriodoIdx=1, una materia con correlativa en curso no puede caer en el índice 1.
    const X = materia('X', [], { correlativasEnCurso: ['ALGO'] });
    const periodos = plan([[], [], [X]]);

    const { periodos: out } = moverMateriaConCascada(periodos, 'X', 1, { primerPeriodoIdx: 1 });

    expect(indiceDe(out, 'X')).toBe(2); // no baja al primer cuatrimestre proyectado (índice 1)
    expect(planEsValido(out, 1)).toBe(true);
  });
});
