import type { Student, StudentPrivacy } from "../model/student";
import { normalizeStudent, denormalizePrivacy } from "../model/student";
import { apiClient } from "@/shared/api/apiClient";

export async function getStudents(): Promise<Student[]> {
  const raw = await apiClient.get('/api/students');
  const data = Array.isArray(raw?.data) ? raw.data : [];
  return data.map(normalizeStudent);
}

export async function getStudent(id: number | string): Promise<Student> {
  const raw = await apiClient.get(`/api/students/${id}`);
  const data = raw?.data ?? raw;
  return normalizeStudent(data);
}

export async function updateStudentPrivacy(
  id: number | string,
  privacy: Partial<StudentPrivacy>
): Promise<Student> {
  const body = denormalizePrivacy(privacy);
  const raw = await apiClient.patch(`/api/students/${id}`, body);
  const data = raw?.data ?? raw;
  return normalizeStudent(data);
}

export async function updateStudent(
  id: number | string,
  data: { name?: string; lastname?: string; email?: string; legajo?: string }
): Promise<Student> {
  const raw = await apiClient.patch(`/api/students/${id}`, data);
  const res = raw?.data ?? raw;
  return normalizeStudent(res);
}

export async function getStudentProfile(id: number | string): Promise<Student> {
  const raw = await apiClient.get(`/api/students/${id}/profile`);
  const data = raw?.data ?? raw;
  return normalizeStudent(data);
}

export async function uploadStudentAvatar(
  id: number | string,
  file: File
): Promise<Student> {
  const formData = new FormData();
  formData.append('avatar', file);

  const raw = await apiClient.post(`/api/students/${id}/avatar`, formData);
  const data = raw?.data ?? raw;
  return normalizeStudent(data);
}

export async function createStudent(data: Record<string, unknown>): Promise<any> {
  const res = await apiClient.post("/api/students", data);
  return res?.data ?? res;
}

export async function getExamEligibility(studentId: string): Promise<Array<{
  academic_record_id: number;
  subject_id: number;
  subject_name: string;
  plan_subject_id: number | null;
  grade: string;
  regularity_expires_at: string | null;
  is_expired: boolean;
  failed_attempts: number;
  eligibility: string;
}>> {
  const res = await apiClient.get(`/api/students/${studentId}/exam-eligibility`);
  const data = res?.data ?? [];
  return Array.isArray(data) ? data : [];
}

export async function getSubjectEligibility(studentId: string, enrollmentId?: string): Promise<Array<{
  subject_id: number;
  subject_name: string;
  plan_subject_id: number;
  eligibility: string | null;
  blocked_reason: string | null;
  latest_academic_record: {
    id: number;
    status: string;
    regularity_expires_at: string | null;
  } | null;
}>> {
  let url = `/api/students/${studentId}/subject-eligibility`;
  if (enrollmentId) {
    url += `?enrollmentId=${enrollmentId}`;
  }
  const res = await apiClient.get(url);
  const data = res?.data ?? [];
  return Array.isArray(data) ? data : [];
}

export async function getStudentPlanSubjects(
  studentId: string,
  enrollmentId: string
): Promise<Array<{
  id: string;
  name: string;
  code: string;
  credits?: number | null;
  suggested_year?: number | null;
  suggested_term?: number | null;
}>> {
  const res = await apiClient.get(`/api/students/${studentId}/plan-subjects?enrollmentId=${enrollmentId}`);
  const data = res?.data ?? [];
  return Array.isArray(data) ? data.map(d => ({
    id: d.id,
    name: d.name,
    code: d.code,
    credits: d.credits,
  })) : [];
}

