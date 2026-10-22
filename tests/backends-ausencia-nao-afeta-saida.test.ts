import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { sourceFake } from "./backends-fixtures";

const fullEnv = {
  resolveNpm: () => "1.0.0",
  resolveLocalPython: () => "1.0.0",
  resolveOnPath: () => "1.0.0",
};

describe("AC-081 — an absent supported backend doesn't affect the exit code", () => {
  // TRACEABILITY: US-030 FR-030 PR-032 NFR-031 AC-081
  it("no agent backend present still exits with code zero, when npm/python are complete", () => {
    const { env: backendEnv } = sourceFake({});
    const r = inspectDependencies(fullEnv, undefined, backendEnv);
    expect(r.exitCode).toBe(0);
  });

  // TRACEABILITY: US-030 FR-030 PR-032 NFR-031 AC-081
  it("the five supported ones appear named as absent", () => {
    const { env: backendEnv } = sourceFake({});
    const r = inspectDependencies(fullEnv, undefined, backendEnv);
    const agents = r.results.filter((d) => d.layer === "agent");
    expect(agents.length).toBeGreaterThan(0);
    expect(agents.every((d) => !d.present)).toBe(true);
  });
});
