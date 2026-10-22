import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, capacityFake, ollamaAbsent } from "./models-fixtures";

describe("AC-090 — a supported present backend is recommended", () => {
  // TRACEABILITY: US-033 FR-034 AC-090
  it("with pi present, the recommended backend is pi", () => {
    const r = recommend(backendsFake(["pi"]), ollamaAbsent, capacityFake(0));
    expect(r.backend).toBe("pi");
    expect(r.backendOverridden).toBe(false);
  });
});
