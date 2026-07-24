import type { Plan, SavePlanPayload, SavePlanItem } from "../model/planner";

/**
 * Convierte un Plan a SavePlanPayload para guardar en el backend.
 * 
 * @param plan - Plan a guardar
 * @param name - Nombre del plan guardado
 * @returns Payload para POST /api/custom-study-plans
 */
export function planToSavePayload(plan: Plan, name: string): SavePlanPayload {
  const items: SavePlanItem[] = [];

  for (const year of plan.years) {
    for (const semester of year.semesters) {
      for (const subject of semester.subjects) {
        items.push({
          plan_subject_id: subject.plan_subject_id,
          target_year: year.year,
          target_term: semester.term,
          status: 'planificado',
        });
      }
    }
  }

  return {
    name,
    weekly_hours: plan.limit_hours,
    items,
  };
}

