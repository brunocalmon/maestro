import { describe, it, expect } from "vitest";
import type { BackendResult } from "../src/backends/detect";
import type { AgentTelemetryEntry } from "../src/telemetry/record";
import { profile, plan, reader } from "./delegation-fixtures";

const BASE = "# padrão\nApresente o plano antes de executar.";
const files = { ".maestro/subagents/maestro/behavior.md": BASE };
const detected = (names: string[]): BackendResult[] => names.map((name) => ({ name, present: true, version: "1.0.0", supported: true }));

function collect() {
  const entries: AgentTelemetryEntry[] = [];
  return { entries, record: (entry: AgentTelemetryEntry) => entries.push(entry), now: () => "2026-09-07T00:00:00.000Z" };
}

describe("AC-001 — spawn executado grava um registro completo", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-001
  it("grava outcome ran com backend, modelo, exitCode e duração", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const telemetry = collect();
    const config = { maestro: profile("maestro"), subagents: [] };

    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE, {
      root: "/tmp",
      detected: detected(["claude"]),
      ask: () => true,
      spawn: () => ({ ok: true, stdout: "ola", stderr: "", exitCode: 0 }),
      telemetry,
    });

    expect(telemetry.entries).toHaveLength(1);
    const entry = telemetry.entries[0];
    expect(entry.outcome).toBe("ran");
    if (entry.outcome === "ran") {
      expect(entry.backend).toBe("claude");
      expect(entry.model).toBe("qwen3:8b");
      expect(entry.exitCode).toBe(0);
      expect(entry.durationMs).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("AC-002 — tools required não suportável grava recusa", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-002
  it("grava outcome refused com stage tools", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const telemetry = collect();
    const config = { maestro: profile("maestro", { tools: ["edit", "bash"] }), subagents: [] };
    config.maestro.capability.tools.mode = "required";

    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE, {
      root: "/tmp",
      detected: detected(["agy"]),
      ask: () => true,
      spawn: () => ({ ok: true, stdout: "", stderr: "", exitCode: 0 }),
      telemetry,
    });

    expect(telemetry.entries).toHaveLength(1);
    const entry = telemetry.entries[0];
    expect(entry.outcome).toBe("refused");
    if (entry.outcome === "refused") expect(entry.stage).toBe("tools");
  });
});

describe("AC-003 — backend ausente grava recusa", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-003
  it("grava outcome refused com stage backend", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const telemetry = collect();
    const agentProfile = profile("maestro");
    agentProfile.execution = { ...agentProfile.execution, cli_backend: { value: "pi", mode: "required" } } as typeof agentProfile.execution;
    const config = { maestro: agentProfile, subagents: [] };

    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE, {
      root: "/tmp",
      detected: detected(["claude"]),
      ask: () => true,
      spawn: () => ({ ok: true, stdout: "", stderr: "", exitCode: 0 }),
      telemetry,
    });

    expect(telemetry.entries).toHaveLength(1);
    const entry = telemetry.entries[0];
    expect(entry.outcome).toBe("refused");
    if (entry.outcome === "refused") expect(entry.stage).toBe("backend");
  });
});

describe("AC-004 — decisão negativa do gate grava recusa", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-004
  it("grava outcome refused com stage gate", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const telemetry = collect();
    const config = { maestro: profile("maestro"), subagents: [] };

    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE, {
      root: "/tmp",
      detected: detected(["claude"]),
      ask: () => false,
      spawn: () => ({ ok: true, stdout: "", stderr: "", exitCode: 0 }),
      telemetry,
    });

    expect(telemetry.entries).toHaveLength(1);
    const entry = telemetry.entries[0];
    expect(entry.outcome).toBe("refused");
    if (entry.outcome === "refused") expect(entry.stage).toBe("gate");
  });
});

describe("AC-005 — native e auto nunca geram registro", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-005
  it("nenhum registro é gravado para native, mas o mesmo coletor grava para cli", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const telemetry = collect();
    const config = { maestro: profile("maestro"), subagents: [] };
    const cliRuntime = {
      root: "/tmp",
      detected: detected(["claude"]),
      ask: () => true,
      spawn: () => ({ ok: true as const, stdout: "", stderr: "", exitCode: 0 }),
      telemetry,
    };

    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "native" }]), config, reader(files), BASE, cliRuntime);
    expect(telemetry.entries).toHaveLength(0);

    // Prova que o coletor está de fato ligado: o mesmo runDelegation, com runtime cli, grava.
    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE, cliRuntime);
    expect(telemetry.entries).toHaveLength(1);
  });
});

describe("AC-007 — nenhum registro contém stdout/stderr", () => {
  // TRACEABILITY: US-001 FR-001 NFR-002 AC-007
  it("nenhuma chave do registro contém o texto do subprocesso", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const telemetry = collect();
    const config = { maestro: profile("maestro"), subagents: [] };
    const secretOutput = "SEGREDO-DE-PROJETO-NAO-PODE-VAZAR";

    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE, {
      root: "/tmp",
      detected: detected(["claude"]),
      ask: () => true,
      spawn: () => ({ ok: true, stdout: secretOutput, stderr: secretOutput, exitCode: 0 }),
      telemetry,
    });

    expect(telemetry.entries).toHaveLength(1);
    const serialized = JSON.stringify(telemetry.entries);
    expect(serialized).not.toContain(secretOutput);
  });
});

describe("AC-010 — plano misto grava telemetria só para o agente cli", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-010
  it("só o agente cli produz registro", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const telemetry = collect();
    const config = { maestro: profile("maestro"), subagents: [profile("gitops-dev")] };

    runDelegation(
      plan([
        { profile: "maestro", model: "qwen3:8b", runtime: "native" },
        { profile: "gitops-dev", model: "qwen3:8b", runtime: "cli" },
      ]),
      config,
      reader(files),
      BASE,
      {
        root: "/tmp",
        detected: detected(["claude"]),
        ask: () => true,
        spawn: () => ({ ok: true, stdout: "", stderr: "", exitCode: 0 }),
        telemetry,
      },
    );

    expect(telemetry.entries).toHaveLength(1);
    expect(telemetry.entries[0].agent).toBe("gitops-dev");
  });
});

describe("AC-011 — plano só com native/auto não cria arquivo de telemetria", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-011
  it("o hook nunca é chamado para auto, mas o mesmo coletor grava para cli", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const telemetry = collect();
    const config = { maestro: profile("maestro"), subagents: [] };
    const cliRuntime = {
      root: "/tmp",
      detected: detected(["claude"]),
      ask: () => true,
      spawn: () => ({ ok: true as const, stdout: "", stderr: "", exitCode: 0 }),
      telemetry,
    };

    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "auto" }]), config, reader(files), BASE, cliRuntime);
    expect(telemetry.entries).toHaveLength(0);

    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE, cliRuntime);
    expect(telemetry.entries).toHaveLength(1);
  });
});
