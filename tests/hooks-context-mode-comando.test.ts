import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { projectContextModeHooks } from "../src/hooks/upstream";
import { translateForClaudeCode } from "../src/hooks/claude-code";

// SPEC-0022 (FR-006): the context-mode hooks are no longer Markdown files
// the maestro maintains; they are projected from the installed package's
// own `hooks/hooks.json`. This file keeps the original intent of AC-009
// (SPEC-0003): the final command carries no unresolved placeholder and
// runs as a real command line.
const REAL_HOOKS_JSON = resolve(__dirname, "..", "node_modules", "context-mode", "hooks", "hooks.json");

describe("AC-009 — the final command contains no unresolved placeholder", () => {
  // SPECSFY: US-002 FR-002 AC-009
  it("no projected command keeps the {ide} or ${CLAUDE_PLUGIN_ROOT} placeholder", () => {
    if (!existsSync(REAL_HOOKS_JSON)) return;
    const { hooks, skipped } = projectContextModeHooks(REAL_HOOKS_JSON);
    expect(skipped).toBeUndefined();
    expect(hooks.length).toBeGreaterThan(0);
    for (const h of hooks) {
      expect(h.script).not.toContain("{ide}");
      expect(h.script).not.toContain("${CLAUDE_PLUGIN_ROOT}");
    }
  });

  // SPECSFY: US-002 FR-002 AC-009
  it("every projected command points at a script inside the installed package", () => {
    if (!existsSync(REAL_HOOKS_JSON)) return;
    const { hooks } = projectContextModeHooks(REAL_HOOKS_JSON);
    for (const h of hooks) {
      expect(h.kind).toBe("dispatch");
      expect(translateForClaudeCode(h).command).toMatch(/node_modules\/context-mode\/hooks\/[a-z]+\.mjs/);
    }
  });
});
