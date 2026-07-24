import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { useSessions } from "@/features/sessions/hooks/useSessions";

const BASE = "http://localhost:3001";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

describe("useSessions hook", () => {
  it("fetches sessions successfully", async () => {
    const mockSessions = [
      { id: 1, title: "Session 1", subject_id: 10, type: "virtual", date_time: "2026-06-13T10:00:00.000Z" }
    ];

    server.use(
      http.get(`${BASE}/api/study-sessions`, () => {
        return HttpResponse.json(mockSessions);
      })
    );

    const { result } = renderHook(() => useSessions());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.sessions).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sessions).toEqual(mockSessions);
  });

  it("handles join session", async () => {
    server.use(
      http.get(`${BASE}/api/study-sessions`, () => HttpResponse.json([])),
      http.post(`${BASE}/api/study-sessions/1/join`, () => HttpResponse.json({ status: "approved" }, { status: 201 }))
    );

    const { result } = renderHook(() => useSessions());
    
    await act(async () => {
      await result.current.joinSession(1);
    });

    // If it doesn't throw, it's successful
    expect(true).toBe(true);
  });

  it("handles removeParticipant correctly", async () => {
    let requestMade = false;
    server.use(
      http.get(`${BASE}/api/study-sessions`, () => HttpResponse.json([])),
      http.delete(`${BASE}/api/study-sessions/1/registrations/100`, () => {
        requestMade = true;
        return HttpResponse.json({ message: "Success" });
      })
    );

    const { result } = renderHook(() => useSessions());
    
    await act(async () => {
      await result.current.removeParticipant(1, 100);
    });

    expect(requestMade).toBe(true);
  });
  
  it("handles removeParticipant error", async () => {
    server.use(
      http.get(`${BASE}/api/study-sessions`, () => HttpResponse.json([])),
      http.delete(`${BASE}/api/study-sessions/1/registrations/100`, () => {
        return HttpResponse.json({ error: "No autorizado" }, { status: 403 });
      })
    );

    const { result } = renderHook(() => useSessions());
    
    await act(async () => {
      await expect(result.current.removeParticipant(1, 100)).rejects.toThrow("No autorizado");
    });
  });
});
