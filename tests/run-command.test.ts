import { describe, it, expect } from "vitest";
import { run } from "../src/cli";

describe("AC-001 — o comando exige a execução", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-001
  it("recusa quando o identificador não é informado", () => {
    const outcome = run(["run"]);

    expect(outcome.exitCode).not.toBe(0);
    expect(outcome.output).toMatch(/execution identifier|identificador da execução/i);
  });
});

describe("AC-002 — o comando publica seu uso", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-002
  it("imprime o uso e sai com zero em --help", () => {
    const outcome = run(["run", "--help"]);

    expect(outcome.exitCode).toBe(0);
    expect(outcome.output).toMatch(/usage: maestro run/);
  });
});

describe("AC-003 — execução inexistente é recusada", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-003
  it("identificador sem plano aprovado é recusado", () => {
    const outcome = run(["run", "naoexisteesteidentificador"]);

    expect(outcome.exitCode).not.toBe(0);
    expect(outcome.output).toMatch(/não há plano|no approved plan|plano.*(não|nao) encontrado/i);
  });
});
