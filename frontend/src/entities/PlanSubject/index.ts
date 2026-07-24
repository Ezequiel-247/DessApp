export type { PlanSubject } from "./model/planSubject";
export { normalizePlanSubject, denormalizePlanSubject } from "./model/planSubject";

export {
  getPlanSubjects,
  getPlanSubject,
  createPlanSubject,
  updatePlanSubject,
  deletePlanSubject,
} from "./api/planSubjectApi";
