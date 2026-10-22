import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, capacityFake, ollamaAbsent } from "./models-fixtures";

describe("AC-094 — an absent ollama is reported", () => {
  // TRACEABILITY: US-033 FR-035 AC-094
  it("with ollama absent, the recommended local model is null", () => {
    const r = recommend(backendsFake([]), ollamaAbsent, capacityFake(10));
    expect(r.localModel).toBeNull();
    expect(r.report).toMatch(/ollama was not found/i);
  });
});
