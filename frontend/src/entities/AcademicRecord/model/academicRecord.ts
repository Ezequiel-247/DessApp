export interface AcademicRecord {
  id: string;
  studentId: string;
  subjectId: string;
  planSubjectId: string;
  year: number;
  semester: number;
  grade?: string;
  status: AcademicStatus;
  regularityExpiresAt?: string | null;
  micro_estado_calculado?: string;
  final_exams_count?: number;
  latest_final_exam_status?: string | null;
}

export const ACADEMIC_STATUS = {
  APPROVED: "approved",
  PENDING: "pending",
  FAILED: "failed",
  ENROLLED: "enrolled",
  EQUIVALENCIA: "equivalencia",
} as const;

export type AcademicStatus = (typeof ACADEMIC_STATUS)[keyof typeof ACADEMIC_STATUS];

export const GRADE_VALUES = {
  MIN_APPROVED: 6,
  MAX_GRADE: 10,
} as const;

export const SEMESTERS = {
  FIRST: 1,
  SECOND: 2,
} as const;

export type Semester = (typeof SEMESTERS)[keyof typeof SEMESTERS];
