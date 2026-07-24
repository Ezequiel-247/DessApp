export interface Plan {
  id: string;
  careerId: string;
  name: string;
  status: string;
  yearsDuration: number | null;
  courseType: string | null;
  defaultTerm: number | null;
  minTotalCredits: number | null;
}

export function normalizePlan(data: any): Plan {
  return {
    id: String(data.id),
    careerId: String(data.id_career ?? data.careerId ?? ""),
    name: data.name ?? "",
    status: data.status ?? "",
    yearsDuration: data.years_duration ?? data.yearsDuration ?? null,
    courseType: data.course_type ?? data.courseType ?? null,
    defaultTerm: data.default_term ?? data.defaultTerm ?? null,
    minTotalCredits: data.min_total_credits ?? data.minTotalCredits ?? null,
  };
}

export function denormalizePlan(data: Partial<Plan>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.careerId !== undefined) payload.id_career = Number(data.careerId);
  if (data.name !== undefined) payload.name = data.name;
  if (data.status !== undefined) payload.status = data.status;
  if (data.yearsDuration !== undefined) payload.years_duration = data.yearsDuration;
  if (data.courseType !== undefined) payload.course_type = data.courseType;
  if (data.defaultTerm !== undefined) payload.default_term = data.defaultTerm;
  if (data.minTotalCredits !== undefined) payload.min_total_credits = data.minTotalCredits;
  return payload;
}

export interface ReplaceSubject {
  temp_id: string;
  id_subject: number;
  suggested_year: number;
  suggested_term: number;
  credits: number;
  is_elective: boolean;
  is_final_project: boolean;
  correlative_temp_ids: string[];
}

export interface ReplaceUnahurBlock {
  temp_id?: string;
  suggested_year: number;
  suggested_term: number | null;
  sort_order: number | null;
}

export interface ReplaceElectiveBlock {
  name: string;
  min_required: number;
  requires_approved_mandatory_count: number;
  suggested_year: number | null;
  sort_order: number | null;
  subject_temp_ids: string[];
}

export interface ReplaceCreditBlockActivity {
  id_activity: number;
  credits: number;
}

export interface ReplaceCreditBlock {
  name: string;
  min_credits_required: number | null;
  max_credits_allowed: number | null;
  sort_order: number | null;
  activities: ReplaceCreditBlockActivity[];
}

export interface ReplacePlanPayload {
  plan: {
    name: string;
    status: string;
    years_duration: number | null;
    course_type: string | null;
    default_term: number | null;
    min_total_credits: number | null;
  };
  subjects: ReplaceSubject[];
  unahur_blocks: ReplaceUnahurBlock[];
  elective_blocks: ReplaceElectiveBlock[];
  credit_blocks: ReplaceCreditBlock[];
}

export interface ReplacePlanSubjectMapping {
  temp_id: string;
  id: number;
}

export interface ReplacePlanResponse {
  subject_mapping: ReplacePlanSubjectMapping[];
}
