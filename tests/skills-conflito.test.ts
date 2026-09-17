import { describe, it, expect } from "vitest";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { installSkills } from "../src/skills/install";
import { projectWithSkills, fakeExecutor, MATTPOCOCK_SET } from "./skills-fixtures";

/** Prepares a directory whose name the other set would also use. */
function withConflict(): string {
  const root = projectWithSkills();
  const name = MATTPOCOCK_SET[0]!;
  mkdirSync(join(root, ".agents", "skills", name), { recursive: true });
  writeFileSync(join(root, ".agents", "skills", name, "SKILL.md"), "preexisting-content\n");
  return root;
}

describe("AC-027 — two sets compete for the same directory name", () => {
  // SPECSFY: US-022 FR-026 AC-027
  it("refuses instead of overwriting", async () => {
    const root = withConflict();
    const r = await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    expect(r.isError).toBe(true);
  });

  // SPECSFY: US-022 FR-026 AC-027
  it("names the conflict", async () => {
    const root = withConflict();
    const r = await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    expect(r.report).toContain(MATTPOCOCK_SET[0]!);
  });

  // SPECSFY: US-022 NFR-020 AC-027
  it("the existing directory's content remains", async () => {
    const root = withConflict();
    await installSkills({ root, source: "mattpocock/skills", execute: fakeExecutor("success", root).fn });
    const p = join(root, ".agents", "skills", MATTPOCOCK_SET[0]!, "SKILL.md");
    expect(readFileSync(p, "utf8")).toContain("preexisting-content");
  });
});
