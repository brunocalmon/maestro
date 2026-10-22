import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { sourceFake } from "./backends-fixtures";

describe("AC-083 — the supported list is fixed, not discovered in production", () => {
  // TRACEABILITY: US-030 FR-032 NFR-030 AC-083
  it("no call beyond resolving presence/version happens", () => {
    const { env, calls } = sourceFake({ pi: "0.84.3" });
    detectBackends(env);
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(["presence", "version"]).toContain(c.kind);
  });
});
