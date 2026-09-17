import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { buildSkillsAddArgs } from "../src/skills/install";
import { inspectSkills } from "../src/skills/inventory";
import { claudeEnv, project } from "./helpers-spec-0022";
import { skill, claudeSkill } from "./helpers-spec-0024";

const opts = { upstream: { contextModeHooksJson: null } };

describe("AC-012 — matt-pocock instalado com -a universal em .agents/skills", () => {
  // SPECSFY: US-003 FR-005 NFR-001 AC-012
  it("argv do instalador e inventário em .agents/skills", () => {
    const args = buildSkillsAddArgs("mattpocock/skills");
    expect(args[args.indexOf("-a") + 1]).toBe("universal");
    expect(args).toContain("--copy");
    const root = project();
    skill(root, ".agents/skills", "only-in-agents");
    expect(inspectSkills(root).dirs).toContain("only-in-agents");
  });
});

describe("AC-021 — sync antigo .claude → .agents deixa de existir", () => {
  // SPECSFY: US-003 FR-005 NFR-002 AC-021
  it("skill só em .claude não é copiada para .agents", () => {
    const root = project();
    skill(root, ".claude/skills", "local-only");
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(existsSync(resolve(root, ".agents", "skills", "local-only"))).toBe(false);
    expect(claudeSkill(root, "local-only")).toContain("local-only");
  });
});
