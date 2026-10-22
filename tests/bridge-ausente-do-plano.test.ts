import { describe, it, expect } from "vitest";
import { assembleDependencyCommands } from "../src/approval/plan";

describe("AC-117 — the Python bridge doesn't run when already present", () => {
  // TRACEABILITY: US-072 FR-074 NFR-072 AC-117
  it("a bridge candidate with pending=false doesn't appear in the command list", () => {
    const candidates = [
      {
        kind: "bridge" as const,
        label: "install code-review-graph via uv",
        command: { bin: "uv", args: ["pip", "install", "--python", ".venv-crg", "code-review-graph==2.3.7"] },
        pending: false,
      },
    ];
    const items = assembleDependencyCommands(candidates);
    expect(items).toEqual([]);
  });

  // TRACEABILITY: FR-074 AC-117
  it("a candidate with no resolved command (missing bin) doesn't appear even if pending", () => {
    const candidates = [
      { kind: "bridge" as const, label: "install code-review-graph via uv", command: null, pending: true },
    ];
    const items = assembleDependencyCommands(candidates);
    expect(items).toEqual([]);
  });
});
