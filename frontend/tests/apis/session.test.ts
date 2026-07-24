import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { login, register, getMe } from "@/entities/Session";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("login", () => {
  it("envía POST con credenciales y retorna respuesta", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/auth/login`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 1,
              email: sentBody.email,
              role: "student",
            },
            token: "jwt-token-abc",
          },
          { status: 200 }
        );
      })
    );

    const result = await login({ email: "user@test.com", password: "1234" });
    expect(sentBody.email).toBe("user@test.com");
    expect(result.token).toBe("jwt-token-abc");
  });

  it("lanza error cuando las credenciales son inválidas", async () => {
    server.use(
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({ error: "Invalid credentials" }, { status: 401 })
      )
    );

    await expect(login({ email: "bad@test.com", password: "wrong" })).rejects.toThrow(
      "Invalid credentials"
    );
  });
});

describe("register", () => {
  it("envía POST con datos de usuario y retorna respuesta", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/auth/register`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          { data: { id: 2, email: sentBody.email, role: "student" } },
          { status: 201 }
        );
      })
    );

    const result = await register({
      email: "nuevo@test.com",
      password: "1234",
      name: "Nuevo",
      lastname: "Usuario",
    });

    expect(sentBody.email).toBe("nuevo@test.com");
    expect(result.data.role).toBe("student");
  });
});

describe("getMe", () => {
  it("retorna datos del usuario autenticado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/auth/me`, () =>
        HttpResponse.json({
          data: { id: 1, email: "user@test.com", role: "admin" },
        })
      )
    );

    const result = await getMe();
    expect(result.id).toBe(1);
    expect(result.role).toBe("admin");
  });

  it("retorna respuesta directa cuando no hay envelope data", async () => {
    server.use(
      http.get(`${BASE}/api/auth/me`, () =>
        HttpResponse.json({ id: 5, email: "direct@test.com", role: "student" })
      )
    );

    const result = await getMe();
    expect(result.email).toBe("direct@test.com");
  });
});
