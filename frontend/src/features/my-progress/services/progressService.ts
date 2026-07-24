import { apiClient } from "@/shared/api/apiClient";
import type { Condition, YearGroup, PendingFinal, Subject } from "../model/progress";

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"],
    [1, "I"],
  ];
  let result = "";
  let remaining = n;
  for (const [value, numeral] of map) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
}

export const badgeMap: Record<string, { label: string; variant: string }> = {
  finalizada: { label: "FINALIZADA", variant: "positive" },
  equivalencia: { label: "EQUIVALENCIA", variant: "positive" },
  regularizada: { label: "REGULARIZADA", variant: "warning" },
  en_curso: { label: "EN CURSO", variant: "info" },
  faltante: { label: "FALTANTE", variant: "neutral" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const formatted = d.toLocaleDateString("es-AR", { month: "short", year: "numeric" }).replace(".", "");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function mapSummaryToConditions(summary: any): Condition[] {
  const conditions: Condition[] = [];
  if (!summary) return conditions;

  if (summary.mandatory) {
    conditions.push({
      icon: "menu_book", iconBg: "bg-primary-container/10", iconColor: "text-primary",
      label: "Materias Obligatorias",
      value: `${summary.mandatory.approved}/${summary.mandatory.total}`,
      suffix: "Aprobadas",
    });
  }
  if (summary.unahur) {
    conditions.push({
      icon: "school", iconBg: "bg-secondary-container/10", iconColor: "text-secondary",
      label: "Materias UNAHUR",
      value: `${summary.unahur.approved}/${summary.unahur.total}`,
      suffix: "Finalizadas",
    });
  }
  if (summary.elective) {
    conditions.push({
      icon: "category", iconBg: "bg-tertiary-fixed-dim/20", iconColor: "text-tertiary-container",
      label: "Materias Electivas",
      value: `${summary.elective.approved}/${summary.elective.total}`,
      suffix: "Aprobadas",
    });
  }
  if (summary.credit) {
    conditions.push({
      icon: "account_balance", iconBg: "bg-primary-container/10", iconColor: "text-primary",
      label: "Bloques de Créditos",
      value: `${summary.credit.approved}/${summary.credit.total}`,
      suffix: "Completados",
    });
  }
  if (summary.current_academic_year) {
    conditions.push({
      icon: "verified", iconBg: "bg-tertiary-fixed-dim/20", iconColor: "text-tertiary-container",
      label: "Antigüedad",
      value: summary.current_academic_year.label,
      suffix: "",
    });
  }

  return conditions;
}

function mapSubject(s: any): Subject {
  if (s.is_block) {
    let name = s.name ?? "";
    if (s.block_type === "unahur") {
      const n = s.sort_order ?? 1;
      name = `Materia UNAHUR ${toRoman(n)}`;
    } else if (s.block_type === "elective") {
      name = `Materia Electiva ${s.sort_order ?? 1}`;
    }
    const base = {
      name,
      badge: badgeMap[s.classification] ?? badgeMap.faltante,
      grade: "",
      credits: "",
      available: s.available ?? true,
      prerequisites: [],
      is_block: true,
      block_type: s.block_type,
      sort_order: s.sort_order,
      pool_subjects: (s.pool_subjects ?? []).map(mapSubject),
      activities: s.activities,
    };
    if (s.block_type === "credit") {
      return {
        ...base,
        minCreditsRequired: s.min_credits_required ?? null,
        maxCreditsAllowed: s.max_credits_allowed ?? null,
        earnedCredits: s.earned_credits ?? 0,
        pool_activities: (s.pool_activities ?? []).map(mapSubject),
      };
    }
    return base;
  }

  const classification = s.classification;
  const isCompleted = classification === "finalizada" || classification === "equivalencia";
  return {
    name: s.subject_name ?? s.name ?? "",
    classification,
    badge: badgeMap[classification] ?? badgeMap.faltante,
    grade: s.grade ?? "-",
    credits: isCompleted
      ? `${s.credits ?? 0}/${s.credits ?? 0} cr`
      : `0/${s.credits ?? 0} cr`,
    available: s.available ?? true,
    prerequisites: (s.prerequisites ?? []) as any,
    consumed: s.consumed,
    lockIcon:
      s.classification === "faltante" && s.available === false
        ? { icon: "lock", color: "text-error" }
        : s.classification === "faltante" && s.available === true
          ? { icon: "lock_open", color: "text-secondary" }
          : undefined,
    is_unahur: s.is_unahur ?? false,
    is_elective: s.is_elective ?? false,
  };
}

function mapBreakdownToYears(breakdown: any[]): YearGroup[] {
  return breakdown.map((yr: any) => ({
    year: yr.year,
    finalizadas: yr.finalizadas ?? 0,
    regularizadas: yr.regularizadas ?? 0,
    enCurso: yr.en_curso ?? 0,
    faltantes: yr.faltantes ?? 0,
    hasThead: true,
    subjects: (yr.subjects ?? [])
      .map(mapSubject)
      .filter((s) => s.is_block || (!s.is_unahur && !s.is_elective)),
  }));
}

function mapPendingToFinals(pending: any[]): PendingFinal[] {
  const today = new Date();
  return pending.map((pf: any) => {
    const expiresAt = pf.regularity_expires_at ?? "";
    let isUrgent = false;
    if (expiresAt) {
      const expiryDate = new Date(expiresAt);
      const diffMs = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isUrgent = diffDays >= 0 && diffDays <= 90;
    }
    return {
      name: pf.subject_name ?? "",
      expires: expiresAt ? formatDate(expiresAt) : "",
      expiresAt,
      isUrgent,
      attempts: {
        current: pf.failed_attempts ?? 0,
        color: (pf.failed_attempts ?? 0) > 0 ? "text-error" : "text-secondary",
      },
      is_expired: pf.is_expired ?? false,
    };
  });
}

export async function fetchAcademicSummary(studentId: number) {
  const res = await apiClient.get(`/api/students/${studentId}/academic-summary`);
  const summary = res.data;

  return {
    progressPercent: summary?.progress_percentage ?? 0,
    completedUnits: summary?.completed_units ?? 0,
    totalUnits: summary?.total_units ?? 0,
    conditions: mapSummaryToConditions(summary),
    accumulatedCredits: summary?.accumulated_credits ?? 0,
    totalCredits: summary?.total_credits ?? 0,
    averageWithFailures: summary?.average_with_failures ?? 0,
    totalAttempted: summary?.total_attempted ?? 0,
    efficiencyPercentage: summary?.efficiency_percentage ?? 0,
    streakCount: summary?.streak_count ?? 0,
    average: summary?.average ?? 0,
    currentAcademicYear: summary?.current_academic_year?.label ?? "",
    mandatory: summary?.mandatory ?? { total: 0, approved: 0 },
    unahur: summary?.unahur ?? { total: 0, approved: 0 },
    elective: summary?.elective ?? { total: 0, approved: 0 },
    credit: summary?.credit ?? { total: 0, approved: 0 },
    enrollmentYear: summary?.current_academic_year?.short_label ?? "",
  };
}

export async function fetchAcademicYearBreakdown(studentId: number, enrollmentId?: string): Promise<YearGroup[]> {
  let url = `/api/students/${studentId}/academic-year-breakdown`;
  if (enrollmentId) url += `?enrollmentId=${enrollmentId}`;
  const res = await apiClient.get(url);
  return mapBreakdownToYears(res.data);
}

export async function fetchPendingFinals(studentId: number, enrollmentId?: string): Promise<PendingFinal[]> {
  let url = `/api/students/${studentId}/pending-finals`;
  if (enrollmentId) url += `?enrollmentId=${enrollmentId}`;
  const res = await apiClient.get(url);
  return mapPendingToFinals(res.data);
}
