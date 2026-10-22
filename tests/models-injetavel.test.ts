import { describe, it, expect } from "vitest";
import { recommend } from "../src/models/recommend";
import { backendsFake, modelFake, capacityFake, ollamaPresent, ollamaAbsent } from "./models-fixtures";

describe("AC-098 — the module accepts injected sources, without touching network or the real machine", () => {
  // TRACEABILITY: US-035 FR-037 NFR-033 NFR-034 NFR-035 AC-098
  it("the result reflects exactly the fake sources, never the machine the suite runs on", () => {
    const models = [modelFake("qwen2.5:3b", 2)];
    const r = recommend(backendsFake(["pi"]), ollamaPresent(models), capacityFake(10));
    expect(r.backend).toBe("pi");
    expect(r.localModel).toBe("qwen2.5:3b");
    expect(r.freeBytesConsidered).toBe(10 * 1_000_000_000);
  });

  // TRACEABILITY: FR-037 NFR-035 AC-098
  it("the report states that cost and plan usage are not part of the calculation", () => {
    const r = recommend(backendsFake(["pi"]), ollamaAbsent, capacityFake(0));
    expect(r.report).toMatch(/cost|plan usage/i);
    expect(r.report).toMatch(/not part of/i);
  });
});
