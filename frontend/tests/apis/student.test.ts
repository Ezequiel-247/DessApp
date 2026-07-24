import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getStudent,
  createStudent,
  updateStudentPrivacy,
} from "@/entities/Student";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getStudent", () => {
  it("retorna student normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/students/1`, () =>
        HttpResponse.json({
          data: {
            user_id: 1,
            legajo: "12345",
            public_profile: true,
            show_email: false,
            show_academic_info: true,
            publish_approvals: false,
            user: { id: 1, name: "Juan", lastname: "Pérez", email: "juan@test.com", role: "student", is_active: true },
            enrollments: [],
          },
        })
      )
    );

    const result = await getStudent("1");
    expect(result.userId).toBe(1);
    expect(result.legajo).toBe("12345");
    expect(result.publicProfile).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user!.name).toBe("Juan");
  });

  it("retorna student normalizado desde raw directo (sin .data)", async () => {
    server.use(
      http.get(`${BASE}/api/students/2`, () =>
        HttpResponse.json({
          user_id: 2,
          legajo: null,
          enrollments: [],
        })
      )
    );

    const result = await getStudent("2");
    expect(result.userId).toBe(2);
  });
});

describe("createStudent", () => {
  it("envía POST y retorna res.data", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/students`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { id: 1, ...sentBody, student: {} } }, { status: 201 });
      })
    );

    const result = await createStudent({ email: "test@test.com", password: "123", role: "student" });
    expect(sentBody).toEqual({ email: "test@test.com", password: "123", role: "student" });
    expect(result.id).toBe(1);
  });
});

describe("updateStudentPrivacy", () => {
  it("envía PATCH con privacy denormalizado y retorna student normalizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/students/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { user_id: 1, ...sentBody, enrollments: [] } });
      })
    );

    const result = await updateStudentPrivacy("1", { publicProfile: true, showEmail: false });
    expect(sentBody).toEqual({ public_profile: true, show_email: false });
    expect(result.publicProfile).toBe(true);
    expect(result.showEmail).toBe(false);
  });
});

describe("errores", () => {
  it("lanza error con mensaje del backend", async () => {
    server.use(
      http.get(`${BASE}/api/students/999`, () =>
        HttpResponse.json({ error: "Student not found" }, { status: 404 })
      )
    );

    await expect(getStudent("999")).rejects.toThrow(/Student not found/);
  });
});
