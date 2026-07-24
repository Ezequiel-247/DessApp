import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getAcademicRecords,
  createAcademicRecord,
  updateAcademicRecord,
  deleteAcademicRecord,
} from "@/entities/AcademicRecord";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getAcademicRecords", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/academic-records`, () =>
        HttpResponse.json({
          data: [
            { id: 1, student_id: 10, id_subject: 5, plan_subject_id: 20, year: 2024, semester: 1, grade: "8", status: "approved", regularity_expires_at: null },
          ],
        })
      )
    );

    const result = await getAcademicRecords("10");
    expect(result).toHaveLength(1);
    expect(result[0].studentId).toBe("10");
    expect(result[0].grade).toBe("8");
    expect(result[0].status).toBe("approved");
  });

  it("retorna array vacío cuando data es null", async () => {
    server.use(http.get(`${BASE}/api/academic-records?studentId=1`, () => HttpResponse.json({ data: null })));
    expect(await getAcademicRecords("1")).toEqual([]);
  });

  it("pasa studentId como query param", async () => {
    server.use(
      http.get(`${BASE}/api/academic-records`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("studentId")).toBe("42");
        return HttpResponse.json({ data: [] });
      })
    );

    await getAcademicRecords("42");
  });
});

describe("createAcademicRecord", () => {
  it("envía POST con body denormalizado y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/academic-records`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, ...sentBody } }, { status: 201 });
      })
    );

    const result = await createAcademicRecord({
      studentId: "10",
      subjectId: "20",
      year: 2024,
      semester: 1,
      grade: "8",
      status: "approved",
    });

    expect(sentBody).toEqual({
      id_student: "10",
      id_subject: "20",
      year: 2024,
      semester: 1,
      grade: "8",
      status: "aprobado",
    });
    expect(result.grade).toBe("8");
  });
});

describe("updateAcademicRecord", () => {
  it("envía PATCH y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/academic-records/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, grade: "9", ...sentBody } });
      })
    );

    const result = await updateAcademicRecord("1", { grade: "9" });
    expect(sentBody).toEqual({ grade: "9" });
    expect(result.grade).toBe("9");
  });
});

describe("deleteAcademicRecord", () => {
  it("envía DELETE", async () => {
    let deleted = false;
    server.use(
      http.delete(`${BASE}/api/academic-records/1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    await deleteAcademicRecord("1");
    expect(deleted).toBe(true);
  });
});

describe("errores", () => {
  it("lanza error cuando el servidor responde con error", async () => {
    server.use(
      http.get(`${BASE}/api/academic-records?studentId=1`, () =>
        HttpResponse.json({ error: "Registro no encontrado" }, { status: 404 })
      )
    );

    await expect(getAcademicRecords("1")).rejects.toThrow(/Registro no encontrado/);
  });
});
