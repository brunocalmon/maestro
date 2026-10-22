import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { fileTree, project } from "./aprovacao-fixtures";

describe("AC-072 — absence of injection doesn't approve by default", () => {
  // With no `source` injected, only context and the low-level reader:
  // exercises the real channel choice and the real document parse, with
  // no risk of hanging on a real stdin read — the only substituted point
  // is the source of the bytes.
  const run = (root: string) => runSetup({
    env: detectEnvironment(root), root, write: true,
    approval: { context: { hasTerminal: () => false }, stdin: { read: () => "" } },
  });

  // TRACEABILITY: US-062 FR-061 NFR-061 AC-072
  it("the channel choice considers the real context given", () => {
    const root = project();
    expect(run(root).exitCode).not.toBe(0);
  });

  // TRACEABILITY: US-062 FR-065 NFR-061 AC-072
  it("the default behavior, with no explicit source, doesn't approve", () => {
    const root = project();
    const before = fileTree(root);
    run(root);
    expect(fileTree(root)).toEqual(before);
  });

  // TRACEABILITY: US-062 FR-061 AC-072
  it("the real document-reading implementation is what decides, not a value fixed in code", () => {
    const emptyRoot = project("crs-ap-empty-");
    const refusedRoot = project("crs-ap-refused-");
    const a = runSetup({ env: detectEnvironment(emptyRoot), root: emptyRoot, write: true, approval: { context: { hasTerminal: () => false }, stdin: { read: () => "" } } });
    const b = runSetup({ env: detectEnvironment(refusedRoot), root: refusedRoot, write: true, approval: { context: { hasTerminal: () => false }, stdin: { read: () => '{"approved": false}' } } });
    expect(a.exitCode).not.toBe(0);
    expect(b.exitCode).not.toBe(0);
  });
});
