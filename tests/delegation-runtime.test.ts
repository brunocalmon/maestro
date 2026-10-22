import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { profile, plan, reader } from "./delegation-fixtures";

function project(): string {
  const root = mkdtempSync(join(tmpdir(), "delegation-runtime-"));
  mkdirSync(resolve(root, ".maestro"), { recursive: true });
  return root;
}

const BASE = "# padrão\nApresente o plano antes de executar.";
const files = { ".maestro/subagents/maestro/behavior.md": BASE };

describe("AC-010 — cli sem contexto de execução é recusado", () => {
  // TRACEABILITY: US-001 FR-004 NFR-002 AC-010
  it("recusa nomeando a ausência do contexto de execução, sem rodar às cegas", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const config = { maestro: profile("maestro"), subagents: [] };

    const result = runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cli/i);
  });

  it("com contexto de execução, o agente cli de fato roda (SPEC-0019)", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const config = { maestro: profile("maestro"), subagents: [] };

    const result = runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "cli" }]), config, reader(files), BASE, {
      root: "/tmp",
      detected: [{ name: "claude", present: true, version: "1.0.0", supported: true }],
      ask: () => true,
      spawn: () => ({ ok: true, stdout: "olá", stderr: "", exitCode: 0 }),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.text).toMatch(/backend: claude/);
      expect(result.text).toMatch(/exitCode: 0/);
    }
  });
});

describe("AC-011 — auto resolve para o nativo enquanto for a única via", () => {
  // TRACEABILITY: US-001 FR-004 NFR-001 AC-011
  it("emite briefing normalmente para runtime auto", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const config = { maestro: profile("maestro"), subagents: [] };

    const result = runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "auto" }]), config, reader(files), BASE);

    expect(result.ok).toBe(true);
  });
});

describe("AC-012 — emitir briefing não grava nada", () => {
  // TRACEABILITY: US-001 FR-004 NFR-002 AC-012
  it("o projeto permanece idêntico depois da emissão", async () => {
    const { runDelegation } = await import("../src/delegation/run");
    const root = project();
    const before = existsSync(join(root, ".maestro", "plans"));

    const config = { maestro: profile("maestro"), subagents: [] };
    runDelegation(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "native" }]), config, reader(files), BASE);

    expect(existsSync(join(root, ".maestro", "plans"))).toBe(before);
  });
});
