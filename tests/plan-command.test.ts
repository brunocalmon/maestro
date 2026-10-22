import { describe, it, expect } from "vitest";
import { run } from "../src/cli";

describe("AC-001 — o comando exige a tarefa", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-001
  it("recusa quando --task não é informado, sem apresentar plano", () => {
    const outcome = run(["plan"]);

    expect(outcome.exitCode).not.toBe(0);
    expect(outcome.output).toMatch(/--task/);
  });
});

describe("AC-002 — o comando publica seu uso", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-002
  it("imprime o uso e sai com zero em --help", () => {
    const outcome = run(["plan", "--help"]);

    expect(outcome.exitCode).toBe(0);
    expect(outcome.output).toMatch(/usage: maestro plan/);
  });
});

describe("AC-013 — flag desconhecida é recusada, não ignorada", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-013
  it("nomeia a opção que não reconhece", () => {
    const outcome = run(["plan", "--task", "x", "--modo-turbo"]);

    expect(outcome.exitCode).not.toBe(0);
    expect(outcome.output).toMatch(/modo-turbo/);
  });
});
