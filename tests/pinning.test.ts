import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Versions checked against the npm registry on 2026-09-15.
// `@promovaweb/specsfy` moved 0.22.2 → 0.23.0 on 2026-09-15, as part of a
// routine dependency sweep (vault-backed secret management landed upstream;
// no behavior this repo depends on changed).
const PINNED: Record<string, string> = {
  "@promovaweb/specsfy": "0.23.0",
  "context-mode": "1.0.169",
};

const deps = () =>
  JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8")).dependencies ?? {};

describe("AC-007 — pinned versions, no range", () => {
  for (const [name, version] of Object.entries(PINNED)) {
    // SPECSFY: US-001 FR-004 NFR-002 AC-007
    it(`pins ${name} at ${version}, exactly`, () => {
      expect(deps()[name]).toBe(version);
    });
  }

  // SPECSFY: US-001 FR-004 NFR-002 AC-007
  it("doesn't pin the pi agent, which belongs to the backends layer", () => {
    // The guard keeps pi's absence from being true only because no
    // dependency has been declared yet.
    expect(Object.keys(deps()).length).toBeGreaterThan(0);
    expect(deps()["@earendil-works/pi-coding-agent"]).toBeUndefined();
  });
});
