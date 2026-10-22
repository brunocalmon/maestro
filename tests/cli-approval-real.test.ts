import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve(__dirname, "..", "dist", "cli.js");

function projectWithTarget(): string {
  const root = mkdtempSync(join(tmpdir(), "crs-appr-"));
  mkdirSync(join(root, ".claude"), { recursive: true });
  return root;
}

describe("AC-075 — the real command, with no injected channel, approves and writes", () => {
  // TRACEABILITY: US-060 FR-060 FR-065 AC-075
  it("a document approving via standard input unlocks the write", () => {
    const root = projectWithTarget();
    const r = spawnSync("node", [cli, "setup"], {
      cwd: root,
      encoding: "utf8",
      input: JSON.stringify({ approved: true }),
      timeout: 120_000,
    });
    expect(existsSync(join(root, ".claude", "settings.json"))).toBe(true);
    expect(r.stdout).not.toMatch(/not written/);
  }, 120_000);
});

describe("AC-076 — the real command, with no injected channel, refuses and doesn't write", () => {
  // TRACEABILITY: US-061 FR-060 FR-064 NFR-060 AC-076
  it("empty standard input is a refusal, with no write", () => {
    const root = projectWithTarget();
    const r = spawnSync("node", [cli, "setup"], {
      cwd: root,
      encoding: "utf8",
      input: "",
      timeout: 120_000,
    });
    expect(existsSync(join(root, ".claude", "settings.json"))).toBe(false);
    expect(r.stdout + r.stderr).toMatch(/not written/);
    expect(r.status).not.toBe(0);
  }, 120_000);
});
