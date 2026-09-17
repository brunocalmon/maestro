import { describe, it, expect } from "vitest";
import { installSkills } from "../src/skills/install";
import { projectWithSkills, fakeExecutor, SPECSFY_SET, MATTPOCOCK_SET } from "./skills-fixtures";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const skillsOf = (root: string) => readdirSync(join(root, ".agents", "skills")).sort();

describe("AC-020 — a single setup leaves both installed", () => {
  // SPECSFY: US-020 FR-020 AC-020
  it("mattpocock's skills reach .agents/skills/ (canonical since SPEC-0024)", async () => {
    const root = projectWithSkills();
    const ex = fakeExecutor("success", root);
    await installSkills({ root, source: "mattpocock/skills", execute: ex.fn });
    for (const n of MATTPOCOCK_SET) expect(skillsOf(root)).toContain(n);
  });

  // SPECSFY: US-020 FR-026 AC-020
  it("no preexisting directory was removed or renamed", async () => {
    const root = projectWithSkills();
    const before = skillsOf(root);
    const ex = fakeExecutor("success", root);
    await installSkills({ root, source: "mattpocock/skills", execute: ex.fn });
    const after = skillsOf(root);
    for (const n of before) expect(after).toContain(n);
    // Presence doesn't prove absence of removal: the count has to grow, never shrink.
    expect(after.length).toBeGreaterThan(before.length);
  });

  // SPECSFY: US-020 FR-020 FR-026 AC-020
  it("the invocation scopes the target and requests copy, without interaction", async () => {
    const root = projectWithSkills();
    const ex = fakeExecutor("success", root);
    await installSkills({ root, source: "mattpocock/skills", execute: ex.fn });
    const args = ex.calls.at(0) ?? [];
    expect(args).toContain("mattpocock/skills");
    expect(args).toContain("--copy");
    // SPEC-0024: the canonical agent is `universal` (`.agents/skills`); the Claude Code copy is a projection.
    expect(args.join(" ")).toMatch(/\buniversal\b/);
    expect(args).not.toContain("--global");
    expect(args).not.toContain("-g");
    expect(SPECSFY_SET.length).toBe(3);
  });
});
