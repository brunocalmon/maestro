import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { sourceFake } from "./backends-fixtures";

describe("AC-082 — a present unsupported backend appears as such, not as absent", () => {
  // TRACEABILITY: US-031 FR-032 FR-033 AC-082
  it("dsh present and unsupported is distinct from absent", () => {
    const { env } = sourceFake({ dsh: "0.1.1-rc.1" });
    const result = detectBackends(env);
    const dsh = result.find((r) => r.name === "dsh");
    expect(dsh?.present).toBe(true);
    expect(dsh?.supported).toBe(false);

    const pi = result.find((r) => r.name === "pi");
    expect(pi?.present).toBe(false);
  });
});
