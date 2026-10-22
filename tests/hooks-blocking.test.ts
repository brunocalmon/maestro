import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { readHook } from "../src/hooks/source";
import { translateForClaudeCode } from "../src/hooks/claude-code";

const CORPUS = resolve(__dirname, "../resources/hooks");

// Runs the real guard. Checking that the generated text contains the
// expected string doesn't prove blocking: that's how the v0.2.8 defect got through.
function runGuard(name: string, command: string): number {
  const hook = readHook(readFileSync(resolve(CORPUS, `${name}.md`), "utf8"));
  const dir = mkdtempSync(join(tmpdir(), "guard-"));
  const target = join(dir, "guard.sh");
  writeFileSync(target, translateForClaudeCode(hook).script);
  chmodSync(target, 0o755);
  try {
    execFileSync("bash", [target], { input: JSON.stringify({ command }), encoding: "utf8" });
    return 0;
  } catch (e: unknown) {
    return (e as { status?: number }).status ?? 1;
  }
}

describe("AC-002 — guards refuse what they should refuse", () => {
  // TRACEABILITY: US-002 FR-003 FR-006 AC-002
  it("refuses destructive removal without confirmation", () => {
    expect(runGuard("guard-destructive", "rm -rf /")).not.toBe(0);
  });

  // TRACEABILITY: US-002 FR-003 FR-006 AC-002
  it("refuses a command that would display a credential file", () => {
    expect(runGuard("guard-secrets", "cat .env")).not.toBe(0);
  });

  // TRACEABILITY: US-002 FR-006 AC-002
  it("observes the refusal by running the script, not by reading its text", () => {
    const code = runGuard("guard-destructive", "rm -rf /");
    expect(typeof code).toBe("number");
    expect(code).toBeGreaterThan(0);
  });
});
