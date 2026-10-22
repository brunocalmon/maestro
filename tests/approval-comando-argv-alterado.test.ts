import { describe, it, expect } from "vitest";
import { partitionByApproval } from "../src/approval/plan";
import { registryFake, itemFake } from "./approval-command-fixtures";

describe("AC-113 — a command with changed argv asks for approval again", () => {
  // TRACEABILITY: US-070 FR-072 FR-073 NFR-070 AC-113
  it("a Python bridge with a version different from the registered one appears as pending", () => {
    const registered = { bin: "uv", args: ["pip", "install", "--python", ".venv-crg", "code-review-graph==2.3.7"] };
    const newItem = itemFake("bridge", "install code-review-graph via uv", "uv", [
      "pip",
      "install",
      "--python",
      ".venv-crg",
      "code-review-graph==2.4.0",
    ]);
    const registry = registryFake([registered]);
    const { pending, approved } = partitionByApproval(registry, [newItem]);
    expect(pending).toEqual([newItem]);
    expect(approved).toEqual([]);
  });
});
