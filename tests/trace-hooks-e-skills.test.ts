import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { fixedSource, FIXED_INSTANT, FIXED_ID } from "./trace-fixtures";
import { projectWithSkills, fakeExecutor } from "./skills-fixtures";

function fullRecord(): Record<string, any> {
  const root = projectWithSkills("crs-tr-sk-");
  runSetup({
    env: detectEnvironment(root), root, write: true,
    trace: fixedSource(),
    skills: { execute: fakeExecutor("success", root).fn },
  });
  return JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
}

describe("AC-051 — the record's two lists point to the same run", () => {
  // SPECSFY: US-040 FR-040 AC-051
  it("the record carries the identifier once, for the whole run", () => {
    expect(fullRecord()["trace"]).toBe(FIXED_ID);
  });

  // SPECSFY: US-040 FR-041 AC-051
  it("hooks and skills share the same instant", () => {
    const rec = fullRecord();
    const instants = new Set([
      ...rec["hooks"].map((h: { installedAt: string }) => h.installedAt),
      ...rec["skills"].map((s: { installedAt: string }) => s.installedAt),
    ]);
    expect([...instants]).toEqual([FIXED_INSTANT]);
  });

  // SPECSFY: US-040 FR-040 AC-051
  it("both lists exist in the same record", () => {
    const rec = fullRecord();
    // SPEC-0022: five canonical hooks plus the context-mode projection (FR-006); the exact count depends on the installed upstream.
    expect(rec["hooks"].length).toBeGreaterThanOrEqual(5);
    expect(rec["skills"].length).toBeGreaterThan(0);
  });
});
