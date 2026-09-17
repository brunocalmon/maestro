import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { projectWithSkills, fakeExecutor, MATTPOCOCK_SET } from "./skills-fixtures";

/** Runs the full setup, with the injected executor, and returns the written record. */
function writtenRecord(): Record<string, unknown> {
  const root = projectWithSkills();
  runSetup({
    env: detectEnvironment(root),
    root,
    write: true,
    skills: { execute: fakeExecutor("success", root).fn },
  });
  return JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
}

describe("AC-023 — the project record keeps the sets' provenance", () => {
  // SPECSFY: US-021 FR-023 AC-023
  it("the skills list exists in the written file", () => {
    const rec = writtenRecord();
    expect(Array.isArray(rec["skills"])).toBe(true);
    expect((rec["skills"] as unknown[]).length).toBe(MATTPOCOCK_SET.length);
  });

  // SPECSFY: US-021 FR-023 AC-023
  it("each entry carries name, source, provenance and instant", () => {
    for (const e of writtenRecord()["skills"] as Record<string, unknown>[]) {
      expect(typeof e["name"]).toBe("string");
      expect(e["source"]).toBe("mattpocock/skills");
      expect(String(e["computedHash"])).toContain("hash-");
      expect(typeof e["installedAt"]).toBe("string");
    }
  });

  // SPECSFY: US-021 FR-023 AC-023
  it("the hooks list stays as it was", () => {
    const rec = writtenRecord();
    expect((rec["hooks"] as unknown[]).length).toBe(installedHookCount());
  });
});
