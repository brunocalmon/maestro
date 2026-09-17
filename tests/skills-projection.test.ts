import { describe, it, expect } from "vitest";
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project } from "./helpers-spec-0022";
import { skill, claudeSkill, installRecord } from "./helpers-spec-0024";

const opts = { upstream: { contextModeHooksJson: null } };

describe("AC-013 — setup projeta .agents/skills para .claude/skills com registro", () => {
  // SPECSFY: US-003 FR-005 FR-006 NFR-001 AC-013
  it("skill só em .agents aparece em .claude e em projections", () => {
    const root = project();
    skill(root, ".agents/skills", "specsfy-specialist-x", "---\nname: specsfy-specialist-x\n---\n# X\n");
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(claudeSkill(root, "specsfy-specialist-x")).toBe("---\nname: specsfy-specialist-x\n---\n# X\n");
    const p = installRecord(root).projections ?? [];
    expect(p.find((x) => x.name === "specsfy-specialist-x")?.checksum).toMatch(/^[0-9a-f]{16,}$/);
  });
});

describe("AC-014 — cópia editada à mão não é sobrescrita e é reportada", () => {
  // SPECSFY: US-003 FR-006 NFR-002 AC-014
  it("edição local em .claude permanece mesmo com fonte atualizada", () => {
    const root = project();
    skill(root, ".agents/skills", "edited", "v1\n");
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    writeFileSync(join(root, ".claude", "skills", "edited", "SKILL.md"), "v1 + edição local\n");
    writeFileSync(join(root, ".agents", "skills", "edited", "SKILL.md"), "v2\n");
    const result = runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(claudeSkill(root, "edited")).toBe("v1 + edição local\n");
    expect(result.report).toMatch(/edited/);
    expect(result.report).toMatch(/diverg|kept|mantid/i);
  });
});

describe("AC-015 — projeção atualiza cópia íntegra quando a fonte muda", () => {
  // SPECSFY: US-003 FR-006 NFR-001 AC-015
  it("cópia igual ao registrado recebe o novo conteúdo e o checksum muda", () => {
    const root = project();
    skill(root, ".agents/skills", "fresh", "v1\n");
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    const before = installRecord(root).projections!.find((x) => x.name === "fresh")!.checksum;
    writeFileSync(join(root, ".agents", "skills", "fresh", "SKILL.md"), "v2\n");
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(claudeSkill(root, "fresh")).toBe("v2\n");
    expect(installRecord(root).projections!.find((x) => x.name === "fresh")!.checksum).not.toBe(before);
  });
});

describe("AC-016 — Antigravity não recebe projeção", () => {
  // SPECSFY: US-003 FR-006 NFR-003 AC-016
  it(".claude/ continua inexistente", () => {
    const root = project();
    skill(root, ".agents/skills", "x");
    runSetup({ env: { hasClaudeCode: false, hasAntigravity: true, files: [".agents/"] }, root, write: true, target: "antigravity", ...opts });
    expect(existsSync(resolve(root, ".claude", "skills", "x"))).toBe(false);
    // Contraste: a mesma fonte é projetada quando o target é o Claude Code — é o target que decide.
    const cc = project();
    skill(cc, ".agents/skills", "x");
    runSetup({ env: claudeEnv, root: cc, write: true, ...opts });
    expect(existsSync(resolve(cc, ".claude", "skills", "x"))).toBe(true);
  });
});
