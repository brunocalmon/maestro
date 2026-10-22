import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// TRACEABILITY: US-001 FR-004 AC-010 — projeto descartável, o mesmo padrão da SPEC-0013.
function project(): string {
  const root = mkdtempSync(join(tmpdir(), "plan-store-"));
  mkdirSync(resolve(root, ".maestro"), { recursive: true });
  return root;
}

const PLAN = {
  trace: "a1b2c3d4e5f60718293a4b5c6d7e8f90",
  createdAt: "2026-09-07T00:00:00.000Z",
  approvedAt: "2026-09-07T00:00:05.000Z",
  task: "renomear um módulo",
  agents: [{ profile: "maestro", model: "qwen3:8b", runtime: "auto" as const }],
  candidates: { profiles: ["maestro"], backends: ["claude"] },
};

describe("AC-010 — o plano aprovado é identificado pelo trace da execução", () => {
  // TRACEABILITY: US-001 FR-004 NFR-001 AC-010
  it("grava com o identificador da execução, dentro e fora do arquivo", async () => {
    const { writeApprovedPlan } = await import("../src/plan/store");
    const root = project();

    writeApprovedPlan(root, PLAN);

    expect(existsSync(join(root, ".maestro", "plans", `${PLAN.trace}.json`))).toBe(true);
  });
});

describe("AC-011 — o gravado é o mesmo que foi apresentado", () => {
  // TRACEABILITY: US-001 FR-004 NFR-001 AC-011
  it("agente, modelo e runtime sobrevivem ao round trip", async () => {
    const { writeApprovedPlan, readApprovedPlan } = await import("../src/plan/store");
    const root = project();

    writeApprovedPlan(root, PLAN);
    const back = readApprovedPlan(root, PLAN.trace);

    expect(back?.agents).toEqual(PLAN.agents);
    expect(back?.trace).toBe(PLAN.trace);
  });
});

describe("AC-012 — o artefato é legível sem replanejar", () => {
  // TRACEABILITY: US-001 FR-004 NFR-001 AC-012
  it("a leitura por identificador devolve a mesma forma gravada", async () => {
    const { writeApprovedPlan, readApprovedPlan } = await import("../src/plan/store");
    const root = project();

    writeApprovedPlan(root, PLAN);

    expect(readApprovedPlan(root, PLAN.trace)).toEqual(PLAN);
    expect(readApprovedPlan(root, "naoexiste")).toBeNull();
  });
});
