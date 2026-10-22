import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { renderReport } from "../src/cli";
import { sourceFake } from "./backends-fixtures";

const fullEnv = {
  resolveNpm: () => "1.0.0",
  resolveLocalPython: () => "1.0.0",
  resolveOnPath: () => "1.0.0",
};

describe("AC-089 — the agent layer appears in the report text", () => {
  // TRACEABILITY: FR-031 NFR-030 NFR-031 AC-089
  it("the text names the agent layer, distinct from npm and python, without affecting the exit code", () => {
    const { env: backendEnv } = sourceFake({ pi: "0.84.3" });
    const report = inspectDependencies(fullEnv, undefined, backendEnv);
    const text = renderReport(report);

    expect(text).toMatch(/layer agent/);
    expect(text).toMatch(/layer npm/);
    expect(text).toMatch(/layer python/);
    expect(report.exitCode).toBe(0);
  });

  // TRACEABILITY: FR-031 NFR-030 NFR-031 AC-089
  it("a present, unsupported backend appears marked as such in the text", () => {
    const { env: backendEnv } = sourceFake({ dsh: "0.1.1-rc.1" });
    const report = inspectDependencies(fullEnv, undefined, backendEnv);
    const text = renderReport(report);
    expect(text).toMatch(/dsh.*not supported/);
  });
});
