import type { User } from "../model/user";
import { apiClient } from "@/shared/api/apiClient";

export async function getUsers(): Promise<any[]> {
  const res = await apiClient.get("/api/users");
  return res?.data ?? [];
}

export async function getUser(id: string): Promise<any> {
  const res = await apiClient.get(`/api/users/${id}`);
  return res?.data ?? res;
}

export async function getMe(): Promise<any> {
  const raw = await apiClient.get("/api/users/me");
  return raw?.data ?? raw;
}

export async function createUser(data: Record<string, unknown>): Promise<any> {
  const res = await apiClient.post("/api/users", data);
  return res?.data ?? res;
}

export async function updateUser(id: string, data: Partial<User>): Promise<any> {
  const raw = await apiClient.patch(`/api/users/${id}`, data);
  return raw?.data ?? raw;
}

export async function suspendUser(id: string): Promise<any> {
  const raw = await apiClient.patch(`/api/users/${id}/suspend`);
  return raw?.data ?? raw;
}

export async function reactivateUser(id: string): Promise<any> {
  const raw = await apiClient.patch(`/api/users/${id}/reactivate`);
  return raw?.data ?? raw;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/api/users/${id}`);
}
