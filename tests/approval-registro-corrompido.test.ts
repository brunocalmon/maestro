import { describe, it, expect } from "vitest";
import { readApprovalRegistry } from "../src/approval/registry";

describe("AC-119 — a corrupted registry is treated as empty, safe failure", () => {
  // TRACEABILITY: FR-070 NFR-070 NFR-071 AC-119
  it("invalid JSON in the registry resolves to an empty list, without throwing", () => {
    const env = { read: () => "{ this isn't json", write: () => {} };
    expect(() => readApprovalRegistry(env)).not.toThrow();
    expect(readApprovalRegistry(env).commands).toEqual([]);
  });

  // TRACEABILITY: FR-070 AC-119
  it("a missing registry (empty read) resolves to an empty list", () => {
    const env = { read: () => "", write: () => {} };
    expect(readApprovalRegistry(env).commands).toEqual([]);
  });
});
