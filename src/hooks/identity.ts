import type { SettingsEntry } from "./claude-code.js";

/**
 * Names the inline-format setup (v0.3.x and earlier) wrote for the
 * context-mode hooks. They no longer exist as canonical hooks — the
 * upstream projection replaced them (FR-006) — but their legacy entries
 * still sit in consumer settings and must be recognized on migration.
 */
export const LEGACY_HOOK_NAMES: readonly string[] = [
  "context-mode-pretooluse",
  "context-mode-posttooluse",
  "context-mode-stop",
];

const REFERENCE = /\.maestro\/hooks\/([A-Za-z0-9._-]+)\.sh/;
const MARKER = /#\s*maestro:hook=([A-Za-z0-9._-]+)\s*$/;

/**
 * The hook's name when the entry is one of ours, else `null`.
 *
 * Identity lives in the command's path, never in `matcher`: the matcher is
 * a tool-name regex the target owns (SPEC-0022, PR-001).
 */
export function isMaestroEntry(entry: SettingsEntry | { matcher?: string; hooks: { command: string }[] }): string | null {
  for (const h of entry.hooks) {
    const m = REFERENCE.exec(h.command) ?? MARKER.exec(h.command);
    if (m?.[1]) return m[1];
  }
  return null;
}

/**
 * Recognizes the inline format the setup used to write: `matcher` equal
 * to one of our hook names **and** the wrapped fragment inline in the
 * command. Both conditions together collide with nothing another tool
 * writes; either one alone is not enough (FR-004, DEC-007).
 */
export function isLegacyEntry(entry: { matcher?: string; hooks: { command: string }[] }, names: readonly string[]): boolean {
  if (entry.matcher === undefined) return false;
  if (!names.includes(entry.matcher) && !LEGACY_HOOK_NAMES.includes(entry.matcher)) return false;
  return entry.hooks.some((h) => h.command.includes(">>> hook fragment"));
}
