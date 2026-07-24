import { apiClient } from "@/shared/api/apiClient";
import { normalizeInstitute, denormalizeInstitute } from "../model/institute";
import type { Institute } from "../model/institute";

export async function getInstitutes(): Promise<Institute[]> {
  const res = await apiClient.get("/api/institutes");
  const data = res.data ?? [];
  return Array.isArray(data) ? data.map(normalizeInstitute) : [];
}

export async function createInstitute(data: Partial<Institute>): Promise<Institute> {
  const body = denormalizeInstitute(data);
  const res = await apiClient.post("/api/institutes", body);
  return normalizeInstitute(res.data);
}

export async function updateInstitute(id: string, data: Partial<Institute>): Promise<Institute> {
  const body = denormalizeInstitute(data);
  const res = await apiClient.put(`/api/institutes/${id}`, body);
  return normalizeInstitute(res.data);
}

export async function deleteInstitute(id: string): Promise<void> {
  await apiClient.delete(`/api/institutes/${id}`);
}
