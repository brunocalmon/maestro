import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { detectTarget } from "../src/hooks/detect.js";
import { runSetup } from "../src/setup/run.js";

const noEvidence = { hasClaudeCode: false, files: [] as string[] };
const antigravityEvidence = { hasClaudeCode: false, hasAntigravity: true, files: [".agents/skills/"] };

describe("Target Antigravity — detection and setup", () => {
  it("detects antigravity target when .agents/ evidence is present", () => {
    const d = detectTarget(antigravityEvidence);
    expect(d.found).toBe(true);
    expect(d.target).toBe("antigravity");
  });

  it("detects antigravity target when ANTIGRAVITY env variable is set", () => {
    const envWithVar = { ...noEvidence, envVars: { ANTIGRAVITY: "1" } };
    const d = detectTarget(envWithVar);
    expect(d.found).toBe(true);
    expect(d.target).toBe("antigravity");
  });

  it("configures a project for antigravity target without writing .claude/settings.json", () => {
    const root = mkdtempSync(join(tmpdir(), "maestro-ag-test-"));
    const r = runSetup({
      env: noEvidence,
      root,
      write: true,
      target: "antigravity",
    });

    expect(r.exitCode).toBe(0);
    expect(r.record?.target).toBe("antigravity");
    expect(existsSync(join(root, ".claude", "settings.json"))).toBe(false);
    expect(existsSync(join(root, ".agents", "skills", "maestro-extension-creator"))).toBe(true);
    expect(existsSync(join(root, "AGENTS.md"))).toBe(true);

    const agentsContent = readFileSync(join(root, "AGENTS.md"), "utf8");
    expect(agentsContent).toMatch(/## maestro/);
  });
});
