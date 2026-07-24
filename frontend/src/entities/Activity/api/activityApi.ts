import { apiClient } from "@/shared/api/apiClient";
import { normalizeActivity, denormalizeActivity, type Activity } from "../model/activity";

export async function getActivities(): Promise<Activity[]> {
  const res = await apiClient.get("/api/activities");
  const data = res?.data ?? [];
  return Array.isArray(data) ? data.map(normalizeActivity) : [];
}

export async function createActivity(data: Partial<Activity>): Promise<Activity> {
  const body = denormalizeActivity(data);
  const raw = await apiClient.post("/api/activities", body);
  const result = raw?.data ?? raw;
  return normalizeActivity(result);
}

export async function updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
  const body = denormalizeActivity(data);
  const raw = await apiClient.put(`/api/activities/${id}`, body);
  const result = raw?.data ?? raw;
  return normalizeActivity(result);
}

export async function deleteActivity(id: string): Promise<void> {
  await apiClient.delete(`/api/activities/${id}`);
}
