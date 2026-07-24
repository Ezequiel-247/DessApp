import { apiClient } from "@/shared/api/apiClient";
import type { DeviationResponse } from "../model/deviation";

export async function fetchDeviation(studentId: number | string, planId: number): Promise<DeviationResponse> {
  const res = await apiClient.get(`/api/custom-study-plans/${planId}/deviation?studentId=${studentId}`);
  return res.data as DeviationResponse;
}
