import { describe, it, expect } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, decisionThatThrowsIfCalled } from "./aprovacao-fixtures";

describe("AC-074 — with no evidence of target use, nothing is decided", () => {
  const noTarget = () => mkdtempSync(join(tmpdir(), "crs-ap-no-target-"));

  // TRACEABILITY: US-062 FR-060 AC-074
  it("a source that would throw if called isn't triggered", () => {
    const root = noTarget();
    expect(() => runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: decisionThatThrowsIfCalled() } })).not.toThrow();
  });

  // TRACEABILITY: US-062 NFR-061 AC-074
  it("the report states the target was ignored", () => {
    const root = noTarget();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: decisionThatThrowsIfCalled() } });
    expect(r.report).toMatch(/ignored/i);
  });

  // TRACEABILITY: US-062 FR-060 AC-074
  it("control: the same source is actually consulted with a target present, proving the mechanism exists", () => {
    const withTarget = project();
    const r = runSetup({ env: detectEnvironment(withTarget), root: withTarget, write: true, approval: { source: decisionThatThrowsIfCalled() } });
    expect(r.exitCode).not.toBe(0);
  });

  // TRACEABILITY: US-062 FR-060 AC-074
  it("the exit code is zero", () => {
    const root = noTarget();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: decisionThatThrowsIfCalled() } });
    expect(r.exitCode).toBe(0);
  });
});
