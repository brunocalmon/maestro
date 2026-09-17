import { describe, it, expect } from "vitest";
import { installedHookCount } from "./helpers-spec-0022";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("AC-062 — what gets written is what was presented", () => {
  // SPECSFY: US-060 FR-060 AC-062
  it("the source is actually consulted before the write happens", () => {
    const root = project();
    const received: { name: string }[][] = [];
    runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true, received) } });
    expect(received.length).toBe(1);
  });

  // SPECSFY: US-060 FR-060 AC-062
  it("the written hooks match the presented plan's", () => {
    const root = project();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true) } });
    expect(r.installed.length).toBe(installedHookCount());
  });

  // SPECSFY: US-060 NFR-062 AC-062
  it("the installation record exists", () => {
    const root = project();
    runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true) } });
    expect(existsSync(join(root, ".maestro", "install.json"))).toBe(true);
  });

  // SPECSFY: US-060 FR-060 AC-062
  it("the exit code reflects success", () => {
    const root = project();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true) } });
    expect(r.exitCode).toBe(0);
  });
});
