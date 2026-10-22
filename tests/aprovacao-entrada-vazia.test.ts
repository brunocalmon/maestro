import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { fileTree, project } from "./aprovacao-fixtures";

const runWith = (root: string, text: string) => runSetup({
  env: detectEnvironment(root), root, write: true,
  approval: { context: { hasTerminal: () => false }, stdin: { read: () => text } },
});

describe("AC-068 — empty input doesn't authorize", () => {
  // TRACEABILITY: US-061 FR-064 NFR-060 AC-068
  it("the decision is treated as a refusal", () => {
    const root = project();
    expect(runWith(root, "").exitCode).not.toBe(0);
  });

  // TRACEABILITY: US-061 FR-064 NFR-060 AC-068
  it("no file is created", () => {
    const root = project();
    const before = fileTree(root);
    runWith(root, "");
    expect(fileTree(root)).toEqual(before);
  });

  // TRACEABILITY: US-061 FR-064 AC-068
  it("input with only whitespace is also a refusal", () => {
    const root = project();
    expect(runWith(root, "   \n  ").exitCode).not.toBe(0);
  });
});
