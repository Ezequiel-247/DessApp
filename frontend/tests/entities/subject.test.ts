import { describe, it, expect } from "vitest";
import { normalizeSubject, denormalizeSubject } from "@/entities/Subject/model/subject";

describe("normalizeSubject", () => {
  it("convierte a camelCase", () => {
    const raw = {
      id: 1,
      name: "Matemática I",
      code: "MAT101",
      is_unahur: true,
    };

    expect(normalizeSubject(raw)).toEqual({
      id: "1",
      name: "Matemática I",
      code: "MAT101",
      is_unahur: true,
      weeklyHours: 0,
    });
  });

  it("usa fallback isUnahur cuando no hay is_unahur", () => {
    const raw = {
      id: "2",
      name: "Física",
      code: "FIS101",
      isUnahur: true,
    };

    expect(normalizeSubject(raw)).toEqual({
      id: "2",
      name: "Física",
      code: "FIS101",
      is_unahur: true,
      weeklyHours: 0,
    });
  });

  it("usa valores por defecto cuando faltan campos", () => {
    expect(normalizeSubject({ id: 3 })).toEqual({
      id: "3",
      name: "",
      code: "",
      is_unahur: false,
      weeklyHours: 0,
    });
  });
});

describe("denormalizeSubject", () => {
  it("convierte a snake_case manteniendo is_unahur", () => {
    const input = {
      name: "Programación II",
      code: "PROG202",
      is_unahur: false,
    };

    expect(denormalizeSubject(input)).toEqual({
      name: "Programación II",
      code: "PROG202",
      is_unahur: false,
    });
  });

  it("incluye is_unahur false si se pasa explícitamente", () => {
    expect(denormalizeSubject({ is_unahur: false })).toEqual({ is_unahur: false });
  });

  it("solo incluye campos definidos", () => {
    expect(denormalizeSubject({})).toEqual({});
  });
});
