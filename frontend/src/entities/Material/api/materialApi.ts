import type { Material, MaterialFilters } from "../model/material";
import { normalizeMaterial } from "../model/material";
import { apiClient } from "@/shared/api/apiClient";

export async function getMaterials(filters: MaterialFilters = {}): Promise<Material[]> {
  const params = new URLSearchParams();
  if (filters.studentId) params.set("student_id", filters.studentId);
  if (filters.careerId) params.set("career_id", filters.careerId);
  if (filters.subjectId) params.set("subject_id", filters.subjectId);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.q) params.set("q", filters.q);
  if (filters.viewerStudentId) params.set("viewer_student_id", filters.viewerStudentId);

  const qs = params.toString();
  const raw = await apiClient.get(`/api/material${qs ? `?${qs}` : ""}`);
  const list = raw?.data ?? raw ?? [];
  return (Array.isArray(list) ? list : []).map(normalizeMaterial);
}

export async function getMaterial(id: string): Promise<Material> {
  const raw = await apiClient.get(`/api/material/${id}`);
  const data = raw?.data ?? raw;
  return normalizeMaterial(data);
}

export async function uploadMaterial(
  data: { subjectId: string; title: string; type: string; fileUrl: string; authorId: string; tags?: string[] }
): Promise<Material> {
  const body = {
    id_author: data.authorId,
    id_subject: data.subjectId,
    title: data.title,
    type: data.type,
    file_url: data.fileUrl,
    status: "active",
    tags: data.tags ?? [],
  };
  const raw = await apiClient.post("/api/material", body);
  const result = raw?.data ?? raw;
  return normalizeMaterial(result);
}

export async function reportMaterial(
  materialId: string,
  payload: { reporter_id: string; reason_id?: string; details?: string }
): Promise<void> {
  await apiClient.post(`/api/material/${materialId}/report`, payload);
}

export async function getReportedMaterials(filters?: { sort?: string; status_filter?: string }): Promise<{
  data: Material[];
  thresholds: { pending: number; verified: number };
}> {
  const params = new URLSearchParams();
  if (filters?.sort) params.set("sort", filters.sort);
  if (filters?.status_filter) params.set("status_filter", filters.status_filter);
  const qs = params.toString();
  const raw = await apiClient.get(`/api/material/admin/reported${qs ? `?${qs}` : ""}`);
  return {
    data: (raw?.data ?? []).map(normalizeMaterial),
    thresholds: raw?.thresholds ?? { pending: 10, verified: 3 },
  };
}

export async function resolveReport(
  reportId: string,
  action: "confirm" | "reject",
  resolvedById: string
): Promise<void> {
  await apiClient.patch(`/api/material/admin/${reportId}/resolve-report`, {
    action,
    resolved_by_id: resolvedById,
  });
}
