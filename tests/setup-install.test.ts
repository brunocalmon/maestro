import { describe, it, expect } from "vitest";
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";

// SPECSFY: US-001 FR-001 AC-002 AC-004 — isolated disposable project (SPEC-0013).
function project(): string {
  const root = mkdtempSync(join(tmpdir(), "setup-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  return root;
}

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };
const run = () => runSetup({ env, root: project(), write: true, dryRun: false });

describe("AC-001 — the four integration hooks end up installed", () => {
  // SPECSFY: US-001 FR-002 FR-005 AC-001
  it("writes the four subsystem integration entries", () => {
    const names = run().installed.map((h) => h.name);
    // SPEC-0022: context-mode hooks are projected from the package manifest (FR-006), named by target event and index.
    for (const n of ["context-mode-pretooluse-0", "context-mode-posttooluse-0", "context-mode-stop-0", "code-review-graph-update"]) {
      expect(names).toContain(n);
    }
  });

  // SPECSFY: US-001 FR-002 AC-001
  it("places each one under the event the hook declares", () => {
    for (const h of run().installed) expect(h.event).toMatch(/^(PreToolUse|PostToolUse|Stop|SessionStart|PreCompact|UserPromptSubmit)$/);
  });

  // SPECSFY: US-001 FR-004 AC-001
  it("creates the installation record inside the project", () => {
    expect(run().recordPath).toMatch(/^\.maestro\//);
  });

  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("writes nothing outside the project", () => {
    for (const p of run().written) expect(p.startsWith("/")).toBe(false);
  });
});
