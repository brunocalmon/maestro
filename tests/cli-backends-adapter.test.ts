import { describe, it, expect } from "vitest";
import type { AgentBrief } from "../src/delegation/brief";

const brief = (over: Partial<AgentBrief> = {}): AgentBrief => ({
  profile: "maestro",
  model: "qwen3:8b",
  behavior: "# padrão\nApresente o plano antes de executar.",
  skills: [],
  tools: [],
  ...over,
});

describe("AC-001 — cada backend suportado tem um adaptador", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-001
  it("resolve um adaptador para pi, agy, claude, codex e goose", async () => {
    const { resolveAdapter } = await import("../src/delegation/cli-backends/registry");
    const { SUPPORTED_AGENT_BACKENDS } = await import("../src/backends/known");

    for (const name of SUPPORTED_AGENT_BACKENDS) {
      const adapter = resolveAdapter(name);
      expect(adapter, name).toBeDefined();
      expect(adapter?.name).toBe(name);
    }
  });
});

describe("AC-002 — o modelo entra sem tradução", () => {
  // TRACEABILITY: US-001 FR-001 FR-007 NFR-001 AC-002
  it("qwen3:8b aparece idêntico nos argumentos dos cinco adaptadores", async () => {
    const { resolveAdapter } = await import("../src/delegation/cli-backends/registry");
    const { SUPPORTED_AGENT_BACKENDS } = await import("../src/backends/known");

    for (const name of SUPPORTED_AGENT_BACKENDS) {
      const adapter = resolveAdapter(name);
      const args = adapter!.buildArgs(brief());
      expect(args, name).toContain("qwen3:8b");
    }
  });
});

describe("AC-003 — os argumentos pedem saída estruturada", () => {
  // TRACEABILITY: US-001 FR-001 NFR-001 AC-003
  it("cada adaptador inclui sua própria flag de saída estruturada", async () => {
    const { resolveAdapter } = await import("../src/delegation/cli-backends/registry");

    const expected: Record<string, string> = {
      pi: "json",
      claude: "json",
      agy: "json",
      goose: "json",
      codex: "--json",
    };

    for (const [name, token] of Object.entries(expected)) {
      const adapter = resolveAdapter(name);
      const args = adapter!.buildArgs(brief());
      expect(args, name).toContain(token);
    }
  });
});

describe("AC-004 — pi, claude e goose recebem comportamento por flag", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-004
  it("o comportamento aparece na flag nativa daquele backend", async () => {
    const { resolveAdapter } = await import("../src/delegation/cli-backends/registry");

    for (const name of ["pi", "claude", "goose"]) {
      const adapter = resolveAdapter(name);
      expect(adapter?.injectsBehaviorByFlag, name).toBe(true);
      const args = adapter!.buildArgs(brief({ behavior: "comportamento único de teste" }));
      expect(args, name).toContain("comportamento único de teste");
    }
  });
});

describe("AC-019 — modelo desconhecido não é bloqueado antes do spawn", () => {
  // TRACEABILITY: US-001 FR-007 NFR-001 AC-019
  it("construir argumentos com um nome de modelo qualquer nunca lança nem recusa", async () => {
    const { resolveAdapter } = await import("../src/delegation/cli-backends/registry");
    const { SUPPORTED_AGENT_BACKENDS } = await import("../src/backends/known");

    for (const name of SUPPORTED_AGENT_BACKENDS) {
      const adapter = resolveAdapter(name);
      expect(() => adapter!.buildArgs(brief({ model: "modelo-que-nao-existe-em-lugar-nenhum" }))).not.toThrow();
    }
  });
});

describe("AC-020 — nenhuma tabela de tradução é consultada", () => {
  // TRACEABILITY: US-001 FR-007 NFR-001 AC-020
  it("o mesmo modelo em dois adaptadores diferentes aparece com o mesmo valor exato", async () => {
    const { resolveAdapter } = await import("../src/delegation/cli-backends/registry");

    const piArgs = resolveAdapter("pi")!.buildArgs(brief({ model: "llama3.1:70b" }));
    const codexArgs = resolveAdapter("codex")!.buildArgs(brief({ model: "llama3.1:70b" }));

    expect(piArgs.find((a) => a === "llama3.1:70b")).toBe(codexArgs.find((a) => a === "llama3.1:70b"));
  });
});
