import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, EPOCH } from "./trace-fixtures";

function entries(): { installedAt: string }[] {
  const root = project();
  runSetup({ env: detectEnvironment(root), root, write: true });
  return JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"))["hooks"];
}

describe("AC-052 — the epoch is no longer the recorded value", () => {
  // TRACEABILITY: US-041 FR-042 AC-052
  it("no entry carries the epoch instant", () => {
    for (const h of entries()) expect(h.installedAt).not.toBe(EPOCH);
  });

  // TRACEABILITY: US-041 NFR-042 AC-052
  it("no entry carries an instant before the year 2000", () => {
    for (const h of entries()) expect(Date.parse(h.installedAt)).toBeGreaterThan(Date.parse("2000-01-01T00:00:00.000Z"));
  });

  // TRACEABILITY: US-041 FR-042 AC-052
  it("the instant is text in ISO form", () => {
    for (const h of entries()) expect(h.installedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
