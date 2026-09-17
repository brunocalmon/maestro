import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { translateForClaudeCode } from "../src/hooks/claude-code";
import { readHook } from "../src/hooks/source";

const CORPUS = resolve(__dirname, "../resources/hooks");
const hook = (n: string) => readHook(readFileSync(resolve(CORPUS, `${n}.md`), "utf8"));

describe("AC-009 — translation preserves blocking semantics", () => {
  // SPECSFY: US-002 FR-002 FR-003 FR-006 AC-009
  it("makes a hook declared blocking produce an entry that interrupts", () => {
    for (const n of ["guard-destructive", "guard-secrets", "protect-authorship"]) {
      expect(translateForClaudeCode(hook(n)).blocking).toBe(true);
    }
  });

  // SPECSFY: US-002 FR-002 FR-006 AC-009
  it("makes a non-blocking hook produce an entry that only observes", () => {
    for (const n of ["code-review-graph-update"]) {
      expect(translateForClaudeCode(hook(n)).blocking).toBe(false);
    }
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-009
  it("maps each canonical event to the name the target uses", () => {
    expect(translateForClaudeCode(hook("guard-secrets")).event).toBe("PreToolUse");
    expect(translateForClaudeCode(hook("code-review-graph-update")).event).toBe("PostToolUse");
    // SPEC-0022: the context-mode Markdown hooks were removed (FR-006); Stop is exercised by a synthetic hook.
    expect(translateForClaudeCode({ name: "stop-probe", description: "", event: "stop", blocking: false, script: "echo x", kind: "dispatch" }).event).toBe("Stop");
  });
});
