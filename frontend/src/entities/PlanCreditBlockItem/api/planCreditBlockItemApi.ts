import { apiClient } from "@/shared/api/apiClient";
import { normalizePlanCreditBlockItem, type PlanCreditBlockItem } from "../model/planCreditBlockItem";

export async function getPlanCreditBlockItems(): Promise<PlanCreditBlockItem[]> {
  const res = await apiClient.get("/api/plan-credit-block-items");
  const data = res?.data ?? [];
  return Array.isArray(data) ? data.map(normalizePlanCreditBlockItem) : [];
}
