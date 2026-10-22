import { describe, it, expect } from "vitest";
import { detectBackends } from "../src/backends/detect";
import { SUPPORTED_AGENT_BACKENDS } from "../src/backends/known";
import { sourceFake } from "./backends-fixtures";

describe("AC-080 — present supported backends appear in the report", () => {
  // TRACEABILITY: US-030 FR-030 FR-031 AC-080
  it("the five present supported backends bring presence, version and the supported mark", () => {
    const versions: Record<string, string> = { pi: "0.84.3", agy: "1.1.20", claude: "2.1.251", codex: "0.151.0", goose: "1.47.0" };
    const { env } = sourceFake(versions);
    const result = detectBackends(env);
    for (const name of SUPPORTED_AGENT_BACKENDS) {
      const entry = result.find((r) => r.name === name);
      expect(entry?.present).toBe(true);
      expect(entry?.version).toBe(versions[name]);
      expect(entry?.supported).toBe(true);
    }
  });
});
