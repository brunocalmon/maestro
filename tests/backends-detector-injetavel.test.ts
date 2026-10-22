import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { sourceFake } from "./backends-fixtures";

describe("AC-084 — the detector accepts an injected source", () => {
  // TRACEABILITY: US-032 FR-030 NFR-032 AC-084
  it("the result reflects exactly the fake source, without touching the real PATH", () => {
    const { env } = sourceFake({ pi: "0.84.3", agy: "1.1.20", claude: "2.1.251", goose: "1.47.0" });
    const result = detectBackends(env);
    expect(result.find((r) => r.name === "codex")?.present).toBe(false);
    expect(result.find((r) => r.name === "pi")?.present).toBe(true);
  });
});
