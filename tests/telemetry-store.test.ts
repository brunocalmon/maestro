import { describe, it, expect } from "vitest";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { AgentTelemetryEntry } from "../src/telemetry/record";

function project(): string {
  return mkdtempSync(join(tmpdir(), "telemetry-store-"));
}

const ran = (agent: string): AgentTelemetryEntry => ({
  agent,
  backend: "claude",
  model: "qwen3:8b",
  startedAt: "2026-09-07T00:00:00.000Z",
  durationMs: 42,
  outcome: "ran",
  exitCode: 0,
});

describe("AC-006 — dois agentes do mesmo plano acumulam sem se sobrescrever", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-006
  it("o arquivo de telemetria daquele trace contém os dois registros", async () => {
    const { appendTelemetryEntry, readTelemetryRecord } = await import("../src/telemetry/store");
    const root = project();

    appendTelemetryEntry(root, "trace-1", ran("maestro"));
    appendTelemetryEntry(root, "trace-1", ran("gitops-dev"));

    const record = readTelemetryRecord(root, "trace-1");
    expect(record?.agents).toHaveLength(2);
    expect(record?.agents.map((a) => a.agent)).toEqual(["maestro", "gitops-dev"]);
  });
});

describe("AC-012 — duas chamadas para o mesmo trace acumulam, não sobrescrevem", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-012
  it("preserva a ordem em que os registros foram gravados", async () => {
    const { appendTelemetryEntry, readTelemetryRecord } = await import("../src/telemetry/store");
    const root = project();

    appendTelemetryEntry(root, "trace-2", { ...ran("first"), exitCode: 1 });
    appendTelemetryEntry(root, "trace-2", { ...ran("second"), exitCode: 0 });

    const record = readTelemetryRecord(root, "trace-2");
    expect(record?.agents[0].agent).toBe("first");
    expect(record?.agents[1].agent).toBe("second");
  });
});

describe("AC-013 — diretório de telemetria é criado quando ausente", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-013
  it("cria o diretório e o arquivo do trace com o primeiro registro", async () => {
    const { appendTelemetryEntry, TELEMETRY_DIR } = await import("../src/telemetry/store");
    const root = project();
    expect(existsSync(resolve(root, TELEMETRY_DIR))).toBe(false);

    appendTelemetryEntry(root, "trace-3", ran("maestro"));

    expect(existsSync(resolve(root, TELEMETRY_DIR, "trace-3.json"))).toBe(true);
  });
});
