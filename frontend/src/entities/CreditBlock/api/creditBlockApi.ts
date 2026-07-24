import { apiClient } from "@/shared/api/apiClient";
import { normalizeCreditBlock, denormalizeCreditBlock } from "../model/creditBlock";
import type { CreditBlock } from "../model/creditBlock";

export async function getCreditBlocks(planId: string): Promise<CreditBlock[]> {
  const res = await apiClient.get(`/api/plans/${planId}/credit-blocks`);
  const data = res.data ?? [];
  return Array.isArray(data) ? data.map(normalizeCreditBlock) : [];
}

export async function getCreditBlock(planId: string, id: string): Promise<CreditBlock | null> {
  const res = await apiClient.get(`/api/plans/${planId}/credit-blocks/${id}`);
  return res.data ? normalizeCreditBlock(res.data) : null;
}

export async function createCreditBlock(planId: string, data: Partial<CreditBlock>): Promise<CreditBlock> {
  const body = denormalizeCreditBlock(data);
  const res = await apiClient.post(`/api/plans/${planId}/credit-blocks`, body);
  return normalizeCreditBlock(res.data);
}

export async function updateCreditBlock(planId: string, id: string, data: Partial<CreditBlock>): Promise<CreditBlock> {
  const body = denormalizeCreditBlock(data);
  const res = await apiClient.put(`/api/plans/${planId}/credit-blocks/${id}`, body);
  return normalizeCreditBlock(res.data);
}

export async function deleteCreditBlock(planId: string, id: string): Promise<void> {
  await apiClient.delete(`/api/plans/${planId}/credit-blocks/${id}`);
}
