import { describe, it, expect } from "vitest";
import type { BackendResult } from "../src/backends/detect";
import { profile } from "./delegation-fixtures";

const detected = (names: string[]): BackendResult[] =>
  names.map((name) => ({ name, present: true, version: "1.0.0", supported: true }));

describe("AC-010 — sem backend declarado, usa o primeiro detectado", () => {
  // TRACEABILITY: US-001 FR-004 NFR-001 AC-010
  it("escolhe o primeiro presente na ordem fixa", async () => {
    const { selectBackend } = await import("../src/delegation/cli-select");
    const agent = profile("maestro");

    const result = selectBackend(agent, detected(["claude", "codex", "goose"]));

    expect(result).toMatchObject({ ok: true, backend: "claude" });
  });
});

describe("AC-011 — backend required indisponível é recusado", () => {
  // TRACEABILITY: US-001 FR-004 NFR-002 AC-011
  it("recusa nomeando o backend ausente", async () => {
    const { selectBackend } = await import("../src/delegation/cli-select");
    const agent = profile("maestro");
    agent.execution = { ...agent.execution, cli_backend: { value: "pi", mode: "required" } } as typeof agent.execution;

    const result = selectBackend(agent, detected(["claude", "codex"]));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/pi/);
  });
});

describe("AC-012 — backend suggested indisponível cai para outro detectado", () => {
  // TRACEABILITY: US-001 FR-004 NFR-001 AC-012
  it("escolhe o outro backend presente, não uma recusa", async () => {
    const { selectBackend } = await import("../src/delegation/cli-select");
    const agent = profile("maestro");
    agent.execution = { ...agent.execution, cli_backend: { value: "pi", mode: "suggested" } } as typeof agent.execution;

    const result = selectBackend(agent, detected(["goose"]));

    expect(result).toMatchObject({ ok: true, backend: "goose" });
  });
});
