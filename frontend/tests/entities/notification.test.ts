import { describe, it, expect } from "vitest";
import { NOTIFICATION_TYPE } from "@/entities/Notification";

describe("NOTIFICATION_TYPE", () => {
  it("define los tipos esperados", () => {
    expect(NOTIFICATION_TYPE.INFO).toBe("info");
    expect(NOTIFICATION_TYPE.WARNING).toBe("warning");
    expect(NOTIFICATION_TYPE.SUCCESS).toBe("success");
    expect(NOTIFICATION_TYPE.ERROR).toBe("error");
  });

  it("contiene exactamente 4 tipos", () => {
    expect(Object.keys(NOTIFICATION_TYPE)).toHaveLength(4);
  });
});
