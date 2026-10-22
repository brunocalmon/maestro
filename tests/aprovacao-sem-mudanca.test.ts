import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision, decisionThatThrowsIfCalled } from "./aprovacao-fixtures";

describe("AC-073 — an already configured project doesn't ask for approval", () => {
  const alreadyConfigured = () => {
    const root = project();
    runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true) } });
    const record = JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
    return { root, record };
  };

  // TRACEABILITY: US-062 FR-060 AC-073
  it("a source that would throw if called isn't triggered on rerun", () => {
    const { root, record } = alreadyConfigured();
    expect(() => runSetup({
      env: detectEnvironment(root), root, write: true,
      previous: record, approval: { source: decisionThatThrowsIfCalled() },
    })).not.toThrow();
  });

  // TRACEABILITY: US-062 FR-063 AC-073
  it("the report states it was already configured", () => {
    const { root, record } = alreadyConfigured();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, previous: record, approval: { source: decisionThatThrowsIfCalled() } });
    expect(r.report).toMatch(/already configured/i);
  });

  // TRACEABILITY: US-062 FR-060 AC-073
  it("control: the same source is actually consulted on a first run, proving the mechanism exists", () => {
    const root = project();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: decisionThatThrowsIfCalled() } });
    expect(r.exitCode).not.toBe(0);
  });

  // TRACEABILITY: US-062 FR-060 AC-073
  it("the exit code stays a success one", () => {
    const { root, record } = alreadyConfigured();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, previous: record, approval: { source: decisionThatThrowsIfCalled() } });
    expect(r.exitCode).toBe(0);
  });
});
