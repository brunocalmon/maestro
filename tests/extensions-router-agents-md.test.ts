import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("AC-137 — AGENTS.md gets a minimal pointer, without duplicating CLAUDE.md", () => {
  // SPECSFY: US-082 FR-086 FR-087 NFR-083 AC-137
  it("setup runs and AGENTS.md gets the pointer, without repeating the router text", () => {
    const root = project();
    runSetup({
      env: detectEnvironment(root),
      root,
      write: true,
      approval: { source: fixedDecision(true) },
    });

    // SPEC-0024 inverted the direction: the router's text now lives in
    // AGENTS.md and CLAUDE.md holds the minimal side — a single `@AGENTS.md`
    // import — so neither file repeats the other.
    const agentsPath = join(root, "AGENTS.md");
    expect(existsSync(agentsPath)).toBe(true);
    const agentsContent = readFileSync(agentsPath, "utf8");
    expect(agentsContent).toContain("<!-- maestro:extension:router:start -->");
    expect(agentsContent).not.toContain("agents-pointer");

    const claudeContent = readFileSync(join(root, "CLAUDE.md"), "utf8");
    expect(claudeContent).toContain("@AGENTS.md");
    const claudeLines = claudeContent.split("\n").filter((l) => l.trim().length > 0 && !l.startsWith("<!--"));
    for (const line of claudeLines) {
      expect(agentsContent.includes(line) && line.length > 40).toBe(false);
    }
  });
});
