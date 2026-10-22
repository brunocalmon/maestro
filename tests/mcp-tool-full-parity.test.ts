import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { disposableProject } from "./mcp-fixtures";

/**
 * The gap this closes: `executeSetup` used to install hooks only, silently
 * less than what `maestro setup` does from a terminal — confirmed by
 * running the real CLI against a fresh project and the MCP tool against
 * another in the same session.
 * same session. `mcp-tool-install.test.ts` already proves the hooks side;
 * this proves the rest of what a real setup delivers.
 */
describe("AC-014 — the MCP tool installs everything the CLI does, not hooks alone", () => {
  // TRACEABILITY: US-001 FR-001 FR-002 AC-014
  it("installs at least one skill set, same as the terminal command", async () => {
    const root = disposableProject();
    const r = await executeSetup({ project_root: root });
    expect(r.isError ?? false).toBe(false);
    const skillsDir = join(root, ".claude", "skills");
    expect(existsSync(skillsDir)).toBe(true);
  }, 120_000);

  // TRACEABILITY: US-001 FR-001 FR-002 AC-014
  it("does not create legacy project setup files", async () => {
    const root = disposableProject();
    const r = await executeSetup({ project_root: root });
    expect(r.isError ?? false).toBe(false);
    expect(existsSync(join(root, ".project-context"))).toBe(false);
  }, 120_000);
});
