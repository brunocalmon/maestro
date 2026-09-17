import { describe, it, expect } from "vitest";
import { translateForClaudeCode, unwrap } from "../src/hooks/claude-code";
import type { Hook } from "../src/hooks/source";

// Deliberately hostile script: single and double quotes, backslashes,
// dollar signs and command substitution. This is where v0.2.8 failed.
const HOSTILE = `#!/usr/bin/env bash\nif [[ "$1" == *'rm -rf'* ]]; then\n  printf '%s\\n' "blocked: \\$1 contains \\"rm -rf\\""\n  exit 2\nfi\nexit 0\n`;
const hook: Hook = {
  name: "probe", description: "probe", event: "before-shell", blocking: true, script: HOSTILE, kind: "script",
};

// SPEC-0022: the script body no longer travels inside settings.json; it is
// written to .maestro/hooks/<name>.sh and its content is recorded, as JSON,
// in .maestro/extensions.json. That JSON boundary is the one to round-trip.
const serialized = (): string => (JSON.parse(JSON.stringify(translateForClaudeCode(hook))) as { scriptBody: string }).scriptBody;

describe("AC-010 — escaping survives the round trip", () => {
  // SPECSFY: US-002 FR-002 NFR-003 AC-010
  it("recovers the script identical to the original, byte for byte", () => {
    expect(unwrap(serialized())).toBe(HOSTILE);
  });

  // SPECSFY: US-002 FR-002 NFR-003 AC-010
  it("gains no backslash and loses none", () => {
    const recovered = unwrap(serialized());
    const count = (s: string) => (s.match(/\\/g) ?? []).length;
    expect(count(recovered)).toBe(count(HOSTILE));
  });

  // SPECSFY: US-002 FR-006 NFR-003 AC-010
  it("keeps the recovered guard refusing what the source refused", () => {
    const full = serialized();
    expect(full).toContain("HOOK_COMMAND=");
    expect(unwrap(full)).toBe(HOSTILE);
  });
});
