import type { Subject } from "../model/subject";
import { normalizeSubject, denormalizeSubject } from "../model/subject";
import { apiClient } from "@/shared/api/apiClient";

export async function getSubjects(): Promise<Subject[]> {
  const raw = await apiClient.get("/api/subjects");
  const list = raw?.data ?? [];
  return Array.isArray(list) ? list.map(normalizeSubject) : [];
}

export async function getSubject(id: string): Promise<Subject> {
  const raw = await apiClient.get(`/api/subjects/${id}`);
  const data = raw?.data ?? raw;
  return data ? normalizeSubject(data) : normalizeSubject({});
}

export async function getStudentSubjects(studentId: string | number): Promise<Subject[]> {
  const raw = await apiClient.get(`/api/subjects/student/${studentId}`);
  const list = raw?.data ?? [];
  return Array.isArray(list) ? list.map(normalizeSubject) : [];
}

export async function getAllSubjects(): Promise<Subject[]> {
  const raw = await apiClient.get("/api/subjects");
  const list = raw?.data ?? [];
  return Array.isArray(list) ? list.map(normalizeSubject) : [];
}

export async function createSubject(data: Partial<Subject>): Promise<Subject> {
  const body = denormalizeSubject(data);
  const raw = await apiClient.post("/api/subjects", body);
  const result = raw?.data ?? raw;
  return normalizeSubject(result);
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  const body = denormalizeSubject(data);
  const raw = await apiClient.patch(`/api/subjects/${id}`, body);
  const result = raw?.data ?? raw;
  return normalizeSubject(result);
}

export async function deleteSubject(id: string): Promise<void> {
  await apiClient.delete(`/api/subjects/${id}`);
}
