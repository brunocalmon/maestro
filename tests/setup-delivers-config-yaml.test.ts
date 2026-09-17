import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("setup delivers .maestro/config.yaml and the language instruction", () => {
  // SPECSFY: US-001 US-002 US-003 FR-001 FR-006 FR-007 AC-001 AC-007 AC-010
  it("creates a complete config.yaml and the CLAUDE.md/AGENTS.md language blocks on first run", () => {
    const root = project();
    runSetup({
      env: detectEnvironment(root),
      root,
      write: true,
      approval: { source: fixedDecision(true) },
    });

    const configPath = join(root, ".maestro", "config.yaml");
    expect(existsSync(configPath)).toBe(true);
    const config = readFileSync(configPath, "utf8");
    expect(config).toContain("language:");
    expect(config).toContain("default: en_US");
    expect(config).toContain("project:");
    expect(config).toContain("system:");
    expect(config).toContain("git:");

    // SPEC-0024: the language block lives in AGENTS.md; CLAUDE.md imports it.
    const claudeMd = readFileSync(join(root, "CLAUDE.md"), "utf8");
    expect(claudeMd).toMatch(/@AGENTS\.md/);

    const agentsMd = readFileSync(join(root, "AGENTS.md"), "utf8");
    expect(agentsMd).toMatch(/maestro: language/);
    expect(agentsMd).toMatch(/config\.yaml/);
  });
});
