import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const BUDGET_SECONDS = 300;

// Timings live inside .git, outside the versioned tree, for the same
// reason as Phase 0's run state: a run record isn't a source.
const timingsPath = () => {
  const gitDir = execFileSync("git", ["rev-parse", "--absolute-git-dir"], {
    encoding: "utf8",
  }).trim();
  return resolve(gitDir, "phase1a-timings.json");
};
const timings = (): Record<string, number> =>
  existsSync(timingsPath()) ? JSON.parse(readFileSync(timingsPath(), "utf8")) : {};

describe("AC-009 — install, build and tests fit the budget", () => {
  for (const step of ["install", "build", "test"]) {
    // TRACEABILITY: US-001 FR-002 FR-003 NFR-001 AC-009
    it(`records the ${step} step's time`, () => {
      expect(timings()[step]).toBeTypeOf("number");
    });
  }

  // TRACEABILITY: US-001 NFR-001 AC-009
  it("sums the three steps under five minutes", () => {
    const t = timings();
    const total = (t.install ?? 0) + (t.build ?? 0) + (t.test ?? 0);
    expect(Object.keys(t)).toHaveLength(3);
    expect(total).toBeLessThanOrEqual(BUDGET_SECONDS);
  });
});
