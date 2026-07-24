import { normalizeEnrollment } from "@/entities/StudentCareerEnrollment";
import type { StudentCareerEnrollment } from "@/entities/StudentCareerEnrollment";

export interface StudentPrivacy {
  publicProfile: boolean;
  showAcademicInfo: boolean;
  publishApprovals: boolean;
  showEmail: boolean;
}

export interface StudentAcademicRecord {
  id: number | string;
  subjectName: string;
  subjectCode?: string;
  grade?: string;
  status: string;
  year: number;
  semester: number;
}

export interface Student {
  userId: number;
  legajo: string | null;
  visibility?: "owner" | "contact" | "public";
  publicProfile: boolean;
  showEmail: boolean;
  showAcademicInfo: boolean;
  publishApprovals: boolean;
  user?: {
    id: number;
    name: string;
    lastname: string;
    email: string;
    avatar?: string | null;
    role: string;
    is_active: boolean;
  };
  enrollments: StudentCareerEnrollment[];
  academicRecords?: StudentAcademicRecord[];
}

export function normalizeStudent(data: any): Student {
  const rawUser = data.user ?? data.User;
  const rawEnrollments = data.enrollments ?? data.Enrollments ?? [];
  const rawAcademicRecords = data.academic_records ?? data.academicRecords;

  return {
    userId: data.user_id ?? data.userId,
    legajo: data.legajo ?? null,
    visibility: data.visibility,
    publicProfile: data.public_profile ?? data.publicProfile ?? false,
    showEmail: data.show_email ?? data.showEmail ?? false,
    showAcademicInfo: data.show_academic_info ?? data.showAcademicInfo ?? false,
    publishApprovals: data.publish_approvals ?? data.publishApprovals ?? false,
    user: rawUser
      ? {
          id: rawUser.id,
          name: rawUser.name,
          lastname: rawUser.lastname,
          email: rawUser.email,
          avatar: rawUser.avatar ?? null,
          role: rawUser.role,
          is_active: rawUser.is_active ?? rawUser.isActive,
        }
      : undefined,
    enrollments: rawEnrollments.map(normalizeEnrollment),
    academicRecords: Array.isArray(rawAcademicRecords)
      ? rawAcademicRecords.map((record: any) => ({
          id: record.id,
          subjectName: record.plan_subject?.subject?.name ?? 'Materia',
          subjectCode: record.plan_subject?.subject?.code,
          grade: record.grade ?? undefined,
          status: record.status,
          year: record.year,
          semester: record.semester,
        }))
      : undefined,
  };
}

export function denormalizePrivacy(data: Partial<StudentPrivacy>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (data.publicProfile !== undefined) payload.public_profile = data.publicProfile;
  if (data.showAcademicInfo !== undefined) payload.show_academic_info = data.showAcademicInfo;
  if (data.publishApprovals !== undefined) payload.publish_approvals = data.publishApprovals;
  if (data.showEmail !== undefined) payload.show_email = data.showEmail;
  return payload;
}
