import { apiClient } from "@/shared/api/apiClient";

export async function createAdmin(data: Record<string, unknown>): Promise<any> {
  const res = await apiClient.post("/api/admins", data);
  return res?.data ?? res;
}

export async function updateAdmin(id: number, data: { cuil?: string }): Promise<any> {
  const raw = await apiClient.patch(`/api/admins/${id}`, data);
  return raw?.data ?? raw;
}
