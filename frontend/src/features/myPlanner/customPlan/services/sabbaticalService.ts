import { apiClient } from "@/shared/api/apiClient";

export interface SabbaticalPeriod {
  id: number;
  id_custom_study_plan: number;
  year: number;
  term: number;
}

export async function fetchSabbaticals(planId: number): Promise<SabbaticalPeriod[]> {
  const res = await apiClient.get(`/api/custom-study-plans/${planId}/sabbaticals`);
  return res.data as SabbaticalPeriod[];
}

export async function createSabbatical(
  planId: number,
  year: number,
  terms: number[]
): Promise<SabbaticalPeriod[]> {
  const res = await apiClient.post(`/api/custom-study-plans/${planId}/sabbaticals`, { year, terms });
  return res.data as SabbaticalPeriod[];
}

export async function deleteSabbatical(planId: number, year: number, term?: number): Promise<void> {
  const params = new URLSearchParams({ year: String(year) });
  if (term != null) params.set("term", String(term));
  await apiClient.delete(`/api/custom-study-plans/${planId}/sabbaticals?${params.toString()}`);
}
