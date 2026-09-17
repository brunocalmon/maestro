import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve(__dirname, "..", "dist", "cli.js");
const approved = JSON.stringify({ approved: true });

function projectWithTarget(): string {
  const root = mkdtempSync(join(tmpdir(), "crs-registry-"));
  mkdirSync(join(root, ".claude"), { recursive: true });
  return root;
}

function run(root: string, input: string) {
  return spawnSync("node", [cli, "setup"], { cwd: root, encoding: "utf8", input, timeout: 120_000 });
}

describe("AC-118 — a JSON document run uses the same registry", () => {
  // SPECSFY: US-070 US-071 US-072 FR-071 FR-074 NFR-071 AC-118
  it("with the skills command already registered, drift doesn't ask for approval again even with no document", () => {
    const root = projectWithTarget();
    run(root, approved);
    expect(existsSync(join(root, ".maestro", "approved-commands.json"))).toBe(true);

    // SPEC-0024: the installer writes to .agents/skills; that is what drift is measured against.
    rmSync(join(root, ".agents", "skills"), { recursive: true, force: true });

    const second = run(root, "");
    expect(second.status).toBe(0);
    expect(existsSync(join(root, ".agents", "skills"))).toBe(true);
  }, 180_000);
});
