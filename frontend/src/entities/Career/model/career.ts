export interface Career {
  id: string;
  name: string;
  degreeTitle: string;
  instituteId: string;
  duration: number;
  code: string;
  description: string;
  plans?: CareerPlan[];
}

export interface CareerPlan {
  id: string;
  careerId: string;
  name: string;
  status: CareerPlanStatus;
  duration: number;
}

export type CareerPlanStatus = "vigente" | "en_transicion" | "discontinuado";

export const CAREER_DURATION = {
  TWO_YEARS: 2,
  THREE_YEARS: 3,
  FOUR_YEARS: 4,
  FIVE_YEARS: 5,
} as const;

export type CareerDuration = (typeof CAREER_DURATION)[keyof typeof CAREER_DURATION];

export function normalizeCareer(data: any): Career {
  return {
    id: String(data.id),
    name: data.name ?? "",
    degreeTitle: data.degree_title ?? data.degreeTitle ?? "",
    instituteId: String(data.id_institute ?? data.instituteId ?? ""),
    duration: Number(data.duration ?? 0),
    code: data.code ?? "",
    description: data.description ?? "",
    plans: data.plans ?? [],
  };
}

export function denormalizeCareer(data: Partial<Career>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.degreeTitle !== undefined) payload.degree_title = data.degreeTitle;
  if (data.instituteId !== undefined) payload.id_institute = Number(data.instituteId);
  if (data.duration !== undefined) payload.duration = data.duration;
  if (data.code !== undefined) payload.code = data.code;
  if (data.description !== undefined) payload.description = data.description;
  return payload;
}
