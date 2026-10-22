import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("AC-071 — the decision comes from wherever the case says", () => {
  // TRACEABILITY: US-062 FR-065 NFR-061 AC-071
  it("two runs with always-approving sources write, on distinct projects", () => {
    const rootA = project("crs-ap-a-");
    const rootB = project("crs-ap-b-");
    const a = runSetup({ env: detectEnvironment(rootA), root: rootA, write: true, approval: { source: fixedDecision(true) } });
    const b = runSetup({ env: detectEnvironment(rootB), root: rootB, write: true, approval: { source: fixedDecision(true) } });
    expect(a.exitCode).toBe(0);
    expect(b.exitCode).toBe(0);
  });

  // TRACEABILITY: US-062 NFR-061 AC-071
  it("each call uses the source it was given, not a shared global", () => {
    const rootA = project("crs-ap-a2-");
    const rootB = project("crs-ap-b2-");
    const ra = runSetup({ env: detectEnvironment(rootA), root: rootA, write: true, approval: { source: fixedDecision(true) } });
    const rb = runSetup({ env: detectEnvironment(rootB), root: rootB, write: true, approval: { source: fixedDecision(false) } });
    expect(ra.exitCode).toBe(0);
    expect(rb.exitCode).not.toBe(0);
  });

  // TRACEABILITY: US-062 FR-065 AC-071
  it("the injected source is what decides, and is actually consulted", () => {
    const rootA = project("crs-ap-a3-");
    const received: { name: string }[][] = [];
    runSetup({ env: detectEnvironment(rootA), root: rootA, write: true, approval: { source: fixedDecision(true, received) } });
    expect(received.length).toBe(1);
  });
});
