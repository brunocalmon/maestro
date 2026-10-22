import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { fileTree, project } from "./aprovacao-fixtures";

const runWith = (root: string, text: string) => runSetup({
  env: detectEnvironment(root), root, write: true,
  approval: { context: { hasTerminal: () => false }, stdin: { read: () => text } },
});

describe("AC-067 — text that isn't valid JSON doesn't approve", () => {
  // TRACEABILITY: US-061 FR-062 FR-064 NFR-060 AC-067
  it("the decision is treated as a refusal", () => {
    const root = project();
    expect(runWith(root, "this is clearly not json {{{").exitCode).not.toBe(0);
  });

  // TRACEABILITY: US-061 FR-064 NFR-060 AC-067
  it("no file is created", () => {
    const root = project();
    const before = fileTree(root);
    runWith(root, "this is clearly not json {{{");
    expect(fileTree(root)).toEqual(before);
  });

  // TRACEABILITY: US-061 FR-062 FR-064 AC-067
  it("valid JSON but not object-shaped is also a refusal", () => {
    const root = project();
    expect(runWith(root, "42").exitCode).not.toBe(0);
  });
});
