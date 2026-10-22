import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const manifest = () => JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8"));
const NPM_SUBSYSTEMS = ["context-mode"];

describe("AC-001 — a clean install completes", () => {
  // TRACEABILITY: US-001 FR-001 AC-001
  it("declares the product package's name", () => {
    expect(manifest().name).toBe("@brunocalmon/maestro");
  });

  // TRACEABILITY: US-001 FR-004 AC-001
  it("declares the two npm subsystem dependencies at an exact version", () => {
    const deps = manifest().dependencies ?? {};
    // FR-004 requires the two subsystems to be declared and pinned, not
    // that they're the only dependencies. Comparing by set equality
    // pinned a snapshot of the delivery and forbade any future library —
    // which is exactly what happened when the protocol SDK entered fatia 1f.
    for (const name of NPM_SUBSYSTEMS) {
      expect(Object.keys(deps)).toContain(name);
      expect(String(deps[name])).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  // TRACEABILITY: US-001 FR-004 NFR-002 AC-001
  it("declares no dependency with a version range", () => {
    const prod = manifest().dependencies ?? {};
    // Without this guard the next assertion would be trivially true over
    // an empty set, and would pass before what it's meant to protect existed.
    expect(Object.keys(prod).length).toBeGreaterThan(0);
    const all = { ...prod, ...(manifest().devDependencies ?? {}) };
    const ranged = Object.entries(all).filter(([, v]) => /^[\^~><*]|\s-\s|\|\|/.test(String(v)));
    expect(ranged).toEqual([]);
  });

  // TRACEABILITY: US-001 FR-003 AC-001
  it("brings the test runner installable via a clean install", () => {
    expect(manifest().devDependencies?.vitest).toBeDefined();
  });
});
