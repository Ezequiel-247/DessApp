export interface CorrelativitySubject {
  id: string;
  name: string;
  code: string;
}

export interface CorrelativityPlanSubject {
  id: string;
  idSubject: string;
  Subject?: CorrelativitySubject;
  subject?: CorrelativitySubject;
}

export interface Correlativity {
  id: string;
  idPlanSubjectTarget: string;
  idRequiredPlanSubject: string;
  type?: string;
  requiredPlanSubject?: CorrelativityPlanSubject;
}

export function normalizeCorrelativity(raw: any): Correlativity {
  const rps = raw.requiredPlanSubject;
  return {
    id: String(raw.id),
    idPlanSubjectTarget: String(raw.id_plan_subject_target ?? raw.idPlanSubjectTarget ?? ""),
    idRequiredPlanSubject: String(raw.id_required_plan_subject ?? raw.idRequiredPlanSubject ?? ""),
    type: raw.type ?? undefined,
    requiredPlanSubject: rps
      ? {
          id: String(rps.id),
          idSubject: String(rps.id_subject ?? rps.idSubject ?? ""),
          Subject: (rps.Subject ?? rps.subject)
            ? {
                id: String((rps.Subject ?? rps.subject).id),
                name: (rps.Subject ?? rps.subject).name,
                code: (rps.Subject ?? rps.subject).code,
              }
            : undefined,
        }
      : undefined,
  };
}
