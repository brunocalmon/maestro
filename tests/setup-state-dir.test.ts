import { describe, it, expect } from "vitest";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project } from "./helpers-spec-0022";
import { scriptFor, runScript, gitRepo, fakeCrg, stateFile } from "./helpers-spec-0023";

describe("AC-021 — estado por sessão fica em .maestro/state/ e é ignorado pelo git", () => {
  // SPECSFY: FR-007 NFR-001 NFR-003 AC-021
  it("setup cria a pasta e a linha única no .gitignore, idempotente", () => {
    const root = project();
    writeFileSync(resolve(root, ".gitignore"), "node_modules/\n");
    runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: null } });
    expect(existsSync(resolve(root, ".maestro", "state"))).toBe(true);
    runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: null } });
    const lines = readFileSync(resolve(root, ".gitignore"), "utf8").split("\n").filter((l) => l.trim() === ".maestro/state/");
    expect(lines).toHaveLength(1);
    expect(readFileSync(resolve(root, ".gitignore"), "utf8")).toContain("node_modules/");
    const fresh = project();
    runSetup({ env: claudeEnv, root: fresh, write: true, upstream: { contextModeHooksJson: null } });
    expect(readFileSync(resolve(fresh, ".gitignore"), "utf8")).toContain(".maestro/state/");
  });
});

describe("AC-022 — estado não gravável não bloqueia os hooks", () => {
  // SPECSFY: FR-007 FR-003 FR-004 AC-022
  it("update executa sempre e a dica é emitida quando .maestro/state/ é somente leitura", () => {
    const root = gitRepo();
    const crg = fakeCrg();
    const state = resolve(root, ".maestro", "state");
    rmSync(stateFile(root, "crg-tree.hash"), { force: true });
    chmodSync(state, 0o555);
    try {
      writeFileSync(join(root, "x.ts"), "export const a = 9;\n");
      const update = scriptFor("code-review-graph-update", { "code-review-graph": crg.bin });
      const r1 = runScript(update, { tool_name: "Bash", tool_input: { command: "x" } }, root);
      expect(r1.status).toBe(0);
      expect(crg.calls()).toHaveLength(1);
      mkdirSync(join(root, ".code-review-graph"), { recursive: true });
      const hint = scriptFor("graph-hint");
      const r2 = runScript(hint, { session_id: "ro", tool_name: "Grep", tool_input: { pattern: "x" } }, root);
      expect(r2.status).toBe(0);
      expect(r2.stdout).toContain("code-review-graph");
    } finally {
      chmodSync(state, 0o755);
    }
  });
});
