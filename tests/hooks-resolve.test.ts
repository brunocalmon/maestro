import { describe, it, expect } from "vitest";
import { resolveHookCommand } from "../src/hooks/resolve";

describe("AC-014 — a hook's command resolves to an absolute path when one is known", () => {
  // TRACEABILITY: US-001 FR-001 AC-014
  it("replaces the leading command when a resolution is given", () => {
    const script = "context-mode hook claude-code pretooluse";
    const resolved = resolveHookCommand(script, { "context-mode": "/opt/maestro/node_modules/.bin/context-mode" });
    expect(resolved).toBe("'/opt/maestro/node_modules/.bin/context-mode' hook claude-code pretooluse");
  });

  // TRACEABILITY: US-001 FR-001 AC-014
  it("leaves the script untouched when nothing resolves for its command", () => {
    const script = "code-review-graph update --brief";
    expect(resolveHookCommand(script, { "context-mode": "/opt/x/context-mode" })).toBe(script);
  });

  // TRACEABILITY: US-001 FR-001 AC-014
  it("leaves the script untouched when the resolution maps to null", () => {
    const script = "code-review-graph update --brief";
    expect(resolveHookCommand(script, { "code-review-graph": null })).toBe(script);
  });

  // TRACEABILITY: US-001 FR-001 NFR-001 AC-014
  it("quotes a resolved path containing a single quote safely", () => {
    const script = "context-mode hook claude-code pretooluse";
    const resolved = resolveHookCommand(script, { "context-mode": "/opt/o'brien/context-mode" });
    expect(resolved).toBe("'/opt/o'\\''brien/context-mode' hook claude-code pretooluse");
  });

  // TRACEABILITY: US-001 FR-001 AC-014
  it("leaves a multi-line script (a real fragment, not a dispatch one-liner) untouched", () => {
    const script = "#!/usr/bin/env bash\necho hi\n";
    expect(resolveHookCommand(script, { "context-mode": "/opt/x/context-mode" })).toBe(script);
  });
});
