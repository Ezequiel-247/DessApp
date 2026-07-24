import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getCareers,
  getCareer,
  createCareer,
  updateCareer,
  deleteCareer,
} from "@/entities/Career";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getCareers", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/careers`, () =>
        HttpResponse.json({
          data: [
            { id: 1, name: "Lic. Sistemas", degree_title: "Lic.", id_institute: 3, duration: 5, code: "LS", description: "" },
          ],
        })
      )
    );

    const result = await getCareers();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Lic. Sistemas");
    expect(result[0].instituteId).toBe("3");
  });

  it("retorna array vacío cuando data es null", async () => {
    server.use(http.get(`${BASE}/api/careers`, () => HttpResponse.json({ data: null })));
    expect(await getCareers()).toEqual([]);
  });
});

describe("getCareer", () => {
  it("retorna carrera normalizada", async () => {
    server.use(
      http.get(`${BASE}/api/careers/1`, () =>
        HttpResponse.json({ data: { id: 1, name: "Test", id_institute: 2, duration: 4 } })
      )
    );

    const result = await getCareer("1");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test");
    expect(result!.duration).toBe(4);
  });

  it("retorna null cuando no hay data", async () => {
    server.use(http.get(`${BASE}/api/careers/999`, () => HttpResponse.json({ data: null })));
    expect(await getCareer("999")).toBeNull();
  });
});

describe("createCareer", () => {
  it("envía POST con body denormalizado y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/careers`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, ...sentBody } }, { status: 201 });
      })
    );

    const result = await createCareer({ name: "Nueva", instituteId: "5", duration: 4 });
    expect(sentBody).toEqual({ name: "Nueva", id_institute: 5, duration: 4 });
    expect(result.instituteId).toBe("5");
  });
});

describe("updateCareer", () => {
  it("envía PUT y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.put(`${BASE}/api/careers/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, ...sentBody } });
      })
    );

    const result = await updateCareer("1", { name: "Actualizado" });
    expect(sentBody).toEqual({ name: "Actualizado" });
    expect(result.name).toBe("Actualizado");
  });
});

describe("deleteCareer", () => {
  it("envía DELETE", async () => {
    let deleted = false;
    server.use(
      http.delete(`${BASE}/api/careers/1`, () => {
        deleted = true;
        return HttpResponse.json({ data: { id: 1 } });
      })
    );

    await deleteCareer("1");
    expect(deleted).toBe(true);
  });
});

describe("errores", () => {
  it("lanza error con mensaje del backend", async () => {
    server.use(
      http.get(`${BASE}/api/careers`, () =>
        HttpResponse.json({ error: "Error del servidor" }, { status: 500 })
      )
    );

    await expect(getCareers()).rejects.toThrow(/Error del servidor/);
  });
});
