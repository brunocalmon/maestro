import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { projectWithoutClaudeCode } from "./mcp-fixtures";

describe("AC-013 — the MCP tool accepts an explicit target", () => {
  // A project that exists but was never configured for Claude Code has
  // none of detectTarget's evidence — this is the scenario found running
  // `maestro setup` for real against a fresh project, from inside
  // Claude Code itself.
  // TRACEABILITY: US-001 FR-001 AC-013
  it("configures a project with no target evidence at all, given an explicit target", async () => {
    const root = projectWithoutClaudeCode();
    const r = await executeSetup({ project_root: root, target: "claude-code" });
    expect(r.isError ?? false).toBe(false);
    expect(existsSync(join(root, ".claude", "settings.json"))).toBe(true);
  });

  // TRACEABILITY: US-001 FR-001 AC-013
  it("refuses an unknown target instead of silently doing nothing", async () => {
    const root = projectWithoutClaudeCode();
    const r = await executeSetup({ project_root: root, target: "some-editor-nobody-made" });
    expect(r.isError).toBe(true);
    expect(r.content[0]?.text).toMatch(/unknown target/);
  });

  // TRACEABILITY: US-001 FR-001 AC-013
  it("refuses a non-string target", async () => {
    const root = projectWithoutClaudeCode();
    const r = await executeSetup({ project_root: root, target: 42 });
    expect(r.isError).toBe(true);
  });

  // TRACEABILITY: US-001 FR-001 AC-006
  it("still falls back to filesystem evidence when no target is given", async () => {
    const root = projectWithoutClaudeCode();
    const r = await executeSetup({ project_root: root });
    expect(r.isError ?? false).toBe(false);
    expect(r.structuredContent?.changed).toBe(false);
    expect(existsSync(join(root, ".claude"))).toBe(false);
  });
});
