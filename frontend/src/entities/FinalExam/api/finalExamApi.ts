import { apiClient } from "@/shared/api/apiClient";
import { normalizeFinalExam, type FinalExam } from "../model/finalExam";

export async function getFinalExams(studentId: string): Promise<FinalExam[]> {
  const res = await apiClient.get(`/api/final-exams?studentId=${studentId}`);
  const list = res?.data ?? [];
  return Array.isArray(list) ? list.map(normalizeFinalExam) : [];
}

export async function createFinalExam(data: {
  id_academic_record: number;
  grade?: string;
  year?: number;
  semester?: number;
  status: string;
}): Promise<FinalExam> {
  const raw = await apiClient.post("/api/final-exams", data);
  const result = raw?.data ?? raw;
  return normalizeFinalExam(result);
}

export async function updateFinalExam(
  id: string,
  data: {
    grade?: string;
    year?: number;
    semester?: number;
    status?: string;
  }
): Promise<FinalExam> {
  const raw = await apiClient.patch(`/api/final-exams/${id}`, data);
  const result = raw?.data ?? raw;
  return normalizeFinalExam(result);
}

export async function deleteFinalExam(id: string): Promise<void> {
  await apiClient.delete(`/api/final-exams/${id}`);
}
