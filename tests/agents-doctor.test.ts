import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

function setup(root: string) {
  return runSetup({
    env: detectEnvironment(root),
    root,
    write: true,
    approval: { source: fixedDecision(true) },
  });
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc.sort();
}

function hashTree(dir: string): string {
  const hash = createHash("sha256");
  for (const file of walk(dir)) {
    hash.update(file.slice(dir.length));
    hash.update(readFileSync(file));
  }
  return hash.digest("hex");
}

/** Projeto semeado cujo behavior do maestro aponta para um arquivo que não existe. */
function brokenProject(): string {
  const root = project();
  setup(root);
  const path = join(root, ".maestro", "config.yaml");
  // O serializador escreve em bloco (`behavior:` / `value:` em linhas
  // separadas), então a troca precisa alcançar a linha do `value`.
  writeFileSync(
    path,
    readFileSync(path, "utf8").replace(
      "value: .maestro/subagents/maestro/behavior.md",
      "value: .maestro/subagents/maestro/apagado.md",
    ),
  );
  return root;
}

describe("AC-010 — o doctor relata referência quebrada", () => {
  // TRACEABILITY: US-001 FR-004 NFR-002 AC-010
  it("o relatório que a pessoa lê nomeia o perfil e o caminho, com saída diferente de zero", async () => {
    const { diagnoseAgents } = await import("../src/agents/diagnose");
    const { renderReport } = await import("../src/cli");
    const { inspectDependencies, defaultEnvironment } = await import("../src/doctor");
    const root = brokenProject();

    // Afirmar sobre a função de diagnóstico sozinha deixaria passar um
    // relatório silencioso: o `exitCode` viraria 1 sem dizer por quê. O caso
    // exercita o texto que o comando de fato imprime.
    const report = inspectDependencies(defaultEnvironment(), root);
    const rendered = renderReport(report);

    expect(diagnoseAgents(root)).toHaveLength(1);
    expect(rendered).toMatch(/maestro/);
    expect(rendered).toMatch(/apagado\.md/);
    expect(report.exitCode).not.toBe(0);
  });
});

describe("AC-011 — o doctor não altera nada", () => {
  // TRACEABILITY: US-001 FR-004 NFR-002 AC-011
  it("a árvore do projeto permanece idêntica depois do diagnóstico", async () => {
    const { diagnoseAgents } = await import("../src/agents/diagnose");
    const root = brokenProject();
    const before = hashTree(root);

    diagnoseAgents(root);

    expect(hashTree(root)).toBe(before);
  });
});

describe("AC-012 — config íntegra passa limpa pelo doctor", () => {
  // TRACEABILITY: US-001 FR-004 NFR-001 AC-012
  it("nenhuma divergência de perfil de agente num projeto recém-configurado", async () => {
    const { diagnoseAgents } = await import("../src/agents/diagnose");
    const root = project();
    setup(root);

    expect(diagnoseAgents(root)).toEqual([]);
  });
});
