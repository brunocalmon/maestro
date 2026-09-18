import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { project as freshProject } from "./helpers-spec-0022";
import { configurationContractId, writeDeferral, isDeferralActive, readDeferral } from "../src/setup/defer";

describe("AC-009 — adiamento grava contractId vigente e libera o chat", () => {
  // SPECSFY: US-002 FR-003 AC-009
  it("fica ativo logo após writeDeferral com o contractId atual", () => {
    const root = freshProject();
    expect(isDeferralActive(root)).toBe(false);
    writeDeferral(root, configurationContractId(root));
    expect(isDeferralActive(root)).toBe(true);
  });
});

describe("AC-012 — mudança no contrato de traços invalida o adiamento anterior", () => {
  // SPECSFY: US-002 FR-003 AC-012
  it("deixa de estar ativo quando o contractId gravado não bate com o vigente", () => {
    const root = freshProject();
    // Simulates a deferral recorded under a prior version's contract, whose
    // trace list has since changed — the recorded id no longer matches
    // configurationContractId(root) computed against today's constants.
    writeDeferral(root, "contract-id-de-uma-versao-anterior-simulada");
    expect(isDeferralActive(root)).toBe(false);
  });
});

describe("AC-013 — adiamento permanece válido quando o contrato não muda", () => {
  // SPECSFY: US-002 FR-003 AC-013
  it("continua ativo ao recalcular contractId sem nenhuma mudança de contrato", () => {
    const root = freshProject();
    const contractId = configurationContractId(root);
    writeDeferral(root, contractId);
    // Recomputing (as a later `maestro setup` run would, e.g. after a
    // dependency-only version bump) must yield the same id and keep it active.
    expect(configurationContractId(root)).toBe(contractId);
    expect(isDeferralActive(root)).toBe(true);
  });
});

describe("AC-009 — CLI real: `maestro setup --defer-conversational`", () => {
  // SPECSFY: US-002 FR-003 AC-009
  it("grava o adiamento via processo real, sem instalar nada mais", () => {
    const root = freshProject();
    const cli = resolve(__dirname, "..", "dist", "cli.js");
    const r = spawnSync("node", [cli, "setup", "--defer-conversational", "--target", "claude-code"], {
      cwd: root,
      encoding: "utf8",
      timeout: 20_000,
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/deferred/i);
    expect(isDeferralActive(root)).toBe(true);
  }, 20_000);

  // SPECSFY: US-002 FR-003 AC-009
  it("avisa e não grava nada quando o projeto já está totalmente configurado", () => {
    const root = freshProject();
    const cli = resolve(__dirname, "..", "dist", "cli.js");
    // Pre-populates the 4 specsfy-setup traces and the AGENT_SKILLS_HEADING
    // directly, so "nothing pending" holds without a real specsfy/skills install.
    mkdirSync(resolve(root, ".specsfy"), { recursive: true });
    writeFileSync(resolve(root, "PROJECT.md"), "x\n");
    writeFileSync(resolve(root, ".specsfy", "STACK.md"), "x\n");
    writeFileSync(resolve(root, ".specsfy", "RULES.md"), "x\n");
    writeFileSync(resolve(root, ".specsfy", "USER-PROFILE.md"), "x\n");
    writeFileSync(resolve(root, "AGENTS.md"), "## Agent skills\n\nfoo\n");

    const r = spawnSync("node", [cli, "setup", "--defer-conversational", "--target", "claude-code"], {
      cwd: root,
      encoding: "utf8",
      timeout: 20_000,
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/nothing pending/i);
    expect(readDeferral(root)).toBeNull();
  }, 20_000);
});
