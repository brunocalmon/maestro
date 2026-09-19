import { describe, it, expect } from "vitest";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { registryFake, targetEnvFake } from "./extensions-fixtures";
import { computeChecksum, insertAnchor } from "../src/extensions/anchor";
import { FOREIGN_SIGNATURES } from "../src/extensions/foreign";

describe("AC-133/AC-135 — disk presence is resolved by target, not by name", () => {
  // SPECSFY: US-081 FR-083 NFR-080 NFR-082 AC-133 AC-135
  it("an intact artifact whose name differs from its target isn't falsely reported as an orphan", () => {
    const content = "# original content";
    const anchored = insertAnchor("", "extension", "my-extension", content);
    const targetEnv = targetEnvFake({ ".maestro/extensions/my-hook.md": anchored });
    const registry = registryFake([
      {
        category: "extension",
        name: "my-extension",
        target: "my-hook",
        content,
        checksum: computeChecksum(content),
        createdAt: "2026-09-02T00:00:00.000Z",
      },
    ]);

    // The real `listPresentExtensionNames` returns the filename — same as the target, not the name.
    const divergent = diagnoseExtensions(registry, targetEnv, ["my-hook"]);
    expect(divergent).toHaveLength(0);
  });
});

describe("AC-136 — foreign content is compared by its heading, not by an anchor comment", () => {
  // `readAnchor` looks for `<!-- foreign:<name>:start -->`, which a
  // third-party skill never writes — comparing that way made every intact
  // `foreign` artifact look divergent regardless of its actual checksum.
  it("an intact foreign artifact, matching checksum, is not reported as divergent", () => {
    const sig = FOREIGN_SIGNATURES[0]!;
    const content = `${sig.heading}\n\nsome third-party content.\n`;
    const targetEnv = targetEnvFake({ "AGENTS.md": content });
    const registry = registryFake([
      { category: "foreign", name: sig.name, target: "AGENTS.md", origin: sig.origin, content, checksum: computeChecksum(content), createdAt: "2026-09-02T00:00:00.000Z" },
    ]);

    const divergent = diagnoseExtensions(registry, targetEnv, []);
    expect(divergent).toHaveLength(0);
  });

  it("a foreign artifact whose content actually changed is reported as divergent", () => {
    const sig = FOREIGN_SIGNATURES[0]!;
    const original = `${sig.heading}\n\noriginal content.\n`;
    const changed = `${sig.heading}\n\nchanged content.\n`;
    const targetEnv = targetEnvFake({ "AGENTS.md": changed });
    const registry = registryFake([
      { category: "foreign", name: sig.name, target: "AGENTS.md", origin: sig.origin, content: original, checksum: computeChecksum(original), createdAt: "2026-09-02T00:00:00.000Z" },
    ]);

    const divergent = diagnoseExtensions(registry, targetEnv, []);
    expect(divergent).toEqual([{ name: sig.name, target: "AGENTS.md", reason: "checksum-mismatch" }]);
  });
});
