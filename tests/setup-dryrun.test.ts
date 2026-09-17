import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";

// SPECSFY: US-001 FR-001 AC-002 AC-004 — isolated disposable project (SPEC-0013).
// A dry run never writes regardless of root (runSetup returns before any
// disk write), so this file was never observed to pollute the real repo —
// found running it as-is before this edit, git status stayed clean. Fixed
// anyway: FR-001 requires root on every write:true call unconditionally,
// and it keeps this file from becoming a real defect the moment dryRun's
// own early return ever changes.
function project(): string {
  const root = mkdtempSync(join(tmpdir(), "setup-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  return root;
}

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };
const dryRun = () => runSetup({ env, root: project(), write: true, dryRun: true });

describe("AC-007 — a dry run doesn't write", () => {
  // SPECSFY: US-003 FR-005 FR-007 AC-007
  it("lists the seven hooks that would be installed and their targets", () => {
    expect(dryRun().planned).toHaveLength(installedHookCount());
    for (const h of dryRun().planned) expect(h.target).toBeTruthy();
  });

  // SPECSFY: US-003 FR-007 NFR-002 AC-007
  it("creates or changes no file at all", () => {
    expect(dryRun().written).toEqual([]);
  });

  // SPECSFY: US-003 FR-004 NFR-002 AC-007
  it("doesn't write the record", () => {
    expect(dryRun().record).toBeNull();
  });
});
