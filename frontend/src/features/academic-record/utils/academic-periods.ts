import { ACADEMIC_PERIODS } from "@/features/academic-record/import-rules";

export type AcademicPeriod = "verano" | "q1" | "q2";

export function derivePeriod(fecha: string, tipo: string): AcademicPeriod {
  const month = Number(fecha.split("/")[1]);

  if (month >= 4 && month <= 7) return "q1";
  if (month === 1 || month >= 9) return "q2";

  if (tipo === "En curso") return "q1";
  return "verano";
}

export function deriveAcademicYear(fecha: string): number {
  const [day, month, year] = fecha.split("/").map(Number);
  return month === 1 ? year - 1 : year;
}

export function derivePeriodKey(fecha: string, tipo: string): string {
  return `${deriveAcademicYear(fecha)}-${derivePeriod(fecha, tipo)}`;
}

export function deriveSemesterFromPeriod(fecha: string, tipo: string): number {
  const period = derivePeriod(fecha, tipo);
  return period === "q2" ? 2 : 1;
}
