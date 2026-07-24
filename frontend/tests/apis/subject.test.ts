import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getSubjects,
  getSubject,
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "@/entities/Subject";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getSubjects", () => {
  it("retorna array normalizado desde raw.data", async () => {
    server.use(
      http.get(`${BASE}/api/subjects`, () =>
        HttpResponse.json({
          data: [
            { id: 1, name: "Matemática", code: "MAT101", is_unahur: true },
          ],
        })
      )
    );

    const result = await getSubjects();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Matemática");
    expect(result[0].is_unahur).toBe(true);
  });

  it("retorna array vacío cuando data es null", async () => {
    server.use(http.get(`${BASE}/api/subjects`, () => HttpResponse.json({ data: null })));
    expect(await getSubjects()).toEqual([]);
  });
});

describe("getAllSubjects", () => {
  it("tiene el mismo comportamiento que getSubjects", async () => {
    server.use(
      http.get(`${BASE}/api/subjects`, () =>
        HttpResponse.json({ data: [{ id: 1, name: "X" }] })
      )
    );

    expect(await getAllSubjects()).toHaveLength(1);
  });
});

describe("getSubject", () => {
  it("retorna materia normalizada", async () => {
    server.use(
      http.get(`${BASE}/api/subjects/1`, () =>
        HttpResponse.json({ data: { id: 1, name: "Física", code: "FIS101", is_unahur: false } })
      )
    );

    const result = await getSubject("1");
    expect(result.name).toBe("Física");
  });
});

describe("createSubject", () => {
  it("envía POST y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/subjects`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, ...sentBody } }, { status: 201 });
      })
    );

    const result = await createSubject({ name: "Nueva", code: "NEW01", is_unahur: true });
    expect(sentBody).toEqual({ name: "Nueva", code: "NEW01", is_unahur: true });
    expect(result.is_unahur).toBe(true);
  });
});

describe("updateSubject", () => {
  it("envía PATCH y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/subjects/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, name: "Editado", ...sentBody } });
      })
    );

    const result = await updateSubject("1", { name: "Editado" });
    expect(sentBody).toEqual({ name: "Editado" });
    expect(result.name).toBe("Editado");
  });
});

describe("deleteSubject", () => {
  it("envía DELETE", async () => {
    let deleted = false;
    server.use(
      http.delete(`${BASE}/api/subjects/1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    await deleteSubject("1");
    expect(deleted).toBe(true);
  });
});
