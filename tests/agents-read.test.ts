import { describe, it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { project } from "./aprovacao-fixtures";

/** Config mínima com um perfil de subagent, escrita direto para não depender da semeadura. */
function writeConfig(root: string, maestro: string): string {
  mkdirSync(join(root, ".maestro", "subagents", "maestro"), { recursive: true });
  writeFileSync(join(root, ".maestro", "subagents", "maestro", "behavior.md"), "# padrão\n");
  writeFileSync(join(root, ".maestro", "config.yaml"), `maestro:\n${maestro}`);
  return root;
}

const MAESTRO_BASE = `  identity:
    name: { value: maestro, mode: required }
  instruction:
    behavior: { value: .maestro/subagents/maestro/behavior.md, mode: suggested }
`;

describe("AC-007 — o leitor carrega perfis válidos", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-007
  it("devolve o subagent declarado com modelo e mode preservados, junto do maestro", async () => {
    const { readAgentConfig } = await import("../src/agents/read");
    const root = writeConfig(
      project(),
      `${MAESTRO_BASE}  subagents:
    - identity:
        name: { value: gitops-dev, mode: required }
      cognition:
        model: { value: "qwen3:8b", mode: required }
`,
    );

    const config = readAgentConfig(root);

    expect(config.maestro.identity.name.value).toBe("maestro");
    expect(config.subagents).toHaveLength(1);
    expect(config.subagents[0]!.cognition.model).toEqual({ value: "qwen3:8b", mode: "required" });
  });
});

describe("AC-008 — referência quebrada faz a leitura recusar em voz alta", () => {
  // TRACEABILITY: US-001 FR-003 NFR-002 AC-008
  it("falha nomeando o perfil e o caminho quando o behavior não existe", async () => {
    const { readAgentConfig } = await import("../src/agents/read");
    const root = writeConfig(
      project(),
      `  identity:
    name: { value: maestro, mode: required }
  instruction:
    behavior: { value: .maestro/subagents/maestro/apagado.md, mode: suggested }
`,
    );

    expect(() => readAgentConfig(root)).toThrowError(/maestro.*apagado\.md|apagado\.md.*maestro/s);
  });
});

describe("AC-009 — mode inválido é recusado", () => {
  // TRACEABILITY: US-001 FR-003 NFR-002 AC-009
  it("falha nomeando a propriedade e o valor fora do domínio", async () => {
    const { readAgentConfig } = await import("../src/agents/read");
    const root = writeConfig(
      project(),
      `  identity:
    name: { value: maestro, mode: obrigatorio }
`,
    );

    expect(() => readAgentConfig(root)).toThrowError(/identity\.name.*obrigatorio|obrigatorio.*identity\.name/s);
  });
});
