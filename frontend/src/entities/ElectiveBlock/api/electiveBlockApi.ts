import { apiClient } from "@/shared/api/apiClient";
import { normalizeElectiveBlock, denormalizeElectiveBlock, normalizeElectiveBlockSubject } from "../model/electiveBlock";
import type { ElectiveBlock, ElectiveBlockSubject } from "../model/electiveBlock";

export async function getElectiveBlocks(planId: string): Promise<ElectiveBlock[]> {
  const res = await apiClient.get(`/api/plans/${planId}/elective-blocks`);
  const data = res.data ?? [];
  return Array.isArray(data) ? data.map(normalizeElectiveBlock) : [];
}

export async function getElectiveBlock(planId: string, id: string): Promise<ElectiveBlock | null> {
  const res = await apiClient.get(`/api/plans/${planId}/elective-blocks/${id}`);
  return res.data ? normalizeElectiveBlock(res.data) : null;
}

export async function createElectiveBlock(planId: string, data: Partial<ElectiveBlock>): Promise<ElectiveBlock> {
  const body = denormalizeElectiveBlock(data);
  const res = await apiClient.post(`/api/plans/${planId}/elective-blocks`, body);
  return normalizeElectiveBlock(res.data);
}

export async function updateElectiveBlock(planId: string, id: string, data: Partial<ElectiveBlock>): Promise<ElectiveBlock> {
  const body = denormalizeElectiveBlock(data);
  const res = await apiClient.put(`/api/plans/${planId}/elective-blocks/${id}`, body);
  return normalizeElectiveBlock(res.data);
}

export async function deleteElectiveBlock(planId: string, id: string): Promise<void> {
  await apiClient.delete(`/api/plans/${planId}/elective-blocks/${id}`);
}

export async function getBlockSubjects(planId: string, blockId: string): Promise<ElectiveBlockSubject[]> {
  const res = await apiClient.get(`/api/plans/${planId}/elective-blocks/${blockId}/subjects`);
  const data = res.data ?? [];
  return Array.isArray(data) ? data.map(normalizeElectiveBlockSubject) : [];
}

export async function addBlockSubject(planId: string, blockId: string, planSubjectId: number): Promise<ElectiveBlockSubject> {
  const res = await apiClient.post(`/api/plans/${planId}/elective-blocks/${blockId}/subjects`, { id_plan_subject: planSubjectId });
  return normalizeElectiveBlockSubject(res.data);
}

export async function removeBlockSubject(planId: string, blockId: string, subjectId: string): Promise<void> {
  await apiClient.delete(`/api/plans/${planId}/elective-blocks/${blockId}/subjects/${subjectId}`);
}
