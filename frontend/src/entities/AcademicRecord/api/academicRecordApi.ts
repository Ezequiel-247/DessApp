import type { AcademicRecord } from "../model/academicRecord";
import { apiClient } from "@/shared/api/apiClient";

const STATUS_MAP_TO_FE: Record<string, AcademicRecord["status"]> = {
  aprobado: "approved",
  pendiente: "pending",
  desaprobado: "failed",
  enrolled: "enrolled",
};

const STATUS_MAP_TO_DB: Record<string, string> = {
  approved: "aprobado",
  pending: "pendiente",
  failed: "desaprobado",
  enrolled: "enrolled",
};

export function normalizeRecord(data: any): AcademicRecord {
  const feStatus = STATUS_MAP_TO_FE[data.status] || data.status;
  return {
    id: String(data.id),
    studentId: String(data.studentId ?? data.student_id ?? data.id_student ?? ""),
    subjectId: String(data.id_subject ?? data.subjectId ?? ""),
    planSubjectId: String(data.plan_subject_id ?? ""),
    year: Number(data.year ?? 1),
    semester: Number(data.semester ?? 1),
    grade: data.grade !== undefined && data.grade !== null ? String(data.grade) : undefined,
    status: (feStatus as AcademicRecord["status"]) || "pending",
    regularityExpiresAt: data.regularity_expires_at ?? data.regularityExpiresAt ?? null,
    micro_estado_calculado: data.micro_estado_calculado ?? undefined,
    final_exams_count: data.final_exams_count ?? undefined,
    latest_final_exam_status: data.latest_final_exam_status ?? undefined,
  };
}

export function denormalizeRecord(data: Partial<AcademicRecord>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.studentId !== undefined) payload.id_student = data.studentId;
  if (data.subjectId !== undefined) payload.id_subject = data.subjectId;
  if (data.year !== undefined) payload.year = data.year;
  if (data.semester !== undefined) payload.semester = data.semester;
  if (data.grade !== undefined) payload.grade = data.grade;
  if (data.status !== undefined) payload.status = STATUS_MAP_TO_DB[data.status] || data.status;
  if (data.regularityExpiresAt !== undefined) payload.regularity_expires_at = data.regularityExpiresAt;
  return payload;
}

export async function getAcademicRecords(studentId: string): Promise<AcademicRecord[]> {
  const raw = await apiClient.get(`/api/academic-records?studentId=${studentId}`);
  const list = raw?.data ?? raw ?? [];
  return (Array.isArray(list) ? list : []).map(normalizeRecord);
}

export async function createAcademicRecord(
  data: Omit<AcademicRecord, "id">
): Promise<AcademicRecord> {
  const body = denormalizeRecord(data);
  const raw = await apiClient.post("/api/academic-records", body);
  return normalizeRecord(raw?.data ?? raw);
}

export async function updateAcademicRecord(
  id: string,
  data: Partial<AcademicRecord>
): Promise<AcademicRecord> {
  const body = denormalizeRecord(data);
  const raw = await apiClient.patch(`/api/academic-records/${id}`, body);
  return normalizeRecord(raw?.data ?? raw);
}

export async function deleteAcademicRecord(id: string): Promise<void> {
  await apiClient.delete(`/api/academic-records/${id}`);
}
