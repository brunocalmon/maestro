import { describe, it, expect } from "vitest";

const BASE = "# padrão\nSempre apresente um plano antes de executar.";
const OWN = "# próprio\nFale só português.";
const EXTRA = "# extra\nNunca toque em migrations.";

describe("AC-004 — o comportamento padrão vale quando nada é declarado", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-004
  it("sem behavior nem additional_behavior, o resultado é o padrão", async () => {
    const { composeBehavior } = await import("../src/delegation/behavior");
    expect(composeBehavior({ base: BASE, behavior: null, additional: null })).toBe(BASE);
  });
});

describe("AC-005 — behavior substitui o padrão", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-005
  it("com behavior próprio, o padrão não aparece", async () => {
    const { composeBehavior } = await import("../src/delegation/behavior");
    const result = composeBehavior({ base: BASE, behavior: OWN, additional: null });

    expect(result).toContain("Fale só português");
    expect(result).not.toContain("Sempre apresente um plano");
  });
});

describe("AC-006 — additional_behavior soma ao que vale", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-006
  it("com additional e sem behavior, os dois textos aparecem", async () => {
    const { composeBehavior } = await import("../src/delegation/behavior");
    const result = composeBehavior({ base: BASE, behavior: null, additional: EXTRA });

    expect(result).toContain("Sempre apresente um plano");
    expect(result).toContain("Nunca toque em migrations");
  });
});
