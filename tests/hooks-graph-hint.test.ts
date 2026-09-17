import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project, readSettings, entriesFor } from "./helpers-spec-0022";
import { scriptFor, runScript, stateFile } from "./helpers-spec-0023";

const withGraph = (): string => {
  const root = project();
  mkdirSync(join(root, ".code-review-graph"), { recursive: true });
  mkdirSync(join(root, ".maestro", "state"), { recursive: true });
  return root;
};
const grep = (session: string, tool = "Grep") => ({ session_id: session, tool_name: tool, tool_input: { pattern: "x" } });
const parse = (stdout: string) => JSON.parse(stdout) as { hookSpecificOutput: { hookEventName: string; additionalContext: string } };

describe("AC-011 — dica do grafo aparece uma vez por sessão", () => {
  // SPECSFY: US-003 FR-004 FR-007 NFR-001 AC-011
  it("primeiro Grep emite JSON; segundo fica em silêncio; marca gravada", () => {
    const root = withGraph();
    const script = scriptFor("graph-hint");
    const first = runScript(script, grep("s1"), root);
    expect(first.status).toBe(0);
    const out = parse(first.stdout);
    expect(out.hookSpecificOutput.hookEventName).toBe("PreToolUse");
    expect(out.hookSpecificOutput.additionalContext).toContain("code-review-graph");
    const second = runScript(script, grep("s1"), root);
    expect(second.stdout).toBe("");
    expect(existsSync(stateFile(root, "graph-hint-s1"))).toBe(true);
  });
});

describe("AC-012 — sem grafo, silêncio", () => {
  // SPECSFY: US-003 FR-004 NFR-001 AC-012
  it("projeto sem .code-review-graph/ não recebe dica", () => {
    const root = project();
    mkdirSync(join(root, ".maestro", "state"), { recursive: true });
    const script = scriptFor("graph-hint");
    const r = runScript(script, grep("s1"), root);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });
});

describe("AC-013 — nova sessão recebe a dica de novo; Glob também conta", () => {
  // SPECSFY: US-003 FR-004 FR-007 AC-013
  it("session_id diferente com Glob emite uma vez; matcher Grep|Glob no settings", () => {
    const root = withGraph();
    const script = scriptFor("graph-hint");
    runScript(script, grep("s1"), root);
    const r = runScript(script, grep("s2", "Glob"), root);
    expect(parse(r.stdout).hookSpecificOutput.additionalContext).toContain("code-review-graph");
    expect(runScript(script, grep("s2", "Glob"), root).stdout).toBe("");
    const setupRoot = project();
    runSetup({ env: claudeEnv, root: setupRoot, write: true, upstream: { contextModeHooksJson: null } });
    const [entry] = entriesFor(readSettings(setupRoot), "PreToolUse", "graph-hint");
    expect(entry?.matcher).toBe("Grep|Glob");
  });
});
