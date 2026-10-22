import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
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

function readConfig(root: string): Record<string, any> {
  return parse(readFileSync(join(root, ".maestro", "config.yaml"), "utf8"));
}

/**
 * Toda propriedade configurável da seção, incluindo as aninhadas.
 *
 * `subagents` é lista de perfis e `task_types` (SPEC-0017) é mapa de tipos:
 * nenhum dos dois é propriedade, mas o que está dentro deles é — e a
 * invariante do formato `{ value, mode }` precisa alcançar lá dentro, senão
 * um grupo novo escaparia da regra só por ser aninhado.
 */
function properties(profile: Record<string, any>): [string, unknown][] {
  const out: [string, unknown][] = [];
  for (const [group, body] of Object.entries(profile)) {
    if (group === "subagents") continue;
    if (group === "task_types") {
      for (const [type, requirement] of Object.entries(body as Record<string, Record<string, unknown>>)) {
        for (const [name, value] of Object.entries(requirement)) out.push([`task_types.${type}.${name}`, value]);
      }
      continue;
    }
    for (const [name, value] of Object.entries(body as Record<string, unknown>)) {
      out.push([`${group}.${name}`, value]);
    }
  }
  return out;
}

describe("AC-001 — a seção maestro existe e está completa após o setup", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-001
  it("declara os cinco grupos e a lista subagents", () => {
    const root = project();
    setup(root);

    const maestro = readConfig(root).maestro;
    expect(maestro).toBeDefined();
    for (const group of ["identity", "cognition", "instruction", "capability", "execution"]) {
      expect(maestro).toHaveProperty(group);
    }
    expect(Array.isArray(maestro.subagents)).toBe(true);
  });
});

describe("AC-002 — toda propriedade usa o formato uniforme value/mode", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-002
  it("cada propriedade configurável é um objeto com value e mode no domínio", () => {
    const root = project();
    setup(root);

    const entries = properties(readConfig(root).maestro);
    expect(entries.length).toBeGreaterThan(0);
    for (const [path, value] of entries) {
      expect(value, path).toMatchObject({ mode: expect.stringMatching(/^(suggested|required)$/) });
      expect(value, path).toHaveProperty("value");
    }
  });
});

describe("AC-003 — o setup não sobrescreve configuração já existente", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-003
  it("preserva um subagent declarado pela pessoa numa segunda execução", () => {
    const root = project();
    setup(root);

    const path = join(root, ".maestro", "config.yaml");
    const raw = readFileSync(path, "utf8");
    writeFileSync(
      path,
      raw.replace(
        /^  subagents:.*$/m,
        "  subagents:\n    - identity:\n        name: { value: gitops-dev, mode: required }",
      ),
    );

    setup(root);

    const subagents = readConfig(root).maestro.subagents;
    expect(subagents).toHaveLength(1);
    expect(subagents[0].identity.name.value).toBe("gitops-dev");
  });
});
