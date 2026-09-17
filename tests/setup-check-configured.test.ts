import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { project } from "./helpers-spec-0022";
import { scriptFor, runScript } from "./helpers-spec-0023";

/** A root with the base "installed" markers (.maestro/install.json, .specsfy/) already in place. */
function installedRoot(): string {
  const root = project();
  mkdirSync(join(root, ".maestro"), { recursive: true });
  writeFileSync(join(root, ".maestro", "install.json"), "{}\n");
  mkdirSync(join(root, ".specsfy"), { recursive: true });
  return root;
}

function withTraces(root: string): void {
  for (const t of ["PROJECT.md", ".specsfy/STACK.md", ".specsfy/RULES.md", ".specsfy/USER-PROFILE.md"]) {
    mkdirSync(join(root, t, ".."), { recursive: true });
    writeFileSync(join(root, t), "x\n");
  }
}

function withAgentSkillsSection(root: string): void {
  writeFileSync(join(root, "AGENTS.md"), "## Agent skills\n\nfoo\n");
}

describe("AC-001 — SessionStart orienta quando faltam rastros", () => {
  // SPECSFY: US-001 FR-001 FR-002 NFR-001 AC-001
  it("cita /specsfy-setup e lista PROJECT.md e .specsfy/STACK.md ausentes", () => {
    const root = installedRoot();
    withAgentSkillsSection(root);
    const r = runScript(scriptFor("setup-check"), { session_id: "s", source: "startup" }, root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("/specsfy-setup");
    expect(r.stdout).toContain("PROJECT.md");
    expect(r.stdout).toContain(".specsfy/STACK.md");
  });
});

describe("AC-002 — SessionStart silencioso quando completo", () => {
  // SPECSFY: US-001 FR-001 FR-002 NFR-001 AC-002
  it("stdout vazio e exit 0 quando tudo presente", () => {
    const root = installedRoot();
    withTraces(root);
    writeFileSync(join(root, "AGENTS.md"), "## Agent skills\n\nfoo\n\n<!-- maestro:extension:router:start -->\n## maestro\n<!-- maestro:extension:router:end -->\n");
    writeFileSync(join(root, "CLAUDE.md"), "<!-- maestro:extension:agents-import:start -->\n@AGENTS.md\n<!-- maestro:extension:agents-import:end -->\n");
    const r = runScript(scriptFor("setup-check"), { session_id: "s", source: "startup" }, root);
    expect(r.stdout).toBe("");
    expect(r.status).toBe(0);
  });
});

describe("AC-003 — SessionStart cita a skill do matt-pocock quando falta a seção", () => {
  // SPECSFY: US-001 FR-001 FR-002 AC-003
  it("cita /setup-matt-pocock-skills e não cita /specsfy-setup", () => {
    const root = installedRoot();
    withTraces(root);
    const r = runScript(scriptFor("setup-check"), { session_id: "s", source: "startup" }, root);
    expect(r.stdout).toContain("/setup-matt-pocock-skills");
    expect(r.stdout).not.toContain("/specsfy-setup");
  });
});
