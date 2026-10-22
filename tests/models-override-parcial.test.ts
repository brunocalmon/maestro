import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modelFake, capacityFake, ollamaPresent } from "./models-fixtures";

describe("AC-100 — a partial override combines the human choice with the calculated rest", () => {
  // TRACEABILITY: US-034 FR-034 FR-036 AC-100
  it("specifying only the backend, the local model stays calculated, not overridden", () => {
    const models = [modelFake("qwen2.5:3b", 2)];
    const r = recommend(backendsFake(["pi", "claude"]), ollamaPresent(models), capacityFake(10), {
      backend: "claude",
    });
    expect(r.backend).toBe("claude");
    expect(r.backendOverridden).toBe(true);
    expect(r.localModel).toBe("qwen2.5:3b");
    expect(r.localModelOverridden).toBe(false);
  });
});
