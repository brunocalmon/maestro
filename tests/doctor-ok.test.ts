import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { noBackends } from "./backends-fixtures";

// Injected environment: the result must depend on what's passed in, not on the machine.
const full = {
  resolveNpm: (name: string) =>
    ({ "context-mode": "1.0.169" })[name] ?? null,
  resolveLocalPython: () => "2.3.7",
  resolveOnPath: () => "2.3.7",
};

describe("AC-005 — doctor approves a complete environment", () => {
  // TRACEABILITY: US-002 FR-006 AC-005
  it("lists the project's two dependencies", () => {
    const dependencies = inspectDependencies(full, undefined, noBackends).results.filter((r) => r.layer !== "agent");
    expect(dependencies).toHaveLength(2);
  });

  // TRACEABILITY: US-002 FR-006 NFR-002 AC-005
  it("reports layer, resolved origin and version for each one", () => {
    const dependencies = inspectDependencies(full, undefined, noBackends).results.filter((r) => r.layer !== "agent");
    for (const r of dependencies) {
      expect(r.layer).toBeDefined();
      expect(r.origin).toMatch(/^(local|global)$/);
      expect(r.version).toBeTruthy();
    }
  });

  // TRACEABILITY: US-002 FR-006 NFR-003 AC-005
  it("prefers the local origin when it exists", () => {
    const crg = inspectDependencies(full, undefined, noBackends).results.find((r) => r.name === "code-review-graph");
    expect(crg?.origin).toBe("local");
  });

  // TRACEABILITY: US-002 FR-006 AC-005
  it("approves the environment, with a zero exit code", () => {
    expect(inspectDependencies(full, undefined, noBackends).exitCode).toBe(0);
  });
});
