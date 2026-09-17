import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { claudeCodeAdapter } from "../src/targets/claude-code";
import { antigravityAdapter } from "../src/targets/antigravity";
import { runSetup } from "../src/setup/run";
import { syntheticHook, project, readSettings } from "./helpers-spec-0022";

const COMPACT = "kind: hook\nname: compact-probe\nevent: before-compact\nraw_command: echo compact";

describe("AC-016 — evento não suportado pelo adaptador é reportado como pulado", () => {
  // SPECSFY: US-003 FR-007 AC-016
  it("Antigravity pula before-compact e lista o motivo; Claude Code instala em PreCompact", () => {
    const hook = syntheticHook(COMPACT);
    expect(antigravityAdapter.supportedEvents).not.toContain("before-compact");
    const ag = antigravityAdapter.formatHooks([hook]);
    expect(ag.installed).toHaveLength(0);
    expect(ag.skipped).toEqual([expect.objectContaining({ name: "compact-probe", event: "before-compact" })]);
    const cc = claudeCodeAdapter.formatHooks([hook]);
    expect(cc.skipped).toHaveLength(0);
    expect(cc.settings?.hooks.PreCompact?.[0]?.hooks[0]?.command).toContain("echo compact");

    const hooksDir = mkdtempSync(join(tmpdir(), "spec0022-hooks-"));
    writeFileSync(join(hooksDir, "compact-probe.md"), `---\n${COMPACT}\n---\n`);
    const agRoot = project();
    const agResult = runSetup({ env: { hasClaudeCode: false, hasAntigravity: true, files: [".agents/"] }, root: agRoot, write: true, target: "antigravity", hooksDir });
    expect(agResult.report).toMatch(/compact-probe/);
    expect(agResult.report).toMatch(/pulad|skipped/i);
    const ccRoot = project();
    runSetup({ env: { hasClaudeCode: true, files: [".claude/settings.json"] }, root: ccRoot, write: true, hooksDir });
    expect(readSettings(ccRoot).hooks.PreCompact?.[0]?.hooks[0]?.command).toContain("echo compact");
  });
});
