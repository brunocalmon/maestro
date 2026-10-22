import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modelFake, capacityFake, ollamaPresent } from "./models-fixtures";

describe("AC-093 — no local model fitting is reported, not blindly chosen", () => {
  // TRACEABILITY: US-033 FR-035 AC-093
  it("with a 9GB model and 2GB free, the recommended local model is null", () => {
    const models = [modelFake("cogito:14b", 9)];
    const r = recommend(backendsFake([]), ollamaPresent(models), capacityFake(2));
    expect(r.localModel).toBeNull();
    expect(r.report).toMatch(/no local model fit/i);
  });
});
