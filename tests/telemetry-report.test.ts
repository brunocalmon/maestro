import { describe, it, expect } from "vitest";
import type { TelemetryRecord } from "../src/telemetry/store";

const record = (): TelemetryRecord => ({
  trace: "trace-x",
  agents: [
    {
      agent: "maestro",
      backend: "claude",
      model: "qwen3:8b",
      startedAt: "2026-09-07T00:00:00.000Z",
      durationMs: 120,
      outcome: "ran",
      exitCode: 0,
    },
  ],
});

describe("AC-008 — maestro report apresenta os registros de um trace", () => {
  // TRACEABILITY: US-002 FR-004 NFR-001 AC-008
  it("nomeia agente, backend, modelo e resultado de cada registro", async () => {
    const { renderTelemetry } = await import("../src/telemetry/render");

    const text = renderTelemetry(record());

    expect(text).toMatch(/maestro/);
    expect(text).toMatch(/claude/);
    expect(text).toMatch(/qwen3:8b/);
    expect(text).toMatch(/ran|exitCode: 0/);
  });
});

describe("AC-014 — relatório com só recusas ainda é legível", () => {
  // TRACEABILITY: US-002 FR-004 NFR-001 AC-014
  it("nomeia cada recusa e seu motivo, sem exigir nenhum registro ran", async () => {
    const { renderTelemetry } = await import("../src/telemetry/render");
    const refusedOnly: TelemetryRecord = {
      trace: "trace-y",
      agents: [
        {
          agent: "maestro",
          backend: "agy",
          model: "qwen3:8b",
          startedAt: "2026-09-07T00:00:00.000Z",
          durationMs: 3,
          outcome: "refused",
          stage: "tools",
          reason: "backend agy has no tools allowlist",
        },
      ],
    };

    const text = renderTelemetry(refusedOnly);

    expect(text).toMatch(/refused/);
    expect(text).toMatch(/tools allowlist/);
  });
});

describe("AC-009 — trace sem telemetria é recusado nomeando a ausência", () => {
  // TRACEABILITY: US-002 FR-004 NFR-002 AC-009
  it("formatReport recusa nomeando a ausência, código de saída diferente de zero", async () => {
    const { mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const cliModule = await import("../src/cli");

    const root = mkdtempSync(join(tmpdir(), "telemetry-report-"));
    const cwdSpy = process.cwd;
    process.cwd = () => root;
    try {
      const result = cliModule.run(["report", "does-not-exist"]);
      expect(result.exitCode).not.toBe(0);
      expect(result.output).toMatch(/does-not-exist/);
    } finally {
      process.cwd = cwdSpy;
    }
  });
});
