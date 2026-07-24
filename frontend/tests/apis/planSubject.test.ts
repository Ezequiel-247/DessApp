import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getPlanSubjects,
  getPlanSubject,
  createPlanSubject,
  updatePlanSubject,
  deletePlanSubject,
} from "@/entities/PlanSubject";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getPlanSubjects", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/plan-subjects`, () =>
        HttpResponse.json({
          data: [
            { id: 1, id_study_plan: 5, id_subject: 10, suggested_year: 2, suggested_term: 1, weekly_hours: 4, credits: 6 },
          ],
        })
      )
    );

    const result = await getPlanSubjects();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "1",
      idStudyPlan: "5",
      idSubject: "10",
      suggestedYear: 2,
      suggestedTerm: 1,
      credits: 6,
    });
  });

  it("retorna array vacío cuando data es null", async () => {
    server.use(http.get(`${BASE}/api/plan-subjects`, () => HttpResponse.json({ data: null })));
    expect(await getPlanSubjects()).toEqual([]);
  });

  it("retorna array vacío cuando data no es array", async () => {
    server.use(http.get(`${BASE}/api/plan-subjects`, () => HttpResponse.json({ data: {} })));
    expect(await getPlanSubjects()).toEqual([]);
  });

  it("pasa planId y subjectId como query params", async () => {
    server.use(
      http.get(`${BASE}/api/plan-subjects`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("planId")).toBe("5");
        expect(url.searchParams.get("subjectId")).toBe("10");
        return HttpResponse.json({ data: [] });
      })
    );

    await getPlanSubjects("5", "10");
  });
});

describe("getPlanSubject", () => {
  it("retorna plan-subject normalizado", async () => {
    server.use(
      http.get(`${BASE}/api/plan-subjects/1`, () =>
        HttpResponse.json({
          data: { id: 1, id_study_plan: 5, id_subject: 10 },
        })
      )
    );

    const result = await getPlanSubject("1");
    expect(result).not.toBeNull();
    expect(result!.idStudyPlan).toBe("5");
  });

  it("retorna null cuando no hay data", async () => {
    server.use(http.get(`${BASE}/api/plan-subjects/999`, () => HttpResponse.json({ data: null })));
    expect(await getPlanSubject("999")).toBeNull();
  });
});

describe("createPlanSubject", () => {
  it("envía POST y retorna el objeto normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/plan-subjects`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          { data: { id: 1, ...sentBody } },
          { status: 201 }
        );
      })
    );

    const result = await createPlanSubject({
      id_study_plan: 5,
      id_subject: 10,
      suggested_year: 2,
      suggested_term: 1,
      credits: 6,
    });

    expect(sentBody).toEqual({ id_study_plan: 5, id_subject: 10, suggested_year: 2, suggested_term: 1, credits: 6 });
    expect(result!.idStudyPlan).toBe("5");
  });
});

describe("updatePlanSubject", () => {
  it("envía PATCH y retorna el objeto normalizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/plan-subjects/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, ...sentBody } });
      })
    );

    const result = await updatePlanSubject("1", { suggested_year: 3 });
    expect(sentBody).toEqual({ suggested_year: 3 });
    expect(result!.suggestedYear).toBe(3);
  });
});

describe("deletePlanSubject", () => {
  it("envía DELETE", async () => {
    let deleted = false;
    server.use(
      http.delete(`${BASE}/api/plan-subjects/1`, () => {
        deleted = true;
        return HttpResponse.json({ data: { id: 1 } });
      })
    );

    await deletePlanSubject("1");
    expect(deleted).toBe(true);
  });
});

describe("errores", () => {
  it("lanza error cuando la respuesta no es ok", async () => {
    server.use(
      http.get(`${BASE}/api/plan-subjects`, () =>
        HttpResponse.json({ error: "Not found" }, { status: 404 })
      )
    );

    await expect(getPlanSubjects()).rejects.toThrow();
  });

  it("lanza error con mensaje del backend", async () => {
    server.use(
      http.get(`${BASE}/api/plan-subjects`, () =>
        HttpResponse.json({ error: "Recurso no encontrado" }, { status: 404 })
      )
    );

    await expect(getPlanSubjects()).rejects.toThrow(/Recurso no encontrado/);
  });
});
