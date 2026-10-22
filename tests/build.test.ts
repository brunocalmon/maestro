import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const binTarget = () => {
  const bin = manifest().bin;
  return typeof bin === "string" ? bin : bin?.["maestro"];
};

describe("AC-002 — build produces an executable", () => {
  // TRACEABILITY: US-001 FR-001 AC-002
  it("declares the maestro binary in the manifest", () => {
    expect(binTarget()).toBeDefined();
  });

  // TRACEABILITY: US-001 FR-002 AC-002
  it("generates in dist/ the file the bin field declares", () => {
    const target = binTarget();
    expect(target).toBeDefined();
    expect(existsSync(resolve(ROOT, String(target)))).toBe(true);
  });

  // TRACEABILITY: US-001 FR-002 NFR-001 AC-002
  it("points the binary into dist/, not at the source code", () => {
    expect(String(binTarget())).toMatch(/^\.?\/?dist\//);
  });

  // TRACEABILITY: US-001 FR-002 AC-002
  it("produces a non-empty file", () => {
    const target = binTarget();
    expect(target).toBeDefined();
    expect(statSync(resolve(ROOT, String(target))).size).toBeGreaterThan(0);
  });
});
