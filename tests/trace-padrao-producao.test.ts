import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, EPOCH } from "./trace-fixtures";

/** No injection: the real source is what answers. */
function withoutInjection(): Record<string, any> {
  const root = project();
  runSetup({ env: detectEnvironment(root), root, write: true });
  return JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
}

describe("AC-050 — the absence of injection doesn't leave the value constant", () => {
  // TRACEABILITY: US-042 FR-042 AC-050
  it("the recorded instant is later than the epoch", () => {
    const t = withoutInjection()["hooks"][0].installedAt;
    expect(Date.parse(t)).toBeGreaterThan(Date.parse(EPOCH));
  });

  // TRACEABILITY: US-042 FR-043 AC-050
  it("the identifier isn't empty", () => {
    expect(String(withoutInjection()["trace"] ?? "").length).toBeGreaterThan(0);
  });

  // TRACEABILITY: US-042 NFR-040 AC-050
  it("two runs without injection get distinct identifiers", () => {
    expect(withoutInjection()["trace"]).not.toBe(withoutInjection()["trace"]);
  });
});
