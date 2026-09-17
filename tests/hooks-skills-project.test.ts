import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project, readSettings, entriesFor } from "./helpers-spec-0022";
import { scriptFor, runScript, shellEvent, CTX_EXECUTE } from "./helpers-spec-0023";
import { skill, claudeSkill } from "./helpers-spec-0024";

const opts = { upstream: { contextModeHooksJson: null } };

describe("AC-017 — hook de sessão copia o que falta", () => {
  // SPECSFY: US-003 FR-007 NFR-001 AC-017
  it("SessionStart copia b, preserva a, sem stdout", () => {
    const root = project();
    skill(root, ".agents/skills", "a", "fonte a\n");
    skill(root, ".agents/skills", "b", "fonte b\n");
    skill(root, ".claude/skills", "a", "cópia local de a\n");
    const r = runScript(scriptFor("skills-project-session"), { session_id: "s", source: "startup" }, root);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    expect(claudeSkill(root, "b")).toBe("fonte b\n");
    expect(claudeSkill(root, "a")).toBe("cópia local de a\n");
  });
});

describe("AC-018 — hook pós-ferramenta copia após skills add ou specsfy skills", () => {
  // SPECSFY: US-003 FR-007 NFR-001 AC-018
  it("copia após o comando de instalação e ignora comandos comuns", () => {
    const root = project();
    skill(root, ".agents/skills", "c", "fonte c\n");
    const script = scriptFor("skills-project");
    runScript(script, shellEvent("Bash", "ls"), root);
    expect(existsSync(resolve(root, ".claude", "skills", "c"))).toBe(false);
    const r = runScript(script, shellEvent("Bash", "npx skills add promovaweb/specsfy --skill x"), root);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    expect(claudeSkill(root, "c")).toBe("fonte c\n");
    skill(root, ".agents/skills", "d", "fonte d\n");
    runScript(script, shellEvent(CTX_EXECUTE, "specsfy skills install foo"), root);
    expect(claudeSkill(root, "d")).toBe("fonte d\n");
  });
});

describe("AC-019 — hooks de projeção inertes sem .claude/ ou sem .agents/skills", () => {
  // SPECSFY: US-003 FR-007 NFR-003 AC-019
  it("nada é criado e exit 0", () => {
    const noClaude = mkdtempSync(join(tmpdir(), "spec0024-noclaude-"));
    skill(noClaude, ".agents/skills", "x");
    const r1 = runScript(scriptFor("skills-project-session"), { session_id: "s" }, noClaude);
    expect(r1.status).toBe(0);
    expect(existsSync(resolve(noClaude, ".claude"))).toBe(false);
    const noAgents = project();
    rmSync(resolve(noAgents, ".agents"), { recursive: true, force: true });
    mkdirSync(resolve(noAgents, ".claude"), { recursive: true });
    const r2 = runScript(scriptFor("skills-project"), shellEvent("Bash", "npx skills add x/y"), noAgents);
    expect(r2.status).toBe(0);
    expect(existsSync(resolve(noAgents, ".claude", "skills"))).toBe(false);
  });
});

describe("AC-020 — hooks de projeção instalados com os matchers corretos", () => {
  // SPECSFY: US-003 FR-007 FR-006 AC-020
  it("SessionStart e PostToolUse referenciam os scripts", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    const s = readSettings(root);
    expect(entriesFor(s, "SessionStart", "skills-project-session")).toHaveLength(1);
    const [post] = entriesFor(s, "PostToolUse", "skills-project");
    expect(post?.matcher).toBe("Bash|mcp__.*(execute|run_in_terminal|shell).*");
  });
});
