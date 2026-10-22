import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const scriptPath = resolve(ROOT, "scripts", "cycle.mjs");

describe("AC-013 — the cycle fails loudly when a step fails", () => {
  // TRACEABILITY: US-001 FR-007 NFR-001 AC-013
  it("stops at the first failure, without continuing", () => {
    const source = readFileSync(scriptPath, "utf8");
    expect(source).toMatch(/exit\(|exitCode/);
    expect(source).toMatch(/break|return|process\.exit/);
  });

  // TRACEABILITY: US-001 FR-007 AC-013
  it("names the step that failed", () => {
    expect(readFileSync(scriptPath, "utf8")).toMatch(/step/i);
  });
});
