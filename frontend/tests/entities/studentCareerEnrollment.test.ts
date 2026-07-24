import { describe, it, expect } from "vitest";
import { normalizeEnrollment } from "@/entities/StudentCareerEnrollment/model/studentCareerEnrollment";

describe("normalizeEnrollment", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      student_id: 10,
      career_id: 5,
      enrolled_at: "2024-03-01",
      completed_at: null,
      status: "active",
      is_active: true,
    };

    expect(normalizeEnrollment(raw)).toEqual({
      id: 1,
      studentId: 10,
      careerId: 5,
      studyPlanId: null,
      enrolledAt: "2024-03-01",
      completedAt: null,
      status: "active",
      isActive: true,
      career: undefined,
      studyPlan: undefined,
    });
  });

  it("usa fallback camelCase cuando no hay snake_case", () => {
    const raw = {
      id: 2,
      studentId: 20,
      careerId: 8,
      enrolledAt: "2024-06-01",
      completedAt: "2025-06-01",
      status: "completed",
      isActive: false,
    };

    expect(normalizeEnrollment(raw)).toEqual({
      id: 2,
      studentId: 20,
      careerId: 8,
      studyPlanId: null,
      enrolledAt: "2024-06-01",
      completedAt: "2025-06-01",
      status: "completed",
      isActive: false,
      career: undefined,
      studyPlan: undefined,
    });
  });

  it("usa valores por defecto cuando faltan campos", () => {
    const raw = { id: 3 };

    expect(normalizeEnrollment(raw)).toEqual({
      id: 3,
      studentId: undefined,
      careerId: undefined,
      studyPlanId: null,
      enrolledAt: undefined,
      completedAt: null,
      status: "active",
      isActive: true,
      career: undefined,
      studyPlan: undefined,
    });
  });

  it("normaliza nested career desde snake_case", () => {
    const raw = {
      id: 1,
      student_id: 1,
      career_id: 5,
      enrolled_at: "2024-01-01",
      status: "active",
      is_active: true,
      career: {
        id: 5,
        name: "Lic. en Sistemas",
        degree_title: "Licenciado",
        duration: 5,
        code: "LS",
      },
    };

    const result = normalizeEnrollment(raw);
    expect(result.career).toBeDefined();
    expect(result.career!.name).toBe("Lic. en Sistemas");
    expect(result.career!.degreeTitle).toBe("Licenciado");
  });

  it("normaliza nested Career (PascalCase) si está presente", () => {
    const raw = {
      id: 1,
      student_id: 1,
      career_id: 8,
      enrolled_at: "2024-01-01",
      status: "active",
      is_active: true,
      Career: {
        id: 8,
        name: "Analista",
        degree_title: "Analista Univ.",
        duration: 3,
        code: "AU",
      },
    };

    const result = normalizeEnrollment(raw);
    expect(result.career).toBeDefined();
    expect(result.career!.name).toBe("Analista");
  });
});
