import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("AC-060 — the plan reaches the decision-maker before any write", () => {
  // SPECSFY: US-060 FR-060 AC-060
  it("the source receives the plan before the command writes", () => {
    const root = project();
    const received: { name: string; target: string; event: string }[][] = [];
    runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true, received) } });
    expect(received.length).toBe(1);
  });

  // SPECSFY: US-060 FR-063 FR-065 AC-060
  it("the plan describes each hook with name, target and event", () => {
    const root = project();
    const received: { name: string; target: string; event: string }[][] = [];
    runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true, received) } });
    expect(received[0]?.length).toBe(installedHookCount());
    for (const item of received[0] ?? []) {
      expect(typeof item.name).toBe("string");
      expect(typeof item.target).toBe("string");
      expect(typeof item.event).toBe("string");
    }
  });

  // SPECSFY: US-060 FR-060 AC-060
  it("the source is consulted exactly once", () => {
    const root = project();
    const received: { name: string; target: string; event: string }[][] = [];
    runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true, received) } });
    expect(received.length).toBe(1);
  });
});
