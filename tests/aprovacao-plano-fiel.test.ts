import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("AC-070 — nothing is written beyond what the plan foresaw", () => {
  const run = () => {
    const root = project();
    const received: { name: string }[][] = [];
    const r = runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true, received) } });
    return { plan: received[0] ?? [], installed: r.installed };
  };

  // TRACEABILITY: US-060 NFR-062 AC-070
  it("every written file matches a plan item", () => {
    const { plan, installed } = run();
    const planNames = new Set(plan.map((p) => p.name));
    for (const h of installed) expect(planNames.has(h.name)).toBe(true);
  });

  // TRACEABILITY: US-060 NFR-062 AC-070
  it("no plan item was left unwritten", () => {
    const { plan, installed } = run();
    const installedNames = new Set(installed.map((h) => h.name));
    for (const p of plan) expect(installedNames.has(p.name)).toBe(true);
  });

  // TRACEABILITY: US-060 NFR-062 AC-070
  it("the counts match exactly", () => {
    const { plan, installed } = run();
    expect(installed.length).toBe(plan.length);
  });
});
