import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, chmodSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readHook, type Hook } from "../src/hooks/source";
import { projectContextModeHooks } from "../src/hooks/upstream";

/** Ambiente de detecção do Claude Code usado por todos os casos da SPEC-0022. */
export const claudeEnv = { hasClaudeCode: true, files: [".claude/settings.json"] };

/** Raiz descartável com `.claude/` pronta; opcionalmente já com um settings.json. */
export function project(previousSettings?: string): string {
  const root = mkdtempSync(join(tmpdir(), "spec0022-"));
  mkdirSync(resolve(root, ".claude"), { recursive: true });
  if (previousSettings !== undefined) writeFileSync(resolve(root, ".claude", "settings.json"), previousSettings);
  return root;
}

export function readSettings(root: string): { hooks: Record<string, SettingsEntry[]> } {
  return JSON.parse(readFileSync(resolve(root, ".claude", "settings.json"), "utf8"));
}

export interface SettingsEntry {
  matcher?: string;
  hooks: { type: string; command: string; blocking?: boolean }[];
}

/** Entradas de um evento cujo command referencia o script de um hook do maestro. */
export function entriesFor(settings: { hooks: Record<string, SettingsEntry[]> }, event: string, name: string): SettingsEntry[] {
  return (settings.hooks[event] ?? []).filter((e) => e.hooks.some((h) => h.command.includes(`.maestro/hooks/${name}.sh`)));
}

/** Um hook canônico lido do corpus real. */
export function corpusHook(name: string): Hook {
  return readHook(readFileSync(resolve(__dirname, "..", "resources", "hooks", `${name}.md`), "utf8"));
}

/** Um hook canônico sintético a partir de frontmatter e corpo. */
export function syntheticHook(frontmatter: string, body = ""): Hook {
  return readHook(`---\n${frontmatter.trim()}\n---\n${body}`);
}

/** Script shell executável em diretório temporário. */
export function executable(name: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "spec0022-bin-"));
  const path = join(dir, name);
  writeFileSync(path, `#!/bin/sh\n${content}\n`);
  chmodSync(path, 0o755);
  return path;
}

/** Entrada no formato inline anterior (matcher = nome do hook, comando com fragmento). */
export function legacyEntry(name: string, fragment: string): SettingsEntry {
  return {
    matcher: name,
    hooks: [{ type: "command", command: `#!/usr/bin/env bash\nHOOK_INPUT=$(cat)\ndecision=allow\n\n# >>> hook fragment\n${fragment}\n# <<< hook fragment\n\nexit 0` }],
  };
}

export const FIXTURE_HOOKS_JSON = resolve(__dirname, "fixtures", "spec-0022", "context-mode-hooks.json");

/**
 * How many hooks a real `runSetup` installs on this checkout: the canonical
 * Markdown hooks plus the context-mode projection from the installed package
 * (SPEC-0022, FR-006). Legacy cases used to hard-code 8; the projection makes
 * the number depend on the upstream manifest, so it is computed here.
 */
export function installedHookCount(): number {
  const canonical = readdirSync(resolve(__dirname, "..", "resources", "hooks")).filter((f) => f.endsWith(".md")).length;
  const upstream = projectContextModeHooks(resolve(__dirname, "..", "node_modules", "context-mode", "hooks", "hooks.json")).hooks.length;
  return canonical + upstream;
}
