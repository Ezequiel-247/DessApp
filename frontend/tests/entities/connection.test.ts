import { describe, it, expect } from "vitest";
import { CONNECTION_STATUS } from "@/entities/Connection";

describe("CONNECTION_STATUS", () => {
  it("define los estados esperados", () => {
    expect(CONNECTION_STATUS.PENDING).toBe("pending");
    expect(CONNECTION_STATUS.ACCEPTED).toBe("accepted");
    expect(CONNECTION_STATUS.REJECTED).toBe("rejected");
  });

  it("contiene exactamente 3 estados", () => {
    expect(Object.keys(CONNECTION_STATUS)).toHaveLength(3);
  });
});
