import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createExtension, realTargetFileEnvironment } from "../src/extensions/create";
import { realChecksumEnvironment } from "../src/extensions/registry";
import { buildConfigLanguageBlock, buildConfigLanguagePointer } from "../src/extensions/router";

function mktemp(): string {
  return mkdtempSync(join(tmpdir(), "maestro-config-router-"));
}

describe("AC-007 — the router receives the language/config.yaml instruction", () => {
  // TRACEABILITY: US-002 FR-006 AC-007
  it("delivers the anchored block into CLAUDE.md", () => {
    const root = mktemp();
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);
    createExtension({
      category: "extension",
      name: "config-language-rule",
      target: "CLAUDE.md",
      content: buildConfigLanguageBlock(),
      registryEnv,
      targetEnv,
    });
    const content = readFileSync(join(root, "CLAUDE.md"), "utf8");
    expect(content).toMatch(/config\.yaml/);
    expect(content).toMatch(/language\.default/);
    expect(content).toMatch(/language\.exceptions/);
  });
});

describe("AC-008 — AGENTS.md receives the matching pointer", () => {
  // TRACEABILITY: US-002 FR-006 AC-008
  it("delivers a pointer into AGENTS.md", () => {
    const root = mktemp();
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);
    createExtension({
      category: "extension",
      name: "config-language-pointer",
      target: "AGENTS.md",
      content: buildConfigLanguagePointer(),
      registryEnv,
      targetEnv,
    });
    const content = readFileSync(join(root, "AGENTS.md"), "utf8");
    expect(content).toMatch(/CLAUDE\.md/);
    expect(content.toLowerCase()).toMatch(/idioma|language/);
  });
});

describe("AC-009 — the router instruction is idempotent", () => {
  // TRACEABILITY: US-002 FR-006 NFR-002 AC-009
  it("does not duplicate the block on a second run", () => {
    const root = mktemp();
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);
    const opts = {
      category: "extension" as const,
      name: "config-language-rule",
      target: "CLAUDE.md",
      content: buildConfigLanguageBlock(),
      registryEnv,
      targetEnv,
    };
    createExtension(opts);
    const before = readFileSync(join(root, "CLAUDE.md"), "utf8");
    // Second run must not throw and must not duplicate the anchored block.
    createExtension(opts);
    const after = readFileSync(join(root, "CLAUDE.md"), "utf8");
    expect(after).toBe(before);
    expect(existsSync(join(root, "CLAUDE.md"))).toBe(true);
  });
});
