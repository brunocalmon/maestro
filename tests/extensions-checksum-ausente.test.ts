import { describe, it, expect } from "vitest";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { registryFake, targetEnvFake } from "./extensions-fixtures";

describe("AC-135 — a missing checksum record is divergence, not an exception", () => {
  // TRACEABILITY: US-081 FR-083 FR-084 NFR-080 NFR-081 NFR-082 AC-135
  it("a present file with no matching registry entry is treated as divergent", () => {
    const registry = registryFake([]);
    const targetEnv = targetEnvFake();

    expect(() => diagnoseExtensions(registry, targetEnv, ["orphan"])).not.toThrow();
    const divergent = diagnoseExtensions(registry, targetEnv, ["orphan"]);
    expect(divergent).toHaveLength(1);
    expect(divergent[0].name).toBe("orphan");
    expect(divergent[0].reason).toBe("checksum-missing");
  });
});
