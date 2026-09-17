import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project, readSettings, entriesFor, legacyEntry, corpusHook } from "./helpers-spec-0022";

const LEGACY_BY_EVENT: Record<string, string[]> = {
  PreToolUse: ["context-mode-pretooluse", "guard-destructive", "guard-secrets", "protect-authorship"],
  PostToolUse: ["code-review-graph-update", "context-mode-posttooluse"],
  Stop: ["context-mode-stop"],
  SessionStart: ["setup-check"],
};

function legacySettings(): string {
  const hooks: Record<string, unknown[]> = {};
  for (const [event, names] of Object.entries(LEGACY_BY_EVENT)) hooks[event] = names.map((n) => legacyEntry(n, `# fragmento de ${n}`));
  return JSON.stringify({ permissions: { allow: ["Bash"] }, hooks }, null, 2);
}

describe("AC-009 — formato inline antigo é migrado sem duplicatas", () => {
  // SPECSFY: US-002 FR-004 NFR-002 AC-009
  it("remove as 8 entradas antigas, instala uma nova por hook e relata a contagem", () => {
    const root = project(legacySettings());
    const result = runSetup({ env: claudeEnv, root, write: true });
    const s = readSettings(root);
    const all = Object.values(s.hooks).flat();
    expect(all.filter((e) => e.hooks[0]!.command.includes(">>> hook fragment"))).toHaveLength(0);
    for (const name of ["guard-destructive", "guard-secrets", "protect-authorship"]) expect(entriesFor(s, "PreToolUse", name), name).toHaveLength(1);
    expect(entriesFor(s, "SessionStart", "setup-check")).toHaveLength(1);
    expect(result.report).toMatch(/8 .*migrad|migrated.*8|migrad[ao]s?: 8/i);
    expect((s as { permissions?: unknown }).permissions).toEqual({ allow: ["Bash"] });
  });
});

describe("AC-010 — nome coincidente sem marcador não é tocado", () => {
  // SPECSFY: US-002 FR-004 NFR-002 AC-010
  it("preserva a entrada de terceiro que só coincide no matcher", () => {
    const foreign = { matcher: "setup-check", hooks: [{ type: "command", command: "echo ok" }] };
    const root = project(JSON.stringify({ hooks: { SessionStart: [foreign] } }));
    runSetup({ env: claudeEnv, root, write: true });
    const s = readSettings(root);
    expect(s.hooks.SessionStart).toContainEqual(foreign);
    expect(entriesFor(s, "SessionStart", "setup-check")).toHaveLength(1);
    expect(corpusHook("setup-check").event).toBe("session-start");
  });
});
