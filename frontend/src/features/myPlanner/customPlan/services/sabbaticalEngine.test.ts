import { describe, expect, it } from 'vitest';
import { insertSabbaticalGap, removeSabbaticalGap } from './sabbaticalEngine';
import type { Plan } from '../model/planner';

function makePlan(): Plan {
  return {
    years: [
      {
        year: 2026,
        semesters: [
          { term: 1, subjects: [{ plan_subject_id: 1, subject_name: 'A', weekly_hours: 4, credits: 4, weight: 0 }], total_hours: 4 },
          { term: 2, subjects: [{ plan_subject_id: 2, subject_name: 'B', weekly_hours: 4, credits: 4, weight: 0 }], total_hours: 4 },
        ],
      },
      {
        year: 2027,
        semesters: [
          { term: 1, subjects: [{ plan_subject_id: 3, subject_name: 'C', weekly_hours: 4, credits: 4, weight: 0 }], total_hours: 4 },
          { term: 2, subjects: [{ plan_subject_id: 4, subject_name: 'D', weekly_hours: 4, credits: 4, weight: 0 }], total_hours: 4 },
        ],
      },
    ],
    total_credits: 16,
    limit_hours: 20,
  };
}

function subjectAt(plan: Plan, year: number, term: number): string[] {
  const yearPlan = plan.years.find((y) => y.year === year);
  const semester = yearPlan?.semesters.find((s) => s.term === term);
  return semester?.subjects.map((s) => s.subject_name) ?? [];
}

describe('insertSabbaticalGap', () => {
  it('vacía un cuatrimestre puntual y corre todo lo posterior un lugar, preservando el orden', () => {
    const plan = makePlan();
    const { plan: shifted } = insertSabbaticalGap(plan, { year: 2027, term: 1 }, 1);

    // 2026 queda intacto (todo lo movido está en o después del período elegido)
    expect(subjectAt(shifted, 2026, 1)).toEqual(['A']);
    expect(subjectAt(shifted, 2026, 2)).toEqual(['B']);

    // 2027-C1 queda vacío (el sabático)
    expect(subjectAt(shifted, 2027, 1)).toEqual([]);

    // Lo que estaba en 2027-C1 (C) pasa a 2027-C2, y lo que estaba en 2027-C2 (D) pasa a 2028-C1
    expect(subjectAt(shifted, 2027, 2)).toEqual(['C']);
    expect(subjectAt(shifted, 2028, 1)).toEqual(['D']);
  });

  it('año completo (2 cuatrimestres) corre todo dos lugares', () => {
    const plan = makePlan();
    const { plan: shifted } = insertSabbaticalGap(plan, { year: 2027, term: 1 }, 2);

    expect(subjectAt(shifted, 2027, 1)).toEqual([]);
    expect(subjectAt(shifted, 2027, 2)).toEqual([]);
    expect(subjectAt(shifted, 2028, 1)).toEqual(['C']);
    expect(subjectAt(shifted, 2028, 2)).toEqual(['D']);
  });

  it('recalcula la etiqueta de los sabáticos existentes que quedaron corridos', () => {
    const plan = makePlan();
    // Ya había un sabático marcado en 2027-C2; ahora se agrega uno ANTES, en 2027-C1.
    const { movedPeriods } = insertSabbaticalGap(
      plan,
      { year: 2027, term: 1 },
      1,
      [{ year: 2027, term: 2 }]
    );

    expect(movedPeriods).toEqual([
      { from: { year: 2027, term: 2 }, to: { year: 2028, term: 1 } },
    ]);
  });
});

describe('removeSabbaticalGap', () => {
  it('deshace exactamente un insert (round-trip)', () => {
    const plan = makePlan();
    const { plan: shifted } = insertSabbaticalGap(plan, { year: 2027, term: 1 }, 1);
    const { plan: restored } = removeSabbaticalGap(shifted, { year: 2027, term: 1 }, 1);

    expect(subjectAt(restored, 2026, 1)).toEqual(['A']);
    expect(subjectAt(restored, 2026, 2)).toEqual(['B']);
    expect(subjectAt(restored, 2027, 1)).toEqual(['C']);
    expect(subjectAt(restored, 2027, 2)).toEqual(['D']);
    // No debe quedar un año 2028 vacío colgando
    expect(restored.years.some((y) => y.year === 2028)).toBe(false);
  });
});
