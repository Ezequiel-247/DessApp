import { describe, it, expect } from "vitest";
import { normalizeCareer, denormalizeCareer } from "@/entities/Career/model/career";

describe("normalizeCareer", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      name: "Licenciatura en Sistemas",
      degree_title: "Licenciado en Sistemas",
      id_institute: 3,
      duration: 5,
      code: "LS",
      description: "Carrera de sistemas",
    };

    expect(normalizeCareer(raw)).toEqual({
      id: "1",
      name: "Licenciatura en Sistemas",
      degreeTitle: "Licenciado en Sistemas",
      instituteId: "3",
      duration: 5,
      code: "LS",
      description: "Carrera de sistemas",
      plans: [],
    });
  });

  it("usa fallback camelCase cuando no hay snake_case", () => {
    const raw = {
      id: "2",
      name: "Analista",
      degreeTitle: "Analista Universitario",
      instituteId: "7",
      duration: 3,
      code: "AU",
      description: "Desc",
    };

    expect(normalizeCareer(raw)).toEqual({
      id: "2",
      name: "Analista",
      degreeTitle: "Analista Universitario",
      instituteId: "7",
      duration: 3,
      code: "AU",
      description: "Desc",
      plans: [],
    });
  });

  it("usa valores por defecto cuando faltan campos", () => {
    const raw = { id: 3, name: "Test" };

    expect(normalizeCareer(raw)).toEqual({
      id: "3",
      name: "Test",
      degreeTitle: "",
      instituteId: "",
      duration: 0,
      code: "",
      description: "",
      plans: [],
    });
  });

  it("no incluye subjects (campo fantasma eliminado)", () => {
    const raw = { id: 1, name: "X", subjects: ["a", "b"] };
    const result = normalizeCareer(raw);
    expect(result).not.toHaveProperty("subjects");
  });

  it("pasa plans si están presentes", () => {
    const raw = { id: 1, name: "X", plans: [{ id: 10, careerId: "1", name: "Plan 2024", status: "vigente", duration: 5 }] };
    expect(normalizeCareer(raw).plans).toHaveLength(1);
  });

  it("deja plans como array vacío si no están presentes", () => {
    const raw = { id: 1, name: "X" };
    expect(normalizeCareer(raw).plans).toEqual([]);
  });
});

describe("denormalizeCareer", () => {
  it("convierte camelCase a snake_case", () => {
    const input = {
      name: "Nuevo nombre",
      degreeTitle: "Nuevo título",
      instituteId: "5",
      duration: 4,
      code: "NN",
      description: "Descripción",
    };

    expect(denormalizeCareer(input)).toEqual({
      name: "Nuevo nombre",
      degree_title: "Nuevo título",
      id_institute: 5,
      duration: 4,
      code: "NN",
      description: "Descripción",
    });
  });

  it("solo incluye campos definidos", () => {
    expect(denormalizeCareer({ name: "Solo nombre" })).toEqual({ name: "Solo nombre" });
  });

  it("convierte instituteId vacío a id_institute: 0 (Number('') === 0)", () => {
    expect(denormalizeCareer({ instituteId: "" })).toEqual({ id_institute: 0 });
  });

  it("incluye duration: 0 si se pasa explícitamente", () => {
    expect(denormalizeCareer({ duration: 0 })).toEqual({ duration: 0 });
  });
});
