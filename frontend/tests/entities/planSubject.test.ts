import { describe, it, expect } from "vitest";
import { normalizePlanSubject, denormalizePlanSubject } from "@/entities/PlanSubject/model/planSubject";

describe("normalizePlanSubject", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      id_study_plan: 5,
      id_subject: 10,
      suggested_year: 2,
      suggested_term: 1,
      weekly_hours: 4,
      credits: 6,
    };

    expect(normalizePlanSubject(raw)).toEqual({
      id: "1",
      idStudyPlan: "5",
      idSubject: "10",
      suggestedYear: 2,
      suggestedTerm: 1,
      credits: 6,
    });
  });

  it("usa fallbacks cuando faltan campos snake_case", () => {
    const raw = {
      id: "2",
      idStudyPlan: "99",
      idSubject: "42",
      suggestedYear: 3,
      suggestedTerm: 2,
      weeklyHours: 6,
      credits: 8,
    };

    expect(normalizePlanSubject(raw)).toEqual({
      id: "2",
      idStudyPlan: "99",
      idSubject: "42",
      suggestedYear: 3,
      suggestedTerm: 2,
      credits: 8,
    });
  });

  it("usa valores por defecto cuando faltan campos opcionales", () => {
    const raw = { id: 3, id_study_plan: 1, id_subject: 2 };

    expect(normalizePlanSubject(raw)).toEqual({
      id: "3",
      idStudyPlan: "1",
      idSubject: "2",
      suggestedYear: 1,
      suggestedTerm: 1,
      credits: 0,
    });
  });
});

describe("denormalizePlanSubject", () => {
  it("convierte camelCase a snake_case", () => {
    const input = {
      idStudyPlan: "5",
      idSubject: "10",
      suggestedYear: 2,
      suggestedTerm: 1,
      weeklyHours: 4,
      credits: 6,
    };

    expect(denormalizePlanSubject(input)).toEqual({
      id_study_plan: 5,
      id_subject: 10,
      suggested_year: 2,
      suggested_term: 1,
      credits: 6,
    });
  });

  it("incluye credits: 0 cuando se pasa explícitamente", () => {
    expect(denormalizePlanSubject({ credits: 0 })).toEqual({ credits: 0 });
  });

  it("excluye campos no definidos", () => {
    expect(denormalizePlanSubject({})).toEqual({});
  });
});

describe("PlanSubject - Credits Validation", () => {
  it("normalizePlanSubject preserva credits positivos", () => {
    const raw = { id: 1, id_study_plan: 5, id_subject: 10, credits: 5 };
    const result = normalizePlanSubject(raw);
    expect(result.credits).toBe(5);
  });

  it("normalizePlanSubject preserva credits de 0", () => {
    const raw = { id: 1, id_study_plan: 5, id_subject: 10, credits: 0 };
    const result = normalizePlanSubject(raw);
    expect(result.credits).toBe(0);
  });

  it("denormalizePlanSubject incluye credits positivos", () => {
    const input = { idStudyPlan: "5", idSubject: "10", credits: 3 };
    const result = denormalizePlanSubject(input);
    expect(result.credits).toBe(3);
  });

  it("denormalizePlanSubject preserva credits 0", () => {
    const input = { idStudyPlan: "5", idSubject: "10", credits: 0 };
    const result = denormalizePlanSubject(input);
    expect(result.credits).toBe(0);
  });

  it("normalizePlanSubject usa default 0 cuando credits falta", () => {
    const raw = { id: 1, id_study_plan: 5, id_subject: 10 };
    const result = normalizePlanSubject(raw);
    expect(result.credits).toBe(0);
  });

  it("denormalizePlanSubject permite omitir credits", () => {
    const input = { idStudyPlan: "5", idSubject: "10" };
    const result = denormalizePlanSubject(input);
    expect(result.credits).toBeUndefined();
  });

  it("normalizePlanSubject convierte string credits a number", () => {
    const raw = { id: 1, id_study_plan: 5, id_subject: 10, credits: "5" };
    const result = normalizePlanSubject(raw);
    expect(result.credits).toBe(5);
    expect(typeof result.credits).toBe("number");
  });
});
