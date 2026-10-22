import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedSource, FIXED_INSTANT } from "./trace-fixtures";

function instantOf(root: string): string {
  runSetup({ env: detectEnvironment(root), root, write: true, trace: fixedSource() });
  const rec = JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
  return rec["hooks"][0].installedAt;
}

describe("AC-043 — two runs with the same clock record the same instant", () => {
  // TRACEABILITY: US-042 FR-043 AC-043
  it("distinct projects get the same instant", () => {
    expect(instantOf(project("crs-a-"))).toBe(instantOf(project("crs-b-")));
  });

  // TRACEABILITY: US-042 NFR-040 AC-043
  it("the value is the injected one, not the machine's clock", () => {
    expect(instantOf(project())).toBe(FIXED_INSTANT);
  });

  // TRACEABILITY: US-042 FR-043 NFR-040 AC-043
  it("the case doesn't depend on the real clock", () => {
    const before = instantOf(project());
    const after = instantOf(project());
    expect(before).toBe(after);
  });
});
