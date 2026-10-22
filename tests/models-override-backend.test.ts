import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, capacityFake, ollamaAbsent } from "./models-fixtures";

describe("AC-095 — a backend override is honored, not recalculated", () => {
  // TRACEABILITY: US-034 FR-036 AC-095
  it("with pi and claude present, specifying claude recommends claude as an override", () => {
    const r = recommend(backendsFake(["pi", "claude"]), ollamaAbsent, capacityFake(0), {
      backend: "claude",
    });
    expect(r.backend).toBe("claude");
    expect(r.backendOverridden).toBe(true);
  });
});
