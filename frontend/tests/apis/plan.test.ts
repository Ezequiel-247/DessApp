import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
} from "@/entities/Plan";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getPlans", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/plans`, () =>
        HttpResponse.json({
          data: [
            { id: 1, id_career: 5, name: "Plan 2024", status: "vigente", years_duration: 5, course_type: "cuatrimestral", default_term: 1 },
          ],
        })
      )
    );

    const result = await getPlans();
    expect(result).toHaveLength(1);
    expect(result[0].careerId).toBe("5");
    expect(result[0].yearsDuration).toBe(5);
  });

  it("pasa careerId como query param", async () => {
    server.use(
      http.get(`${BASE}/api/plans`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("careerId")).toBe("3");
        return HttpResponse.json({ data: [] });
      })
    );

    await getPlans("3");
  });

  it("retorna array vacío cuando data es null", async () => {
    server.use(http.get(`${BASE}/api/plans`, () => HttpResponse.json({ data: null })));
    expect(await getPlans()).toEqual([]);
  });
});

describe("getPlan", () => {
  it("retorna plan normalizado", async () => {
    server.use(
      http.get(`${BASE}/api/plans/1`, () =>
        HttpResponse.json({ data: { id: 1, id_career: 5, name: "Plan" } })
      )
    );

    const result = await getPlan("1");
    expect(result).not.toBeNull();
    expect(result!.careerId).toBe("5");
  });

  it("retorna null cuando no hay data", async () => {
    server.use(http.get(`${BASE}/api/plans/999`, () => HttpResponse.json({ data: null })));
    expect(await getPlan("999")).toBeNull();
  });
});

describe("createPlan", () => {
  it("envía POST con body denormalizado y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/plans`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, ...sentBody } }, { status: 201 });
      })
    );

    const result = await createPlan({ careerId: "5", name: "Nuevo Plan", status: "vigente", yearsDuration: 5 });
    expect(sentBody).toEqual({ id_career: 5, name: "Nuevo Plan", status: "vigente", years_duration: 5 });
    expect(result.name).toBe("Nuevo Plan");
  });
});

describe("updatePlan", () => {
  it("envía PATCH y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/plans/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, name: "Actualizado", ...sentBody } });
      })
    );

    const result = await updatePlan("1", { name: "Actualizado" });
    expect(sentBody).toEqual({ name: "Actualizado" });
    expect(result.name).toBe("Actualizado");
  });
});

describe("deletePlan", () => {
  it("envía DELETE", async () => {
    let deleted = false;
    server.use(
      http.delete(`${BASE}/api/plans/1`, () => {
        deleted = true;
        return HttpResponse.json({ data: { id: 1 } });
      })
    );

    await deletePlan("1");
    expect(deleted).toBe(true);
  });
});

describe("errores", () => {
  it("lanza error con mensaje del backend", async () => {
    server.use(
      http.get(`${BASE}/api/plans`, () =>
        HttpResponse.json({ error: "Error interno" }, { status: 500 })
      )
    );

    await expect(getPlans()).rejects.toThrow(/Error interno/);
  });
});
