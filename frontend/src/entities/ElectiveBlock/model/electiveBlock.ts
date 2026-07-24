export interface ElectiveBlock {
  id: string;
  idStudyPlan: string;
  name: string;
  minRequired: number;
  requiresApprovedMandatoryCount: number;
  suggestedYear: number | null;
  sortOrder: number | null;
  subjects?: ElectiveBlockSubject[];
}

export interface ElectiveBlockSubject {
  id: string;
  idElectiveBlock: string;
  idPlanSubject: string;
  subjectName?: string;
}

export function normalizeElectiveBlock(data: any): ElectiveBlock {
  return {
    id: String(data.id),
    idStudyPlan: String(data.id_study_plan ?? data.idStudyPlan ?? ""),
    name: data.name ?? "",
    minRequired: Number(data.min_required ?? data.minRequired ?? 1),
    requiresApprovedMandatoryCount: Number(data.requires_approved_mandatory_count ?? data.requiresApprovedMandatoryCount ?? 0),
    suggestedYear: data.suggested_year ?? data.suggestedYear ?? null,
    sortOrder: data.sort_order ?? data.sortOrder ?? null,
    subjects: Array.isArray(data.PlanElectiveBlockSubjects ?? data.subjects)
      ? (data.PlanElectiveBlockSubjects ?? data.subjects).map(normalizeElectiveBlockSubject)
      : undefined,
  };
}

export function denormalizeElectiveBlock(data: Partial<ElectiveBlock>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.minRequired !== undefined) payload.min_required = data.minRequired;
  if (data.requiresApprovedMandatoryCount !== undefined) payload.requires_approved_mandatory_count = data.requiresApprovedMandatoryCount;
  if (data.suggestedYear !== undefined) payload.suggested_year = data.suggestedYear;
  if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;
  return payload;
}

export function normalizeElectiveBlockSubject(data: any): ElectiveBlockSubject {
  return {
    id: String(data.id),
    idElectiveBlock: String(data.id_elective_block ?? data.idElectiveBlock ?? ""),
    idPlanSubject: String(data.id_plan_subject ?? data.idPlanSubject ?? data.plan_subject?.id ?? ""),
    subjectName: data.plan_subject?.subject?.name ?? data.subjectName ?? "",
  };
}
