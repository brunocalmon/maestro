import { describe, it, expect } from "vitest";
import { readFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureConfigFile } from "../src/config/write";
import { createExtension, realTargetFileEnvironment } from "../src/extensions/create";
import { realChecksumEnvironment } from "../src/extensions/registry";
import { buildRouterBlock, buildAgentsPointer } from "../src/extensions/router";

describe("AC-013 — creating config.yaml doesn't depend on other extensions already existing", () => {
  // TRACEABILITY: US-001 FR-001 FR-002 FR-004 NFR-001 NFR-003 AC-013
  it("creates config.yaml even when router/agents-pointer are already registered", () => {
    const root = mktemp();
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);
    createExtension({ category: "extension", name: "router", target: "CLAUDE.md", content: buildRouterBlock(), registryEnv, targetEnv });
    createExtension({ category: "extension", name: "agents-pointer", target: "AGENTS.md", content: buildAgentsPointer(), registryEnv, targetEnv });

    ensureConfigFile(root);

    const configPath = join(root, ".maestro", "config.yaml");
    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, "utf8");
    expect(content).toContain("default: en_US");
    expect(content).toContain("system:");
  });
});

function mktemp(): string {
  return mkdtempSync(join(tmpdir(), "maestro-config-write-"));
}
