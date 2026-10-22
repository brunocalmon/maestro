import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Real end to end: no `Executor` is injected. This is the same command the
 * person responsible ran by hand to discover that `setup` never installed
 * anything — generous timeout for the same reason as
 * `tests/hooks-context-mode-comando.test.ts`: two real third-party
 * subprocesses, under full-suite load.
 *
 * `input` approves via standard input: since SPEC-0007 reopened,
 * `formatSetup()` also wires in real `approval`, and without this the run
 * would be read as an empty document — refused, no write.
 */
describe("AC-036 / AC-038 — maestro setup, end to end, no fixture", () => {
  it("installs skills and hooks without requiring a project framework", () => {
    const root = mkdtempSync(join(tmpdir(), "crs-e2e-"));
    mkdirSync(join(root, ".claude"), { recursive: true });
    const cli = resolve(__dirname, "..", "dist", "cli.js");

    const r = spawnSync("node", [cli, "setup"], {
      cwd: root,
      encoding: "utf8",
      input: JSON.stringify({ approved: true }),
      timeout: 120_000,
    });
    expect(r.status).toBe(0);

    const skills = existsSync(join(root, ".claude", "skills")) ? readdirSync(join(root, ".claude", "skills")) : [];
    expect(skills.some((n) => n === "ask-matt" || n === "code-review")).toBe(true);
    expect(skills.some((n) => n.startsWith("framework-"))).toBe(false);

    expect(existsSync(join(root, ".project-context"))).toBe(false);
    expect(existsSync(join(root, ".agents", "skills"))).toBe(true);
    expect(existsSync(join(root, "CLAUDE.md"))).toBe(true);
    expect(existsSync(join(root, "AGENTS.md"))).toBe(true);
  }, 120_000);
});
