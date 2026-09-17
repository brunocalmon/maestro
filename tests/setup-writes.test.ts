import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runSetup, TARGET_SETTINGS } from "../src/setup/run";
import { RECORD_PATH } from "../src/setup/record";
import { isMaestroEntry } from "../src/hooks/identity";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

/** Disposable project, so verification touches disk without touching the real one. */
function project(previousContent?: string): string {
  const root = mkdtempSync(join(tmpdir(), "setup-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  if (previousContent !== undefined) writeFileSync(resolve(root, TARGET_SETTINGS), previousContent);
  return root;
}

describe("AC-001 — installation actually writes to disk", () => {
  // SPECSFY: US-001 FR-002 FR-004 AC-001
  it("creates the target's configuration file", () => {
    const root = project();
    runSetup({ env, root, write: true });
    expect(existsSync(resolve(root, TARGET_SETTINGS))).toBe(true);
  });

  // SPECSFY: US-003 FR-004 AC-004
  it("creates the installation record", () => {
    const root = project();
    runSetup({ env, root, write: true });
    expect(existsSync(resolve(root, RECORD_PATH))).toBe(true);
  });

  // SPECSFY: US-001 FR-002 AC-001
  it("writes the seven hooks into the written file", () => {
    const root = project();
    runSetup({ env, root, write: true });
    // SPEC-0022: identity lives in the command (script path or dispatch marker), never in `matcher`.
    const written = JSON.parse(readFileSync(resolve(root, TARGET_SETTINGS), "utf8")) as {
      hooks: Record<string, { hooks: { command: string }[] }[]>;
    };
    const names = Object.values(written.hooks).flat().map((e) => isMaestroEntry(e)).filter((n) => n !== null);
    expect(names).toHaveLength(installedHookCount());
  });

  // SPECSFY: US-001 FR-002 NFR-002 AC-001
  it("preserves a third-party key already in the file", () => {
    const root = project(JSON.stringify({ permissions: { allow: ["Bash"] }, hooks: {} }));
    runSetup({ env, root, write: true });
    const written = JSON.parse(readFileSync(resolve(root, TARGET_SETTINGS), "utf8")) as {
      permissions?: unknown;
    };
    expect(written.permissions).toEqual({ allow: ["Bash"] });
  });

  // SPECSFY: US-003 FR-007 NFR-002 AC-007
  it("writes no file in dry-run mode", () => {
    const root = project();
    runSetup({ env, root, write: true, dryRun: true });
    expect(existsSync(resolve(root, TARGET_SETTINGS))).toBe(false);
    expect(existsSync(resolve(root, RECORD_PATH))).toBe(false);
  });
});
