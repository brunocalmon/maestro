import { describe, it, expect } from "vitest";
import { bridgePythonSubsystem } from "../src/setup/bridge";

const absent = { localVenv: null as string | null, onPath: null as string | null, hasUv: true };
const present = { localVenv: "2.3.7", onPath: null as string | null, hasUv: true };

describe("AC-008 — the bridge creates the local copy when it's missing", () => {
  // TRACEABILITY: US-001 FR-008 AC-008
  it("creates the copy inside the project, at the pinned version", () => {
    const r = bridgePythonSubsystem({ env: absent, execute: false });
    expect(r.wouldInstall).toBe("code-review-graph==2.3.7");
    expect(r.targetDir.startsWith("/")).toBe(false);
  });

  // TRACEABILITY: US-001 FR-008 NFR-001 AC-008
  it("doesn't write to the global environment", () => {
    expect(bridgePythonSubsystem({ env: absent, execute: false }).touchesGlobal).toBe(false);
  });

  // TRACEABILITY: US-001 FR-008 AC-008
  it("doesn't act when the local copy already exists", () => {
    expect(bridgePythonSubsystem({ env: present, execute: false }).wouldInstall).toBeNull();
  });

  // TRACEABILITY: US-001 FR-008 AC-008
  it("refuses, naming the tool, when uv is missing", () => {
    const r = bridgePythonSubsystem({ env: { ...absent, hasUv: false }, execute: false });
    expect(r.refused).toMatch(/uv/i);
  });
});
