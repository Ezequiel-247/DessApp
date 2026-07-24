export interface PlanCreditBlockItem {
  id: string;
  creditBlockId: string;
  activityId: string;
  credits: number;
  studyPlanId?: string;
  activity?: { id: string; name: string };
}

export function normalizePlanCreditBlockItem(data: any): PlanCreditBlockItem {
  return {
    id: String(data.id),
    creditBlockId: String(data.id_credit_block ?? data.creditBlockId ?? data.idCreditBlock ?? ""),
    activityId: String(data.id_activity ?? data.activityId ?? ""),
    credits: Number(data.credits ?? 0),
    studyPlanId: data.id_study_plan ? String(data.id_study_plan) : undefined,
    activity: data.activity
      ? { id: String(data.activity.id), name: data.activity.name }
      : undefined,
  };
}
