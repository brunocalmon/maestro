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
  it("second call still reports the write pass (SPEC-0025, FR-004)", async () => {
    // Idempotency used to mean "the second call writes nothing", enforced by
    // skipping the skills/Specsfy installers whenever their directories
    // already existed. SPEC-0025 removed that shortcut on purpose: a
    // directory existing isn't proof the installer has nothing left to
    // reconcile, and by the time you'd know, you'd already have
    // reinstalled to find out. The installers now run every call where
    // they're configured — idempotent by their own construction, and
    // `changed` now reflects that a reconciliation pass happened, not that
    // content differed. What "the second call recognizes the state" still
    // means is covered for real by SPEC-0025's own suite (no renewed
    // approval prompt, hooks unchanged): AC-006/AC-007 in
    // tests/setup-installers-always.test.ts.
    const root = disposableProject();
    await executeSetup({ project_root: root });
    const second = await executeSetup({ project_root: root });
    expect(second.structuredContent?.changed).toBe(true);
  });
});
