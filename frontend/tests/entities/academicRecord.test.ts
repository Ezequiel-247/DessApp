import { describe, it, expect } from "vitest";
import { normalizeRecord, denormalizeRecord } from "@/entities/AcademicRecord/api/academicRecordApi";
import type { AcademicRecord } from "@/entities/AcademicRecord";


describe("normalizeRecord", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      student_id: 10,
      id_subject: 5,
      plan_subject_id: 20,
      year: 2024,
      semester: 1,
      grade: "8",
      status: "approved",
      regularity_expires_at: "2025-06-01",
    };

    expect(normalizeRecord(raw)).toEqual({
      id: "1",
      studentId: "10",
      subjectId: "5",
      planSubjectId: "20",
      year: 2024,
      semester: 1,
      grade: "8",
      status: "approved",
      regularityExpiresAt: "2025-06-01",
    });
  });

  it("usa id_subject como subjectId (ignora plan_subject_id)", () => {
    const raw = {
      id: 1,
      id_subject: 5,
      plan_subject_id: 99,
    };
    expect(normalizeRecord(raw).subjectId).toBe("5");
  });

  it("usa subjectId como fallback si no hay id_subject", () => {
    const raw = { id: 1, subjectId: "subj_5" };
    expect(normalizeRecord(raw).subjectId).toBe("subj_5");
  });

  it("usa string vacío si no hay subjectId ni id_subject", () => {
    const raw = { id: 1, plan_subject_id: 99 };
    expect(normalizeRecord(raw).subjectId).toBe("");
  });

  it("captura plan_subject_id como planSubjectId", () => {
    const raw = { id: 1, id_subject: 5, plan_subject_id: 20 };
    expect(normalizeRecord(raw).planSubjectId).toBe("20");
  });

  it("deja planSubjectId vacío si no hay plan_subject_id", () => {
    const raw = { id: 1, id_subject: 5 };
    expect(normalizeRecord(raw).planSubjectId).toBe("");
  });

  it("convierte grade a string aunque llegue como número", () => {
    expect(normalizeRecord({ id: 1, studentId: 1, subjectId: 1, grade: 7 }).grade).toBe("7");
  });

  it("deja grade undefined cuando es null o undefined", () => {
    expect(normalizeRecord({ id: 1, studentId: 1, subjectId: 1, grade: null }).grade).toBeUndefined();
    expect(normalizeRecord({ id: 1, studentId: 1, subjectId: 1 }).grade).toBeUndefined();
  });

  it("usa valores por defecto cuando faltan campos obligatorios", () => {
    const raw = { id: 1 };

    expect(normalizeRecord(raw)).toEqual({
      id: "1",
      studentId: "",
      subjectId: "",
      planSubjectId: "",
      year: 1,
      semester: 1,
      grade: undefined,
      status: "pending",
      regularityExpiresAt: null,
    });
  });
});

describe("denormalizeRecord", () => {
  it("convierte camelCase a snake_case", () => {
    const input: Partial<AcademicRecord> = {
      studentId: "10",
      subjectId: "20",
      year: 2024,
      semester: 1,
      grade: "8",
      status: "approved",
      regularityExpiresAt: "2025-06-01",
    };

    expect(denormalizeRecord(input)).toEqual({
      id_student: "10",
      id_subject: "20",
      year: 2024,
      semester: 1,
      grade: "8",
      status: "aprobado",
      regularity_expires_at: "2025-06-01",
    });
  });

  it("solo incluye campos definidos", () => {
    expect(denormalizeRecord({})).toEqual({});
  });

  it("incluye grade vacío si se pasa explícitamente", () => {
    expect(denormalizeRecord({ grade: "" })).toEqual({ grade: "" });
  });
});
