import { describe, it, expect } from "vitest";
import { COMMANDS } from "../src/cli";

const FORBIDDEN = ["mcp", "serve", "approve", "agent", "model", "orchestrate"];

describe("AC-011 — this fatia doesn't deliver another one's capability", () => {
  // TRACEABILITY: US-001 US-003 FR-001 AC-011
  it("offers version identification, verification and configuration", () => {
    // The list grows as later slices land — `plan` arrived with SPEC-0016.
    // What this still guards is the case below: no command from a slice that
    // hasn't been delivered yet shows up here by accident.
    expect(Object.keys(COMMANDS).sort()).toEqual(["doctor", "extension", "plan", "recommend", "report", "run", "setup", "version"]);
  });

  // TRACEABILITY: US-001 FR-005 AC-011
  it("offers no surface from the following fatias", () => {
    expect(Object.keys(COMMANDS).filter((c) => FORBIDDEN.includes(c))).toEqual([]);
  });

  // TRACEABILITY: US-003 FR-001 AC-011
  it("exposes configuration as a dispatchable function", () => {
    expect(COMMANDS.setup).toBeTypeOf("function");
  });
});
