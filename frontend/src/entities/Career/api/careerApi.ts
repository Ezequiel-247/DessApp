import { apiClient } from "@/shared/api/apiClient";
import { normalizeCareer, denormalizeCareer } from "../model/career";
import type { Career } from "../model/career";

export async function getCareers(): Promise<Career[]> {
  const res = await apiClient.get("/api/careers");
  const data = res.data ?? [];
  return Array.isArray(data) ? data.map(normalizeCareer) : [];
}

export async function getCareer(id: string): Promise<Career | null> {
  const res = await apiClient.get(`/api/careers/${id}`);
  return res.data ? normalizeCareer(res.data) : null;
}

export async function createCareer(data: Partial<Career>): Promise<Career> {
  const body = denormalizeCareer(data);
  const res = await apiClient.post("/api/careers", body);
  return normalizeCareer(res.data);
}

export async function updateCareer(id: string, data: Partial<Career>): Promise<Career> {
  const body = denormalizeCareer(data);
  const res = await apiClient.put(`/api/careers/${id}`, body);
  return normalizeCareer(res.data);
}

export async function deleteCareer(id: string): Promise<void> {
  await apiClient.delete(`/api/careers/${id}`);
}
