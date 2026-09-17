import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createExtension, realTargetFileEnvironment } from "../src/extensions/create";
import { realChecksumEnvironment } from "../src/extensions/registry";
import { diagnoseExtensions } from "../src/extensions/diagnose";
import { buildDocumentationBlock, buildDocumentationPointer } from "../src/extensions/router";

function mktemp(): string {
  return mkdtempSync(join(tmpdir(), "maestro-config-documentation-"));
}

describe("AC-001 — the documentation rule is installed with the full text", () => {
  // SPECSFY: US-001 FR-001 NFR-001 AC-001
  it("delivers the anchored block into CLAUDE.md", () => {
    const root = mktemp();
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);
    createExtension({
      category: "extension",
      name: "config-documentation-rule",
      target: "CLAUDE.md",
      content: buildDocumentationBlock(),
      registryEnv,
      targetEnv,
    });
    const content = readFileSync(join(root, "CLAUDE.md"), "utf8");
    expect(content).toMatch(/## maestro: documentation/);
    expect(content).toMatch(/language\.default/);
    expect(content).toMatch(/mermaid/i);
    expect(content).toMatch(/backlink|link/i);
  });
});

describe("AC-002 — a second setup run does not duplicate the block", () => {
  // SPECSFY: US-001 FR-001 NFR-001 AC-002
  it("keeps exactly one documentation section after running twice", () => {
    const root = mktemp();
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);
    const opts = {
      category: "extension" as const,
      name: "config-documentation-rule",
      target: "CLAUDE.md",
      content: buildDocumentationBlock(),
      registryEnv,
      targetEnv,
    };
    createExtension(opts);
    const before = readFileSync(join(root, "CLAUDE.md"), "utf8");
    createExtension(opts);
    const after = readFileSync(join(root, "CLAUDE.md"), "utf8");
    expect(after).toBe(before);
    expect(after.match(/## maestro: documentation/g)).toHaveLength(1);
  });
});

describe("AC-003 — AGENTS.md carries the pointer, doctor detects manual drift", () => {
  // SPECSFY: US-001 FR-001 NFR-001 US-003 AC-003
  it("delivers a pointer into AGENTS.md that references CLAUDE.md", () => {
    const root = mktemp();
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);
    createExtension({
      category: "extension",
      name: "config-documentation-pointer",
      target: "AGENTS.md",
      content: buildDocumentationPointer(),
      registryEnv,
      targetEnv,
    });
    const content = readFileSync(join(root, "AGENTS.md"), "utf8");
    expect(content).toMatch(/CLAUDE\.md/);
    expect(content.toLowerCase()).toMatch(/documentation|documentação/);
  });

  // SPECSFY: US-001 FR-001 NFR-001 US-003 AC-003
  it("a hand-edited pointer is reported as divergent by the existing extension diagnosis", () => {
    const root = mktemp();
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);
    createExtension({
      category: "extension",
      name: "config-documentation-pointer",
      target: "AGENTS.md",
      content: buildDocumentationPointer(),
      registryEnv,
      targetEnv,
    });
    const path = join(root, "AGENTS.md");
    const edited = readFileSync(path, "utf8").replace("CLAUDE.md", "SOMEONE_EDITED_THIS.md");
    writeFileSync(path, edited, "utf8");

    const divergent = diagnoseExtensions(realChecksumEnvironment(root), targetEnv, []);
    expect(divergent.some((d) => d.name === "config-documentation-pointer")).toBe(true);
  });
});
