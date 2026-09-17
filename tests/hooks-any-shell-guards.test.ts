import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project, readSettings, entriesFor } from "./helpers-spec-0022";
import { scriptFor, runScript, shellEvent, CTX_EXECUTE, CTX_BATCH, TERMINAL, PLAYWRIGHT_CODE, AI_TRAILER } from "./helpers-spec-0023";

const TOOLS_REGEX = "Bash|mcp__.*(execute|run_in_terminal|shell).*";

describe("AC-001 — comando destrutivo via ctx_execute shell é bloqueado", () => {
  // SPECSFY: US-001 FR-001 FR-002 FR-006 NFR-002 AC-001
  it("mesmo veredito e mensagem do Bash", () => {
    const root = project();
    const script = scriptFor("guard-destructive");
    const viaBash = runScript(script, shellEvent("Bash", "rm -rf /"), root);
    const viaCtx = runScript(script, shellEvent(CTX_EXECUTE, "rm -rf /"), root);
    expect(viaBash.status).toBe(2);
    expect(viaCtx.status).toBe(2);
    expect(viaCtx.stderr.trim()).toBe(viaBash.stderr.trim());
  });
});

describe("AC-002 — trailer de IA via run_in_terminal é bloqueado", () => {
  // SPECSFY: US-001 FR-001 FR-002 FR-006 NFR-002 AC-002
  it("git commit com trailer de agente pelo terminal MCP", () => {
    const root = project();
    const script = scriptFor("protect-authorship");
    const command = `git ${"com" + "mit"} -m x -m '${AI_TRAILER}'`;
    const r = runScript(script, shellEvent(TERMINAL, command), root);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/co-author/i);
    // O script já lia `command`; o gap real é o matcher: sem tools: ampliado o
    // Claude Code nunca invoca o guard para run_in_terminal.
    runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: null } });
    const [entry] = entriesFor(readSettings(root), "PreToolUse", "protect-authorship");
    expect(new RegExp(`^(${entry?.matcher ?? ""})$`).test(TERMINAL)).toBe(true);
  });
});

describe("AC-003 — código não-shell em ctx_execute não é avaliado como comando", () => {
  // SPECSFY: US-001 FR-001 NFR-002 AC-003
  it("javascript que menciona rm -rf passa", () => {
    const root = project();
    const script = scriptFor("guard-destructive");
    const r = runScript(script, { session_id: "s", tool_name: CTX_EXECUTE, tool_input: { language: "javascript", code: "const s = 'rm -rf /'" } }, root);
    expect(r.status).toBe(0);
    expect(r.stderr.trim()).toBe("");
    // E o mesmo texto como shell continua bloqueado — prova que a distinção é a linguagem.
    expect(runScript(script, shellEvent(CTX_EXECUTE, "rm -rf /"), root).status).toBe(2);
  });
});

describe("AC-004 — ctx_batch_execute avalia cada comando da lista", () => {
  // SPECSFY: US-001 FR-001 FR-002 AC-004
  it("cat .env no meio do lote é bloqueado", () => {
    const root = project();
    const script = scriptFor("guard-secrets");
    const r = runScript(script, { session_id: "s", tool_name: CTX_BATCH, tool_input: { commands: ["ls", "cat .env", "pwd"] } }, root);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/credential/i);
  });
});

describe("AC-005 — os três guards declaram tools: cobrindo as ferramentas de shell", () => {
  // SPECSFY: US-001 FR-002 AC-005
  it("matcher no settings.json e regex que exclui o playwright", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true, upstream: { contextModeHooksJson: null } });
    const s = readSettings(root);
    for (const name of ["guard-destructive", "guard-secrets", "protect-authorship"]) {
      const [entry] = entriesFor(s, "PreToolUse", name);
      expect(entry?.matcher, name).toBe(TOOLS_REGEX);
    }
    const re = new RegExp(`^(${TOOLS_REGEX})$`);
    expect(re.test("Bash")).toBe(true);
    expect(re.test(CTX_EXECUTE)).toBe(true);
    expect(re.test(CTX_BATCH)).toBe(true);
    expect(re.test(TERMINAL)).toBe(true);
    expect(re.test(PLAYWRIGHT_CODE)).toBe(false);
    expect(re.test("Read")).toBe(false);
  });
});

describe("AC-006 — hooks valem para subagentes (verificação manual registrada)", () => {
  // SPECSFY: US-001 FR-006 AC-006
  it("a seção 11 da spec registra a verificação manual com data e responsável", () => {
    const specsDir = resolve(__dirname, "..", "specs");
    const states = readdirSync(specsDir).filter((d) => !d.includes("."));
    const spec = states
      .flatMap((state) => {
        const dir = resolve(specsDir, state);
        try { return readdirSync(dir).filter((n) => n.startsWith("0023-")).map((n) => resolve(dir, n, "spec.md")); } catch { return []; }
      })
      .find((p) => { try { readFileSync(p); return true; } catch { return false; } });
    expect(spec, "spec 0023 encontrada").toBeDefined();
    const text = readFileSync(spec!, "utf8");
    const row = text.split("\n").find((l) => l.startsWith("| US-001, FR-006, AC-006 |"));
    expect(row, "linha de AC-006 na tabela RED-GREEN-REFACTOR").toBeDefined();
    const cells = row!.split("|").map((c) => c.trim());
    const green = cells[5] ?? "";
    expect(green).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(green).toMatch(/respons[aá]vel/i);
    expect(green).not.toMatch(/^Pending$/);
  });
});
