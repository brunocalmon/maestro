import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { executeSetup } from "../src/mcp/tool";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { disposableProject } from "./mcp-fixtures";

/**
 * Reproduces what the command line does, to compare against the protocol.
 * `runSetup` already writes both files when `write` is true; writing again
 * here would duplicate the operation being compared.
 */
function viaCommandLine(root: string) {
  return runSetup({ env: detectEnvironment(root), root, write: true });
}

describe("AC-006 — both entry points describe the same result", () => {
  // TRACEABILITY: US-003 FR-004 AC-006
  it("the installed hooks match by name", async () => {
    const viaTerminal = viaCommandLine(disposableProject("crs-cli-"));
    const viaTool = await executeSetup({ project_root: disposableProject("crs-mcp-") });
    expect(viaTool.structuredContent?.hooks.map((h) => h.name).sort())
      .toEqual(viaTerminal.installed.map((h) => h.name).sort());
  });

  // TRACEABILITY: US-003 FR-005 AC-006
  it("the hooks match by event", async () => {
    const viaTerminal = viaCommandLine(disposableProject("crs-cli-"));
    const viaTool = await executeSetup({ project_root: disposableProject("crs-mcp-") });
    const key = (h: { name: string; event: string }) => `${h.name}:${h.event}`;
    expect(viaTool.structuredContent?.hooks.map(key).sort())
      .toEqual(viaTerminal.installed.map(key).sort());
  });

  // TRACEABILITY: US-003 NFR-002 AC-006
  it("the records match by target and entry count", async () => {
    const rootCli = disposableProject("crs-cli-");
    const rootMcp = disposableProject("crs-mcp-");
    viaCommandLine(rootCli);
    await executeSetup({ project_root: rootMcp });
    const read = (r: string) => JSON.parse(readFileSync(join(r, ".maestro", "install.json"), "utf8"));
    const a = read(rootCli), b = read(rootMcp);
    expect(b.target).toBe(a.target);
    expect(b.hooks).toHaveLength(a.hooks.length);
  });
});
