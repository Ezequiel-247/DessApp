export interface ActivityRecord {
  id: string;
  studentId: string;
  activityId: string;
  planCreditBlockItemId?: string;
  year: number;
  semester: number;
  grade?: string;
  status: string;
}

export interface ActivityEligibilityItem {
  activityId: string;
  activityName: string;
  credits: number;
  planCreditBlockItemId: string;
}

const STATUS_MAP_TO_FE: Record<string, string> = {
  enrolled: "enrolled",
  approved: "approved",
  failed: "failed",
  equivalencia: "equivalencia",
};

const STATUS_MAP_TO_DB: Record<string, string> = {
  enrolled: "enrolled",
  approved: "approved",
  failed: "failed",
  equivalencia: "equivalencia",
};

export function normalizeActivityRecord(data: any): ActivityRecord {
  return {
    id: String(data.id),
    studentId: String(data.studentId ?? data.student_id ?? data.id_student ?? ""),
    activityId: String(data.activityId ?? data.id_activity ?? ""),
    planCreditBlockItemId: data.plan_credit_block_item_id ?? data.planCreditBlockItemId ?? undefined,
    year: Number(data.year ?? 1),
    semester: Number(data.semester ?? 1),
    grade: data.grade !== undefined && data.grade !== null ? String(data.grade) : undefined,
    status: STATUS_MAP_TO_FE[data.status] || data.status || "enrolled",
  };
}

export function denormalizeActivityRecord(data: Partial<ActivityRecord>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.studentId !== undefined) payload.id_student = data.studentId;
  if (data.activityId !== undefined) payload.id_activity = data.activityId;
  if (data.planCreditBlockItemId !== undefined) payload.plan_credit_block_item_id = data.planCreditBlockItemId;
  if (data.year !== undefined) payload.year = data.year;
  if (data.semester !== undefined) payload.semester = data.semester;
  if (data.grade !== undefined) payload.grade = data.grade;
  if (data.status !== undefined) payload.status = STATUS_MAP_TO_DB[data.status] || data.status;
  return payload;
}
