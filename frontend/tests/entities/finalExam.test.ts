import { describe, it, expect } from "vitest";
import { normalizeFinalExam } from "@/entities/FinalExam";

describe("normalizeFinalExam", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      id_academic_record: 50,
      grade: "7",
      year: 2024,
      semester: 1,
      status: "approved",
    };

    const result = normalizeFinalExam(raw);
    expect(result.id).toBe("1");
    expect(result.academicRecordId).toBe("50");
    expect(result.grade).toBe("7");
    expect(result.year).toBe(2024);
    expect(result.semester).toBe(1);
    expect(result.status).toBe("approved");
  });

  it("usa fallback camelCase cuando no hay snake_case", () => {
    const raw = {
      id: "2",
      academicRecordId: "99",
      grade: "10",
      year: 2023,
      semester: 2,
      status: "pending",
    };

    const result = normalizeFinalExam(raw);
    expect(result.academicRecordId).toBe("99");
  });

  it("usa valores por defecto cuando faltan campos", () => {
    const raw = { id: 3 };
    const result = normalizeFinalExam(raw);
    expect(result.academicRecordId).toBe("");
    expect(result.grade).toBe("");
    expect(result.year).toBe(0);
    expect(result.semester).toBe(0);
    expect(result.status).toBe("");
  });

  it("normaliza AcademicRecord (PascalCase) cuando está presente", () => {
    const raw = {
      id: 1,
      id_academic_record: 50,
      grade: "8",
      year: 2024,
      semester: 1,
      status: "approved",
      AcademicRecord: {
        id: 50,
        id_student: 10,
        id_subject: 20,
        year: 2024,
        semester: 1,
        grade: "8",
        status: "approved",
        Subject: { id: 20, name: "Álgebra", code: "ALG" },
      },
    };

    const result = normalizeFinalExam(raw);
    expect(result.academicRecord).not.toBeUndefined();
    expect(result.academicRecord!.id).toBe("50");
    expect(result.academicRecord!.id_student).toBe("10");
    expect(result.academicRecord!.Subject!.name).toBe("Álgebra");
  });

  it("normaliza academicRecord (camelCase) cuando está presente", () => {
    const raw = {
      id: 1,
      id_academic_record: 50,
      grade: "8",
      year: 2024,
      semester: 1,
      status: "approved",
      academicRecord: {
        id: 50,
        id_student: 10,
        id_subject: 20,
        year: 2024,
        semester: 1,
        grade: "8",
        status: "approved",
      },
    };

    const result = normalizeFinalExam(raw);
    expect(result.academicRecord!.id).toBe("50");
    expect(result.academicRecord!.Subject).toBeUndefined();
  });

  it("omite academicRecord cuando no está presente", () => {
    const raw = { id: 1, id_academic_record: 50, grade: "8", year: 2024, semester: 1, status: "approved" };
    const result = normalizeFinalExam(raw);
    expect(result.academicRecord).toBeUndefined();
  });
});
