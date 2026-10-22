import { describe, it, expect } from "vitest";
import { createExtension } from "../src/extensions/create";
import { checksumEnvFake, targetEnvFake } from "./extensions-fixtures";

describe("AC-132 — a name conflict asks for an explicit choice, no silent default", () => {
  // TRACEABILITY: US-080 FR-080 FR-081 FR-082 AC-132
  it("an already registered name produces a conflict notice, without applying skip or replace", () => {
    const registryEnv = checksumEnvFake();
    const targetEnv = targetEnvFake();
    const first = createExtension({
      category: "extension",
      name: "my-extension",
      target: "my-hook",
      content: "first version",
      registryEnv,
      targetEnv,
      managedHooks: [],
    });
    expect(first.ok).toBe(true);

    const second = createExtension({
      category: "extension",
      name: "my-extension",
      target: "my-hook",
      content: "second version",
      registryEnv,
      targetEnv,
      managedHooks: [],
    });
    expect(second.ok).toBe(false);
    expect(second.reason).toMatch(/conflict/i);
    expect(second.reason).toMatch(/skip/i);
    expect(second.reason).toMatch(/replace/i);
  });
});
