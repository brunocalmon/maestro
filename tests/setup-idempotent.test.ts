import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";

// SPECSFY: US-001 FR-001 AC-002 AC-004 — isolated disposable project, so this
// suite never writes into the real repository it runs from (SPEC-0013).
function project(): string {
  const root = mkdtempSync(join(tmpdir(), "setup-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  return root;
}

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-005 — rerunning doesn't duplicate", () => {
  // SPECSFY: US-003 FR-007 NFR-002 AC-005
  it("leaves the target's configuration identical on the second run", () => {
    const root = project();
    const one = runSetup({ env, root, write: true });
    const two = runSetup({ env, root, write: true, previous: one.record });
    expect(two.settings).toEqual(one.settings);
  });

  // SPECSFY: US-003 FR-007 AC-005
  it("reports it was already configured", () => {
    const root = project();
    const one = runSetup({ env, root, write: true });
    expect(runSetup({ env, root, write: true, previous: one.record }).report).toMatch(/already|unchanged/i);
  });

  // SPECSFY: US-003 FR-005 NFR-002 AC-005
  it("doesn't add a duplicate entry to the record", () => {
    const root = project();
    const one = runSetup({ env, root, write: true });
    const two = runSetup({ env, root, write: true, previous: one.record });
    expect(two.record.hooks).toHaveLength(installedHookCount());
  });

  // SPECSFY: US-003 FR-008 AC-005
  it("doesn't recreate the local copy that already exists", () => {
    const root = project();
    const one = runSetup({ env, root, write: true });
    expect(runSetup({ env, root, write: true, previous: one.record }).bridged).toBe(false);
  });
});
