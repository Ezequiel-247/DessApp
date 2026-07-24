export interface CreditBlockItem {
  id: string;
  idCreditBlock: string;
  idActivity: string;
  credits: number;
  activityName?: string;
}

export interface CreditBlock {
  id: string;
  idStudyPlan: string;
  name: string;
  minCreditsRequired: number | null;
  maxCreditsAllowed: number | null;
  sortOrder: number | null;
  items?: CreditBlockItem[];
}

export function normalizeCreditBlock(data: any): CreditBlock {
  const rawItems = data.items ?? data.PlanCreditBlockItems;
  return {
    id: String(data.id),
    idStudyPlan: String(data.id_study_plan ?? data.idStudyPlan ?? ""),
    name: data.name ?? "",
    minCreditsRequired: data.min_credits_required ?? data.minCreditsRequired ?? null,
    maxCreditsAllowed: data.max_credits_allowed ?? data.maxCreditsAllowed ?? null,
    sortOrder: data.sort_order ?? data.sortOrder ?? null,
    items: Array.isArray(rawItems)
      ? rawItems.map((item: any) => ({
          id: String(item.id),
          idCreditBlock: String(item.id_credit_block ?? item.idCreditBlock ?? ""),
          idActivity: String(item.id_activity ?? item.idActivity ?? ""),
          credits: Number(item.credits ?? 0),
          activityName: item.Activity?.name ?? item.activityName ?? "",
        }))
      : undefined,
  };
}

export function denormalizeCreditBlock(data: Partial<CreditBlock>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.minCreditsRequired !== undefined) payload.min_credits_required = data.minCreditsRequired;
  if (data.maxCreditsAllowed !== undefined) payload.max_credits_allowed = data.maxCreditsAllowed;
  if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;
  return payload;
}
