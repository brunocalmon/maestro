import { describe, it, expect } from "vitest";
import { recordApproval } from "../src/approval/plan";
import { registryFake, itemFake } from "./approval-command-fixtures";

describe("AC-114 — approving records the new command in the registry", () => {
  // TRACEABILITY: US-070 FR-073 NFR-071 AC-114
  it("an approved command ends up in the returned registry", () => {
    const item = itemFake("skills", "install skills", "node", [
      "framework.cjs",
      "install",
      "--project",
      "/tmp/proj",
      "--json",
    ]);
    const registry = recordApproval(registryFake([]), [item]);
    expect(registry.commands).toEqual([{ bin: item.bin, args: item.args }]);
  });

  // TRACEABILITY: FR-073 AC-114
  it("a command already present in the registry doesn't duplicate", () => {
    const item = itemFake("skills", "install skills", "node", [
      "framework.cjs",
      "install",
      "--project",
      "/tmp/proj",
      "--json",
    ]);
    const registry = registryFake([{ bin: item.bin, args: item.args }]);
    const updated = recordApproval(registry, [item]);
    expect(updated.commands).toHaveLength(1);
  });
});
