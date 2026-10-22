import { describe, it, expect } from "vitest";
import { inspectDependencies } from "../src/doctor";
import { project, writeRecord, oldRecord, fileTree } from "./trace-fixtures";
import { noBackends } from "./backends-fixtures";

const env = { resolveNpm: () => "1.0.0", resolveLocalPython: () => "2.3.7", resolveOnPath: () => null };
const noExtensions = () => [];

function withoutTrace(): string {
  const root = project();
  writeRecord(root, oldRecord());
  return root;
}

describe("AC-047 — a record written before this fatia is read", () => {
  // TRACEABILITY: US-041 FR-045 AC-047
  it("the read happens without error", () => {
    expect(() => inspectDependencies(env, withoutTrace(), noBackends, noExtensions)).not.toThrow();
  });

  // TRACEABILITY: US-041 FR-044 AC-047
  it("the report states the run wasn't identified", () => {
    expect(inspectDependencies(env, withoutTrace(), noBackends, noExtensions).trace?.kind).toBe("unidentified");
  });

  // TRACEABILITY: US-041 NFR-042 AC-047
  it("nothing on disk is changed by the read", () => {
    const root = withoutTrace();
    const before = fileTree(root);
    inspectDependencies(env, root, noBackends, noExtensions);
    expect(fileTree(root)).toEqual(before);
  });
});
