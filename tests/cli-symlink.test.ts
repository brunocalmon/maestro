import { describe, it, expect } from "vitest";
import { mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Invokes the CLI through a real symlink, the same pattern `npm link` and
 * `npm install -g` produce for every globally installed package. Direct
 * execution of the real path never exercised this case.
 */
function viaLink(...args: string[]): { stdout: string; stderr: string; status: number | null } {
  const realCli = resolve(__dirname, "..", "dist", "cli.js");
  const dir = mkdtempSync(join(tmpdir(), "crs-link-"));
  const link = join(dir, "maestro");
  symlinkSync(realCli, link);
  const r = spawnSync("node", [link, ...args], { encoding: "utf8" });
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

describe("AC-008 — the binary responds when invoked via symlink", () => {
  // TRACEABILITY: US-001 FR-005 AC-008
  it("--version produces output and exits with zero", () => {
    const r = viaLink("--version");
    expect(r.status).toBe(0);
    expect(r.stdout.trim().length).toBeGreaterThan(0);
  });

  // TRACEABILITY: US-002 FR-006 AC-008
  it("doctor produces output", () => {
    const r = viaLink("doctor");
    expect((r.stdout + r.stderr).trim().length).toBeGreaterThan(0);
  });

  // TRACEABILITY: US-001 US-002 NFR-003 AC-008
  it("the output via link matches the output via the direct path", () => {
    const realCli = resolve(__dirname, "..", "dist", "cli.js");
    const direct = spawnSync("node", [realCli, "--version"], { encoding: "utf8" });
    const link = viaLink("--version");
    expect(link.stdout).toBe(direct.stdout);
    expect(link.status).toBe(direct.status);
  });
});
