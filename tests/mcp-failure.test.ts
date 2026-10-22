import { describe, it, expect } from "vitest";
import { chmodSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { disposableProject } from "./mcp-fixtures";

/** Makes the root valid but unwritable, to exercise the real error path. */
function rootWithoutPermission(): string {
  const root = disposableProject("crs-ro-");
  chmodSync(join(root, ".claude"), 0o500);
  chmodSync(root, 0o500);
  return root;
}

describe("AC-009 — an error during configuration doesn't become success", () => {
  // TRACEABILITY: US-001 FR-006 AC-009
  it("returns an error", async () => {
    expect((await executeSetup({ project_root: rootWithoutPermission() })).isError).toBe(true);
  });

  // TRACEABILITY: US-003 FR-005 AC-009
  it("describes what prevented the operation", async () => {
    const r = await executeSetup({ project_root: rootWithoutPermission() });
    expect(JSON.stringify(r.content)).toMatch(/permission|EACCES/i);
  });

  // TRACEABILITY: US-001 FR-005 AC-009
  it("doesn't claim the configuration was completed", async () => {
    const r = await executeSetup({ project_root: rootWithoutPermission() });
    expect(JSON.stringify(r.content)).not.toMatch(/installed|configured successfully/i);
  });
});
