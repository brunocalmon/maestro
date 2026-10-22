import { describe, it, expect } from "vitest";
import { createExtension } from "../src/extensions/create";
import { checksumEnvFake, targetEnvFake } from "./extensions-fixtures";

describe("AC-131 — category new is refused for the seven hooks", () => {
  // TRACEABILITY: US-080 FR-080 FR-081 FR-082 AC-131
  it("a request for category new on a managed hook is refused with a reason", () => {
    const r = createExtension({
      category: "new",
      name: "hack",
      target: "guard-destructive",
      content: "# attempt",
      registryEnv: checksumEnvFake(),
      targetEnv: targetEnvFake(),
      managedHooks: ["guard-destructive", "guard-secrets"],
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/new/i);
    expect(r.reason).toMatch(/override|extension/i);
  });
});
