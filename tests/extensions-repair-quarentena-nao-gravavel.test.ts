import { describe, it, expect } from "vitest";
import { repairExtension } from "../src/extensions/repair";
import { registryFake, targetEnvFake } from "./extensions-fixtures";
import { computeChecksum } from "../src/extensions/anchor";

describe("AC-139 — an unwritable quarantine refuses the whole repair", () => {
  // TRACEABILITY: US-081 FR-084 FR-085 NFR-080 NFR-081 AC-139
  it("an unwritable quarantine directory keeps the divergent one exactly as it was", () => {
    const target = ".maestro/extensions/my-hook.md";
    const targetEnv = targetEnvFake({ [target]: "# divergent content" });
    const before = { ...targetEnv.files() };
    const registry = registryFake([
      { category: "extension", name: "my-extension", target: "my-hook", content: "something else", checksum: computeChecksum("something else"), createdAt: "2026-09-02T00:00:00.000Z" },
    ]);
    const divergent = { name: "my-extension", target: "my-hook", reason: "checksum-mismatch" as const };

    const result = repairExtension(divergent, {
      registry,
      targetEnv,
      quarantineEnv: {
        write: () => {
          throw new Error("quarantine not writable");
        },
      },
    });

    expect(result.ok).toBe(false);
    expect(targetEnv.files()).toEqual(before);
  });
});
