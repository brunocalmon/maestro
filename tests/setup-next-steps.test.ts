import { describe, it, expect } from "vitest";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project } from "./helpers-spec-0022";

const opts = { upstream: { contextModeHooksJson: null } };
const readme = (root: string) => readFileSync(resolve(root, "README.md"), "utf8");

function withSpecsfySetupTraces(root: string): void {
  mkdirSync(resolve(root, ".specsfy"), { recursive: true });
  writeFileSync(resolve(root, "PROJECT.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "STACK.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "RULES.md"), "x\n");
  writeFileSync(resolve(root, ".specsfy", "USER-PROFILE.md"), "x\n");
}

describe("AC-004 — README e relatório orientam os próximos passos", () => {
  // SPECSFY: US-001 FR-003 NFR-003 AC-004
  it("relatório e README terminam com a orientação completa quando nada está configurado", () => {
    const root = project();
    const result = runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(result.report).toContain("next: run /specsfy-setup and /setup-matt-pocock-skills in your agent");
    expect(readme(root)).toContain("next: run /specsfy-setup and /setup-matt-pocock-skills in your agent");
  });
});

describe("AC-005 — relatório não repete a orientação quando já configurado", () => {
  // SPECSFY: US-001 FR-003 FR-001 NFR-003 AC-005
  it("sem next: quando tudo está presente", () => {
    const root = project();
    withSpecsfySetupTraces(root);
    writeFileSync(resolve(root, "AGENTS.md"), "## Agent skills\n\nfoo\n");
    const result = runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(result.report).not.toContain("next: run");
    expect(readme(root)).not.toContain("next: run");
  });
});

describe("AC-019 — a linha next: cita só a skill que falta", () => {
  // SPECSFY: US-001 FR-003 NFR-003 AC-019
  it("só falta o matt-pocock: cita só /setup-matt-pocock-skills", () => {
    const root = project();
    withSpecsfySetupTraces(root);
    const result = runSetup({ env: claudeEnv, root, write: true, ...opts });
    expect(result.report).toContain("next: run /setup-matt-pocock-skills in your agent");
    expect(result.report).not.toContain("/specsfy-setup");
  });
});
