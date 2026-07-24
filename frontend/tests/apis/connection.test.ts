import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getConnections,
  createConnection,
  updateConnectionStatus,
} from "@/entities/Connection";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getConnections", () => {
  it("retorna la lista de conexiones del usuario", async () => {
    server.use(
      http.get(`${BASE}/api/connections`, () =>
        HttpResponse.json([
          {
            id: "1",
            userId: "10",
            connectedUserId: "20",
            status: "accepted",
            createdAt: "2024-01-01T00:00:00Z",
          },
        ])
      )
    );

    const result = await getConnections("10");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("accepted");
  });

  it("pasa userId como query param", async () => {
    server.use(
      http.get(`${BASE}/api/connections`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("userId")).toBe("42");
        return HttpResponse.json([]);
      })
    );

    await getConnections("42");
  });

  it("retorna array vacío cuando no hay conexiones", async () => {
    server.use(
      http.get(`${BASE}/api/connections`, () => HttpResponse.json([]))
    );
    expect(await getConnections("99")).toEqual([]);
  });
});

describe("createConnection", () => {
  it("envía POST con connectedUserId y retorna conexión", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/connections`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          {
            id: "2",
            userId: "10",
            connectedUserId: sentBody.connectedUserId,
            status: "pending",
            createdAt: "2024-01-01T00:00:00Z",
          },
          { status: 201 }
        );
      })
    );

    const result = await createConnection("30");
    expect(sentBody.connectedUserId).toBe("30");
    expect(result.status).toBe("pending");
  });
});

describe("updateConnectionStatus", () => {
  it("envía PATCH con status y retorna conexión actualizada", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/connections/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          id: "1",
          userId: "10",
          connectedUserId: "20",
          status: sentBody.status,
          createdAt: "2024-01-01T00:00:00Z",
        });
      })
    );

    const result = await updateConnectionStatus("1", "accepted");
    expect(sentBody.status).toBe("accepted");
    expect(result.status).toBe("accepted");
  });
});
