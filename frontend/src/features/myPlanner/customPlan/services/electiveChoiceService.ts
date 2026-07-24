import { apiClient } from "@/shared/api/apiClient";

export interface ElectiveBlockSubjectLink {
  id: number;
  id_elective_block: number;
  id_plan_subject: number;
}

export interface ElectiveBlock {
  id: number;
  id_study_plan: number;
  name: string;
  min_required: number;
  suggested_year: number | null;
  sort_order: number | null;
  PlanElectiveBlockSubjects?: ElectiveBlockSubjectLink[];
}

export interface ElectiveChoice {
  id: number;
  id_custom_study_plan: number;
  id_elective_block: number;
  plan_subject_id: number;
}

export async function fetchElectiveBlocks(studyPlanId: number): Promise<ElectiveBlock[]> {
  const res = await apiClient.get(`/api/plans/${studyPlanId}/elective-blocks`);
  return res.data as ElectiveBlock[];
}

export async function fetchElectiveChoices(planId: number): Promise<ElectiveChoice[]> {
  const res = await apiClient.get(`/api/custom-study-plans/${planId}/elective-choices`);
  return res.data as ElectiveChoice[];
}

export async function createElectiveChoice(
  planId: number,
  electiveBlockId: number,
  planSubjectId: number
): Promise<ElectiveChoice> {
  const res = await apiClient.post(`/api/custom-study-plans/${planId}/elective-choices`, {
    id_elective_block: electiveBlockId,
    plan_subject_id: planSubjectId,
  });
  return res.data as ElectiveChoice;
}

export async function deleteElectiveChoice(planId: number, planSubjectId: number): Promise<void> {
  await apiClient.delete(`/api/custom-study-plans/${planId}/elective-choices?plan_subject_id=${planSubjectId}`);
}
