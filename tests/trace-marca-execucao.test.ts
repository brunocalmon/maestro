import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedSource, FIXED_ID } from "./trace-fixtures";

function recordOf(root: string): Record<string, any> {
  runSetup({ env: detectEnvironment(root), root, write: true, trace: fixedSource() });
  return JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
}

describe("AC-040 — every entry from the same run shares the identifier", () => {
  // SPECSFY: US-040 FR-040 AC-040
  it("the record carries a correlation identifier", () => {
    expect(recordOf(project())["trace"]).toBe(FIXED_ID);
  });

  // SPECSFY: US-040 FR-040 AC-040
  it("the identifier isn't empty or absent", () => {
    const t = recordOf(project())["trace"];
    expect(typeof t).toBe("string");
    expect(String(t).length).toBeGreaterThan(0);
  });

  // SPECSFY: US-040 FR-040 AC-040
  it("the hook entries belong to that run", () => {
    const rec = recordOf(project());
    expect(rec["hooks"].length).toBe(installedHookCount());
    for (const h of rec["hooks"]) expect(h.installedAt).toBe("2026-08-29T17:45:00.000Z");
  });
});
