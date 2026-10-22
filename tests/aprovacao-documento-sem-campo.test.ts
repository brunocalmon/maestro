import { describe, it, expect } from "vitest";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { fileTree, project } from "./aprovacao-fixtures";

const runWith = (root: string, text: string) => runSetup({
  env: detectEnvironment(root), root, write: true,
  approval: { context: { hasTerminal: () => false }, stdin: { read: () => text } },
});

describe("Edge case — valid JSON, an object, missing the decision field", () => {
  // TRACEABILITY: US-061 FR-062 AC-067
  it("an empty object is a refusal", () => {
    const root = project();
    expect(runWith(root, "{}").exitCode).not.toBe(0);
  });

  // TRACEABILITY: US-061 FR-064 NFR-060 AC-067
  it("no file is created", () => {
    const root = project();
    const before = fileTree(root);
    runWith(root, "{}");
    expect(fileTree(root)).toEqual(before);
  });

  // TRACEABILITY: US-061 FR-064 AC-067
  it("an object with other fields, but no approved, is also a refusal", () => {
    const root = project();
    expect(runWith(root, '{"comment": "approved in chat"}').exitCode).not.toBe(0);
  });
});
