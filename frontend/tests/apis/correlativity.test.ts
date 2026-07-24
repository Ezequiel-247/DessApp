import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getCorrelativities,
  getCorrelativity,
  createCorrelativity,
  updateCorrelativity,
  deleteCorrelativity,
} from "@/entities/Correlativity";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getCorrelativities", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/correlativities`, () =>
        HttpResponse.json({
          data: [
            { id: 1, id_plan_subject_target: 10, id_required_plan_subject: 20, type: "regular" },
          ],
        })
      )
    );

    const result = await getCorrelativities();
    expect(result).toHaveLength(1);
    expect(result[0].idPlanSubjectTarget).toBe("10");
    expect(result[0].idRequiredPlanSubject).toBe("20");
    expect(result[0].type).toBe("regular");
  });

  it("retorna array vacío cuando data es null", async () => {
    server.use(
      http.get(`${BASE}/api/correlativities`, () => HttpResponse.json({ data: null }))
    );
    expect(await getCorrelativities()).toEqual([]);
  });

  it("pasa id_plan_subject_target como query param cuando se provee", async () => {
    server.use(
      http.get(`${BASE}/api/correlativities`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("id_plan_subject_target")).toBe("5");
        return HttpResponse.json({ data: [] });
      })
    );
    await getCorrelativities("5");
  });
});

describe("getCorrelativity", () => {
  it("retorna correlativity normalizada", async () => {
    server.use(
      http.get(`${BASE}/api/correlativities/1`, () =>
        HttpResponse.json({
          data: { id: 1, id_plan_subject_target: 10, id_required_plan_subject: 20 },
        })
      )
    );

    const result = await getCorrelativity("1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("1");
  });

  it("retorna null cuando no hay data", async () => {
    server.use(
      http.get(`${BASE}/api/correlativities/999`, () =>
        HttpResponse.json({ data: null })
      )
    );
    expect(await getCorrelativity("999")).toBeNull();
  });
});

describe("createCorrelativity", () => {
  it("envía POST con body y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/correlativities`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          { data: { id: 1, ...sentBody } },
          { status: 201 }
        );
      })
    );

    const result = await createCorrelativity({
      id_plan_subject_target: 10,
      id_required_plan_subject: 20,
      type: "regular",
    });

    expect(sentBody.id_plan_subject_target).toBe(10);
    expect(sentBody.id_required_plan_subject).toBe(20);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("regular");
  });
});

describe("updateCorrelativity", () => {
  it("envía PATCH y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/correlativities/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          data: { id: 1, id_plan_subject_target: 10, id_required_plan_subject: 20, ...sentBody },
        });
      })
    );

    const result = await updateCorrelativity("1", { type: "final" });
    expect(sentBody.type).toBe("final");
    expect(result!.type).toBe("final");
  });

  it("retorna null cuando no hay data en la respuesta", async () => {
    server.use(
      http.patch(`${BASE}/api/correlativities/1`, () =>
        HttpResponse.json({ data: null })
      )
    );
    expect(await updateCorrelativity("1", {})).toBeNull();
  });
});

describe("deleteCorrelativity", () => {
  it("envía DELETE y resuelve sin valor", async () => {
    server.use(
      http.delete(`${BASE}/api/correlativities/1`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    await expect(deleteCorrelativity("1")).resolves.toBeUndefined();
  });
});
