import type { Subject } from "@/entities/Subject";

export interface ExamEligibleOption {
  id: string;
  name: string;
  label: string;
  is_expired: boolean;
  year: number;
}

export const CURRENT_YEAR = new Date().getFullYear();

export type RecordType = "regularidad" | "examen" | "actividad";
export type FilterMode = "plan" | "unahur";

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  regularidad: "Materia",
  examen: "Examen Final",
  actividad: "Actividad con créditos",
};

export const MICRO_ESTADO_BADGE_MAP: Record<string, { label: string; className: string }> = {
  FINALIZADA:   { label: "FINALIZADA",   className: "bg-secondary-container/10 text-secondary" },
  EQUIVALENCIA: { label: "EQUIVALENCIA", className: "bg-secondary-container/10 text-secondary" },
  REGULARIZADA: { label: "REGULARIZADA", className: "bg-tertiary-fixed-dim/20 text-tertiary-container" },
  EN_CURSO:     { label: "EN CURSO",     className: "bg-primary-fixed/30 text-primary" },
  FALTANTE:     { label: "FALTANTE",     className: "bg-slate-100 text-slate-400" },
  VENCIDA:      { label: "VENCIDA",      className: "bg-error-container/30 text-error" },
};

export function getBadgeForMicroEstado(microEstado: string | null | undefined) {
  return MICRO_ESTADO_BADGE_MAP[microEstado ?? ""] ?? MICRO_ESTADO_BADGE_MAP.FALTANTE;
}

export function isPillDisabled(
  type: RecordType,
  hasExamEligibleSubjects: boolean,
  availableActivitiesCount: number,
  hasAnySubject: boolean
): boolean {
  if (type === "examen") return !hasExamEligibleSubjects;
  if (type === "actividad") return availableActivitiesCount === 0;
  return !hasAnySubject;
}

export function getPillDisabledTitle(type: RecordType): string {
  const titles: Record<RecordType, string> = {
    regularidad: "No hay materias disponibles para registrar",
    examen: "No tenés exámenes finales pendientes para rendir",
    actividad: "No hay actividades disponibles para registrar",
  };
  return titles[type];
}

export function getSubjectOptions(
  modalMode: "add" | "edit" | null,
  type: RecordType,
  effectiveFilter: FilterMode,
  subjects: Subject[],
  subjectsForRegularidadSelector: Subject[],
  subjectsForUnahurSelector: Subject[],
  subjectsWithRegularidad: Subject[]
): Subject[] {
  if (modalMode === "edit") return subjects;
  if (type === "examen") return subjectsWithRegularidad;
  if (effectiveFilter === "unahur") return subjectsForUnahurSelector;
  return subjectsForRegularidadSelector;
}

export function getExamEligibleOptions(examEligibleData: any[]): { vigentes: ExamEligibleOption[]; historicas: ExamEligibleOption[] } {
  const vigentes: ExamEligibleOption[] = [];
  const historicas: ExamEligibleOption[] = [];

  for (const entry of examEligibleData) {
    let label = entry.subject_name ?? '';
    if (entry.failed_attempts > 0) {
      label += ` (${entry.failed_attempts} intento${entry.failed_attempts !== 1 ? 's' : ''})`;
    } else if (!entry.is_expired && entry.regularity_expires_at) {
      const d = new Date(entry.regularity_expires_at);
      const formatted = d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }).replace('.', '');
      label += ` (Vence: ${formatted})`;
    } else if (entry.is_expired && entry.regularity_expires_at) {
      label += ` (Cursada: ${entry.year ?? '?'} | Vencida)`;
    }

    const option: ExamEligibleOption = {
      id: String(entry.subject_id),
      name: entry.subject_name ?? '',
      label,
      is_expired: entry.is_expired ?? false,
      year: entry.year ?? 0,
    };

    if (option.is_expired) {
      historicas.push(option);
    } else {
      vigentes.push(option);
    }
  }

  return { vigentes, historicas };
}

export function isYearSemesterDisabled(type: RecordType, subjectId: string): boolean {
  return type !== "actividad" && subjectId === "";
}

export function shouldShowGrade(type: RecordType, status: string): boolean {
  return status !== "enrolled" && status !== "equivalencia" && type !== "actividad";
}

export function getGradeMinMax(type: RecordType, status: string): { min: number; max: number } {
  const isExamen = type === "examen";
  const isApproved = status === "approved" || status === "aprobado";

  if (isExamen) {
    return isApproved ? { min: 4, max: 10 } : { min: 1, max: 3 };
  }
  return status === "approved" ? { min: 4, max: 10 } : { min: 1, max: 3 };
}

export function getGradePlaceholder(type: RecordType, status: string): string {
  const isExamen = type === "examen";
  const isApproved = status === "approved" || status === "aprobado";

  if (isExamen) return isApproved ? "Nota 4-10" : "Nota 1-3";
  return status === "approved" ? "Nota 4-10" : "Nota 1-3";
}

export function computeExpiryLabel(year: number, semester: number): string {
  if (!year || !semester) return "—";
  const expiryYear = year + 2;
  if (semester === 1) return `31 jul ${expiryYear}`;
  if (semester === 2) return `31 dic ${expiryYear}`;
  return "—";
}

export function shouldShowExpiryField(type: RecordType, status: string): boolean {
  return type === "regularidad" && status === "approved";
}

export function getModalTitle(mode: "add" | "edit" | null, type: RecordType): string {
  if (mode === "edit") return type === "examen" ? "Editar Examen" : "Editar Registro";
  return "Agregar Registro";
}

export function getDeleteInfo(
  selectedExam: any,
  selectedActivityRecord: any,
  selectedRecord: any
): { id: string; type: "subject" | "exam" | "actividad" } {
  const id = selectedExam?.id ?? selectedRecord?.id ?? selectedActivityRecord?.id ?? "";
  const type = selectedExam ? "exam" as const
    : selectedActivityRecord ? "actividad" as const
    : "subject" as const;
  return { id, type };
}

const STATUS_BADGE_MAP: Record<string, { label: string; variant: string }> = {
  pending:      { label: "Regularizada",  variant: "warning" },
  enrolled:     { label: "En curso",      variant: "info" },
  failed:       { label: "Desaprobada",   variant: "danger" },
  desaprobado:  { label: "Desaprobada",   variant: "danger" },
  approved:     { label: "Finalizada",    variant: "positive" },
  aprobado:     { label: "Finalizada",    variant: "positive" },
  equivalencia: { label: "Equivalencia",  variant: "positive" },
};

export function getStatusLabel(status: string): string {
  return STATUS_BADGE_MAP[status]?.label ?? status;
}

export function getStatusBadge(status: string): { label: string; variant: string } {
  return STATUS_BADGE_MAP[status] ?? { label: status, variant: "positive" };
}

const MICRO_ESTADO_ICON_MAP: Record<string, { icon: string; className: string; title: string }> = {
  FINALIZADA: { icon: "check_circle", className: "text-secondary", title: "Finalizada" },
  REGULARIZADA: { icon: "hourglass_empty", className: "text-tertiary-fixed-dim", title: "Regular vigente" },
  VENCIDA: { icon: "close", className: "text-error", title: "Regularidad vencida" },
};

export function getMicroEstadoIcon(microEstado: string | null | undefined) {
  return MICRO_ESTADO_ICON_MAP[microEstado ?? ""];
}

export function getActivityGradeDisplay(status: string): string | undefined {
  if (status === "approved" || status === "equivalencia") return "C";
  if (status === "enrolled") return undefined;
  return "NC";
}


