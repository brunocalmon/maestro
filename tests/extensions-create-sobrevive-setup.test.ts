import { describe, it, expect } from "vitest";
import { createExtension } from "../src/extensions/create";
import { readExtensionRegistry } from "../src/extensions/registry";
import { checksumEnvFake, targetEnvFake } from "./extensions-fixtures";

describe("AC-130 — an extension created via the CLI survives a reinstall", () => {
  // TRACEABILITY: US-080 FR-080 FR-081 FR-082 NFR-083 AC-130
  it("a second read of the registry recognizes the same checksum", () => {
    const registryEnv = checksumEnvFake();
    const targetEnv = targetEnvFake();
    const r = createExtension({
      category: "extension",
      name: "my-extension",
      target: "my-hook",
      content: "# custom content",
      registryEnv,
      targetEnv,
      managedHooks: [],
    });
    expect(r.ok).toBe(true);

    const registry = readExtensionRegistry(registryEnv);
    const artifact = registry.artifacts.find((a) => a.name === "my-extension");
    expect(artifact).toBeDefined();
    expect(artifact?.checksum).toBe(r.artifact?.checksum);
  });
});
