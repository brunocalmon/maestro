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

describe("AC-003 — ordinary work stays allowed", () => {
  // TRACEABILITY: US-002 FR-003 FR-006 AC-003
  it("allows editing a credential file, because editing isn't displaying", () => {
    expect(runGuard("guard-secrets", "vim .env")).toBe(0);
  });

  // TRACEABILITY: US-002 FR-003 FR-006 AC-003
  it("allows ordinary file removal inside the project", () => {
    expect(runGuard("guard-destructive", "rm dist/cli.js")).toBe(0);
  });

  // TRACEABILITY: US-002 FR-006 AC-003
  it("allows an ordinary command that merely mentions the protected path", () => {
    expect(runGuard("guard-secrets", "grep -l KEY .env.example")).toBe(0);
  });
});
