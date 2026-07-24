import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getInstitutes,
  createInstitute,
  updateInstitute,
  deleteInstitute,
} from "@/entities/Institute";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getInstitutes", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/institutes`, () =>
        HttpResponse.json({
          data: [
            { id: 1, name: "Instituto A", short_name: "IA", responsible: "Dr. X", status: "active", email: "a@a.com", tel: "123", address: "Dir 1", notes: null },
          ],
        })
      )
    );

    const result = await getInstitutes();
    expect(result).toHaveLength(1);
    expect(result[0].shortName).toBe("IA");
    expect(result[0].name).toBe("Instituto A");
  });

  it("retorna array vacío cuando data es null", async () => {
    server.use(http.get(`${BASE}/api/institutes`, () => HttpResponse.json({ data: null })));
    expect(await getInstitutes()).toEqual([]);
  });
});

describe("createInstitute", () => {
  it("envía POST con body denormalizado y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/institutes`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, name: "Creado", ...sentBody } }, { status: 201 });
      })
    );

    const result = await createInstitute({ name: "Creado", shortName: "CR" });
    expect(sentBody).toEqual({ name: "Creado", short_name: "CR" });
    expect(result.shortName).toBe("CR");
  });
});

describe("updateInstitute", () => {
  it("envía PUT y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.put(`${BASE}/api/institutes/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, name: "Actualizado", ...sentBody } });
      })
    );

    const result = await updateInstitute("1", { name: "Actualizado" });
    expect(sentBody).toEqual({ name: "Actualizado" });
    expect(result.name).toBe("Actualizado");
  });
});

describe("deleteInstitute", () => {
  it("envía DELETE", async () => {
    let deleted = false;
    server.use(
      http.delete(`${BASE}/api/institutes/1`, () => {
        deleted = true;
        return HttpResponse.json({ data: { id: 1 } });
      })
    );

    await deleteInstitute("1");
    expect(deleted).toBe(true);
  });
});

describe("errores", () => {
  it("lanza error con mensaje del backend", async () => {
    server.use(
      http.get(`${BASE}/api/institutes`, () =>
        HttpResponse.json({ error: "No autorizado" }, { status: 403 })
      )
    );

    await expect(getInstitutes()).rejects.toThrow(/No autorizado/);
  });
});
