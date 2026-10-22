import { describe, it, expect } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { RECORD_PATH } from "../src/setup/record";
import { readRecordFile } from "../src/setup/write";

const env = { hasClaudeCode: true, files: [".claude/settings.json"] };

// TRACEABILITY: US-001 FR-002 AC-002 AC-004 — isolated disposable project (SPEC-0013 pattern).
function project(): string {
  const root = mkdtempSync(join(tmpdir(), "rename-setup-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  return root;
}

const LEGACY_RECORD = { target: "claude", version: "0.0.1-legacy", hooks: [] };

describe("AC-004 — setup cria .maestro/ do zero, ignorando .common-rules/", () => {
  // TRACEABILITY: US-001 FR-002 NFR-002 AC-004
  it("cria .maestro/install.json sem ler o conteúdo de .common-rules/install.json", () => {
    const root = project();
    mkdirSync(resolve(root, ".common-rules"), { recursive: true });
    writeFileSync(resolve(root, ".common-rules", "install.json"), JSON.stringify(LEGACY_RECORD));

    const previous = readRecordFile(root, RECORD_PATH);
    runSetup({ env, root, write: true, previous });

    expect(existsSync(resolve(root, ".maestro", "install.json"))).toBe(true);
    const legacyStillThere = readFileSync(resolve(root, ".common-rules", "install.json"), "utf8");
    expect(JSON.parse(legacyStillThere)).toEqual(LEGACY_RECORD);
  });
});

describe("AC-005 — .common-rules/ e .maestro/ coexistindo: o antigo é ignorado", () => {
  // TRACEABILITY: US-001 FR-002 NFR-002 AC-005
  it("lê apenas .maestro/install.json quando os dois diretórios existem", () => {
    const root = project();
    mkdirSync(resolve(root, ".common-rules"), { recursive: true });
    writeFileSync(resolve(root, ".common-rules", "install.json"), JSON.stringify(LEGACY_RECORD));
    mkdirSync(resolve(root, ".maestro"), { recursive: true });
    const newRecord = { target: "claude", version: "9.9.9-new", hooks: [{ name: "marker-new", target: "x", version: "9.9.9-new", installedAt: new Date().toISOString(), event: "PreToolUse" }] };
    writeFileSync(resolve(root, ".maestro", "install.json"), JSON.stringify(newRecord));

    const previous = readRecordFile(root, RECORD_PATH);

    expect(previous?.hooks.map((h) => h.name)).toEqual(["marker-new"]);
  });
});

describe("AC-006 — a execução é relatada como primeira instalação", () => {
  // TRACEABILITY: US-001 FR-002 NFR-002 AC-006
  it("não relata atualização mesmo quando .common-rules/ (legado) contém um registro que bateria com os hooks atuais", () => {
    // Bootstrap: gera um registro real e válido, do jeito que uma
    // instalação de antes da renomeação realmente ficaria em disco.
    const bootstrapRoot = project();
    const bootstrapResult = runSetup({ env, root: bootstrapRoot, write: true });

    const root = project();
    mkdirSync(resolve(root, ".common-rules"), { recursive: true });
    writeFileSync(resolve(root, ".common-rules", "install.json"), JSON.stringify(bootstrapResult.record));

    const previous = readRecordFile(root, RECORD_PATH);
    const result = runSetup({ env, root, write: true, previous });

    expect(result.report).not.toMatch(/already|unchanged/i);
  });
});
