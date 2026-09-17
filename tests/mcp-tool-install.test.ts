import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { disposableProject } from "./mcp-fixtures";

describe("AC-004 — with a valid root the tool installs and reports", () => {
  // SPECSFY: US-001 FR-005 AC-004
  it("lists the seven hooks with their events", async () => {
    const r = await executeSetup({ project_root: disposableProject() });
    expect(r.isError ?? false).toBe(false);
    expect(r.structuredContent?.hooks).toHaveLength(installedHookCount());
    for (const h of r.structuredContent!.hooks) expect(h.event).toMatch(/^(PreToolUse|PostToolUse|Stop|SessionStart|PreCompact|UserPromptSubmit)$/);
  });

  // SPECSFY: US-001 FR-004 AC-004
  it("creates the target's configuration file inside the given root", async () => {
    const root = disposableProject();
    await executeSetup({ project_root: root });
    expect(existsSync(join(root, ".claude", "settings.json"))).toBe(true);
  });

  // SPECSFY: US-001 FR-004 AC-004
  it("creates the installation record inside the given root", async () => {
    const root = disposableProject();
    await executeSetup({ project_root: root });
    expect(existsSync(join(root, ".maestro", "install.json"))).toBe(true);
  });
});
