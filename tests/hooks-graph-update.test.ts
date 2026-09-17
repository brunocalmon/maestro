import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project, readSettings, entriesFor, corpusHook } from "./helpers-spec-0022";
import { scriptFor, runScript, gitRepo, fakeCrg, stateFile } from "./helpers-spec-0023";

const treeHash = (root: string): string => {
  const status = spawnSync("git", ["status", "--porcelain", "--", ".", ":(exclude).maestro", ":(exclude).code-review-graph"], { cwd: root, encoding: "utf8" }).stdout;
  return spawnSync("sha256sum", [], { input: status, encoding: "utf8" }).stdout.split(" ")[0]!;
};

describe("AC-007 — edição via Bash atualiza o grafo", () => {
  // SPECSFY: US-002 FR-003 FR-007 NFR-001 AC-007
  it("dispara update --brief silencioso e grava o hash", () => {
    const root = gitRepo();
    const crg = fakeCrg();
    const script = scriptFor("code-review-graph-update", { "code-review-graph": crg.bin });
    writeFileSync(join(root, "x.ts"), "export const a = 2;\n");
    const r = runScript(script, { session_id: "s", tool_name: "Bash", tool_input: { command: "sed -i s/a/b/ x.ts" } }, root);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    expect(crg.calls()).toEqual(["update --brief"]);
    expect(readFileSync(stateFile(root, "crg-tree.hash"), "utf8").trim()).toBe(treeHash(root));
  });
});

describe("AC-008 — sem mudança no working tree, o CLI não executa", () => {
  // SPECSFY: US-002 FR-003 FR-007 NFR-001 AC-008
  it("segunda chamada sem edição não invoca o binário", () => {
    const root = gitRepo();
    const crg = fakeCrg();
    const script = scriptFor("code-review-graph-update", { "code-review-graph": crg.bin });
    writeFileSync(join(root, "x.ts"), "export const a = 3;\n");
    runScript(script, { tool_name: "Bash", tool_input: { command: "x" } }, root);
    expect(crg.calls()).toHaveLength(1);
    runScript(script, { tool_name: "Edit", tool_input: { file_path: "x.ts" } }, root);
    expect(crg.calls()).toHaveLength(1);
  });
});

describe("AC-009 — Stop fecha a rodada", () => {
  // SPECSFY: US-002 FR-003 NFR-001 AC-009
  it("edição fora do ciclo de ferramentas é capturada no Stop", () => {
    const root = gitRepo();
    const crg = fakeCrg();
    const script = scriptFor("code-review-graph-stop", { "code-review-graph": crg.bin });
    writeFileSync(join(root, "y.ts"), "export const b = 1;\n");
    const r = runScript(script, { session_id: "s", stop_hook_active: false }, root);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    expect(crg.calls()).toEqual(["update --brief"]);
  });
});

describe("AC-010 — PostToolUse amplo instalado com o matcher correto", () => {
  // SPECSFY: US-002 FR-003 AC-010
  it("settings.json referencia os dois scripts", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: null } });
    const s = readSettings(root);
    const [update] = entriesFor(s, "PostToolUse", "code-review-graph-update");
    expect(update?.matcher).toBe("Edit|Write|MultiEdit|NotebookEdit|Bash|mcp__.*");
    expect(entriesFor(s, "PostToolUse", "code-review-graph-update")).toHaveLength(1);
    expect(entriesFor(s, "Stop", "code-review-graph-stop")).toHaveLength(1);
    expect((s.hooks.PostToolUse ?? []).filter((e) => e.hooks[0]!.command.includes("code-review-graph update"))).toHaveLength(0);
  });
});

describe("AC-020 — resoluções de binário chegam ao fragmento", () => {
  // SPECSFY: US-002 FR-003 FR-007 AC-020
  it("preâmbulo define MAESTRO_BIN_code_review_graph e cai para command -v sem resolução", () => {
    const withBin = scriptFor("code-review-graph-update", { "code-review-graph": "/opt/x/code-review-graph" });
    expect(readFileSync(withBin, "utf8")).toContain("MAESTRO_BIN_code_review_graph='/opt/x/code-review-graph'");
    const without = scriptFor("code-review-graph-update", {});
    const body = readFileSync(without, "utf8");
    expect(body).not.toContain("MAESTRO_BIN_code_review_graph=");
    expect(body).toContain("command -v code-review-graph");
    expect(corpusHook("code-review-graph-update").kind).toBe("script");
  });
});

describe("AC-024 — latência do PostToolUse amplo sem mudança", () => {
  // SPECSFY: NFR-001 FR-003 AC-024
  it("mediana abaixo de 200 ms e nenhuma invocação", () => {
    const root = gitRepo();
    const crg = fakeCrg();
    const script = scriptFor("code-review-graph-update", { "code-review-graph": crg.bin });
    runScript(script, { tool_name: "Bash", tool_input: { command: "x" } }, root);
    const before = crg.calls().length;
    const times: number[] = [];
    for (let i = 0; i < 20; i++) times.push(runScript(script, { tool_name: "Bash", tool_input: { command: "x" } }, root).ms);
    times.sort((a, b) => a - b);
    expect(times[10]!).toBeLessThan(200);
    expect(crg.calls().length).toBe(before);
    expect(existsSync(stateFile(root, "crg-tree.hash"))).toBe(true);
  }, 30_000);
});
