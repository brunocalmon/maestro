import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modelFake, capacityFake, ollamaPresent } from "./models-fixtures";

describe("AC-096 — a local model override is honored, not recalculated", () => {
  // TRACEABILITY: US-034 FR-036 AC-096
  it("with a 9GB model and 2GB free, specifying that model recommends it even though it doesn't fit", () => {
    const models = [modelFake("cogito:14b", 9)];
    const r = recommend(backendsFake([]), ollamaPresent(models), capacityFake(2), {
      localModel: "cogito:14b",
    });
    expect(r.localModel).toBe("cogito:14b");
    expect(r.localModelOverridden).toBe(true);
  });
});
