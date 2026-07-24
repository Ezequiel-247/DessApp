import { describe, it, expect } from "vitest";

/**
 * Unit tests for the normalización of raw API responses from extracurricularApi.ts.
 * These functions are inlined here to test the mapping logic independently of the API client.
 */

interface RawActivity {
  id: string | number;
  student_id: string | number;
  name: string;
  description?: string;
  credits: string | number;
  start_date?: string;
  end_date?: string;
}

function normalizeActivity(d: RawActivity) {
  return {
    id: String(d.id),
    studentId: String(d.student_id),
    name: d.name,
    description: d.description,
    credits: Number(d.credits),
    startDate: d.start_date,
    endDate: d.end_date,
  };
}

function denormalizeActivity(payload: {
  name: string;
  credits: number;
  description?: string;
  startDate?: string;
  endDate?: string;
}) {
  return {
    name: payload.name,
    description: payload.description,
    credits: payload.credits,
    start_date: payload.startDate,
    end_date: payload.endDate,
  };
}

// ─── normalizeActivity ────────────────────────────────────────────────────────

describe("normalizeActivity — snake_case to camelCase", () => {
  it("mapea todos los campos correctamente", () => {
    const raw: RawActivity = {
      id: 1,
      student_id: 2,
      name: "Curso Python",
      description: "Curso introductorio",
      credits: 2,
      start_date: "2025-03-01",
      end_date: "2025-06-30",
    };

    expect(normalizeActivity(raw)).toEqual({
      id: "1",
      studentId: "2",
      name: "Curso Python",
      description: "Curso introductorio",
      credits: 2,
      startDate: "2025-03-01",
      endDate: "2025-06-30",
    });
  });

  it("convierte credits string a number", () => {
    const raw: RawActivity = { id: 1, student_id: 2, name: "Actividad", credits: "3" };
    const result = normalizeActivity(raw);
    expect(result.credits).toBe(3);
    expect(typeof result.credits).toBe("number");
  });

  it("preserva credits igual a 0", () => {
    const raw: RawActivity = { id: 1, student_id: 2, name: "Actividad", credits: 0 };
    const result = normalizeActivity(raw);
    expect(result.credits).toBe(0);
  });

  it("convierte id numérico a string", () => {
    const raw: RawActivity = { id: 42, student_id: 7, name: "Test", credits: 1 };
    const result = normalizeActivity(raw);
    expect(result.id).toBe("42");
    expect(result.studentId).toBe("7");
  });

  it("mapea start_date y end_date opcionales como undefined si no están", () => {
    const raw: RawActivity = { id: 1, student_id: 2, name: "Sin fechas", credits: 1 };
    const result = normalizeActivity(raw);
    expect(result.startDate).toBeUndefined();
    expect(result.endDate).toBeUndefined();
  });
});

// ─── denormalizeActivity ──────────────────────────────────────────────────────

describe("denormalizeActivity — camelCase to snake_case", () => {
  it("mapea todos los campos correctamente", () => {
    const payload = {
      name: "Hackathon",
      description: "Nacional 2025",
      credits: 2,
      startDate: "2025-05-10",
      endDate: "2025-05-12",
    };

    expect(denormalizeActivity(payload)).toEqual({
      name: "Hackathon",
      description: "Nacional 2025",
      credits: 2,
      start_date: "2025-05-10",
      end_date: "2025-05-12",
    });
  });

  it("incluye credits: 0 correctamente", () => {
    const result = denormalizeActivity({ name: "Actividad", credits: 0 });
    expect(result.credits).toBe(0);
  });

  it("permite omitir description, startDate, endDate", () => {
    const result = denormalizeActivity({ name: "Evento", credits: 3 });
    expect(result.description).toBeUndefined();
    expect(result.start_date).toBeUndefined();
    expect(result.end_date).toBeUndefined();
  });
});
