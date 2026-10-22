import { describe, it, expect } from "vitest";
import { partitionByApproval } from "../src/approval/plan";
import { registryFake, itemFake } from "./approval-command-fixtures";

describe("AC-111 — an unknown command asks for approval", () => {
  // TRACEABILITY: US-070 US-071 FR-070 FR-072 NFR-072 AC-111
  it("an empty registry, a pending skills command appears as pending", () => {
    const registry = registryFake([]);
    const item = itemFake("skills", "install skills from mattpocock", "node", ["cli.mjs", "add", "mattpocock/skills"]);
    const { approved, pending } = partitionByApproval(registry, [item]);
    expect(pending).toEqual([item]);
    expect(approved).toEqual([]);
  });
});

describe("AC-112 — an already approved command, identical argv, isn't asked again", () => {
  // TRACEABILITY: US-070 FR-070 FR-072 NFR-070 AC-112
  it("a command with the exact argv already registered doesn't appear as pending, even after drift", () => {
    const item = itemFake("skills", "install skills from mattpocock", "node", ["cli.mjs", "add", "mattpocock/skills"]);
    const registry = registryFake([{ bin: item.bin, args: item.args }]);
    const { approved, pending } = partitionByApproval(registry, [item]);
    expect(approved).toEqual([item]);
    expect(pending).toEqual([]);
  });
});
