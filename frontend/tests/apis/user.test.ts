import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getUsers,
  getUser,
  getMe,
  createUser,
  updateUser,
  deleteUser,
} from "@/entities/User";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getUsers", () => {
  it("retorna array de usuarios desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/users`, () =>
        HttpResponse.json({
          data: [
            { id: "1", name: "Ana", lastname: "López", email: "ana@test.com", role: "student", is_active: true },
            { id: "2", name: "Carlos", lastname: "García", email: "carlos@test.com", role: "admin", is_active: true },
          ],
        })
      )
    );

    const result = await getUsers();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Ana");
    expect(result[1].role).toBe("admin");
  });

  it("retorna array vacío cuando data es vacía", async () => {
    server.use(
      http.get(`${BASE}/api/users`, () => HttpResponse.json({ data: [] }))
    );
    expect(await getUsers()).toEqual([]);
  });
});

describe("getUser", () => {
  it("retorna usuario por id desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/users/1`, () =>
        HttpResponse.json({
          data: { id: "1", name: "Ana", lastname: "López", email: "ana@test.com", role: "student", is_active: true },
        })
      )
    );

    const result = await getUser("1");
    expect(result.id).toBe("1");
    expect(result.email).toBe("ana@test.com");
  });
});

describe("getMe", () => {
  it("retorna usuario autenticado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/users/me`, () =>
        HttpResponse.json({
          data: { id: "3", name: "Mi Usuario", email: "me@test.com", role: "admin", is_active: true },
        })
      )
    );

    const result = await getMe();
    expect(result.id).toBe("3");
    expect(result.role).toBe("admin");
  });

  it("retorna respuesta directa cuando no hay envelope data", async () => {
    server.use(
      http.get(`${BASE}/api/users/me`, () =>
        HttpResponse.json({ id: "4", name: "Directo", email: "direct@test.com", role: "student", is_active: true })
      )
    );

    const result = await getMe();
    expect(result.email).toBe("direct@test.com");
  });
});

describe("createUser", () => {
  it("envía POST con datos y retorna usuario creado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/users`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          { data: { id: "5", ...sentBody } },
          { status: 201 }
        );
      })
    );

    const result = await createUser({ name: "Nuevo", email: "nuevo@test.com", role: "student" });
    expect(sentBody.email).toBe("nuevo@test.com");
    expect(result.name).toBe("Nuevo");
  });
});

describe("updateUser", () => {
  it("envía PATCH y retorna usuario actualizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/users/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          data: { id: "1", name: sentBody.name ?? "Ana", email: "ana@test.com", role: "student", is_active: true },
        });
      })
    );

    const result = await updateUser("1", { name: "Ana Modificada" } as any);
    expect(sentBody.name).toBe("Ana Modificada");
    expect(result.name).toBe("Ana Modificada");
  });
});

describe("deleteUser", () => {
  it("envía DELETE y resuelve sin valor", async () => {
    server.use(
      http.delete(`${BASE}/api/users/1`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    await expect(deleteUser("1")).resolves.toBeUndefined();
  });
});
