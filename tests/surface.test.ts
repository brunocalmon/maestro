import { describe, it, expect } from "vitest";
import { COMMANDS } from "../src/cli";

// Commands from fatias 1c through 1f. `setup` left this list once fatia 1b
// delivered it: the durable property is that the skeleton doesn't smuggle
// in orchestration, not that the product never grows.
const FORBIDDEN = ["orchestrate", "approve", "model", "agent", "serve", "mcp"];

describe("AC-010 — the skeleton doesn't deliver product capability", () => {
  // TRACEABILITY: US-001 US-002 FR-005 FR-006 AC-010
  it("offers the two commands this fatia delivered", () => {
    for (const c of ["doctor", "version"]) expect(Object.keys(COMMANDS)).toContain(c);
  });

  // TRACEABILITY: US-001 FR-005 AC-010
  it("offers no command from the following fatias", () => {
    const leaked = Object.keys(COMMANDS).filter((c) => FORBIDDEN.includes(c));
    expect(leaked).toEqual([]);
  });

  // TRACEABILITY: US-002 FR-006 AC-010
  it("keeps doctor as the sole verification surface", () => {
    expect(COMMANDS.doctor).toBeTypeOf("function");
  });
});
