import { apiClient } from "@/shared/api/apiClient";
import { normalizePlanSubject } from "../model/planSubject";

export type PlanSubjectPayload = {
  id_study_plan?: number;
  id_subject?: number;
  suggested_year?: number;
  suggested_term?: number;
  credits?: number;
};

export async function getPlanSubjects(planId?: string, subjectId?: string) {
  const params = new URLSearchParams();
  if (planId) params.set("planId", planId);
  if (subjectId) params.set("subjectId", subjectId);
  const query = params.toString();
  const res = await apiClient.get(`/api/plan-subjects${query ? `?${query}` : ""}`);
  const data = res?.data ?? [];
  return Array.isArray(data) ? data.map(normalizePlanSubject) : [];
}

export async function getPlanSubject(id: string) {
  const res = await apiClient.get(`/api/plan-subjects/${id}`);
  return res?.data ? normalizePlanSubject(res.data) : null;
}

export async function createPlanSubject(data: Record<string, unknown>) {
  const res = await apiClient.post("/api/plan-subjects", data);
  return res?.data ? normalizePlanSubject(res.data) : null;
}

export async function updatePlanSubject(id: string, data: Record<string, unknown>) {
  const res = await apiClient.patch(`/api/plan-subjects/${id}`, data);
  return res?.data ? normalizePlanSubject(res.data) : null;
}

export async function deletePlanSubject(id: string) {
  await apiClient.delete(`/api/plan-subjects/${id}`);
}
