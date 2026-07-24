import type { StudentCareerEnrollment } from "../model/studentCareerEnrollment";
import { normalizeEnrollment } from "../model/studentCareerEnrollment";
import { apiClient } from "@/shared/api/apiClient";

export async function getEnrollments(studentId: number | string): Promise<StudentCareerEnrollment[]> {
  const raw = await apiClient.get(`/api/students/${studentId}/enrollments`);
  const list = raw?.data ?? raw ?? [];
  return list.map(normalizeEnrollment);
}

export async function createEnrollment(
  studentId: number | string,
  data: { career_id: number; study_plan_id?: number; enrolled_at?: string }
): Promise<StudentCareerEnrollment> {
  const raw = await apiClient.post(`/api/students/${studentId}/enrollments`, data);
  const enrollment = raw?.data ?? raw;
  return normalizeEnrollment(enrollment);
}

export async function updateEnrollment(
  studentId: number | string,
  enrollmentId: number,
  data: { career_id?: number; study_plan_id?: number | null; enrolled_at?: string; completed_at?: string | null; status?: string; is_active?: boolean }
): Promise<StudentCareerEnrollment> {
  const raw = await apiClient.patch(`/api/students/${studentId}/enrollments/${enrollmentId}`, data);
  const enrollment = raw?.data ?? raw;
  return normalizeEnrollment(enrollment);
}

export async function deleteEnrollment(
  studentId: number | string,
  enrollmentId: number
): Promise<void> {
  await apiClient.delete(`/api/students/${studentId}/enrollments/${enrollmentId}`);
}
