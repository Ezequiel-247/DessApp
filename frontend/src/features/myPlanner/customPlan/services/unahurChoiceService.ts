import { apiClient } from "@/shared/api/apiClient";

export interface UnahurBlock {
  id: number;
  id_study_plan: number;
  suggested_year: number;
  suggested_term: number | null;
  sort_order: number | null;
}

export interface UnahurChoice {
  id: number;
  id_custom_study_plan: number;
  id_unahur_block: number;
  plan_subject_id: number;
}

export async function fetchUnahurBlocks(studyPlanId: number): Promise<UnahurBlock[]> {
  const res = await apiClient.get(`/api/plans/${studyPlanId}/unahur-blocks`);
  return res.data as UnahurBlock[];
}

export async function fetchUnahurChoices(planId: number): Promise<UnahurChoice[]> {
  const res = await apiClient.get(`/api/custom-study-plans/${planId}/unahur-choices`);
  return res.data as UnahurChoice[];
}

export async function createUnahurChoice(
  planId: number,
  unahurBlockId: number,
  planSubjectId: number
): Promise<UnahurChoice> {
  const res = await apiClient.post(`/api/custom-study-plans/${planId}/unahur-choices`, {
    id_unahur_block: unahurBlockId,
    plan_subject_id: planSubjectId,
  });
  return res.data as UnahurChoice;
}

export async function deleteUnahurChoice(planId: number, planSubjectId: number): Promise<void> {
  await apiClient.delete(`/api/custom-study-plans/${planId}/unahur-choices?plan_subject_id=${planSubjectId}`);
}
