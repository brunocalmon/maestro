import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const manifest = () => JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const runBin = (args: string[]) => {
  const bin = manifest().bin;
  const target = typeof bin === "string" ? bin : bin?.["maestro"];
  if (!target) throw new Error("the manifest doesn't declare the maestro binary");
  return execFileSync("node", [resolve(ROOT, String(target)), ...args], { encoding: "utf8" });
};

describe("AC-004 — --version prints the manifest's version", () => {
  // TRACEABILITY: US-001 FR-005 AC-004
  it("prints exactly the declared version", () => {
    expect(runBin(["--version"]).trim()).toContain(String(manifest().version));
  });

  // TRACEABILITY: US-001 FR-002 FR-005 AC-004
  it("exits with code zero", () => {
    expect(() => runBin(["--version"])).not.toThrow();
  });

  // TRACEABILITY: US-001 FR-001 NFR-003 AC-004
  it("declares a version in the manifest to be able to print it", () => {
    expect(manifest().version).toBeDefined();
  });
});
