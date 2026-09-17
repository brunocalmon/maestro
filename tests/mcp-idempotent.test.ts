import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { disposableProject } from "./mcp-fixtures";

describe("AC-007 — the second call recognizes the state", () => {
  // SPECSFY: US-003 FR-004 AC-007
  it("states it was already configured", async () => {
    const root = disposableProject();
    await executeSetup({ project_root: root });
    const second = await executeSetup({ project_root: root });
    expect(JSON.stringify(second.content)).toMatch(/already configured/i);
  });

  // SPECSFY: US-003 NFR-002 AC-007
  it("keeps the record with seven entries", async () => {
    const root = disposableProject();
    await executeSetup({ project_root: root });
    await executeSetup({ project_root: root });
    const rec = JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
    expect(rec.hooks).toHaveLength(installedHookCount());
  });

  // SPECSFY: US-003 FR-004 AC-007
  it("doesn't report the second call as a new installation", async () => {
    const root = disposableProject();
    await executeSetup({ project_root: root });
    const second = await executeSetup({ project_root: root });
    expect(second.structuredContent?.changed).toBe(false);
  });
});
