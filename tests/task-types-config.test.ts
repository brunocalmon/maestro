import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { runSetup } from "../src/setup/run";
import { detectEnvironment } from "../src/setup/env";
import { project, fixedDecision } from "./aprovacao-fixtures";

function setup(root: string) {
  return runSetup({ env: detectEnvironment(root), root, write: true, approval: { source: fixedDecision(true) } });
}
const config = (root: string) => parse(readFileSync(join(root, ".maestro", "config.yaml"), "utf8"));

describe("AC-004 — os tipos de tarefa vêm da configuração", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-004
  it("o setup semeia os tipos, cada um com sua janela mínima", () => {
    const root = project();
    setup(root);

    const types = config(root).maestro.task_types;
    expect(types).toBeDefined();
    const names = Object.keys(types);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(types[name].context_window_min, name).toMatchObject({
        mode: expect.stringMatching(/^(suggested|required)$/),
      });
    }
  });
});

describe("AC-005 — a configuração da pessoa não é sobrescrita", () => {
  // TRACEABILITY: US-001 FR-002 NFR-002 AC-005
  it("um tipo próprio sobrevive a uma segunda execução do setup", () => {
    const root = project();
    setup(root);

    const path = join(root, ".maestro", "config.yaml");
    const raw = readFileSync(path, "utf8");
    writeFileSync(path, raw.replace(/^  task_types:$/m, "  task_types:\n    auditoria:\n      context_window_min: { value: 200000, mode: required }"));

    setup(root);

    expect(config(root).maestro.task_types.auditoria.context_window_min.value).toBe(200000);
  });
});

describe("AC-006 — tipo desconhecido é recusado", () => {
  // TRACEABILITY: US-001 FR-002 NFR-002 AC-006
  it("nomeia o tipo pedido e os disponíveis", async () => {
    const { resolveTaskType } = await import("../src/models/task-type");
    const types = { revisao: { context_window_min: { value: 100000, mode: "suggested" as const } } };

    expect(() => resolveTaskType(types, "inexistente")).toThrowError(/inexistente[\s\S]*revisao|revisao[\s\S]*inexistente/);
  });
});
