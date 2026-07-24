import { apiClient } from "@/shared/api/apiClient";
import { normalizeCorrelativity, type Correlativity } from "../model/correlativity";

export async function getCorrelativities(planSubjectTargetId?: string): Promise<Correlativity[]> {
  const params = planSubjectTargetId ? `?id_plan_subject_target=${planSubjectTargetId}` : "";
  const res = await apiClient.get(`/api/correlativities${params}`);
  const data = res?.data ?? [];
  return Array.isArray(data) ? data.map(normalizeCorrelativity) : [];
}

export async function getCorrelativity(id: string): Promise<Correlativity | null> {
  const res = await apiClient.get(`/api/correlativities/${id}`);
  return res?.data ? normalizeCorrelativity(res.data) : null;
}

export async function createCorrelativity(data: {
  id_plan_subject_target: number;
  id_required_plan_subject: number;
  type?: string;
}): Promise<Correlativity | null> {
  const res = await apiClient.post("/api/correlativities", data);
  return res?.data ? normalizeCorrelativity(res.data) : null;
}

export async function updateCorrelativity(
  id: string,
  data: { type?: string }
): Promise<Correlativity | null> {
  const res = await apiClient.patch(`/api/correlativities/${id}`, data);
  return res?.data ? normalizeCorrelativity(res.data) : null;
}

export async function deleteCorrelativity(id: string): Promise<void> {
  await apiClient.delete(`/api/correlativities/${id}`);
}
