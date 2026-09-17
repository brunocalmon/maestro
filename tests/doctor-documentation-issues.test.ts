import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectDependencies } from "../src/doctor";
import { noBackends } from "./backends-fixtures";

const full = {
  resolveNpm: (name: string) =>
    ({ "@promovaweb/specsfy": "0.10.2", "context-mode": "1.0.169" })[name] ?? null,
  resolveLocalPython: () => "2.3.7",
  resolveOnPath: () => "2.3.7",
};

function rootWithDocumentationIssue(): string {
  const root = mkdtempSync(join(tmpdir(), "maestro-doctor-documentation-"));
  mkdirSync(join(root, ".specsfy"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs", "architecture.md"), "# Architecture\n\nNo link back here.\n", "utf8");
  return root;
}

describe("AC-015 — a documentation finding never changes doctor's exit code", () => {
  // SPECSFY: US-003 NFR-003 AC-015
  it("reports the finding while keeping a healthy environment's exit code at zero", () => {
    const root = rootWithDocumentationIssue();
    const report = inspectDependencies(full, root, noBackends);
    expect(report.documentationIssues?.some((i) => i.kind === "missing-backlink")).toBe(true);
    expect(report.exitCode).toBe(0);
  });
});
