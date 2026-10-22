import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { project, writeRecord, oldRecord, FIXED_ID } from "./trace-fixtures";
import { noBackends } from "./backends-fixtures";

const env = { resolveNpm: () => "1.0.0", resolveLocalPython: () => "2.3.7", resolveOnPath: () => null };
const noExtensions = () => [];

function report(root: string) {
  return inspectDependencies(env, root, noBackends, noExtensions);
}

describe("AC-046 — the identifier appears in the diagnosis", () => {
  const withTrace = () => {
    const root = project();
    writeRecord(root, { ...oldRecord(), trace: FIXED_ID });
    return root;
  };

  // TRACEABILITY: US-040 FR-044 AC-046
  it("the report names the recorded identifier", () => {
    expect(report(withTrace()).trace?.kind).toBe("identified");
  });

  // TRACEABILITY: US-040 FR-041 AC-046
  it("the named value is the one from the record", () => {
    const t = report(withTrace()).trace;
    expect(t?.kind === "identified" ? t.trace : null).toBe(FIXED_ID);
  });

  // TRACEABILITY: US-040 FR-044 AC-046
  it("the dependency report remains", () => {
    expect(report(withTrace()).results.length).toBeGreaterThan(0);
  });
});
