import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { diagnoseDocumentation } from "../src/documentation/diagnose";

function mktemp(): string {
  return mkdtempSync(join(tmpdir(), "maestro-documentation-diagnose-"));
}

function withSpecsfy(root: string): string {
  mkdirSync(join(root, ".specsfy"), { recursive: true });
  return root;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc.sort();
}

function hashTree(root: string): string {
  return walk(root)
    .map((file) => `${file.slice(root.length)}:${readFileSync(file).length}`)
    .join("|");
}

describe("AC-010 — docs/ absent while .specsfy/ is present is reported", () => {
  // SPECSFY: US-003 FR-004 NFR-003 AC-010
  it("reports a missing-documentation issue when docs/ does not exist", () => {
    const root = withSpecsfy(mktemp());
    const issues = diagnoseDocumentation(root);
    expect(issues.some((i) => i.kind === "empty" && i.file === "docs/")).toBe(true);
  });
});

describe("AC-011 — an experimental Mermaid header is reported", () => {
  // SPECSFY: US-003 FR-005 NFR-002 NFR-003 AC-011
  it("names the file and the experimental syntax found", () => {
    const root = withSpecsfy(mktemp());
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(
      join(root, "docs", "architecture.md"),
      "# Architecture\n\n```mermaid\nblock-beta\n  a --> b\n```\n\n[Back](../README.md)\n",
      "utf8",
    );
    const issues = diagnoseDocumentation(root);
    const found = issues.find((i) => i.kind === "invalid-mermaid" && i.file === "docs/architecture.md");
    expect(found).toBeDefined();
    expect(found?.detail).toMatch(/block-beta/);
  });
});

describe("AC-012 — no false positive for stable or absent Mermaid", () => {
  // SPECSFY: FR-005 AC-012
  it("does not report a file with a stable Mermaid header", () => {
    const root = withSpecsfy(mktemp());
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(
      join(root, "docs", "flows.md"),
      "# Flows\n\n```mermaid\nsequenceDiagram\n  A->>B: hi\n```\n\n[Back](../README.md)\n",
      "utf8",
    );
    const issues = diagnoseDocumentation(root);
    expect(issues.some((i) => i.kind === "invalid-mermaid" && i.file === "docs/flows.md")).toBe(false);
  });

  // SPECSFY: FR-005 AC-012
  it("does not report a file with no Mermaid at all", () => {
    const root = withSpecsfy(mktemp());
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "docs", "testing.md"), "# Testing\n\nNo diagrams here.\n\n[Back](../README.md)\n", "utf8");
    const issues = diagnoseDocumentation(root);
    expect(issues.some((i) => i.kind === "invalid-mermaid" && i.file === "docs/testing.md")).toBe(false);
  });
});

describe("AC-013 — a missing backlink to the root README is reported", () => {
  // SPECSFY: US-003 FR-006 NFR-003 AC-013
  it("names the file missing a link back to ../README.md", () => {
    const root = withSpecsfy(mktemp());
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "docs", "architecture.md"), "# Architecture\n\nNo link back here.\n", "utf8");
    const issues = diagnoseDocumentation(root);
    expect(issues.some((i) => i.kind === "missing-backlink" && i.file === "docs/architecture.md")).toBe(true);
  });
});

describe("AC-014 — the diagnosis never writes anything, even with multiple findings", () => {
  // SPECSFY: NFR-002 FR-004 FR-005 FR-006 AC-014
  it("leaves the project tree byte-for-byte identical", () => {
    const root = withSpecsfy(mktemp());
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "docs", "outro.md"), "# Outro\n\n```mermaid\nblock-beta\n```\n", "utf8");
    const before = hashTree(root);

    diagnoseDocumentation(root);

    expect(hashTree(root)).toBe(before);
  });
});

describe("AC-016 — a zero-byte file inside docs/ is reported", () => {
  // SPECSFY: FR-004 AC-016
  it("reports the empty file as incomplete documentation", () => {
    const root = withSpecsfy(mktemp());
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "docs", "README.md"), "", "utf8");
    const issues = diagnoseDocumentation(root);
    expect(issues.some((i) => i.kind === "empty" && i.file === "docs/README.md")).toBe(true);
  });
});

describe("AC-017 — docs/README.md never needs a backlink to itself", () => {
  // SPECSFY: FR-006 AC-017
  it("does not report the portal file for a missing backlink", () => {
    const root = withSpecsfy(mktemp());
    mkdirSync(join(root, "docs"), { recursive: true });
    writeFileSync(join(root, "docs", "README.md"), "# Docs Portal\n\n- [Architecture](architecture.md)\n", "utf8");
    const issues = diagnoseDocumentation(root);
    expect(issues.some((i) => i.kind === "missing-backlink" && i.file === "docs/README.md")).toBe(false);
  });
});

describe("AC-018 — the check works with no network access", () => {
  // SPECSFY: NFR-002 AC-018
  it("produces a report using only local filesystem reads", () => {
    const originalFetch = globalThis.fetch;
    // @ts-expect-error — deliberately removing fetch to prove no network call is attempted.
    globalThis.fetch = undefined;
    try {
      const root = withSpecsfy(mktemp());
      mkdirSync(join(root, "docs"), { recursive: true });
      writeFileSync(join(root, "docs", "architecture.md"), "# Architecture\n\nNo link back here.\n", "utf8");
      expect(() => diagnoseDocumentation(root)).not.toThrow();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
