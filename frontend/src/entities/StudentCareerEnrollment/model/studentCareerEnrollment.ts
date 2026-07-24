export interface StudentCareerEnrollment {
  id: number;
  studentId: number;
  careerId: number;
  studyPlanId: number | null;
  enrolledAt: string;
  completedAt: string | null;
  status: string;
  isActive: boolean;
  career?: {
    id: number;
    name: string;
    degreeTitle?: string;
    duration?: number;
    code?: string;
  };
  studyPlan?: {
    id: number;
    name: string;
    status: string;
  };
}

export function normalizeEnrollment(data: any): StudentCareerEnrollment {
  return {
    id: data.id,
    studentId: data.student_id ?? data.studentId,
    careerId: data.career_id ?? data.careerId,
    studyPlanId: data.study_plan_id ?? data.studyPlanId ?? null,
    enrolledAt: data.enrolled_at ?? data.enrolledAt,
    completedAt: data.completed_at ?? data.completedAt ?? null,
    status: data.status ?? 'active',
    isActive: data.is_active ?? data.isActive ?? true,
    career: data.career
      ? {
          id: data.career.id,
          name: data.career.name,
          degreeTitle: data.career.degree_title ?? data.career.degreeTitle,
          duration: data.career.duration,
          code: data.career.code,
        }
      : data.Career
        ? {
            id: data.Career.id,
            name: data.Career.name,
            degreeTitle: data.Career.degree_title ?? data.Career.degreeTitle,
            duration: data.Career.duration,
            code: data.Career.code,
          }
        : undefined,
    studyPlan: data.studyPlan ?? data.StudyPlan
      ? {
          id: (data.studyPlan ?? data.StudyPlan).id,
          name: (data.studyPlan ?? data.StudyPlan).name,
          status: (data.studyPlan ?? data.StudyPlan).status,
        }
      : undefined,
  };
}
