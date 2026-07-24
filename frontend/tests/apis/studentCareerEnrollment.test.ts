import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
} from "@/entities/StudentCareerEnrollment";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getEnrollments", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/students/10/enrollments`, () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              student_id: 10,
              career_id: 5,
              study_plan_id: null,
              enrolled_at: "2024-03-01",
              completed_at: null,
              status: "active",
              is_active: true,
            },
          ],
        })
      )
    );

    const result = await getEnrollments(10);
    expect(result).toHaveLength(1);
    expect(result[0].studentId).toBe(10);
    expect(result[0].careerId).toBe(5);
    expect(result[0].status).toBe("active");
  });

  it("retorna array vacío cuando data es array vacío", async () => {
    server.use(
      http.get(`${BASE}/api/students/99/enrollments`, () =>
        HttpResponse.json({ data: [] })
      )
    );
    expect(await getEnrollments("99")).toEqual([]);
  });

  it("acepta studentId como string", async () => {
    server.use(
      http.get(`${BASE}/api/students/5/enrollments`, () =>
        HttpResponse.json({ data: [] })
      )
    );
    const result = await getEnrollments("5");
    expect(result).toEqual([]);
  });

  it("normaliza career anidada (PascalCase Career)", async () => {
    server.use(
      http.get(`${BASE}/api/students/1/enrollments`, () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              student_id: 1,
              career_id: 3,
              enrolled_at: "2024-01-01",
              status: "active",
              is_active: true,
              Career: { id: 3, name: "Lic. Sistemas", degree_title: "Licenciado", duration: 5 },
            },
          ],
        })
      )
    );

    const result = await getEnrollments("1");
    expect(result[0].career).not.toBeUndefined();
    expect(result[0].career!.name).toBe("Lic. Sistemas");
  });
});

describe("createEnrollment", () => {
  it("envía POST con body y retorna enrollment normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/students/10/enrollments`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 1,
              student_id: 10,
              career_id: sentBody.career_id,
              study_plan_id: sentBody.study_plan_id ?? null,
              enrolled_at: "2024-03-01",
              completed_at: null,
              status: "active",
              is_active: true,
            },
          },
          { status: 201 }
        );
      })
    );

    const result = await createEnrollment(10, { career_id: 5 });
    expect(sentBody.career_id).toBe(5);
    expect(result.careerId).toBe(5);
    expect(result.studentId).toBe(10);
  });
});

describe("updateEnrollment", () => {
  it("envía PATCH y retorna enrollment actualizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/students/10/enrollments/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          data: {
            id: 1,
            student_id: 10,
            career_id: 5,
            study_plan_id: null,
            enrolled_at: "2024-03-01",
            completed_at: null,
            status: sentBody.status ?? "active",
            is_active: sentBody.is_active ?? true,
          },
        });
      })
    );

    const result = await updateEnrollment(10, 1, { status: "completed", is_active: false });
    expect(sentBody.status).toBe("completed");
    expect(result.status).toBe("completed");
  });
});

describe("deleteEnrollment", () => {
  it("envía DELETE y resuelve sin valor", async () => {
    server.use(
      http.delete(`${BASE}/api/students/10/enrollments/1`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    await expect(deleteEnrollment(10, 1)).resolves.toBeUndefined();
  });
});
