import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project } from "./helpers-spec-0022";
import { read, block, artifact, registry, registerBlock, oldDirectionRoot, OLD_ROUTER, OLD_LANGUAGE, OLD_FALLBACK, count } from "./helpers-spec-0024";

const opts = { upstream: { contextModeHooksJson: null } };
const quarantine = (root: string): string[] => (existsSync(resolve(root, ".maestro", "quarantine")) ? readdirSync(resolve(root, ".maestro", "quarantine")) : []);

describe("AC-004 — migração de blocos íntegros da direção antiga", () => {
  // SPECSFY: US-001 FR-002 NFR-001 NFR-002 AC-004
  it("blocos movidos, ponteiros removidos, registro atualizado sem duplicata", () => {
    const root = oldDirectionRoot();
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(block(root, "AGENTS.md", "router")).toBe(OLD_ROUTER);
    expect(block(root, "AGENTS.md", "config-language-rule")).toBe(OLD_LANGUAGE);
    expect(block(root, "AGENTS.md", "hooks-fallback")).toBe(OLD_FALLBACK);
    for (const n of ["router", "config-language-rule", "hooks-fallback"]) expect(block(root, "CLAUDE.md", n), n).toBeNull();
    for (const n of ["agents-pointer", "config-language-pointer", "hooks-fallback-pointer"]) {
      expect(block(root, "AGENTS.md", n), n).toBeNull();
      expect(artifact(root, n), n).toBeUndefined();
    }
    expect(block(root, "CLAUDE.md", "agents-import")).toBe("@AGENTS.md");
    for (const n of ["router", "config-language-rule", "hooks-fallback"]) expect(artifact(root, n)?.target, n).toBe("AGENTS.md");
    expect(registry(root).artifacts.filter((a) => a.name === "router")).toHaveLength(1);
    expect(quarantine(root)).toHaveLength(0);
  });
});

describe("AC-005 — bloco divergente vai para quarentena", () => {
  // SPECSFY: US-001 FR-002 NFR-002 AC-005
  it("router editado à mão é preservado em quarentena e AGENTS.md recebe o registrado", () => {
    const root = oldDirectionRoot();
    writeFileSync(resolve(root, "CLAUDE.md"), read(root, "CLAUDE.md").replace("router text from an older release", "router text edited by hand"));
    const result = runSetup({ env: claudeEnv, root, write: true, ...opts });
    const files = quarantine(root).filter((f) => f.includes("router"));
    expect(files.length).toBeGreaterThan(0);
    expect(readFileSync(resolve(root, ".maestro", "quarantine", files[0]!), "utf8")).toContain("router text edited by hand");
    expect(block(root, "AGENTS.md", "router")).toBe(OLD_ROUTER);
    expect(block(root, "CLAUDE.md", "router")).toBeNull();
    expect(result.report).toMatch(/quarantine|quarentena/i);
  });
});

describe("AC-006 — blocos do Specsfy e conteúdo humano intocados", () => {
  // SPECSFY: US-001 FR-002 NFR-002 AC-006
  it("specsfy:framework nos dois arquivos e parágrafo humano em CLAUDE.md permanecem", () => {
    const root = oldDirectionRoot();
    writeFileSync(resolve(root, "CLAUDE.md"), `${read(root, "CLAUDE.md")}\nUm parágrafo humano sem assinatura que deve ficar aqui.\n`);
    const specsfyClaude = /<!-- specsfy:framework:start -->[\s\S]*?<!-- specsfy:framework:end -->/.exec(read(root, "CLAUDE.md"))![0];
    const specsfyAgents = /<!-- specsfy:framework:start -->[\s\S]*?<!-- specsfy:framework:end -->/.exec(read(root, "AGENTS.md"))![0];
    runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(read(root, "CLAUDE.md")).toContain(specsfyClaude);
    expect(read(root, "AGENTS.md")).toContain(specsfyAgents);
    expect(read(root, "CLAUDE.md")).toContain("Um parágrafo humano sem assinatura que deve ficar aqui.");
    expect(count(read(root, "AGENTS.md"), "specsfy:framework:start")).toBe(1);
    // A preservação só prova algo se a migração de fato aconteceu ao redor do conteúdo alheio.
    expect(block(root, "AGENTS.md", "router")).toBe(OLD_ROUTER);
    expect(block(root, "CLAUDE.md", "router")).toBeNull();
  });
});

describe("AC-007 — renomeação dos artefatos agents-* do Antigravity", () => {
  // SPECSFY: US-001 FR-002 NFR-001 AC-007
  it("registro passa a usar os nomes compartilhados com os mesmos conteúdos", () => {
    const root = project();
    writeFileSync(resolve(root, "AGENTS.md"), "");
    registerBlock(root, "agents-router", "AGENTS.md", OLD_ROUTER);
    registerBlock(root, "agents-config-language-rule", "AGENTS.md", OLD_LANGUAGE);
    registerBlock(root, "agents-hooks-fallback", "AGENTS.md", OLD_FALLBACK);
    runSetup({ env: { hasClaudeCode: false, hasAntigravity: true, files: [".agents/"] }, root, write: true, target: "antigravity", ...opts });
    expect(artifact(root, "router")?.content).toBe(OLD_ROUTER);
    expect(artifact(root, "config-language-rule")?.content).toBe(OLD_LANGUAGE);
    expect(artifact(root, "hooks-fallback")?.content).toBe(OLD_FALLBACK);
    for (const n of ["agents-router", "agents-config-language-rule", "agents-hooks-fallback"]) expect(artifact(root, n), n).toBeUndefined();
    expect(count(read(root, "AGENTS.md"), "maestro:extension:router:start")).toBe(1);
    expect(count(read(root, "AGENTS.md"), "router text from an older release")).toBe(1);
  });
});
