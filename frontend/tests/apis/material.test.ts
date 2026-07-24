import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { getMaterials, getMaterial, uploadMaterial } from "@/entities/Material";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getMaterials", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/material`, () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              id_subject: 10,
              title: "Parcial 2024",
              type: "pdf",
              file_url: "https://example.com/file.pdf",
              id_author: 5,
              total_upvotes: 3,
              status: "active",
            },
          ],
        })
      )
    );

    const result = await getMaterials();
    expect(result).toHaveLength(1);
    expect(result[0].subjectId).toBe("10");
    expect(result[0].title).toBe("Parcial 2024");
    expect(result[0].type).toBe("pdf");
  });

  it("retorna array vacío cuando data es array vacío", async () => {
    server.use(
      http.get(`${BASE}/api/material`, () => HttpResponse.json({ data: [] }))
    );
    expect(await getMaterials()).toEqual([]);
  });

  it("maneja respuesta sin envelope data", async () => {
    server.use(
      http.get(`${BASE}/api/material`, () =>
        HttpResponse.json([
          { id: 2, id_subject: 1, title: "Video", type: "video", status: "active" },
        ])
      )
    );
    const result = await getMaterials();
    expect(result[0].title).toBe("Video");
  });
});

describe("getMaterial", () => {
  it("retorna material normalizado por id", async () => {
    server.use(
      http.get(`${BASE}/api/material/1`, () =>
        HttpResponse.json({
          data: {
            id: 1,
            id_subject: 5,
            title: "Resumen",
            type: "pdf",
            file_url: "https://example.com/resumen.pdf",
            id_author: 2,
            total_upvotes: 0,
            status: "active",
          },
        })
      )
    );

    const result = await getMaterial("1");
    expect(result.id).toBe("1");
    expect(result.title).toBe("Resumen");
  });
});

describe("uploadMaterial", () => {
  it("envía POST con body denormalizado y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/material`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 3,
              id_subject: sentBody.id_subject,
              title: sentBody.title,
              type: sentBody.type,
              file_url: sentBody.file_url,
              id_author: sentBody.id_author,
              total_upvotes: 0,
              status: "active",
            },
          },
          { status: 201 }
        );
      })
    );

    const result = await uploadMaterial({
      subjectId: "10",
      title: "Nuevo material",
      type: "pdf",
      fileUrl: "https://example.com/nuevo.pdf",
      authorId: "5",
    });

    expect(sentBody.id_subject).toBe("10");
    expect(sentBody.id_author).toBe("5");
    expect(sentBody.file_url).toBe("https://example.com/nuevo.pdf");
    expect(result.title).toBe("Nuevo material");
  });
});
