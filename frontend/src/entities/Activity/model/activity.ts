export interface Activity {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export function normalizeActivity(data: any): Activity {
  return {
    id: String(data.id),
    name: data.name ?? "",
    code: data.code ?? undefined,
    description: data.description ?? undefined,
  };
}

export function denormalizeActivity(data: Partial<Activity>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.code !== undefined) payload.code = data.code;
  if (data.description !== undefined) payload.description = data.description;
  return payload;
}
