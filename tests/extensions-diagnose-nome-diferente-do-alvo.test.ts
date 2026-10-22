import { describe, it, expect } from "vitest";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { registryFake, targetEnvFake } from "./extensions-fixtures";
import { computeChecksum, insertAnchor } from "../src/extensions/anchor";
import { FOREIGN_SIGNATURES } from "../src/extensions/foreign";

describe("AC-133/AC-135 — disk presence is resolved by target, not by name", () => {
  // TRACEABILITY: US-081 FR-083 NFR-080 NFR-082 AC-133 AC-135
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

describe("AC-136 — foreign content wrapped in its maestro anchor diagnoses like any other block", () => {
  // Since relocateForeignSections now wraps every `## Agent skills` it sees
  // in the standard `<!-- maestro:foreign:<name>:start/end -->` anchor, the
  // generic readAnchor branch already covers the steady state.
  it("an intact foreign artifact, matching checksum, is not reported as divergent", () => {
    const sig = FOREIGN_SIGNATURES[0]!;
    const inner = `${sig.heading}\n\nsome third-party content.`;
    const anchored = insertAnchor("", "foreign", sig.name, inner);
    const targetEnv = targetEnvFake({ "AGENTS.md": anchored });
    const registry = registryFake([
      { category: "foreign", name: sig.name, target: "AGENTS.md", origin: sig.origin, content: inner, checksum: computeChecksum(inner), createdAt: "2026-09-02T00:00:00.000Z" },
    ]);

    const divergent = diagnoseExtensions(registry, targetEnv, []);
    expect(divergent).toHaveLength(0);
  });

  it("a foreign artifact whose content actually changed is reported as divergent", () => {
    const sig = FOREIGN_SIGNATURES[0]!;
    const original = `${sig.heading}\n\noriginal content.`;
    const changed = `${sig.heading}\n\nchanged content.`;
    const targetEnv = targetEnvFake({ "AGENTS.md": insertAnchor("", "foreign", sig.name, changed) });
    const registry = registryFake([
      { category: "foreign", name: sig.name, target: "AGENTS.md", origin: sig.origin, content: original, checksum: computeChecksum(original), createdAt: "2026-09-02T00:00:00.000Z" },
    ]);

    const divergent = diagnoseExtensions(registry, targetEnv, []);
    expect(divergent).toEqual([{ name: sig.name, target: "AGENTS.md", reason: "checksum-mismatch" }]);
  });

  // Transient state: a registration made before this anchor-wrapping existed
  // (or the anchor was hand-removed) — the heading-based fallback still has
  // to find it, so a stale artifact doesn't look divergent for no reason
  // right up until the next `maestro setup` re-wraps it.
  it("falls back to heading-based matching for content not yet wrapped in an anchor", () => {
    const sig = FOREIGN_SIGNATURES[0]!;
    const inner = `${sig.heading}\n\nsome third-party content.`;
    const targetEnv = targetEnvFake({ "AGENTS.md": `${inner}\n` });
    const registry = registryFake([
      { category: "foreign", name: sig.name, target: "AGENTS.md", origin: sig.origin, content: inner, checksum: computeChecksum(inner), createdAt: "2026-09-02T00:00:00.000Z" },
    ]);

    const divergent = diagnoseExtensions(registry, targetEnv, []);
    expect(divergent).toHaveLength(0);
  });
});
