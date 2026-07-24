export interface Subject {
  id: string;
  name: string;
  code: string;
  is_unahur: boolean;
  weeklyHours: number;
}

export function normalizeSubject(data: any): Subject {
  return {
    id: String(data.id),
    name: data.name ?? "",
    code: data.code ?? "",
    is_unahur: String(data.is_unahur ?? data.isUnahur ?? "") === "true",
    weeklyHours: Number(data.weekly_hours ?? data.weeklyHours ?? 0),
  };
}

export function denormalizeSubject(data: Partial<Subject>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
  if (data.is_unahur !== undefined) payload.is_unahur = data.is_unahur;
  if (data.weeklyHours !== undefined) payload.weekly_hours = data.weeklyHours;
  return payload;
}
