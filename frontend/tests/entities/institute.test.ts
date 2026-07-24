import { describe, it, expect } from "vitest";
import { normalizeInstitute, denormalizeInstitute } from "@/entities/Institute/model/institute";

describe("normalizeInstitute", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      id: 1,
      name: "Instituto de Sistemas",
      short_name: "IS",
      responsible: "Dr. Pérez",
      status: "active",
      email: "is@edu.ar",
      tel: "123456",
      address: "Calle Falsa 123",
      notes: "Sin notas",
    };

    expect(normalizeInstitute(raw)).toEqual({
      id: "1",
      name: "Instituto de Sistemas",
      shortName: "IS",
      responsible: "Dr. Pérez",
      status: "active",
      email: "is@edu.ar",
      tel: "123456",
      address: "Calle Falsa 123",
      notes: "Sin notas",
    });
  });

  it("usa fallback camelCase cuando no hay snake_case", () => {
    const raw = {
      id: "2",
      name: "Instituto de Datos",
      shortName: "ID",
      responsible: "Lic. García",
      status: "inactive",
      email: "id@edu.ar",
      tel: "654321",
      address: "Av. Siempre Viva 742",
      notes: null,
    };

    expect(normalizeInstitute(raw)).toEqual({
      id: "2",
      name: "Instituto de Datos",
      shortName: "ID",
      responsible: "Lic. García",
      status: "inactive",
      email: "id@edu.ar",
      tel: "654321",
      address: "Av. Siempre Viva 742",
      notes: null,
    });
  });

  it("no usa data.phone como fallback (eliminado en limpieza)", () => {
    const raw = { id: 3, name: "Test", phone: "999999" };
    expect(normalizeInstitute(raw).tel).toBe("");
  });

  it("usa valores por defecto cuando faltan campos", () => {
    const raw = { id: 4, name: "Mínimo" };

    expect(normalizeInstitute(raw)).toEqual({
      id: "4",
      name: "Mínimo",
      shortName: "",
      responsible: "",
      status: "",
      email: "",
      tel: "",
      address: "",
      notes: null,
    });
  });
});

describe("denormalizeInstitute", () => {
  it("convierte camelCase a snake_case", () => {
    const input = {
      name: "Nuevo Instituto",
      shortName: "NI",
      responsible: "Nuevo Resp.",
      status: "active",
      email: "ni@edu.ar",
      tel: "111222",
      address: "Dir 123",
      notes: "Nota",
    };

    expect(denormalizeInstitute(input)).toEqual({
      name: "Nuevo Instituto",
      short_name: "NI",
      responsible: "Nuevo Resp.",
      status: "active",
      email: "ni@edu.ar",
      tel: "111222",
      address: "Dir 123",
      notes: "Nota",
    });
  });

  it("solo incluye campos definidos", () => {
    expect(denormalizeInstitute({ name: "Solo nombre" })).toEqual({ name: "Solo nombre" });
  });
});
