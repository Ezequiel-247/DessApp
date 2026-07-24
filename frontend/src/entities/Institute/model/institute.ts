export interface Institute {
  id: string;
  name: string;
  shortName: string;
  responsible: string;
  status: string;
  email: string;
  tel: string;
  address: string;
  notes: string | null;
}

export function normalizeInstitute(data: any): Institute {
  return {
    id: String(data.id),
    name: data.name ?? "",
    shortName: data.short_name ?? data.shortName ?? "",
    responsible: data.responsible ?? "",
    status: data.status ?? "",
    email: data.email ?? "",
    tel: data.tel ?? "",
    address: data.address ?? "",
    notes: data.notes ?? null,
  };
}

export function denormalizeInstitute(data: Partial<Institute>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.shortName !== undefined) payload.short_name = data.shortName;
  if (data.responsible !== undefined) payload.responsible = data.responsible;
  if (data.status !== undefined) payload.status = data.status;
  if (data.email !== undefined) payload.email = data.email;
  if (data.tel !== undefined) payload.tel = data.tel;
  if (data.address !== undefined) payload.address = data.address;
  if (data.notes !== undefined) payload.notes = data.notes;
  return payload;
}
