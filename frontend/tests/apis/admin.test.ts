import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createAdmin, updateAdmin } from "@/entities/Admin";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("createAdmin", () => {
  it("envía POST con datos y retorna admin creado desde res.data", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/admins`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          { data: { id: 1, userId: sentBody.userId, cuil: sentBody.cuil } },
          { status: 201 }
        );
      })
    );

    const result = await createAdmin({ userId: 10, cuil: "20-12345678-9" });
    expect(sentBody.userId).toBe(10);
    expect(sentBody.cuil).toBe("20-12345678-9");
    expect(result.id).toBe(1);
  });

  it("retorna respuesta directa cuando no hay envelope data", async () => {
    server.use(
      http.post(`${BASE}/api/admins`, async ({ request }) => {
        const body: any = await request.json();
        return HttpResponse.json(
          { id: 2, userId: body.userId },
          { status: 201 }
        );
      })
    );

    const result = await createAdmin({ userId: 20 });
    expect(result.userId).toBe(20);
  });
});

describe("updateAdmin", () => {
  it("envía PATCH con cuil y retorna admin actualizado desde res.data", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/admins/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          data: { id: 1, cuil: sentBody.cuil },
        });
      })
    );

    const result = await updateAdmin(1, { cuil: "27-98765432-1" });
    expect(sentBody.cuil).toBe("27-98765432-1");
    expect(result.cuil).toBe("27-98765432-1");
  });

  it("retorna respuesta directa cuando no hay envelope data", async () => {
    server.use(
      http.patch(`${BASE}/api/admins/2`, async ({ request }) => {
        const body: any = await request.json();
        return HttpResponse.json({ id: 2, cuil: body.cuil });
      })
    );

    const result = await updateAdmin(2, { cuil: "30-11111111-0" });
    expect(result.id).toBe(2);
  });
});
