import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { readTrace } from "../src/telemetry/read";
import { project } from "./trace-fixtures";
import { noBackends } from "./backends-fixtures";

const env = { resolveNpm: () => "1.0.0", resolveLocalPython: () => "2.3.7", resolveOnPath: () => null };
const noExtensions = () => [];

describe("AC-053 — doctor doesn't fabricate an identifier", () => {
  // TRACEABILITY: US-040 FR-044 AC-053
  it("with no record, the read reports absence", () => {
    expect(readTrace(project()).kind).toBe("absent");
  });

  // TRACEABILITY: US-040 FR-045 AC-053
  it("the report doesn't name any identifier", () => {
    const t = inspectDependencies(env, project(), noBackends, noExtensions).trace;
    expect(t?.kind).toBe("absent");
    expect(t && "trace" in t).toBe(false);
  });

  // TRACEABILITY: US-040 FR-044 FR-045 AC-053
  it("the dependency diagnosis keeps happening", () => {
    expect(inspectDependencies(env, project(), noBackends, noExtensions).results.length).toBeGreaterThan(0);
  });
});
