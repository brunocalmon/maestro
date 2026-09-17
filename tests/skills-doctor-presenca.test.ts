import { describe, it, expect } from "vitest";
import { reportSkills } from "../src/skills/record";
import { projectWithSkills, writeLock, MATTPOCOCK_SET } from "./skills-fixtures";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Record and disk agree: the no-divergence state. */
function consistentProject(): string {
  const root = projectWithSkills();
  for (const n of MATTPOCOCK_SET) {
    mkdirSync(join(root, ".agents", "skills", n), { recursive: true });
    writeFileSync(join(root, ".agents", "skills", n, "SKILL.md"), `---\nname: ${n}\n---\nbody\n`);
  }
  writeLock(root, MATTPOCOCK_SET);
  return root;
}

describe("AC-024 — doctor enumerates the sets", () => {
  // SPECSFY: US-021 FR-024 AC-024
  it("names each set", () => {
    const names = reportSkills(consistentProject()).results.map((r) => r.name).sort();
    expect(names).toEqual([...MATTPOCOCK_SET].sort());
  });

  // SPECSFY: US-021 FR-024 AC-024
  it("names each one's source", () => {
    for (const r of reportSkills(consistentProject()).results) expect(r.origin).toBe("mattpocock/skills");
  });

  // SPECSFY: US-021 FR-024 AC-024
  it("exits with zero when nothing diverged", () => {
    expect(reportSkills(consistentProject()).exitCode).toBe(0);
  });
});
