import { apiClient } from "@/shared/api/apiClient";
import { normalizeUnahurBlock, denormalizeUnahurBlock } from "../model/unahurBlock";
import type { UnahurBlock } from "../model/unahurBlock";

export async function getUnahurBlocks(planId: string): Promise<UnahurBlock[]> {
  const res = await apiClient.get(`/api/plans/${planId}/unahur-blocks`);
  const data = res.data ?? [];
  return Array.isArray(data) ? data.map(normalizeUnahurBlock) : [];
}

export async function getUnahurBlock(planId: string, id: string): Promise<UnahurBlock | null> {
  const res = await apiClient.get(`/api/plans/${planId}/unahur-blocks/${id}`);
  return res.data ? normalizeUnahurBlock(res.data) : null;
}

export async function createUnahurBlock(planId: string, data: Partial<UnahurBlock>): Promise<UnahurBlock> {
  const body = denormalizeUnahurBlock(data);
  const res = await apiClient.post(`/api/plans/${planId}/unahur-blocks`, body);
  return normalizeUnahurBlock(res.data);
}

export async function updateUnahurBlock(planId: string, id: string, data: Partial<UnahurBlock>): Promise<UnahurBlock> {
  const body = denormalizeUnahurBlock(data);
  const res = await apiClient.put(`/api/plans/${planId}/unahur-blocks/${id}`, body);
  return normalizeUnahurBlock(res.data);
}

export async function deleteUnahurBlock(planId: string, id: string): Promise<void> {
  await apiClient.delete(`/api/plans/${planId}/unahur-blocks/${id}`);
}
