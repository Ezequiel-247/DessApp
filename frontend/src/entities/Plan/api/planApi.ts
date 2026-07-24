import { apiClient } from "@/shared/api/apiClient";
import { normalizePlan, denormalizePlan } from "../model/plan";
import type { Plan, ReplacePlanPayload, ReplacePlanResponse } from "../model/plan";

export async function getPlans(careerId?: string): Promise<Plan[]> {
  const q = careerId ? `?careerId=${careerId}` : "";
  const res = await apiClient.get(`/api/plans${q}`);
  const data = res.data ?? [];
  return Array.isArray(data) ? data.map(normalizePlan) : [];
}

export async function getPlan(id: string): Promise<Plan | null> {
  const res = await apiClient.get(`/api/plans/${id}`);
  return res.data ? normalizePlan(res.data) : null;
}

export async function createPlan(data: Partial<Plan>): Promise<Plan> {
  const body = denormalizePlan(data);
  const res = await apiClient.post("/api/plans", body);
  return normalizePlan(res.data);
}

export async function updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
  const body = denormalizePlan(data);
  const res = await apiClient.patch(`/api/plans/${id}`, body);
  return normalizePlan(res.data);
}

export async function deletePlan(id: string): Promise<void> {
  await apiClient.delete(`/api/plans/${id}`);
}

export async function replacePlan(id: string, payload: ReplacePlanPayload): Promise<ReplacePlanResponse> {
  const res = await apiClient.put(`/api/plans/${id}/replace`, payload);
  return res.data as ReplacePlanResponse;
}
