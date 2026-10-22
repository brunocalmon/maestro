import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedSource, FIXED_INSTANT, EPOCH } from "./trace-fixtures";

const rec = () => {
  const root = project();
  runSetup({ env: detectEnvironment(root), root, write: true, trace: fixedSource() });
  return JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
};

describe("AC-042 — the stamp matches the moment of the run", () => {
  // TRACEABILITY: US-041 FR-042 AC-042
  it("the recorded instant is the injected clock's", () => {
    for (const h of rec()["hooks"]) expect(h.installedAt).toBe(FIXED_INSTANT);
  });

  // TRACEABILITY: US-041 FR-042 AC-042
  it("the recorded instant isn't the epoch", () => {
    for (const h of rec()["hooks"]) expect(h.installedAt).not.toBe(EPOCH);
  });

  // TRACEABILITY: US-041 FR-042 AC-042
  it("all entries carry the same instant", () => {
    const instants = new Set(rec()["hooks"].map((h: { installedAt: string }) => h.installedAt));
    expect(instants.size).toBe(1);
  });
});
