import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reportSkills } from "../src/skills/record";
import { projectWithSkills, writeLock, MATTPOCOCK_SET } from "./skills-fixtures";

function installedProject(): string {
  const root = projectWithSkills();
  for (const n of MATTPOCOCK_SET) {
    mkdirSync(join(root, ".agents", "skills", n), { recursive: true });
    writeFileSync(join(root, ".agents", "skills", n, "SKILL.md"), "body\n");
  }
  writeLock(root, MATTPOCOCK_SET);
  return root;
}

describe("AC-030 — the report doesn't promise what it doesn't deliver", () => {
  // SPECSFY: US-021 FR-024 AC-030
  it("states that the reference isn't pinned by the source", () => {
    expect(reportSkills(installedProject()).note).toMatch(/doesn't pin/i);
  });

  // SPECSFY: US-021 NFR-021 AC-030
  it("doesn't claim two machines will get identical content", () => {
    expect(reportSkills(installedProject()).note).not.toMatch(/reproducible|identical/i);
  });

  // SPECSFY: US-021 NFR-021 AC-030
  it("the statement accompanies the report even without divergence", () => {
    const r = reportSkills(installedProject());
    expect(r.exitCode).toBe(0);
    expect(r.note.length).toBeGreaterThan(0);
  });
});
