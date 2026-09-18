import { describe, it, expect } from "vitest";
import { project as freshProject } from "./helpers-spec-0022";
import { scriptFor, runScript, shellEvent, TERMINAL } from "./helpers-spec-0023";

const DEFER_COMMAND = "maestro setup --defer-conversational";

describe("AC-010 — guard bloqueia --defer-conversational executado via Bash pelo agente", () => {
  // SPECSFY: US-002 FR-004 AC-010
  it("nega a execução do comando de adiamento via tool Bash", () => {
    const root = freshProject();
    const script = scriptFor("guard-defer-conversational");
    const r = runScript(script, shellEvent("Bash", DEFER_COMMAND), root);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/terminal/i);
  });
});

describe("AC-011 — guard cobre também tool MCP de shell, não só Bash", () => {
  // SPECSFY: US-002 FR-004 AC-011
  it("nega a execução do comando de adiamento via tool MCP de terminal", () => {
    const root = freshProject();
    const script = scriptFor("guard-defer-conversational");
    const r = runScript(script, shellEvent(TERMINAL, DEFER_COMMAND), root);
    expect(r.status).toBe(2);
  });
});

describe("AC-015 — guard não intercepta uma invocação fora de qualquer tool de agente", () => {
  // SPECSFY: US-002 FR-004 AC-015
  it("permite quando o evento não traz nenhum comando reconhecível (execução real de terminal nunca chega como tool event)", () => {
    const root = freshProject();
    const script = scriptFor("guard-defer-conversational");
    const r = runScript(script, {}, root);
    expect(r.status).toBe(0);
  });

  // SPECSFY: US-002 FR-004 AC-015
  it("permite um comando Bash não relacionado ao adiamento", () => {
    const root = freshProject();
    const script = scriptFor("guard-defer-conversational");
    const r = runScript(script, shellEvent("Bash", "npm run test:tdd"), root);
    expect(r.status).toBe(0);
  });
});
