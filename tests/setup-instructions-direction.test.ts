import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { buildRouterBlock, buildConfigLanguageBlock, buildHooksFallbackBlock } from "../src/extensions/router";
import { claudeEnv, project } from "./helpers-spec-0022";
import { read, block, count } from "./helpers-spec-0024";

const opts = { upstream: { contextModeHooksJson: null } };
const antigravityEnv = { hasClaudeCode: false, hasAntigravity: true, files: [".agents/"] };

describe("AC-001 — projeto novo recebe conteúdo em AGENTS.md e @AGENTS.md em CLAUDE.md", () => {
  // SPECSFY: US-001 FR-001 NFR-001 NFR-003 AC-001
  it("blocos completos em AGENTS.md; bloco agents-import em CLAUDE.md", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(block(root, "AGENTS.md", "router")).toBe(buildRouterBlock());
    expect(block(root, "AGENTS.md", "config-language-rule")).toBe(buildConfigLanguageBlock());
    expect(block(root, "AGENTS.md", "hooks-fallback")).toBe(buildHooksFallbackBlock());
    expect(block(root, "CLAUDE.md", "agents-import")).toBe("@AGENTS.md");
    expect(read(root, "CLAUDE.md")).not.toContain("maestro-extension-creator");
    expect(block(root, "CLAUDE.md", "router")).toBeNull();
  });
});

describe("AC-002 — segundo setup não duplica nem altera", () => {
  // SPECSFY: US-001 FR-001 NFR-001 AC-002
  it("arquivos idênticos e @AGENTS.md uma única vez", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    const agents = read(root, "AGENTS.md"), claude = read(root, "CLAUDE.md");
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(read(root, "AGENTS.md")).toBe(agents);
    expect(read(root, "CLAUDE.md")).toBe(claude);
    expect(count(read(root, "CLAUDE.md"), "@AGENTS.md")).toBe(1);
  });
});

describe("AC-003 — Antigravity usa os mesmos nomes de bloco em AGENTS.md", () => {
  // SPECSFY: US-001 FR-001 NFR-003 AC-003
  it("nomes compartilhados e nenhum CLAUDE.md", () => {
    const root = project();
    runSetup({ env: antigravityEnv, root, write: true, target: "antigravity", ...opts });
    expect(block(root, "AGENTS.md", "router")).toBe(buildRouterBlock());
    expect(block(root, "AGENTS.md", "config-language-rule")).toBe(buildConfigLanguageBlock());
    expect(block(root, "AGENTS.md", "hooks-fallback")).toBe(buildHooksFallbackBlock());
    expect(block(root, "AGENTS.md", "agents-router")).toBeNull();
    expect(existsSync(resolve(root, "CLAUDE.md"))).toBe(false);
  });
});
