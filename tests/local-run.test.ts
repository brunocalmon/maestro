import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const target = () => {
  const bin = manifest().bin;
  return typeof bin === "string" ? bin : bin?.["maestro"];
};

describe("AC-008 — the package doesn't require a global install", () => {
  // TRACEABILITY: US-001 US-002 FR-001 AC-008
  it("resolves the binary via a project-relative path", () => {
    expect(target()).toBeDefined();
    expect(existsSync(resolve(ROOT, String(target())))).toBe(true);
  });

  // TRACEABILITY: US-001 FR-002 FR-005 NFR-003 AC-008
  it("responds when run via the local path, with no global install", () => {
    const out = execFileSync("node", [resolve(ROOT, String(target())), "--version"], {
      encoding: "utf8",
    });
    expect(out.trim().length).toBeGreaterThan(0);
  });

  // TRACEABILITY: US-002 NFR-003 AC-008
  it("resolves the npm subsystems from node_modules, not the global PATH", () => {
    for (const dep of ["context-mode"]) {
      expect(existsSync(resolve(ROOT, "node_modules", dep))).toBe(true);
    }
  });
});
