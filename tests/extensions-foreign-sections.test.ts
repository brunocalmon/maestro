import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { buildRouterBlock } from "../src/extensions/router";
import { computeChecksum } from "../src/extensions/anchor";
import { claudeEnv, project } from "./helpers-spec-0022";
import { read, registry, AGENT_SKILLS_SECTION, count } from "./helpers-spec-0024";

const opts = { upstream: { contextModeHooksJson: null } };
const foreign = (root: string) => registry(root).artifacts.find((a) => (a as { category: string }).category === "foreign") as
  | { category: string; name: string; origin?: string; checksum: string; content: string; target: string }
  | undefined;
const quarantine = (root: string): string[] => (existsSync(resolve(root, ".maestro", "quarantine")) ? readdirSync(resolve(root, ".maestro", "quarantine")) : []);

describe("AC-008 — ## Agent skills movido de CLAUDE.md para AGENTS.md", () => {
  // SPECSFY: US-002 FR-003 FR-004 NFR-002 AC-008
  it("seção movida com o mesmo texto e registrada como foreign", () => {
    const root = project();
    writeFileSync(resolve(root, "CLAUDE.md"), `# Projeto\n\n${AGENT_SKILLS_SECTION}\n## Outra seção humana\n\nfica.\n`);
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(read(root, "AGENTS.md")).toContain(AGENT_SKILLS_SECTION.trim());
    expect(read(root, "CLAUDE.md")).not.toContain("## Agent skills");
    expect(read(root, "CLAUDE.md")).toContain("## Outra seção humana");
    const f = foreign(root);
    expect(f).toBeDefined();
    expect(f!.origin).toBe("mattpocock/skills");
    expect(f!.target).toBe("AGENTS.md");
    expect(f!.checksum).toBe(computeChecksum(f!.content));
    expect(f!.content.trim()).toBe(AGENT_SKILLS_SECTION.trim());
  });
});

describe("AC-009 — conteúdo foreign nunca é reescrito pelo maestro", () => {
  // SPECSFY: US-002 FR-004 NFR-002 AC-009
  it("texto alterado em AGENTS.md permanece, é relatado e não vai para quarentena", () => {
    const root = project();
    writeFileSync(resolve(root, "CLAUDE.md"), `${AGENT_SKILLS_SECTION}`);
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    writeFileSync(resolve(root, "AGENTS.md"), read(root, "AGENTS.md").replace("Issues live in GitHub.", "Issues live in Linear."));
    const before = quarantine(root).length;
    const result = runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(read(root, "AGENTS.md")).toContain("Issues live in Linear.");
    expect(read(root, "AGENTS.md")).not.toContain("Issues live in GitHub.");
    expect(result.report).toMatch(/foreign|terceiro/i);
    expect(quarantine(root).length).toBe(before);
  });
});

describe("AC-010 — só assinaturas conhecidas são movidas; duplicata idêntica resolvida", () => {
  // SPECSFY: US-002 FR-003 FR-004 NFR-002 AC-010
  it("seção desconhecida fica; duplicata idêntica some de CLAUDE.md; seção diferente é mantida e relatada", () => {
    const root = project();
    writeFileSync(resolve(root, "AGENTS.md"), `${AGENT_SKILLS_SECTION}`);
    writeFileSync(resolve(root, "CLAUDE.md"), `## Minhas notas\n\nnotas humanas.\n\n${AGENT_SKILLS_SECTION}`);
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(read(root, "CLAUDE.md")).toContain("## Minhas notas");
    expect(read(root, "CLAUDE.md")).not.toContain("## Agent skills");
    expect(count(read(root, "AGENTS.md"), "## Agent skills")).toBe(1);

    const other = project();
    writeFileSync(resolve(other, "AGENTS.md"), `${AGENT_SKILLS_SECTION}`);
    writeFileSync(resolve(other, "CLAUDE.md"), AGENT_SKILLS_SECTION.replace("GitHub", "Jira"));
    const result = runSetup({ env: claudeEnv, root: other, write: true, ...opts });
    expect(read(other, "CLAUDE.md")).toContain("## Agent skills");
    expect(read(other, "CLAUDE.md")).toContain("Jira");
    expect(count(read(other, "AGENTS.md"), "## Agent skills")).toBe(1);
    expect(result.report).toMatch(/Agent skills/);
  });
});

describe("AC-011 — router instrui skills que editam CLAUDE.md", () => {
  // SPECSFY: US-002 FR-003 NFR-003 AC-011
  it("texto do router menciona AGENTS.md e @AGENTS.md", () => {
    const text = buildRouterBlock();
    expect(text).toMatch(/AGENTS\.md/);
    expect(text).toMatch(/@AGENTS\.md/);
    expect(text).toMatch(/CLAUDE\.md/);
  });
});
