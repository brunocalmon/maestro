import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedSource } from "./trace-fixtures";

describe("AC-041 — whoever ran it can name the run", () => {
  const run = () => {
    const root = project();
    const r = runSetup({ env: detectEnvironment(root), root, write: true, trace: fixedSource() });
    const rec = JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
    return { report: r.report, recorded: rec["trace"] as string };
  };

  // TRACEABILITY: US-040 FR-041 AC-041
  it("the report contains the recorded identifier", () => {
    const { report, recorded } = run();
    expect(report).toContain(recorded);
  });

  // TRACEABILITY: US-040 FR-041 AC-041
  it("the report still describes the hooks", () => {
    expect(run().report).toMatch(/hooks/);
  });

  // TRACEABILITY: US-040 FR-041 AC-041
  it("the cited identifier is the same as the record's, not a literal", () => {
    const a = run(), b = run();
    expect(a.report).toContain(a.recorded);
    expect(b.report).toContain(b.recorded);
  });
});
