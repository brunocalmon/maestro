import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, capacityFake, ollamaAbsent } from "./models-fixtures";

describe("AC-091 — no backend present is reported, not invented", () => {
  // TRACEABILITY: US-033 FR-034 AC-091
  it("with no supported backend present, the recommended backend is null", () => {
    const r = recommend(backendsFake([]), ollamaAbsent, capacityFake(0));
    expect(r.backend).toBeNull();
    expect(r.report).toMatch(/no supported backend/i);
  });
});
