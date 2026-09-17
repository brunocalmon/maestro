import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { runSetup } from "../src/setup/run";
import { translateForClaudeCode, renderSettings } from "../src/hooks/claude-code";
import { claudeEnv, project, readSettings, entriesFor, corpusHook, syntheticHook } from "./helpers-spec-0022";

const CANONICAL = ["guard-destructive", "guard-secrets", "protect-authorship", "code-review-graph-update", "setup-check"];

describe("AC-001 — protect-authorship em PreToolUse com matcher Bash bloqueia trailer de IA", () => {
  // SPECSFY: US-001 FR-001 FR-002 NFR-003 AC-001
  it("instala o guard como referência a .maestro/hooks/ e o script devolve exit 2", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true });
    const entries = entriesFor(readSettings(root), "PreToolUse", "protect-authorship");
    expect(entries).toHaveLength(1);
    // SPEC-0023 widened the guards' matcher to every shell tool; "Bash" must still match.
    expect(new RegExp(`^(${entries[0]!.matcher})$`).test("Bash")).toBe(true);
    expect(entries[0]!.hooks[0]!.command).toBe('"$CLAUDE_PROJECT_DIR/.maestro/hooks/protect-authorship.sh"');
    const script = resolve(root, ".maestro", "hooks", "protect-authorship.sh");
    expect(existsSync(script)).toBe(true);
    const r = spawnSync("bash", [script], {
      input: JSON.stringify({ tool_name: "Bash", tool_input: { command: "git commit -m 'x' -m 'Co-Authored-By: Claude <noreply@anthropic.com>'" } }),
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: root },
      timeout: 20_000,
    });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/co-author/i);
  }, 30_000);
});

describe("AC-002 — matcher derivado do evento canônico por mapa fixo", () => {
  // SPECSFY: US-001 FR-001 AC-002
  it("nenhuma entrada usa o nome do hook e cada evento recebe o matcher do mapa", () => {
    const hooks = CANONICAL.map(corpusHook);
    const translated = hooks.map(translateForClaudeCode);
    for (const [i, t] of translated.entries()) {
      const source = hooks[i]!;
      if (source.event === "before-shell") { expect(t.event).toBe("PreToolUse"); expect(t.matcher).toBe(source.tools ?? "Bash"); }
      if (source.event === "after-file-edit") { expect(t.event).toBe("PostToolUse"); expect(t.matcher).toBe("Edit|Write|MultiEdit|NotebookEdit"); }
      if (source.event === "stop" || source.event === "session-start") expect(t.matcher).toBeUndefined();
    }
    // A before-shell hook without tools: gets the fixed-map default.
    expect(translateForClaudeCode(syntheticHook("kind: hook\nname: plain\nevent: before-shell\nraw_command: echo x")).matcher).toBe("Bash");
    const settings = renderSettings(translated);
    for (const entries of Object.values(settings.hooks)) {
      for (const e of entries ?? []) {
        expect(CANONICAL).not.toContain(e.matcher);
        if (e.matcher === undefined) expect("matcher" in e).toBe(false);
      }
    }
  });
});

describe("AC-003 — tools: no frontmatter sobrescreve o mapa fixo", () => {
  // SPECSFY: US-001 FR-001 FR-007 AC-003
  it("usa tools quando declarado e o mapa fixo quando não", () => {
    const withTools = syntheticHook("kind: hook\nname: wide\nevent: before-tool\ntools: Bash|Read|Grep|WebFetch\nraw_command: echo x");
    const without = syntheticHook("kind: hook\nname: narrow\nevent: before-tool\nraw_command: echo y");
    expect(translateForClaudeCode(withTools).event).toBe("PreToolUse");
    expect(translateForClaudeCode(withTools).matcher).toBe("Bash|Read|Grep|WebFetch");
    expect(translateForClaudeCode(without).matcher).toBe("Bash");
  });
});
