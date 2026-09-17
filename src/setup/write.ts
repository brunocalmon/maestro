import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Settings, SettingsEntry, TranslatedHook } from "../hooks/claude-code.js";
import { HOOKS_DIR } from "../hooks/claude-code.js";
import { isLegacyEntry, isMaestroEntry } from "../hooks/identity.js";
import type { InstallRecord } from "./record.js";
import { readExtensionRegistry, writeExtensionRegistry, type ChecksumEnvironment, type ExtensionArtifact } from "../extensions/registry.js";
import { computeChecksum } from "../extensions/anchor.js";
import { QUARANTINE_DIR, type QuarantineEnvironment } from "../extensions/repair.js";

export interface WriteSettingsResult {
  path: string;
  /** Entries that were not ours and survived untouched. */
  preserved: number;
  /** Inline-format entries (v0.3.x) replaced by the new reference entries. */
  migrated: number;
  /** Quarantine file name when the previous settings could not be parsed. */
  quarantined?: string;
}

const stamp = (now: () => string): string => now().replace(/[:.]/g, "-");

/**
 * Writes the target's configuration, preserving what isn't ours.
 *
 * Third-party keys in the file survive, and within `hooks` only the
 * entries recognized as ours — by the script path in the command, or by
 * the inline legacy format — get replaced. Everything else stays where it
 * is, in every event (SPEC-0022, FR-003/FR-004). A file that doesn't
 * parse is copied to quarantine before anything is written: the previous
 * version treated it as absent and, in practice, erased it (FIND-ARCH-001).
 */
export function writeSettings(
  root: string,
  relPath: string,
  settings: Settings,
  names: readonly string[] = [],
  opts: { quarantineEnv?: QuarantineEnvironment; now?: () => string } = {},
): WriteSettingsResult {
  const target = resolve(root, relPath);
  mkdirSync(dirname(target), { recursive: true });

  let current: Record<string, unknown> = {};
  let quarantined: string | undefined;
  if (existsSync(target)) {
    const raw = readFileSync(target, "utf8");
    try {
      current = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      const now = opts.now ?? (() => new Date().toISOString());
      const name = `${stamp(now)}-settings.json`;
      const env = opts.quarantineEnv ?? realQuarantine(root);
      env.write(name, raw);
      quarantined = name;
      current = {};
    }
  }

  const currentHooks = (current["hooks"] ?? {}) as Record<string, SettingsEntry[]>;
  const events = new Set([...Object.keys(currentHooks), ...Object.keys(settings.hooks)]);
  const merged: Record<string, SettingsEntry[]> = {};
  let preserved = 0;
  let migrated = 0;
  for (const event of events) {
    const existing = Array.isArray(currentHooks[event]) ? currentHooks[event] : [];
    const kept: SettingsEntry[] = [];
    for (const entry of existing) {
      if (!entry || !Array.isArray(entry.hooks)) { kept.push(entry); continue; }
      if (isLegacyEntry(entry, names)) { migrated += 1; continue; }
      if (isMaestroEntry(entry) !== null) continue;
      kept.push(entry);
      preserved += 1;
    }
    const ours = settings.hooks[event as keyof Settings["hooks"]] ?? [];
    const list = [...kept, ...ours];
    if (list.length > 0) merged[event] = list;
  }

  writeFileSync(target, `${JSON.stringify({ ...current, hooks: merged }, null, 2)}\n`);
  return { path: relPath, preserved, migrated, ...(quarantined ? { quarantined } : {}) };
}

/** True when the file still carries entries in the inline format, so a setup that otherwise matches must still run (FR-004). */
export function hasLegacyEntries(root: string, relPath: string, names: readonly string[]): boolean {
  const target = resolve(root, relPath);
  if (!existsSync(target)) return false;
  try {
    const parsed = JSON.parse(readFileSync(target, "utf8")) as { hooks?: Record<string, SettingsEntry[]> };
    return Object.values(parsed.hooks ?? {}).some((list) => Array.isArray(list) && list.some((e) => e && Array.isArray(e.hooks) && isLegacyEntry(e, names)));
  } catch {
    return true;
  }
}

function realQuarantine(root: string): QuarantineEnvironment {
  const dir = join(root, QUARANTINE_DIR);
  return {
    write: (name, content) => {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, name), content);
    },
  };
}

export interface WriteHookScriptsResult {
  written: string[];
  unchanged: string[];
  quarantined: { name: string; quarantinePath: string }[];
}

const artifactName = (hook: string): string => `hook:${hook}`;

/** Path of a hook's script, relative to the project root. */
export function hookScriptPath(name: string): string {
  return `${HOOKS_DIR}/${name}.sh`;
}

/**
 * Writes each script hook to `.maestro/hooks/<name>.sh` and records it in
 * the extension registry by checksum — the identity a settings entry
 * points at (SPEC-0022, FR-002).
 *
 * Managed content, same discipline as the anchored blocks (PR-004): a
 * file that diverges from its registered content is copied to quarantine
 * and restored, never silently overwritten; a file whose content already
 * matches is left alone, so a second run changes neither mtime nor the
 * registry (NFR-001).
 */
export function writeHookScripts(
  root: string,
  hooks: readonly TranslatedHook[],
  opts: { registryEnv: ChecksumEnvironment; quarantineEnv?: QuarantineEnvironment; now?: () => string },
): WriteHookScriptsResult {
  const now = opts.now ?? (() => new Date().toISOString());
  const quarantineEnv = opts.quarantineEnv ?? realQuarantine(root);
  const registry = readExtensionRegistry(opts.registryEnv);
  const result: WriteHookScriptsResult = { written: [], unchanged: [], quarantined: [] };
  let registryChanged = false;

  for (const hook of hooks) {
    if (hook.kind !== "script" || hook.scriptBody === undefined) continue;
    const rel = hookScriptPath(hook.name);
    const abs = resolve(root, rel);
    const content = hook.scriptBody;
    const registered = registry.artifacts.find((a) => a.name === artifactName(hook.name));
    const onDisk = existsSync(abs) ? readFileSync(abs, "utf8") : null;

    if (registered && onDisk !== null && onDisk !== registered.content) {
      const quarantinePath = `${stamp(now)}-${hook.name}.sh`;
      quarantineEnv.write(quarantinePath, onDisk);
      result.quarantined.push({ name: hook.name, quarantinePath });
    }

    if (onDisk === content && registered?.checksum === computeChecksum(content)) {
      result.unchanged.push(rel);
      continue;
    }

    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
    chmodSync(abs, 0o755);
    result.written.push(rel);

    const artifact: ExtensionArtifact = {
      category: "hook",
      name: artifactName(hook.name),
      target: rel,
      content,
      checksum: computeChecksum(content),
      createdAt: registered?.createdAt ?? now(),
    };
    registry.artifacts = registered
      ? registry.artifacts.map((a) => (a.name === artifact.name ? artifact : a))
      : [...registry.artifacts, artifact];
    registryChanged = true;
  }

  if (registryChanged) writeExtensionRegistry(registry, opts.registryEnv);
  return result;
}

/** Writes the installation record inside the project. */
export function writeRecordFile(root: string, relPath: string, record: InstallRecord): string {
  const target = resolve(root, relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`);
  return relPath;
}

/** Reads the previous record, when it exists. */
export function readRecordFile(root: string, relPath: string): InstallRecord | null {
  const target = resolve(root, relPath);
  if (!existsSync(target)) return null;
  try {
    return JSON.parse(readFileSync(target, "utf8")) as InstallRecord;
  } catch {
    return null;
  }
}
