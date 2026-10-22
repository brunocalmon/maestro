import { describe, it, expect } from "vitest";
import type { AgentProfile } from "../src/config/schema";

/** Perfil mínimo, só com o que a montagem usa — o resto é opcional (D6, SPEC-0015). */
function profile(name: string): AgentProfile {
  return {
    identity: { name: { value: name, mode: "required" }, description: { value: "", mode: "suggested" } },
    cognition: {
      model: { value: "", mode: "suggested" },
      context_budget: { value: 0.7, mode: "suggested" },
      reasoning_effort: { value: "medium", mode: "suggested" },
    },
    instruction: {
      behavior: { value: "", mode: "suggested" },
      additional_behavior: { value: "", mode: "suggested" },
    },
    capability: {
      skills: { value: [], mode: "suggested" },
      tools: { value: [], mode: "suggested" },
      mcp_servers: { value: [], mode: "suggested" },
    },
    execution: { runtime: { value: "auto", mode: "suggested" }, concurrency: { value: 1, mode: "suggested" } },
  };
}

const FULL = {
  profiles: [profile("maestro"), profile("gitops-dev")],
  backends: ["claude", "pi"],
  recommendation: { backend: "claude", localModel: "qwen3:8b" },
};
const EMPTY = { profiles: [profile("maestro")], backends: [], recommendation: { backend: null, localModel: null } };

describe("AC-003 — o esqueleto propõe um agente com o que foi detectado", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-003
  it("propõe exatamente um agente, com perfil, modelo e runtime nomeados", async () => {
    const { assemblePlan } = await import("../src/plan/assemble");
    const plan = assemblePlan({ ...FULL, task: "renomear um módulo", trace: "t1", createdAt: "2026-09-07T00:00:00.000Z" });

    expect(plan.agents).toHaveLength(1);
    expect(plan.agents[0]!.profile).toBe("maestro");
    expect(plan.agents[0]!.model).toBe("qwen3:8b");
    expect(plan.agents[0]!.runtime).toBe("auto");
  });
});

describe("AC-004 — o esqueleto não inventa o que não detectou", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-004
  it("declara modelo ausente como null quando nada foi detectado", async () => {
    const { assemblePlan } = await import("../src/plan/assemble");
    const plan = assemblePlan({ ...EMPTY, task: "x", trace: "t2", createdAt: "2026-09-07T00:00:00.000Z" });

    expect(plan.agents[0]!.model).toBeNull();
    expect(plan.candidates.backends).toEqual([]);
  });
});

describe("AC-005 — os candidatos detectados ficam anexados ao plano", () => {
  // TRACEABILITY: US-001 FR-002 NFR-001 AC-005
  it("carrega perfis disponíveis e backends detectados", async () => {
    const { assemblePlan } = await import("../src/plan/assemble");
    const plan = assemblePlan({ ...FULL, task: "x", trace: "t3", createdAt: "2026-09-07T00:00:00.000Z" });

    expect(plan.candidates.profiles).toEqual(["maestro", "gitops-dev"]);
    expect(plan.candidates.backends).toEqual(["claude", "pi"]);
  });
});
