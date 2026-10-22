import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = () => JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8"));

describe("AC-003 — the suite runs via the required script", () => {
  // TRACEABILITY: US-001 FR-003 AC-003
  it("exposes test:tdd, as the framework's enforcement requires in a Node project", () => {
    expect(manifest().scripts?.["test:tdd"]).toBeDefined();
  });

  // TRACEABILITY: US-001 FR-003 AC-003
  it("makes test:tdd invoke Vitest", () => {
    expect(manifest().scripts["test:tdd"]).toMatch(/\bvitest\b/);
  });

  // TRACEABILITY: US-001 FR-003 NFR-001 AC-003
  it("also exposes the build script, which the suite depends on", () => {
    expect(manifest().scripts?.build).toBeDefined();
  });
});
