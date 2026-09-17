import { describe, it, expect } from "vitest";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reportSkills } from "../src/skills/record";
import { fileTree, projectWithSkills, writeLock, MATTPOCOCK_SET } from "./skills-fixtures";

/** Record says three; the disk lost one. */
function divergentProject(): { root: string; missing: string } {
  const root = projectWithSkills();
  for (const n of MATTPOCOCK_SET) {
    mkdirSync(join(root, ".agents", "skills", n), { recursive: true });
    writeFileSync(join(root, ".agents", "skills", n, "SKILL.md"), "body\n");
  }
  writeLock(root, MATTPOCOCK_SET);
  const missing = MATTPOCOCK_SET[1]!;
  rmSync(join(root, ".agents", "skills", missing), { recursive: true, force: true });
  return { root, missing };
}

describe("AC-025 — content changed after installation", () => {
  // SPECSFY: US-021 FR-024 AC-025
  it("names the divergent set", () => {
    const { root, missing } = divergentProject();
    const diverged = reportSkills(root).results.filter((r) => r.diverged).map((r) => r.name);
    expect(diverged).toContain(missing);
  });

  // SPECSFY: US-021 FR-024 AC-025
  it("exits with a non-zero code", () => {
    const { root } = divergentProject();
    expect(reportSkills(root).exitCode).not.toBe(0);
  });

  // SPECSFY: US-021 NFR-020 AC-025
  it("no file is created, changed or removed", () => {
    const { root } = divergentProject();
    const before = fileTree(root);
    reportSkills(root);
    expect(fileTree(root)).toEqual(before);
  });
});
