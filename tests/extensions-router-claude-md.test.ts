import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

describe("AC-136 — CLAUDE.md gets maestro' own section on the first setup", () => {
  // SPECSFY: US-082 FR-086 FR-087 NFR-083 AC-136
  it("setup runs for the first time and CLAUDE.md gets the router's anchored block", () => {
    const root = project();
    runSetup({
      env: detectEnvironment(root),
      root,
      write: true,
      approval: { source: fixedDecision(true) },
    });

    // SPEC-0024 moved the router's content into AGENTS.md; CLAUDE.md keeps the
    // maestro's own anchored block too — the `@AGENTS.md` import — so the
    // original contract (a maestro section in CLAUDE.md on first setup) holds.
    const path = join(root, "CLAUDE.md");
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf8");
    expect(content).toContain("<!-- maestro:extension:agents-import:start -->");
    expect(content).toContain("<!-- maestro:extension:agents-import:end -->");
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    expect(agents).toContain("<!-- maestro:extension:router:start -->");
    expect(agents).toContain("<!-- maestro:extension:router:end -->");

    const registry = JSON.parse(readFileSync(join(root, ".maestro", "extensions.json"), "utf8"));
    expect(registry.artifacts.some((a: { target: string }) => a.target === "CLAUDE.md")).toBe(true);
    expect(registry.artifacts.some((a: { name: string; target: string }) => a.name === "router" && a.target === "AGENTS.md")).toBe(true);
  });
});
