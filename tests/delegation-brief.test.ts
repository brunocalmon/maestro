import { describe, it, expect } from "vitest";
import { profile, plan, reader } from "./delegation-fixtures";

const BASE = "# padrão\nApresente o plano antes de executar.";
const files = { ".maestro/subagents/maestro/behavior.md": BASE, ".maestro/subagents/git/behavior.md": "# git\nSó mexe em git." };

describe("AC-007 — o briefing traz o comportamento já composto", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-007
  it("contém o texto, não o caminho", async () => {
    const { buildBriefs } = await import("../src/delegation/brief");
    const config = { maestro: profile("maestro", { behavior: ".maestro/subagents/maestro/behavior.md" }), subagents: [] };

    const briefs = buildBriefs(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "native" }]), config, reader(files), BASE);

    expect(briefs[0]!.behavior).toContain("Apresente o plano antes de executar");
    expect(briefs[0]!.behavior).not.toContain(".maestro/subagents");
  });
});

describe("AC-008 — o briefing declara capacidades e modelo", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-008
  it("nomeia o modelo do plano e lista skills e tools", async () => {
    const { buildBriefs, renderBriefs } = await import("../src/delegation/brief");
    const config = {
      maestro: profile("maestro", { skills: [".agents/skills/framework-05-tasks"], tools: ["Read", "Bash"] }),
      subagents: [],
    };

    const text = renderBriefs(buildBriefs(plan([{ profile: "maestro", model: "qwen3:8b", runtime: "native" }]), config, reader(files), BASE));

    expect(text).toContain("qwen3:8b");
    expect(text).toContain("framework-05-tasks");
    expect(text).toContain("Bash");
  });
});

describe("AC-009 — um briefing por agente planejado", () => {
  // TRACEABILITY: US-001 FR-003 NFR-001 AC-009
  it("plano com dois agentes gera dois blocos, cada um nomeando seu perfil", async () => {
    const { buildBriefs, renderBriefs } = await import("../src/delegation/brief");
    const config = { maestro: profile("maestro"), subagents: [profile("git", { behavior: ".maestro/subagents/git/behavior.md" })] };

    const briefs = buildBriefs(
      plan([
        { profile: "maestro", model: "qwen3:8b", runtime: "native" },
        { profile: "git", model: "qwen2.5:3b", runtime: "native" },
      ]),
      config,
      reader(files),
      BASE,
    );

    expect(briefs).toHaveLength(2);
    const text = renderBriefs(briefs);
    expect(text).toContain("maestro");
    expect(text).toContain("git");
  });
});
