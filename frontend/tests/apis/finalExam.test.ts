import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  getFinalExams,
  createFinalExam,
  updateFinalExam,
  deleteFinalExam,
} from "@/entities/FinalExam";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe("getFinalExams", () => {
  it("retorna array normalizado desde res.data", async () => {
    server.use(
      http.get(`${BASE}/api/final-exams`, () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              id_academic_record: 50,
              grade: "9",
              year: 2024,
              semester: 1,
              status: "approved",
            },
          ],
        })
      )
    );

    const result = await getFinalExams("10");
    expect(result).toHaveLength(1);
    expect(result[0].academicRecordId).toBe("50");
    expect(result[0].grade).toBe("9");
    expect(result[0].status).toBe("approved");
  });

  it("pasa studentId como query param", async () => {
    server.use(
      http.get(`${BASE}/api/final-exams`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("studentId")).toBe("7");
        return HttpResponse.json({ data: [] });
      })
    );
    await getFinalExams("7");
  });

  it("retorna array vacío cuando data es array vacío", async () => {
    server.use(
      http.get(`${BASE}/api/final-exams`, () => HttpResponse.json({ data: [] }))
    );
    expect(await getFinalExams("99")).toEqual([]);
  });
});

describe("createFinalExam", () => {
  it("envía POST con body y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.post(`${BASE}/api/final-exams`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          {
            data: {
              id: 1,
              id_academic_record: sentBody.id_academic_record,
              grade: sentBody.grade ?? "",
              year: sentBody.year ?? 0,
              semester: sentBody.semester ?? 0,
              status: sentBody.status,
            },
          },
          { status: 201 }
        );
      })
    );

    const result = await createFinalExam({
      id_academic_record: 50,
      grade: "8",
      year: 2024,
      semester: 1,
      status: "approved",
    });

    expect(sentBody.id_academic_record).toBe(50);
    expect(result.grade).toBe("8");
    expect(result.status).toBe("approved");
  });
});

describe("updateFinalExam", () => {
  it("envía PATCH y retorna normalizado", async () => {
    let sentBody: any;
    server.use(
      http.patch(`${BASE}/api/final-exams/1`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          data: {
            id: 1,
            id_academic_record: 50,
            grade: sentBody.grade ?? "8",
            year: 2024,
            semester: 1,
            status: sentBody.status ?? "approved",
          },
        });
      })
    );

    const result = await updateFinalExam("1", { grade: "10", status: "approved" });
    expect(sentBody.grade).toBe("10");
    expect(result.grade).toBe("10");
  });
});

describe("deleteFinalExam", () => {
  it("envía DELETE y resuelve sin valor", async () => {
    server.use(
      http.delete(`${BASE}/api/final-exams/1`, () =>
        new HttpResponse(null, { status: 204 })
      )
    );

    await expect(deleteFinalExam("1")).resolves.toBeUndefined();
  });
});
