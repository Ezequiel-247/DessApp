import { apiClient } from "@/shared/api/apiClient";
import { normalizeActivityRecord, denormalizeActivityRecord, type ActivityRecord, type ActivityEligibilityItem } from "../model/activityRecord";

export async function getActivityRecords(studentId: string): Promise<ActivityRecord[]> {
  const raw = await apiClient.get(`/api/activity-records?studentId=${studentId}`);
  const list = raw?.data ?? raw ?? [];
  return (Array.isArray(list) ? list : []).map(normalizeActivityRecord);
}

export async function createActivityRecord(
  data: Omit<ActivityRecord, "id">
): Promise<ActivityRecord> {
  const body = denormalizeActivityRecord(data);
  const raw = await apiClient.post("/api/activity-records", body);
  return normalizeActivityRecord(raw?.data ?? raw);
}

export async function updateActivityRecord(
  id: string,
  data: Partial<ActivityRecord>
): Promise<ActivityRecord> {
  const body = denormalizeActivityRecord(data);
  const raw = await apiClient.patch(`/api/activity-records/${id}`, body);
  return normalizeActivityRecord(raw?.data ?? raw);
}

export async function deleteActivityRecord(id: string): Promise<void> {
  await apiClient.delete(`/api/activity-records/${id}`);
}

export async function getActivityEligibility(studentId: string): Promise<ActivityEligibilityItem[]> {
  const raw = await apiClient.get(`/api/students/${studentId}/activity-eligibility`);
  const list = raw?.data ?? [];
  return (Array.isArray(list) ? list : []).map((item: any) => ({
    activityId: String(item.activity_id),
    activityName: item.activity_name ?? '',
    credits: item.credits ?? 0,
    planCreditBlockItemId: String(item.plan_credit_block_item_id),
  }));
}
