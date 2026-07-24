import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from "@/entities/Notification";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getNotifications", () => {
  it("retorna la lista de notificaciones del usuario", async () => {
    server.use(
      http.get(`${BASE}/api/notifications`, () =>
        HttpResponse.json({
          data: [
            {
              id: "1",
              id_user: "10",
              type: "info",
              title: "Bienvenido",
              message: "Tu cuenta fue activada",
              read: false,
              createdAt: "2024-01-01T00:00:00Z",
            },
          ],
        })
      )
    );

    const result = await getNotifications("10");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("info");
    expect(result[0].read).toBe(false);
  });

  it("pasa userId como query param", async () => {
    server.use(
      http.get(`${BASE}/api/notifications`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("userId")).toBe("42");
        return HttpResponse.json([]);
      })
    );
    await getNotifications("42");
  });
});

describe("markAsRead", () => {
  it("envía PATCH con read:true y retorna notificación actualizada", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/notifications/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          data: {
            id: "1",
            id_user: "10",
            type: "info",
            title: "Bienvenido",
            message: "Mensaje",
            read: true,
            createdAt: "2024-01-01T00:00:00Z",
          },
        });
      })
    );

    const result = await markAsRead("1");
    expect(sentBody.read).toBe(true);
    expect(result.read).toBe(true);
  });
});

describe("markAllAsRead", () => {
  it("envía POST con userId y retorna cantidad actualizada", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/notifications/mark-all-read`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ data: { updated: 3 } }, { status: 200 });
      })
    );

    await expect(markAllAsRead("10")).resolves.toBe(3);
    expect(sentBody.userId).toBe("10");
  });

  it("lanza error cuando el servidor responde con error", async () => {
    server.use(
      http.post(`${BASE}/api/notifications/mark-all-read`, () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    await expect(markAllAsRead("10")).rejects.toThrow();
  });
});

describe("getUnreadCount", () => {
  it("retorna la cantidad de notificaciones sin leer", async () => {
    server.use(
      http.get(`${BASE}/api/notifications/unread-count`, () =>
        HttpResponse.json({ data: { count: 7 } })
      )
    );

    await expect(getUnreadCount("10")).resolves.toBe(7);
  });
});
