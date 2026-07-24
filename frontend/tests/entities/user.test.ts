import { describe, it, expect } from "vitest";
import type { User } from "@/entities/User";

describe("User model shape", () => {
  it("acepta objeto admin con campos requeridos", () => {
    const user: User = {
      id: "1",
      name: "Ana",
      lastname: "Pérez",
      email: "ana@example.com",
      role: "admin",
      is_active: true,
    };

    expect(user.id).toBe("1");
    expect(user.role).toBe("admin");
    expect(user.is_active).toBe(true);
  });

  it("acepta objeto student con avatar opcional", () => {
    const user: User = {
      id: "2",
      name: "Carlos",
      lastname: "López",
      email: "carlos@example.com",
      avatar: "https://example.com/avatar.png",
      role: "student",
      is_active: true,
    };

    expect(user.avatar).toBe("https://example.com/avatar.png");
    expect(user.role).toBe("student");
  });

  it("role puede ser admin o student", () => {
    const roles: Array<"admin" | "student"> = ["admin", "student"];
    expect(roles).toContain("admin");
    expect(roles).toContain("student");
  });
});
