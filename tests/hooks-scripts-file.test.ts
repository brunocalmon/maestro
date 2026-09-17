import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { runSetup } from "../src/setup/run";
import { unwrap } from "../src/hooks/claude-code";
import { claudeEnv, project, readSettings, entriesFor, corpusHook } from "./helpers-spec-0022";

const QUARANTINE = ".maestro/quarantine";

describe("AC-004 — script em arquivo e referência no settings.json", () => {
  // SPECSFY: US-001 FR-002 NFR-003 AC-004
  it("grava .maestro/hooks/<name>.sh executável com o fragmento byte a byte", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true });
    for (const name of ["guard-destructive", "guard-secrets", "protect-authorship", "setup-check"]) {
      const path = resolve(root, ".maestro", "hooks", `${name}.sh`);
      expect(existsSync(path), name).toBe(true);
      expect(statSync(path).mode & 0o111, `${name} executável`).not.toBe(0);
      expect(unwrap(readFileSync(path, "utf8"))).toBe(corpusHook(name).script);
    }
    const entry = entriesFor(readSettings(root), "PreToolUse", "guard-destructive")[0];
    expect(entry?.hooks[0]?.command).toBe('"$CLAUDE_PROJECT_DIR/.maestro/hooks/guard-destructive.sh"');
  });
});

describe("AC-005 — script editado à mão vai para quarentena e é restaurado", () => {
  // SPECSFY: US-001 FR-002 NFR-003 AC-005
  it("detecta drift por checksum, preserva o conteúdo alterado e relata", () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true });
    const path = resolve(root, ".maestro", "hooks", "guard-secrets.sh");
    const original = readFileSync(path, "utf8");
    writeFileSync(path, `${original}\n# alterado à mão\n`);
    const result = runSetup({ env: claudeEnv, root, write: true });
    expect(readFileSync(path, "utf8")).toBe(original);
    const quarantined = readdirSync(resolve(root, QUARANTINE)).filter((f) => f.includes("guard-secrets"));
    expect(quarantined.length).toBeGreaterThan(0);
    expect(readFileSync(resolve(root, QUARANTINE, quarantined[0]!), "utf8")).toContain("# alterado à mão");
    expect(result.report).toMatch(/guard-secrets/);
    expect(result.report).toMatch(/quarantine|quarentena/i);
  });
});

describe("AC-020 — segunda execução não reescreve scripts nem o registro", () => {
  // SPECSFY: NFR-001 FR-002 AC-020
  it("mantém mtime dos scripts e o conteúdo de .maestro/extensions.json", async () => {
    const root = project();
    runSetup({ env: claudeEnv, root, write: true });
    const dir = resolve(root, ".maestro", "hooks");
    const before = Object.fromEntries(readdirSync(dir).map((f) => [f, statSync(resolve(dir, f)).mtimeMs]));
    const registry = readFileSync(resolve(root, ".maestro", "extensions.json"), "utf8");
    await new Promise((r) => setTimeout(r, 20));
    runSetup({ env: claudeEnv, root, write: true });
    for (const [f, mtime] of Object.entries(before)) expect(statSync(resolve(dir, f)).mtimeMs, f).toBe(mtime);
    expect(readFileSync(resolve(root, ".maestro", "extensions.json"), "utf8")).toBe(registry);
    expect(Object.keys(before).length).toBeGreaterThan(0);
  });
});
