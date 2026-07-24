import { describe, it, expect } from "vitest";
import { normalizeCorrelativity } from "@/entities/Correlativity";

describe("normalizeCorrelativity", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      id_plan_subject_target: 10,
      id_required_plan_subject: 20,
      type: "regular",
    };

    const result = normalizeCorrelativity(raw);
    expect(result.id).toBe("1");
    expect(result.idPlanSubjectTarget).toBe("10");
    expect(result.idRequiredPlanSubject).toBe("20");
    expect(result.type).toBe("regular");
  });

  it("usa fallback camelCase cuando no hay snake_case", () => {
    const raw = {
      id: "2",
      idPlanSubjectTarget: "30",
      idRequiredPlanSubject: "40",
    };

    const result = normalizeCorrelativity(raw);
    expect(result.idPlanSubjectTarget).toBe("30");
    expect(result.idRequiredPlanSubject).toBe("40");
  });

  it("usa string vacío cuando faltan IDs", () => {
    const raw = { id: 5 };
    const result = normalizeCorrelativity(raw);
    expect(result.idPlanSubjectTarget).toBe("");
    expect(result.idRequiredPlanSubject).toBe("");
  });

  it("normaliza requiredPlanSubject cuando está presente", () => {
    const raw = {
      id: 1,
      id_plan_subject_target: 10,
      id_required_plan_subject: 20,
      requiredPlanSubject: {
        id: 5,
        id_subject: 99,
        Subject: { id: 99, name: "Matemática", code: "MAT" },
      },
    };

    const result = normalizeCorrelativity(raw);
    expect(result.requiredPlanSubject).not.toBeUndefined();
    expect(result.requiredPlanSubject!.id).toBe("5");
    expect(result.requiredPlanSubject!.idSubject).toBe("99");
    expect(result.requiredPlanSubject!.Subject!.name).toBe("Matemática");
  });

  it("omite requiredPlanSubject cuando es undefined", () => {
    const raw = { id: 1, id_plan_subject_target: 2, id_required_plan_subject: 3 };
    const result = normalizeCorrelativity(raw);
    expect(result.requiredPlanSubject).toBeUndefined();
  });

  it("omite Subject dentro de requiredPlanSubject cuando no está presente", () => {
    const raw = {
      id: 1,
      id_plan_subject_target: 2,
      id_required_plan_subject: 3,
      requiredPlanSubject: { id: 5, id_subject: 10 },
    };
    const result = normalizeCorrelativity(raw);
    expect(result.requiredPlanSubject!.Subject).toBeUndefined();
  });
});
