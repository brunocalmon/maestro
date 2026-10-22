import { describe, it, expect } from "vitest";
import type { CliBackendAdapter } from "../src/delegation/cli-backends/adapter";

const adapter = (over: Partial<CliBackendAdapter>): CliBackendAdapter => ({
  name: "fake",
  buildArgs: () => [],
  injectsBehaviorByFlag: false,
  supportsToolsAllowlist: false,
  ...over,
});

describe("AC-007 — tools required não suportável é recusado", () => {
  // TRACEABILITY: US-001 FR-003 NFR-002 AC-007
  it("recusa nomeando o backend e a limitação", async () => {
    const { checkToolsSupport } = await import("../src/delegation/cli-tools");
    const limited = adapter({ name: "agy", supportsToolsAllowlist: false });

    const result = checkToolsSupport(["edit", "bash"], "required", limited);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/agy/i);
      expect(result.reason).toMatch(/tools|allowlist/i);
    }
  });
});

describe("AC-008 — tools required suportável é aplicado", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-008
  it("a lista de tools aparece na flag de allowlist daquele backend", async () => {
    const { checkToolsSupport } = await import("../src/delegation/cli-tools");
    const { resolveAdapter } = await import("../src/delegation/cli-backends/registry");
    const claude = resolveAdapter("claude")!;

    const result = checkToolsSupport(["edit", "bash"], "required", claude);
    expect(result.ok).toBe(true);

    const args = claude.buildArgs({ profile: "maestro", model: "qwen3:8b", behavior: "", skills: [], tools: ["edit", "bash"] });
    expect(args.join(" ")).toMatch(/edit.*bash|bash.*edit/);
  });
});

describe("AC-009 — tools sem exigência não bloqueia backend limitado", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-009
  it("sem tools declaradas, prossegue normalmente mesmo sem allowlist", async () => {
    const { checkToolsSupport } = await import("../src/delegation/cli-tools");
    const limited = adapter({ name: "codex", supportsToolsAllowlist: false });

    const result = checkToolsSupport([], "suggested", limited);
    expect(result.ok).toBe(true);
  });
});
