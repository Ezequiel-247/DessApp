export interface FinalExam {
  id: string;
  academicRecordId: string;
  grade: string;
  year: number;
  semester: number;
  status: string;
  academicRecord?: {
    id: string;
    id_student: string;
    id_subject: string;
    year: number;
    semester: number;
    grade: string;
    status: string;
    Subject?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export function normalizeFinalExam(data: any): FinalExam {
  return {
    id: String(data.id),
    academicRecordId: String(data.id_academic_record ?? data.academicRecordId ?? ""),
    grade: data.grade ?? "",
    year: Number(data.year ?? 0),
    semester: Number(data.semester ?? 0),
    status: data.status ?? "",
    academicRecord: data.AcademicRecord ?? data.academicRecord
      ? {
          id: String((data.AcademicRecord ?? data.academicRecord).id),
          id_student: String((data.AcademicRecord ?? data.academicRecord).id_student),
          id_subject: String((data.AcademicRecord ?? data.academicRecord).id_subject),
          year: Number((data.AcademicRecord ?? data.academicRecord).year ?? 0),
          semester: Number((data.AcademicRecord ?? data.academicRecord).semester ?? 0),
          grade: (data.AcademicRecord ?? data.academicRecord).grade ?? "",
          status: (data.AcademicRecord ?? data.academicRecord).status ?? "",
          Subject: (data.AcademicRecord ?? data.academicRecord).Subject
            ? {
                id: String((data.AcademicRecord ?? data.academicRecord).Subject.id),
                name: (data.AcademicRecord ?? data.academicRecord).Subject.name,
                code: (data.AcademicRecord ?? data.academicRecord).Subject.code,
              }
            : undefined,
        }
      : undefined,
  };
}
