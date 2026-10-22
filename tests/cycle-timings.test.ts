import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const scriptPath = resolve(ROOT, "scripts", "cycle.mjs");
const gitDir = () =>
  execFileSync("git", ["rev-parse", "--absolute-git-dir"], { encoding: "utf8" }).trim();

describe("AC-012 — the cycle records the three steps", () => {
  // TRACEABILITY: US-001 FR-007 NFR-001 AC-012
  it("measures install, build and the suite separately", () => {
    const source = readFileSync(scriptPath, "utf8");
    for (const step of ["install", "build", "test"]) expect(source).toContain(step);
  });

  // TRACEABILITY: US-001 FR-007 NFR-001 AC-012
  it("writes the timings outside the versioned tree", () => {
    const source = readFileSync(scriptPath, "utf8");
    expect(source).toMatch(/absolute-git-dir|phase1a-timings/);
    expect(existsSync(resolve(ROOT, "phase1a-timings.json"))).toBe(false);
  });

  // TRACEABILITY: US-001 FR-007 NFR-001 AC-012
  it("records the three measurements once the cycle has run", () => {
    const record = resolve(gitDir(), "phase1a-timings.json");
    expect(existsSync(record)).toBe(true);
    expect(Object.keys(JSON.parse(readFileSync(record, "utf8"))).sort()).toEqual([
      "build",
      "install",
      "test",
    ]);
  });
});
