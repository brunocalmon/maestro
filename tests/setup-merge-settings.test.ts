import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { claudeEnv, project, readSettings, entriesFor } from "./helpers-spec-0022";

const THIRD_PARTY_PRE = { matcher: "Bash", hooks: [{ type: "command", command: "./meu-hook.sh" }] };
const THIRD_PARTY_STOP = { matcher: "", hooks: [{ type: "command", command: "node outra-ferramenta/stop.mjs" }] };

describe("AC-007 — entrada de terceiro no mesmo evento é preservada", () => {
  // SPECSFY: US-002 FR-003 NFR-002 AC-007
  it("mantém hooks manuais em PreToolUse e Stop ao lado dos do maestro", () => {
    const root = project(JSON.stringify({ hooks: { PreToolUse: [THIRD_PARTY_PRE], Stop: [THIRD_PARTY_STOP] } }, null, 2));
    runSetup({ env: claudeEnv, root, write: true });
    const s = readSettings(root);
    expect(s.hooks.PreToolUse).toContainEqual(THIRD_PARTY_PRE);
    expect(s.hooks.Stop).toContainEqual(THIRD_PARTY_STOP);
    expect(entriesFor(s, "PreToolUse", "guard-destructive")).toHaveLength(1);
  });
});

describe("AC-008 — segunda execução não duplica nem altera", () => {
  // SPECSFY: US-002 FR-003 NFR-001 AC-008
  it("produz settings.json byte a byte idêntico", () => {
    const root = project(JSON.stringify({ hooks: { PreToolUse: [THIRD_PARTY_PRE] } }));
    runSetup({ env: claudeEnv, root, write: true });
    const first = readFileSync(resolve(root, ".claude", "settings.json"), "utf8");
    runSetup({ env: claudeEnv, root, write: true });
    const second = readFileSync(resolve(root, ".claude", "settings.json"), "utf8");
    expect(second).toBe(first);
    const s = readSettings(root);
    expect(s.hooks.PreToolUse).toContainEqual(THIRD_PARTY_PRE);
    expect(entriesFor(s, "PreToolUse", "guard-destructive")).toHaveLength(1);
    const commands = Object.values(s.hooks).flat().flatMap((e) => e.hooks.map((h) => h.command));
    expect(new Set(commands).size).toBe(commands.length);
  });
});

describe("AC-011 — settings.json inválido é preservado em quarentena, nunca apagado", () => {
  // SPECSFY: US-002 FR-003 FR-004 AC-011
  it("copia o original antes de escrever e relata", () => {
    const broken = '{ "hooks": { "PreToolUse": [ { "matcher": "Bash", ';
    const root = project(broken);
    const result = runSetup({ env: claudeEnv, root, write: true });
    const q = resolve(root, ".maestro", "quarantine");
    expect(existsSync(q)).toBe(true);
    const files = readdirSync(q).filter((f) => f.includes("settings"));
    expect(files.length).toBeGreaterThan(0);
    expect(readFileSync(resolve(q, files[0]!), "utf8")).toBe(broken);
    const s = readSettings(root);
    for (const entries of Object.values(s.hooks)) for (const e of entries) expect(e.hooks[0]!.command).toMatch(/\.maestro\/hooks\/|context-mode|code-review-graph/);
    expect(result.report).toMatch(/ileg[ií]vel|unreadable|invalid/i);
  });
});
