import { describe, it, expect } from "vitest";
import type { Session } from "@/entities/Session/model/session";

describe("Session model shape", () => {
  it("acepta un objeto con los campos requeridos", () => {
    const session: Session = {
      id: "abc-123",
      userId: "42",
      token: "jwt-token-value",
      createdAt: "2024-01-01T00:00:00Z",
      expiresAt: "2024-01-02T00:00:00Z",
    };

    expect(session.id).toBe("abc-123");
    expect(session.userId).toBe("42");
    expect(session.token).toBe("jwt-token-value");
    expect(session.createdAt).toBe("2024-01-01T00:00:00Z");
    expect(session.expiresAt).toBe("2024-01-02T00:00:00Z");
  });
});
