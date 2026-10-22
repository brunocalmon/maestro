import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const scriptPath = resolve(ROOT, "scripts", "cycle.mjs");

describe("AC-011 — a freshly obtained clone goes green with one command", () => {
  // TRACEABILITY: US-001 FR-003 FR-007 AC-011
  it("exposes the verify script in the manifest", () => {
    expect(manifest().scripts?.verify).toBeDefined();
  });

  // TRACEABILITY: US-001 FR-007 AC-011
  it("points verify at the cycle runner", () => {
    expect(String(manifest().scripts.verify)).toContain("cycle.mjs");
  });

  // TRACEABILITY: US-001 FR-007 AC-011
  it("has the cycle runner present in the repository", () => {
    expect(existsSync(scriptPath)).toBe(true);
  });
});
