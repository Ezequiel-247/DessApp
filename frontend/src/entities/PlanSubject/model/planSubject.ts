export interface PlanSubject {
  id: string;
  idStudyPlan: string;
  idSubject: string;
  suggestedYear: number;
  suggestedTerm: number;
  credits: number;
  is_elective: boolean;
}

export function normalizePlanSubject(data: any): PlanSubject {
  return {
    id: String(data.id),
    idStudyPlan: String(data.id_study_plan ?? data.idStudyPlan ?? ""),
    idSubject: String(data.id_subject ?? data.idSubject ?? ""),
    suggestedYear: Number(data.suggested_year ?? data.suggestedYear ?? data.year ?? 1),
    suggestedTerm: Number(data.suggested_term ?? data.suggestedTerm ?? data.semester ?? 1),
    credits: Number(data.credits ?? 0),
    is_elective: data.is_elective ?? data.isElective ?? false,
  };
}

export function denormalizePlanSubject(data: Partial<PlanSubject>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.idStudyPlan) payload.id_study_plan = Number(data.idStudyPlan);
  if (data.idSubject) payload.id_subject = Number(data.idSubject);
  if (data.suggestedYear !== undefined) payload.suggested_year = data.suggestedYear;
  if (data.suggestedTerm !== undefined) payload.suggested_term = data.suggestedTerm;
  if (data.credits !== undefined) payload.credits = data.credits;
  return payload;
}
