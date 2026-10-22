import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { fileTree, project, fixedDecision } from "./aprovacao-fixtures";

describe("AC-061 — a refusal prevents the write", () => {
  // TRACEABILITY: US-060 FR-060 NFR-060 AC-061
  it("no file is created or changed", () => {
    const root = project();
    const before = fileTree(root);
    runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(false) } });
    expect(fileTree(root)).toEqual(before);
  });

  // TRACEABILITY: US-060 FR-060 NFR-060 AC-061
  it("the report states that nothing was written for lack of approval", () => {
    const root = project();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(false) } });
    expect(r.report).toMatch(/refused/i);
  });

  // TRACEABILITY: US-060 NFR-060 AC-061
  it("the exit code reflects the absence of a run", () => {
    const root = project();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(false) } });
    expect(r.exitCode).not.toBe(0);
  });
});
