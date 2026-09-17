import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { projectContextModeHooks } from "../src/hooks/upstream";
import { claudeEnv, project, readSettings, FIXTURE_HOOKS_JSON } from "./helpers-spec-0022";

const upstream = { contextModeHooksJson: FIXTURE_HOOKS_JSON };

describe("AC-014 — hooks do context-mode projetados do hooks.json upstream", () => {
  // SPECSFY: US-003 FR-006 FR-007 AC-014
  it("uma entrada PreToolUse por matcher do fixture e PostToolUse com o matcher amplo", () => {
    const projected = projectContextModeHooks(FIXTURE_HOOKS_JSON, {});
    expect(projected.skipped).toBeUndefined();
    expect(projected.hooks.filter((h) => h.event === "before-tool").map((h) => h.tools).sort()).toEqual(["Bash", "Grep", "Read", "WebFetch"]);

    const root = project();
    runSetup({ env: claudeEnv, root, write: true, upstream });
    const s = readSettings(root);
    const pre = (s.hooks.PreToolUse ?? []).filter((e) => e.hooks[0]!.command.includes("pretooluse.mjs"));
    expect(pre.map((e) => e.matcher).sort()).toEqual(["Bash", "Grep", "Read", "WebFetch"]);
    const post = (s.hooks.PostToolUse ?? []).filter((e) => e.hooks[0]!.command.includes("posttooluse.mjs"));
    expect(post).toHaveLength(1);
    expect(post[0]!.matcher).toBe("Bash|Read|Write|Edit|NotebookEdit|Glob|Grep|mcp__");
    for (const md of ["context-mode-pretooluse.md", "context-mode-posttooluse.md", "context-mode-stop.md"]) {
      expect(existsSync(resolve(__dirname, "..", "resources", "hooks", md)), md).toBe(false);
    }
  });
});

describe("AC-015 — hooks.json ausente não impede os demais hooks", () => {
  // SPECSFY: US-003 FR-006 AC-015
  it("instala os canônicos e relata que o context-mode foi pulado", () => {
    const root = project();
    const result = runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: resolve(root, "nao-existe.json") } });
    const s = readSettings(root);
    expect((s.hooks.PreToolUse ?? []).some((e) => e.hooks[0]!.command.includes("guard-destructive.sh"))).toBe(true);
    expect((s.hooks.PreToolUse ?? []).some((e) => e.hooks[0]!.command.includes("pretooluse.mjs"))).toBe(false);
    expect(result.report).toMatch(/context-mode/);
    expect(result.report).toMatch(/pulad|skipped/i);
  });
});

describe("AC-022 — eventos upstream fora do vocabulário antigo são mapeados e instalados", () => {
  // SPECSFY: US-003 FR-006 FR-007 AC-022
  it("PreCompact e UserPromptSubmit viram entradas e eventos canônicos no install.json", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true, upstream });
    const s = readSettings(root);
    expect((s.hooks.PreCompact ?? []).some((e) => e.hooks[0]!.command.includes("precompact.mjs"))).toBe(true);
    expect((s.hooks.UserPromptSubmit ?? []).some((e) => e.hooks[0]!.command.includes("userpromptsubmit.mjs"))).toBe(true);
    const record = JSON.parse(readFileSync(resolve(root, ".maestro", "install.json"), "utf8")) as { hooks: { canonicalEvent?: string }[] };
    const events = new Set(record.hooks.map((h) => h.canonicalEvent));
    expect(events.has("before-compact")).toBe(true);
    expect(events.has("on-prompt")).toBe(true);
  });
});
