export const EXPECTED_COLUMNS = ["Actividad", "Fecha", "Tipo", "Nota", "Resultado"];

export const ALLOWED_TIPOS = ["Regularidad", "Promocion", "En curso", "Examen", "Equivalencia"];

export const ALLOWED_RESULTADOS = ["Aprobado", "Promocionado", "Reprobado", "Ausente", ""];

export const RESULTADO_TO_STATUS: Record<string, string> = {
  Aprobado: "approved",
  Promocionado: "approved",
  Reprobado: "failed",
};

export const SPECIAL_GRADES = {
  CONCEPTO: "C",
  NO_CURSO: "NC",
} as const;

export const CPU_SUBJECT_PREFIX = "CPU_";

export const GRADE_RANGES: Record<string, { min: number; max: number }> = {
  approved: { min: 4, max: 10 },
  failed: { min: 0, max: 3 },
  enrolled: { min: 0, max: 0 },
};

export const RESULTADO_TO_BACKEND_STATUS: Record<string, string> = {
  Aprobado: "aprobado",
  Promocionado: "aprobado",
  Reprobado: "desaprobado",
  Ausente: "desaprobado",
};

export const ACADEMIC_PERIODS = {
  VERANO: { months: [2, 3], semester: 1, label: "Verano" },
  Q1: { months: [4, 5, 6, 7], semester: 1, label: "1° Cuatrimestre" },
  Q2: { months: [8, 9, 10, 11, 12, 1], semester: 2, label: "2° Cuatrimestre" },
} as const;

export const TIPO_PRIORITY: Record<string, number> = {
  Regularidad: 0,
  Promocion: 1,
  Equivalencia: 1,
  Examen: 2,
  "En curso": 3,
};
