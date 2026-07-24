import type { Plan, PlannedYear, PlannedSemester } from "../model/planner";

export interface SabbaticalPeriodRef {
  year: number;
  term: number;
}

export interface SabbaticalShiftResult {
  plan: Plan;
  /** Períodos ya marcados como sabáticos cuya etiqueta año/cuatrimestre cambió por este corrimiento. */
  movedPeriods: { from: SabbaticalPeriodRef; to: SabbaticalPeriodRef }[];
}

function createEmptySemester(term: number): PlannedSemester {
  return { term, subjects: [], total_hours: 0, events: [], generic_blocks: [] };
}

function isSemesterEmpty(semester: PlannedSemester): boolean {
  return (
    semester.subjects.length === 0 &&
    (semester.events?.length ?? 0) === 0 &&
    (semester.generic_blocks?.length ?? 0) === 0 &&
    (semester.completed_subjects?.length ?? 0) === 0
  );
}

/** Aplana el plan a una secuencia lineal cronológica de cuatrimestres (índice 0 = C1 del primer año). */
function flattenPlan(plan: Plan): { startYear: number; slots: PlannedSemester[] } {
  const years = [...plan.years].sort((a, b) => a.year - b.year);
  const startYear = years[0]?.year ?? new Date().getFullYear();
  const slots: PlannedSemester[] = [];

  for (const yearPlan of years) {
    const c1 = yearPlan.semesters.find((s) => s.term === 1) ?? createEmptySemester(1);
    const c2 = yearPlan.semesters.find((s) => s.term === 2) ?? createEmptySemester(2);
    slots.push(c1, c2);
  }

  return { startYear, slots };
}

/** Reagrupa la secuencia lineal de vuelta en años calendario, completando el último par si quedó impar. */
function rebuildPlan(plan: Plan, startYear: number, slots: PlannedSemester[]): Plan {
  const completeSlots = [...slots];
  if (completeSlots.length % 2 !== 0) {
    completeSlots.push(createEmptySemester((completeSlots.length % 2) + 1));
  }

  const years: PlannedYear[] = [];
  for (let i = 0; i < completeSlots.length; i += 2) {
    years.push({
      year: startYear + i / 2,
      semesters: [
        { ...completeSlots[i], term: 1 },
        { ...completeSlots[i + 1], term: 2 },
      ],
    });
  }

  // Evita que el plan crezca indefinidamente con años vacíos al final tras sucesivos altas/bajas.
  while (years.length > 1 && years[years.length - 1].semesters.every(isSemesterEmpty)) {
    years.pop();
  }

  return { ...plan, years };
}

function periodIndex(startYear: number, period: SabbaticalPeriodRef): number {
  return (period.year - startYear) * 2 + (period.term - 1);
}

function indexToPeriod(startYear: number, index: number): SabbaticalPeriodRef {
  return { year: startYear + Math.floor(index / 2), term: (index % 2) + 1 };
}

function diffMovedPeriods(
  startYear: number,
  existingPeriods: SabbaticalPeriodRef[],
  remap: (oldIndex: number) => number
): { from: SabbaticalPeriodRef; to: SabbaticalPeriodRef }[] {
  return existingPeriods
    .map((period) => {
      const oldIndex = periodIndex(startYear, period);
      const to = indexToPeriod(startYear, remap(oldIndex));
      return { from: period, to };
    })
    .filter(({ from, to }) => from.year !== to.year || from.term !== to.term);
}

/**
 * Inserta uno o dos cuatrimestres en blanco a partir del período indicado y corre
 * todo lo posterior un lugar hacia adelante, sin reordenar el contenido entre sí.
 *
 * @param existingPeriods - Sabáticos ya marcados en este plan (para recalcular sus nuevas etiquetas si el corrimiento los desplaza).
 */
export function insertSabbaticalGap(
  plan: Plan,
  targetPeriod: SabbaticalPeriodRef,
  count: 1 | 2,
  existingPeriods: SabbaticalPeriodRef[] = []
): SabbaticalShiftResult {
  const { startYear, slots } = flattenPlan(plan);
  const insertIndex = periodIndex(startYear, targetPeriod);

  // Si el período pedido está más allá del final actual del plan, completar con cuatrimestres vacíos.
  while (slots.length < insertIndex) {
    slots.push(createEmptySemester((slots.length % 2) + 1));
  }

  const blanks: PlannedSemester[] = [];
  for (let i = 0; i < count; i++) {
    blanks.push(createEmptySemester(((insertIndex + i) % 2) + 1));
  }
  slots.splice(insertIndex, 0, ...blanks);

  const movedPeriods = diffMovedPeriods(startYear, existingPeriods, (oldIndex) =>
    oldIndex >= insertIndex ? oldIndex + count : oldIndex
  );

  return { plan: rebuildPlan(plan, startYear, slots), movedPeriods };
}

/**
 * Remueve uno o dos cuatrimestres (previamente insertados como sabático) y corre
 * todo lo posterior un lugar hacia atrás. Es la operación inversa de {@link insertSabbaticalGap}.
 */
export function removeSabbaticalGap(
  plan: Plan,
  targetPeriod: SabbaticalPeriodRef,
  count: 1 | 2,
  existingPeriods: SabbaticalPeriodRef[] = []
): SabbaticalShiftResult {
  const { startYear, slots } = flattenPlan(plan);
  const removeIndex = periodIndex(startYear, targetPeriod);

  if (removeIndex < 0 || removeIndex + count > slots.length) {
    return { plan, movedPeriods: [] };
  }

  slots.splice(removeIndex, count);

  const remaining = existingPeriods.filter((period) => {
    const idx = periodIndex(startYear, period);
    return idx < removeIndex || idx >= removeIndex + count;
  });

  const movedPeriods = diffMovedPeriods(startYear, remaining, (oldIndex) =>
    oldIndex > removeIndex ? oldIndex - count : oldIndex
  );

  return { plan: rebuildPlan(plan, startYear, slots), movedPeriods };
}
