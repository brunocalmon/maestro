import { describe, it, expect } from "vitest";
import { runSubsystemDoctors, type SubsystemExecutor } from "../src/doctor/subsystems";

const fixedExecutor = (byBin: Record<string, { status: number | "timeout" | null; output?: string }>): SubsystemExecutor => (bin) => {
  const r = byBin[bin] ?? { status: null };
  return { status: r.status, output: r.output ?? "" };
};

describe("AC-009 — sub-doctors executados com status próprio", () => {
  // SPECSFY: US-003 FR-005 NFR-002 AC-009
  it("specsfy OK, context-mode FAIL, skills OK, code-review-graph ausente", () => {
    const executor = fixedExecutor({
      specsfy: { status: 0 },
      "context-mode": { status: 1, output: "hooks broken" },
      skills: { status: 0 },
      "code-review-graph": { status: null },
    });
    const results = runSubsystemDoctors("/tmp/does-not-matter", executor, 5000);
    const byName = Object.fromEntries(results.map((r) => [r.name, r]));
    expect(byName.specsfy?.status).toBe("OK");
    expect(byName["context-mode"]?.status).toBe("FAIL");
    expect(byName["context-mode"]?.detail).toContain("hooks broken");
    expect(byName.skills?.status).toBe("OK");
    expect(byName["code-review-graph"]?.status).toBe("ABSENT");
  });
});

describe("AC-010 — sub-doctor em timeout não aborta os demais", () => {
  // SPECSFY: US-003 FR-005 NFR-002 AC-010
  it("context-mode em timeout vira FAIL; os outros três continuam com seus status", () => {
    const executor = fixedExecutor({
      specsfy: { status: 0 },
      "context-mode": { status: "timeout" },
      skills: { status: 0 },
      "code-review-graph": { status: 0 },
    });
    const results = runSubsystemDoctors("/tmp/x", executor, 5000);
    expect(results).toHaveLength(4);
    const byName = Object.fromEntries(results.map((r) => [r.name, r]));
    expect(byName["context-mode"]?.status).toBe("FAIL");
    expect(byName["context-mode"]?.detail).toMatch(/timeout/);
    expect(byName.specsfy?.status).toBe("OK");
    expect(byName.skills?.status).toBe("OK");
    expect(byName["code-review-graph"]?.status).toBe("OK");
  });
});

describe("AC-011 — todos os sub-doctors OK não alteram o resultado", () => {
  // SPECSFY: US-003 FR-005 FR-008 AC-011
  it("quatro OK produz quatro status OK", () => {
    const executor = fixedExecutor({
      specsfy: { status: 0 },
      "context-mode": { status: 0 },
      skills: { status: 0 },
      "code-review-graph": { status: 0 },
    });
    const results = runSubsystemDoctors("/tmp/x", executor, 5000);
    expect(results.every((r) => r.status === "OK")).toBe(true);
  });
});
