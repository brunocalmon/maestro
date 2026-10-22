import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modelFake, capacityFake, ollamaPresent } from "./models-fixtures";

describe("AC-092 — the largest local model that fits in free memory is recommended", () => {
  // TRACEABILITY: US-033 FR-035 AC-092
  it("with 2GB and 9GB models and 10GB free, recommends the 9GB one", () => {
    const models = [modelFake("qwen2.5:3b", 2), modelFake("cogito:14b", 9)];
    const r = recommend(backendsFake([]), ollamaPresent(models), capacityFake(10));
    expect(r.localModel).toBe("cogito:14b");
    expect(r.localModelOverridden).toBe(false);
  });
});
