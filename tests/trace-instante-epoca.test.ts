import { describe, it, expect } from "vitest";
import { readTrace } from "../src/telemetry/read";
import { project, writeRecord, oldRecord, fileTree, EPOCH } from "./trace-fixtures";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function withEpoch(): string {
  const root = project();
  writeRecord(root, oldRecord());
  return root;
}

describe("AC-048 — a record with the epoch stamp is accepted on read", () => {
  // TRACEABILITY: US-041 FR-045 AC-048
  it("the read happens without error", () => {
    expect(() => readTrace(withEpoch())).not.toThrow();
  });

  // TRACEABILITY: US-041 NFR-042 AC-048
  it("the entries stay as they were", () => {
    const root = withEpoch();
    readTrace(root);
    const rec = JSON.parse(readFileSync(join(root, ".maestro", "install.json"), "utf8"));
    expect(rec.hooks[0].installedAt).toBe(EPOCH);
  });

  // TRACEABILITY: US-041 NFR-042 AC-048
  it("the tree doesn't change", () => {
    const root = withEpoch();
    const before = fileTree(root);
    readTrace(root);
    expect(fileTree(root)).toEqual(before);
  });
});
