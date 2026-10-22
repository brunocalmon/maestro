import { describe, it, expect } from "vitest";
import { detectTarget } from "../src/hooks/detect";
import { runSetup } from "../src/setup/run";

const noEvidence = { hasClaudeCode: false, files: [] as string[] };
const withEvidence = { hasClaudeCode: true, files: [".claude/settings.json"] };

describe("AC-006 — with no target evidence, nothing is written", () => {
  // TRACEABILITY: US-001 FR-001 AC-006
  it("doesn't recognize a target when evidence is missing", () => {
    expect(detectTarget(noEvidence).found).toBe(false);
  });

  // TRACEABILITY: US-001 FR-001 NFR-001 AC-006
  it("writes no file at all and ends without error", () => {
    const r = runSetup({ env: noEvidence, write: false });
    expect(r.written).toEqual([]);
    expect(r.exitCode).toBe(0);
  });

  // TRACEABILITY: US-001 FR-001 AC-006
  it("names the ignored target and the missing evidence", () => {
    const r = runSetup({ env: noEvidence, write: false });
    expect(r.report).toMatch(/claude/i);
    expect(r.report).toMatch(/evid/i);
  });

  // TRACEABILITY: US-001 FR-008 AC-006
  it("doesn't create a local subsystem copy", () => {
    expect(runSetup({ env: noEvidence, write: false }).bridged).toBe(false);
  });

  // TRACEABILITY: US-001 FR-001 AC-006
  it("recognizes the target when the evidence exists", () => {
    expect(detectTarget(withEvidence).found).toBe(true);
  });
});

describe("AC-013 — an explicit target skips evidence entirely", () => {
  // A brand-new project can never satisfy AC-006's evidence requirement:
  // .claude/ is what setup would create, so it can't already exist there.
  // The explicit target is the only path that works on that project.
  // TRACEABILITY: US-001 FR-001 AC-013
  it("recognizes the target with no filesystem evidence at all", () => {
    const d = detectTarget(noEvidence, "claude-code");
    expect(d.found).toBe(true);
    expect(d.target).toBe("claude-code");
  });

  // TRACEABILITY: US-001 FR-001 AC-013
  it("names the flag as the reason, not evidence", () => {
    expect(detectTarget(noEvidence, "claude-code").reason).toMatch(/--target/);
  });

  // TRACEABILITY: US-001 FR-001 AC-013
  it("refuses an unknown target instead of guessing", () => {
    const d = detectTarget(noEvidence, "some-editor-nobody-made");
    expect(d.found).toBe(false);
    expect(d.reason).toMatch(/unknown target/);
  });

  // TRACEABILITY: US-001 FR-001 AC-013
  it("writes when the explicit target is passed to runSetup, evidence or not", () => {
    const r = runSetup({ env: noEvidence, write: false, target: "claude-code" });
    expect(r.exitCode).toBe(0);
    expect(r.planned.length).toBeGreaterThan(0);
  });
});
