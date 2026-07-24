export interface UnahurBlock {
  id: string;
  idStudyPlan: string;
  suggestedYear: number;
  suggestedTerm: number | null;
  sortOrder: number | null;
}

export function normalizeUnahurBlock(data: any): UnahurBlock {
  return {
    id: String(data.id),
    idStudyPlan: String(data.id_study_plan ?? data.idStudyPlan ?? ""),
    suggestedYear: Number(data.suggested_year ?? data.suggestedYear ?? 1),
    suggestedTerm: data.suggested_term ?? data.suggestedTerm ?? null,
    sortOrder: data.sort_order ?? data.sortOrder ?? null,
  };
}

export function denormalizeUnahurBlock(data: Partial<UnahurBlock>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.suggestedYear !== undefined) payload.suggested_year = data.suggestedYear;
  if (data.suggestedTerm !== undefined) payload.suggested_term = data.suggestedTerm;
  if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;
  return payload;
}
