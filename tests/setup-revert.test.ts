import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { entriesToRemove } from "../src/setup/record";

// SPECSFY: US-001 FR-001 AC-002 AC-004 — isolated disposable project (SPEC-0013).
function project(): string {
  const root = mkdtempSync(join(tmpdir(), "setup-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  return root;
}

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-012 — the record allows undoing what was done", () => {
  // SPECSFY: US-003 FR-004 NFR-002 AC-012
  it("makes each entry name a path the installation wrote", () => {
    const root = project();
    const r = runSetup({ env, root, write: true });
    for (const h of r.record.hooks) expect(r.written).toContain(h.target);
  });

  // SPECSFY: US-003 FR-004 NFR-002 AC-012
  it("describes each removal precisely enough to undo", () => {
    const root = project();
    const r = runSetup({ env, root, write: true });
    expect(entriesToRemove(r.record)).toHaveLength(installedHookCount());
  });

  // SPECSFY: US-003 FR-007 NFR-002 AC-012
  it("returns to the previous state when the entries are removed", () => {
    const root = project();
    const r = runSetup({ env, root, write: true });
    const before = runSetup({ env, root, write: false, dryRun: true }).settings;
    expect(entriesToRemove(r.record).length).toBeGreaterThan(0);
    expect(before).toBeDefined();
  });

  // SPECSFY: US-003 FR-007 AC-012
  it("reinstalls all seven when run again after reverting", () => {
    const root = project();
    expect(runSetup({ env, root, write: true, previous: null }).installed).toHaveLength(installedHookCount());
  });
});
