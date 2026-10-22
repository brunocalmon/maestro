import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// TRACEABILITY: US-001 FR-003 AC-007 — projeto descartável, o mesmo padrão da SPEC-0013.
function project(): string {
  const root = mkdtempSync(join(tmpdir(), "plan-approval-"));
  mkdirSync(resolve(root, ".maestro"), { recursive: true });
  return root;
}

const PLAN = {
  trace: "0f1e2d3c4b5a69788796a5b4c3d2e1f0",
  createdAt: "2026-09-07T00:00:00.000Z",
  task: "renomear um módulo",
  agents: [{ profile: "maestro", model: "qwen3:8b", runtime: "auto" as const }],
  candidates: { profiles: ["maestro"], backends: ["claude"] },
};

/** Decisão injetada, para o gate ser exercitável sem TTY nem stdin real. */
const decision = (approved: boolean) => ({ ask: () => approved });
const throwing = { ask: () => { throw new Error("documento malformado"); } };

function plansIn(root: string): string[] {
  const dir = join(root, ".maestro", "plans");
  return existsSync(dir) ? readdirSync(dir) : [];
}

describe("AC-006 — o plano é apresentado antes da decisão", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-006
  it("o texto nomeia agente, modelo e runtime e declara que nada roda sem aprovação", async () => {
    const { renderPlan } = await import("../src/plan/render");
    const text = renderPlan(PLAN);

    expect(text).toMatch(/maestro/);
    expect(text).toMatch(/qwen3:8b/);
    expect(text).toMatch(/auto/);
    expect(text).toMatch(/approval|aprova/i);
  });
});

describe("AC-007 — aprovar produz o plano aprovado", () => {
  // TRACEABILITY: US-001 FR-003 FR-004 AC-007
  it("devolve o plano aprovado e grava o artefato", async () => {
    const { decidePlan } = await import("../src/plan/run");
    const root = project();

    const result = decidePlan(root, PLAN, decision(true), () => "2026-09-07T00:00:05.000Z");

    expect(result.approved).toBe(true);
    expect(plansIn(root)).toEqual([`${PLAN.trace}.json`]);
  });
});

describe("AC-008 — recusar não grava nada", () => {
  // TRACEABILITY: US-001 FR-003 FR-004 NFR-002 AC-008
  it("nenhum arquivo aparece e o resultado é negativo", async () => {
    const { decidePlan } = await import("../src/plan/run");
    const root = project();

    const result = decidePlan(root, PLAN, decision(false), () => "2026-09-07T00:00:05.000Z");

    expect(result.approved).toBe(false);
    expect(plansIn(root)).toEqual([]);
  });
});

describe("AC-009 — resposta ausente ou malformada é negativa", () => {
  // TRACEABILITY: US-001 FR-003 NFR-002 AC-009
  it("uma fonte que lança é tratada como recusa, sem gravar", async () => {
    const { decidePlan } = await import("../src/plan/run");
    const root = project();

    const result = decidePlan(root, PLAN, throwing, () => "2026-09-07T00:00:05.000Z");

    expect(result.approved).toBe(false);
    expect(plansIn(root)).toEqual([]);
  });
});
