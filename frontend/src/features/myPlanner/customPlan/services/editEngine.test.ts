import { describe, expect, it } from 'vitest';
import { processMove, processMoveWithFeedback, addSubjectToPlan, findSubjectInPlan, addElectiveSubject, removeElectiveSubject } from './editEngine';
import { findBestTermBackwards } from './planningAlgorithm';
import type { Plan, SubjectGraph } from '../model/planner';

describe('processMove', () => {
  it('should find the closest feasible placement instead of failing when the requested period is not compatible', () => {
    const plan: Plan = {
      years: [
        {
          year: 2025,
          semesters: [
            { term: 1, subjects: [], total_hours: 0 },
            { term: 2, subjects: [], total_hours: 0 },
          ],
        },
      ],
      total_credits: 0,
      limit_hours: 10,
    };

    addSubjectToPlan(plan, {
      plan_subject_id: 1,
      subject_name: 'Álgebra',
      weekly_hours: 4,
      credits: 4,
      weight: 0,
    }, 2025, 1);

    addSubjectToPlan(plan, {
      plan_subject_id: 2,
      subject_name: 'Análisis',
      weekly_hours: 4,
      credits: 4,
      weight: 0,
    }, 2025, 2);

    const graph: SubjectGraph = {
      nodes: new Map([
        [1, { plan_subject_id: 1, subject_name: 'Álgebra', weekly_hours: 4, credits: 4, suggested_year: 1, suggested_term: 1, required_by: [2], requires: [], requirements: [] }],
        [2, { plan_subject_id: 2, subject_name: 'Análisis', weekly_hours: 4, credits: 4, suggested_year: 1, suggested_term: 2, required_by: [], requires: [1], requirements: [{ required_plan_subject_id: 1, subject_name: 'Álgebra', correlativity_type: 'aprobacion' }] }],
      ]),
      topoOrder: [1, 2],
      unlockWeights: new Map([[1, 1], [2, 0]]),
    };

    const moved = processMove(plan, 2, { year: 2025, term: 1 }, graph, 10, 2025);

    const placement = findSubjectInPlan(moved, 2);
    expect(placement).not.toBeNull();
    expect(placement?.year).toBe(2025);
    expect(placement?.term).toBe(2);
  });

  it('should report automatically adjusted dependents when a move forces a cascade', () => {
    const plan: Plan = {
      years: [
        {
          year: 2025,
          semesters: [
            { term: 1, subjects: [], total_hours: 0 },
            { term: 2, subjects: [], total_hours: 0 },
          ],
        },
      ],
      total_credits: 0,
      limit_hours: 10,
    };

    addSubjectToPlan(plan, {
      plan_subject_id: 1,
      subject_name: 'Álgebra',
      weekly_hours: 4,
      credits: 4,
      weight: 0,
    }, 2025, 1);

    addSubjectToPlan(plan, {
      plan_subject_id: 2,
      subject_name: 'Análisis',
      weekly_hours: 4,
      credits: 4,
      weight: 0,
    }, 2025, 2);

    const graph: SubjectGraph = {
      nodes: new Map([
        [1, { plan_subject_id: 1, subject_name: 'Álgebra', weekly_hours: 4, credits: 4, suggested_year: 1, suggested_term: 1, required_by: [2], requires: [], requirements: [] }],
        [2, { plan_subject_id: 2, subject_name: 'Análisis', weekly_hours: 4, credits: 4, suggested_year: 1, suggested_term: 2, required_by: [], requires: [1], requirements: [{ required_plan_subject_id: 1, subject_name: 'Álgebra', correlativity_type: 'aprobacion' }] }],
      ]),
      topoOrder: [1, 2],
      unlockWeights: new Map([[1, 1], [2, 0]]),
    };

    const result = processMoveWithFeedback(plan, 1, { year: 2025, term: 2 }, graph, 10, 2025);

    expect(result.feedback.movedSubject).toBe('Álgebra');
    expect(result.feedback.adjustedSubjects).toContain('Análisis');
  });
});

describe('processMove — caso "sándwich" (prerequisito y dependiente en conflicto simultáneo)', () => {
  // El docstring de processMove menciona un "Caso 6 sándwich" sin que exista una rama
  // de código con ese nombre. Estos tests verifican empíricamente que el escenario que
  // ese nombre describe (mover una materia X que tiene un prerequisito P Y un
  // dependiente D en simultáneo) ya está cubierto por la combinación de Caso 3 + Caso 5
  // + reintento de períodos candidatos — no hace falta una rama separada.
  function makeSandwichGraph(): SubjectGraph {
    return {
      nodes: new Map([
        [1, { plan_subject_id: 1, subject_name: 'P (prereq)', weekly_hours: 4, credits: 4, suggested_year: 1, suggested_term: 1, required_by: [2], requires: [], requirements: [] }],
        [2, { plan_subject_id: 2, subject_name: 'X (movida)', weekly_hours: 4, credits: 4, suggested_year: 1, suggested_term: 2, required_by: [3], requires: [1], requirements: [{ required_plan_subject_id: 1, subject_name: 'P (prereq)', correlativity_type: 'aprobacion' }] }],
        [3, { plan_subject_id: 3, subject_name: 'D (dependiente)', weekly_hours: 4, credits: 4, suggested_year: 2, suggested_term: 1, required_by: [], requires: [2], requirements: [{ required_plan_subject_id: 2, subject_name: 'X (movida)', correlativity_type: 'aprobacion' }] }],
      ]),
      topoOrder: [1, 2, 3],
      unlockWeights: new Map([[1, 2], [2, 1], [3, 0]]),
    };
  }

  function makeSandwichPlan(): Plan {
    return {
      years: [{ year: 2026, semesters: [
        { term: 1, subjects: [], total_hours: 0 },
        { term: 2, subjects: [], total_hours: 0 },
      ] }],
      total_credits: 0,
      limit_hours: 20,
    };
  }

  it('sin margen en el destino pedido, reintenta con períodos candidatos y nunca invierte el orden P < X < D', () => {
    const plan = makeSandwichPlan();
    addSubjectToPlan(plan, { plan_subject_id: 1, subject_name: 'P', weekly_hours: 4, credits: 4, weight: 2 }, 2026, 1);
    addSubjectToPlan(plan, { plan_subject_id: 2, subject_name: 'X', weekly_hours: 4, credits: 4, weight: 1 }, 2026, 2);
    addSubjectToPlan(plan, { plan_subject_id: 3, subject_name: 'D', weekly_hours: 4, credits: 4, weight: 0 }, 2027, 1);

    const graph = makeSandwichGraph();

    // minYear = 2026: pedir mover X al primer cuatrimestre posible no deja NINGÚN
    // lugar para reacomodar a P hacia atrás. processMove reintenta con los períodos
    // candidatos (buildCandidatePeriods) en vez de fallar directamente.
    const moved = processMove(plan, 2, { year: 2026, term: 1 }, graph, 20, 2026);

    const p = findSubjectInPlan(moved, 1)!;
    const x = findSubjectInPlan(moved, 2)!;
    const d = findSubjectInPlan(moved, 3)!;
    const isBefore = (a: { year: number; term: number }, b: { year: number; term: number }) =>
      a.year < b.year || (a.year === b.year && a.term < b.term);

    expect(isBefore(p, x)).toBe(true); // P sigue antes que X
    expect(isBefore(x, d)).toBe(true); // D sigue después de X
  });

  it('con margen suficiente hacia atrás, reacomoda P y no toca a D si queda lejos', () => {
    const plan = makeSandwichPlan();
    plan.years.unshift({ year: 2025, semesters: [
      { term: 1, subjects: [], total_hours: 0 },
      { term: 2, subjects: [], total_hours: 0 },
    ] });
    addSubjectToPlan(plan, { plan_subject_id: 1, subject_name: 'P', weekly_hours: 4, credits: 4, weight: 2 }, 2026, 1);
    addSubjectToPlan(plan, { plan_subject_id: 2, subject_name: 'X', weekly_hours: 4, credits: 4, weight: 1 }, 2026, 2);
    addSubjectToPlan(plan, { plan_subject_id: 3, subject_name: 'D', weekly_hours: 4, credits: 4, weight: 0 }, 2027, 1);

    const graph = makeSandwichGraph();
    const moved = processMove(plan, 2, { year: 2025, term: 2 }, graph, 20, 2025);

    const xPos = findSubjectInPlan(moved, 2);
    const pPos = findSubjectInPlan(moved, 1);
    const dPos = findSubjectInPlan(moved, 3);

    expect(xPos).toEqual({ year: 2025, term: 2 });

    const beforeX = (p: { year: number; term: number }) => p.year < xPos!.year || (p.year === xPos!.year && p.term < xPos!.term);
    const afterX = (p: { year: number; term: number }) => p.year > xPos!.year || (p.year === xPos!.year && p.term > xPos!.term);

    expect(beforeX(pPos!)).toBe(true); // P se reacomodó antes de X
    expect(afterX(dPos!)).toBe(true); // D sigue después de X, no se tocó
  });

  it('Caso 5 (findBestTermBackwards): sin cuatrimestres libres antes del piso académico, lanza error claro', () => {
    // El fondo real de un "sándwich" sin salida: el prerequisito necesita reacomodarse
    // hacia atrás pero no hay ningún cuatrimestre con lugar entre el cursor y minYear.
    const plan = makeSandwichPlan();
    addSubjectToPlan(plan, { plan_subject_id: 100, subject_name: 'Relleno', weekly_hours: 20, credits: 0, weight: 0 }, 2026, 1);

    expect(() =>
      findBestTermBackwards(4, plan, 2026, 1, 20, 2026)
    ).toThrow(/No hay espacio disponible en períodos anteriores/);
  });

  it('processMove: cuando se agotan los períodos candidatos, el error resume el rango probado en vez de mostrar solo el motivo del último intento', () => {
    // Materia cuyas horas solas ya superan el límite: falla igual en TODOS los
    // períodos candidatos (destino pedido + 6 adelante + 6 atrás).
    const plan = makeSandwichPlan();
    const graph: SubjectGraph = {
      nodes: new Map([
        [9, { plan_subject_id: 9, subject_name: 'Sobrecargada', weekly_hours: 25, credits: 4, suggested_year: 1, suggested_term: 1, required_by: [], requires: [], requirements: [] }],
      ]),
      topoOrder: [9],
      unlockWeights: new Map([[9, 0]]),
    };
    addSubjectToPlan(plan, { plan_subject_id: 9, subject_name: 'Sobrecargada', weekly_hours: 25, credits: 4, weight: 0 }, 2026, 1);

    expect(() => processMove(plan, 9, { year: 2026, term: 1 }, graph, 20, 2026)).toThrow(
      /No se encontró un cuatrimestre compatible.*opciones probadas.*Último motivo probado/s
    );
  });
});

describe('addElectiveSubject / removeElectiveSubject', () => {
  function makeElectiveGraph(): SubjectGraph {
    return {
      nodes: new Map([
        [1, { plan_subject_id: 1, subject_name: 'Base', weekly_hours: 6, credits: 6, suggested_year: 1, suggested_term: 1, required_by: [2], requires: [], requirements: [] }],
        [2, { plan_subject_id: 2, subject_name: 'Electiva', weekly_hours: 4, credits: 4, suggested_year: 4, suggested_term: 1, block_type: 'elective', required_by: [], requires: [1], requirements: [{ required_plan_subject_id: 1, subject_name: 'Base', correlativity_type: 'regularidad' }] }],
      ]),
      topoOrder: [1, 2],
      unlockWeights: new Map([[1, 1], [2, 0]]),
    };
  }

  it('ubica la electiva recién elegida después de su correlativa, no en el período de arranque fijo', () => {
    const plan: Plan = { years: [], total_credits: 0, limit_hours: 20 };
    addSubjectToPlan(plan, { plan_subject_id: 1, subject_name: 'Base', weekly_hours: 6, credits: 6, weight: 1 }, 2027, 1);

    const graph = makeElectiveGraph();
    const updated = addElectiveSubject(plan, graph, 2, 20, 2026);

    const placement = findSubjectInPlan(updated, 2);
    expect(placement).toEqual({ year: 2027, term: 2 });
    // El plan original no se muta.
    expect(findSubjectInPlan(plan, 2)).toBeNull();
  });

  it('removeElectiveSubject saca la materia sin afectar nada más', () => {
    const plan: Plan = { years: [], total_credits: 0, limit_hours: 20 };
    addSubjectToPlan(plan, { plan_subject_id: 1, subject_name: 'Base', weekly_hours: 6, credits: 6, weight: 1 }, 2027, 1);
    addSubjectToPlan(plan, { plan_subject_id: 2, subject_name: 'Electiva', weekly_hours: 4, credits: 4, weight: 0 }, 2027, 2);

    const updated = removeElectiveSubject(plan, 2);

    expect(findSubjectInPlan(updated, 2)).toBeNull();
    expect(findSubjectInPlan(updated, 1)).toEqual({ year: 2027, term: 1 });
  });
});
