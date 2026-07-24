import { apiClient } from "@/shared/api/apiClient";
import type { SavePlanItem } from "../model/planner";

export interface SavedPlanItem {
  id: number;
  plan_subject_id: number;
  target_year: number;
  target_term: number;
  status: string;
  plan_subject?: {
    id: number;
    id_subject: number;
    id_study_plan: number;
    suggested_year: number;
    suggested_term: number;
    weekly_hours: number;
    credits: number;
    is_elective?: boolean;
    subject?: {
      id: number;
      name: string;
      code: string;
      is_unahur: boolean;
      weekly_hours: number;
    };
  };
}

export interface SavedPlan {
  id: number;
  id_student: number;
  name: string;
  weekly_hours: number;
  items: SavedPlanItem[];
}

export async function fetchPlans(studentId: number | string, enrollmentId?: string | number | null): Promise<SavedPlan[]> {
  const query = enrollmentId ? `&enrollmentId=${enrollmentId}` : "";
  const res = await apiClient.get(`/api/custom-study-plans?studentId=${studentId}${query}`);
  return res.data as SavedPlan[];
}

export async function renamePlan(planId: number, name: string): Promise<SavedPlan> {
  // Sin `items` en el body: el backend (ver customStudyPlanController.update) solo
  // toca los items del plan si `items` viene como array — al omitirlo, el rename
  // no puede pisar accidentalmente las materias de un plan que ni siquiera está
  // cargado en el canvas (que es lo que pasaría si se reusara updatePlanFromCanvas,
  // pensado para el plan activo).
  const res = await apiClient.put(`/api/custom-study-plans/${planId}`, { name });
  return res.data as SavedPlan;
}

export async function fetchPlan(planId: number): Promise<SavedPlan> {
  const res = await apiClient.get(`/api/custom-study-plans/${planId}`);
  return res.data as SavedPlan;
}

export async function savePlanFromCanvas(
  studentId: number | string,
  name: string,
  weeklyHoursLimit: number,
  items: SavePlanItem[],
  enrollmentId?: string | number | null
): Promise<SavedPlan> {
  const plan = items.map(item => ({
    academic_year: item.target_year,
    term: item.target_term,
    subjects: [{ plan_subject_id: item.plan_subject_id }],
  }));
  const res = await apiClient.post(`/api/students/${studentId}/save-plan`, {
    name,
    weekly_hours_limit: weeklyHoursLimit,
    plan,
    enrollment_id: enrollmentId || null,
  });
  return res.data as SavedPlan;
}

export async function updatePlanFromCanvas(
  planId: number,
  name: string,
  weeklyHours: number,
  items: SavePlanItem[]
): Promise<SavedPlan> {
  const res = await apiClient.put(`/api/custom-study-plans/${planId}`, {
    name,
    weekly_hours: weeklyHours,
    items,
  });
  return res.data as SavedPlan;
}

export async function clonePlan(planId: number, name?: string, studentId?: number | string, enrollmentId?: string | number | null): Promise<SavedPlan> {
  const body: Record<string, any> = {};
  if (name) body.name = name;
  if (studentId != null) body.id_student = studentId;
  if (enrollmentId != null) body.enrollmentId = enrollmentId;
  const res = await apiClient.post(`/api/custom-study-plans/clone/${planId}`, body);
  return res.data as SavedPlan;
}

export async function deletePlan(planId: number): Promise<void> {
  await apiClient.delete(`/api/custom-study-plans/${planId}`);
}


