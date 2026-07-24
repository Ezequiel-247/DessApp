import { describe, it, expect } from "vitest";
import { normalizePlan, denormalizePlan } from "@/entities/Plan/model/plan";

describe("normalizePlan", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      id_career: 5,
      name: "Plan 2024",
      status: "vigente",
      years_duration: 5,
      course_type: "cuatrimestral",
      default_term: 1,
    };

    expect(normalizePlan(raw)).toEqual({
      id: "1",
      careerId: "5",
      name: "Plan 2024",
      status: "vigente",
      yearsDuration: 5,
      courseType: "cuatrimestral",
      defaultTerm: 1,
      minTotalCredits: null,
    });
  });

  it("usa fallback camelCase cuando no hay snake_case", () => {
    const raw = {
      id: "2",
      careerId: "99",
      name: "Plan 2025",
      status: "en_transicion",
      yearsDuration: 4,
      courseType: "anual",
      defaultTerm: null,
    };

    expect(normalizePlan(raw)).toEqual({
      id: "2",
      careerId: "99",
      name: "Plan 2025",
      status: "en_transicion",
      yearsDuration: 4,
      courseType: "anual",
      defaultTerm: null,
      minTotalCredits: null,
    });
  });

  it("usa valores por defecto cuando faltan campos", () => {
    const raw = { id: 3, name: "Plan básico" };

    expect(normalizePlan(raw)).toEqual({
      id: "3",
      careerId: "",
      name: "Plan básico",
      status: "",
      yearsDuration: null,
      courseType: null,
      defaultTerm: null,
      minTotalCredits: null,
    });
  });
});

describe("denormalizePlan", () => {
  it("convierte camelCase a snake_case", () => {
    const input = {
      careerId: "5",
      name: "Plan 2024",
      status: "vigente",
      yearsDuration: 5,
      courseType: "cuatrimestral",
      defaultTerm: 1,
    };

    expect(denormalizePlan(input)).toEqual({
      id_career: 5,
      name: "Plan 2024",
      status: "vigente",
      years_duration: 5,
      course_type: "cuatrimestral",
      default_term: 1,
    });
  });

  it("solo incluye campos definidos", () => {
    expect(denormalizePlan({ name: "Solo nombre" })).toEqual({ name: "Solo nombre" });
  });

  it("incluye yearsDuration: 0 si se pasa explícitamente", () => {
    expect(denormalizePlan({ yearsDuration: 0 })).toEqual({ years_duration: 0 });
  });
});
