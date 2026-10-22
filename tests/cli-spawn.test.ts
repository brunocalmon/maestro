import { describe, it, expect } from "vitest";

describe("AC-016 — stdout e stderr são relatados como texto bruto", () => {
  // TRACEABILITY: US-001 FR-006 NFR-001 AC-016
  it("devolve os dois como texto, sem interpretação", async () => {
    const { spawnCliAgent } = await import("../src/delegation/cli-spawn");

    const result = spawnCliAgent("node", ["-e", "process.stdout.write('ola'); process.stderr.write('aviso')"], {});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.stdout).toBe("ola");
      expect(result.stderr).toBe("aviso");
    }
  });
});

describe("AC-017 — o código de saída é repassado", () => {
  // TRACEABILITY: US-001 FR-006 NFR-001 AC-017
  it("um comando que sai com código 3 devolve exitCode 3", async () => {
    const { spawnCliAgent } = await import("../src/delegation/cli-spawn");

    const result = spawnCliAgent("node", ["-e", "process.exit(3)"], {});

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.exitCode).toBe(3);
  });
});

describe("AC-018 — timeout produz erro claro, sem travar", () => {
  // TRACEABILITY: US-001 FR-006 NFR-002 AC-018
  it("um comando que nunca termina produz resultado de timeout", async () => {
    const { spawnCliAgent } = await import("../src/delegation/cli-spawn");

    const result = spawnCliAgent("node", ["-e", "setInterval(() => {}, 1000)"], { timeoutMs: 300 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/timeout/i);
  }, 10000);
});
