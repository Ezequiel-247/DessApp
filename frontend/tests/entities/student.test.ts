import { describe, it, expect } from "vitest";
import { normalizeStudent, denormalizePrivacy } from "@/entities/Student/model/student";

describe("normalizeStudent", () => {
  it("convierte snake_case a camelCase", () => {
    const raw = {
      user_id: 10,
      legajo: "12345",
      public_profile: true,
      show_email: true,
      show_academic_info: false,
      publish_approvals: true,
    };

    const result = normalizeStudent(raw);
    expect(result.userId).toBe(10);
    expect(result.legajo).toBe("12345");
    expect(result.publicProfile).toBe(true);
    expect(result.showEmail).toBe(true);
    expect(result.showAcademicInfo).toBe(false);
    expect(result.publishApprovals).toBe(true);
    expect(result.enrollments).toEqual([]);
  });

  it("usa fallback camelCase cuando no hay snake_case", () => {
    const raw = {
      userId: 20,
      legajo: null,
      publicProfile: false,
      showEmail: false,
      showAcademicInfo: true,
      publishApprovals: false,
    };

    const result = normalizeStudent(raw);
    expect(result.userId).toBe(20);
    expect(result.publicProfile).toBe(false);
    expect(result.showAcademicInfo).toBe(true);
  });

  it("normaliza nested user si está presente", () => {
    const raw = {
      user_id: 1,
      user: {
        id: 1,
        name: "Juan",
        lastname: "Pérez",
        email: "juan@test.com",
        avatar: "avatar.png",
        role: "student",
        is_active: true,
      },
    };

    const result = normalizeStudent(raw);
    expect(result.user).toBeDefined();
    expect(result.user!.name).toBe("Juan");
    expect(result.user!.avatar).toBe("avatar.png");
    expect(result.user!.is_active).toBe(true);
  });

  it("normaliza nested enrollments", () => {
    const raw = {
      user_id: 1,
      enrollments: [
        { id: 1, student_id: 1, career_id: 5, enrolled_at: "2024-01-01", status: "active", is_active: true },
      ],
    };

    const result = normalizeStudent(raw);
    expect(result.enrollments).toHaveLength(1);
    expect(result.enrollments[0].careerId).toBe(5);
  });
});

describe("denormalizePrivacy", () => {
  it("convierte camelCase a snake_case", () => {
    const input = {
      publicProfile: true,
      showAcademicInfo: false,
      publishApprovals: true,
      showEmail: false,
    };

    expect(denormalizePrivacy(input)).toEqual({
      public_profile: true,
      show_academic_info: false,
      publish_approvals: true,
      show_email: false,
    });
  });

  it("solo incluye campos definidos", () => {
    expect(denormalizePrivacy({ publicProfile: true })).toEqual({ public_profile: true });
    expect(denormalizePrivacy({})).toEqual({});
  });

  it("incluye false si se pasa explícitamente", () => {
    expect(denormalizePrivacy({ publicProfile: false })).toEqual({ public_profile: false });
  });
});
