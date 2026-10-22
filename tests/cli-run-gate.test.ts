import { describe, it, expect } from "vitest";

describe("AC-013 — cada spawn real pede decisão antes de rodar", () => {
  // TRACEABILITY: US-001 FR-005 NFR-002 AC-013
  it("decisão positiva injetada inicia o spawn", async () => {
    const { decideSpawn } = await import("../src/delegation/cli-gate");

    const result = decideSpawn(() => true);

    expect(result.approved).toBe(true);
  });
});

describe("AC-014 — recusar um agente não impede os demais", () => {
  // TRACEABILITY: US-001 FR-005 NFR-001 AC-014
  it("recusar o primeiro de dois não impede o segundo, com decisão positiva", async () => {
    const { decideSpawn } = await import("../src/delegation/cli-gate");

    const first = decideSpawn(() => false);
    const second = decideSpawn(() => true);

    expect(first.approved).toBe(false);
    expect(second.approved).toBe(true);
  });
});

describe("AC-015 — ausência ou documento malformado é recusa", () => {
  // TRACEABILITY: US-001 FR-005 NFR-002 AC-015
  it("fonte de decisão que lança é tratada como recusa, sem spawn", async () => {
    const { decideSpawn } = await import("../src/delegation/cli-gate");

    const result = decideSpawn(() => {
      throw new Error("entrada malformada");
    });

    expect(result.approved).toBe(false);
  });
});
