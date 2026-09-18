import type { CanonicalEvent, Hook, HookKind } from "./source.js";
import { binVariables, type DependencyResolution } from "./resolve.js";

/** Event name in the format the target uses. */
export type TargetEvent = "PreToolUse" | "PostToolUse" | "Stop" | "SessionStart" | "PreCompact" | "UserPromptSubmit";

/** Where the setup writes each hook's script, relative to the project root. */
export const HOOKS_DIR = ".maestro/hooks";

/** The `command` a settings entry carries for a script hook: a reference, never the script itself (SPEC-0022, FR-002). */
export function scriptReference(name: string): string {
  return `"$CLAUDE_PROJECT_DIR/${HOOKS_DIR}/${name}.sh"`;
}

/**
 * Trailing shell comment that gives a dispatch entry an identity of its
 * own. A script entry is recognized by its path; a dispatch entry has no
 * file, and without a marker a second setup couldn't tell its own entry
 * from a third party's and would add it again (NFR-001).
 */
export function dispatchMarker(name: string): string {
  return `# maestro:hook=${name}`;
}

export interface TranslatedHook {
  name: string;
  event: TargetEvent;
  /** The event as the hook declared it, before translation — what the record keeps (AC-022). */
  canonicalEvent: CanonicalEvent;
  /**
   * Tool-name regex the target matches against. Absent for events that
   * take no matcher (`Stop`, `SessionStart`, ...). Never the hook's name:
   * v0.3.x wrote `matcher: name` and no hook ever fired, because the
   * target only matches tool names (SPEC-0022, R-001).
   */
  matcher?: string;
  blocking: boolean;
  kind: HookKind;
  /** What goes into settings: a reference to the script file, or the dispatch command itself. */
  command: string;
  /** Full body of the script file; absent for dispatch hooks. */
  scriptBody?: string;
  /** Kept for callers that execute the translated hook directly: the script body, or the dispatch command. */
  script: string;
}

const EVENT_MAP: Record<CanonicalEvent, TargetEvent> = {
  "before-shell": "PreToolUse",
  "before-tool": "PreToolUse",
  "after-file-edit": "PostToolUse",
  "after-tool": "PostToolUse",
  stop: "Stop",
  "session-start": "SessionStart",
  "before-compact": "PreCompact",
  "on-prompt": "UserPromptSubmit",
};

/** Default matcher per canonical event; `tools:` in the hook overrides it (FR-001). */
const MATCHER_MAP: Partial<Record<CanonicalEvent, string>> = {
  "before-shell": "Bash",
  "before-tool": "Bash",
  "after-file-edit": "Edit|Write|MultiEdit|NotebookEdit",
  "after-tool": "Edit|Write|MultiEdit|NotebookEdit",
};

/**
 * Converts a canonical hook to the target's format.
 *
 * Returns a structure and doesn't write a file. This separation is
 * deliberate: it's what lets the script's fidelity be verified without
 * touching disk. In v0.2.8, escaping and writing lived on the same path,
 * the escape was consumed twice, and every guard started allowing
 * anything — a defect that survived review because the generated file
 * looked correct.
 */
export function translateForClaudeCode(hook: Hook, bins: DependencyResolution = {}): TranslatedHook {
  const kind: HookKind = hook.kind ?? "script";
  const matcher = hook.tools ?? MATCHER_MAP[hook.event];
  const base = {
    name: hook.name,
    event: EVENT_MAP[hook.event],
    canonicalEvent: hook.event,
    ...(matcher !== undefined ? { matcher } : {}),
    blocking: hook.blocking,
    kind,
  };
  if (kind === "dispatch") {
    // No wrapper: the binary reads the event JSON from stdin and its exit
    // code is the decision. The preamble consumed stdin before the
    // fragment ran, so a dispatched hook never saw the event (R-002).
    const command = `${hook.script.trim()} ${dispatchMarker(hook.name)}`;
    return { ...base, command, script: command };
  }
  // The fragment passes through without any transformation, embedded
  // between preamble and postamble. Escaping here and again during
  // serialization is the defect this fatia exists to avoid.
  const scriptBody = wrap(hook, bins);
  return { ...base, command: scriptReference(hook.name), scriptBody, script: scriptBody };
}

/**
 * Wraps the fragment in what makes it executable.
 *
 * The block inside the Markdown isn't a complete script: it reads
 * variables someone needs to supply and communicates via `decision` and
 * `message`, which someone needs to emit. The `guard-destructive`
 * fragment ends at the last `fi` without printing anything — alone, it
 * would never block.
 */
function wrap(hook: Hook, bins: DependencyResolution = {}): string {
  return [
    PREAMBLE,
    `HOOK_EVENT=${JSON.stringify(hook.event)}`,
    `HOOK_TARGET_EVENT=${JSON.stringify(EVENT_MAP[hook.event])}`,
    // Known binary locations, resolved once at setup time and handed to
    // the fragment as variables — a fragment that needs a CLI reads
    // `MAESTRO_BIN_<name>` first and falls back to PATH (SPEC-0023, FR-007).
    ...binVariables(bins),
    "",
    FRAGMENT_START + hook.script + FRAGMENT_END,
    POSTAMBLE,
  ].join("\n");
}

/** Extracts the fragment back out, to check the round trip. */
export function unwrap(command: string): string {
  const i = command.indexOf(FRAGMENT_START);
  const j = command.lastIndexOf(FRAGMENT_END);
  if (i < 0 || j < 0) return command;
  return command.slice(i + FRAGMENT_START.length, j);
}

const FRAGMENT_START = "# >>> hook fragment\n";
const FRAGMENT_END = "\n# <<< hook fragment";

const PREAMBLE = [
  "#!/usr/bin/env bash",
  "HOOK_INPUT=$(cat)",
  "decision=allow",
  "message=''",
  "context=''",
  "PROJECT_DIR=\"${CLAUDE_PROJECT_DIR:-$PWD}\"",
  "_hook_flat=$(printf '%s' \"$HOOK_INPUT\" | tr '\\n' ' ')",
  // Extract fields from the JSON, instead of matching against the whole
  // JSON. The raw input also carries prose: a commit message mentioning
  // `rm -rf` would make a guard fire on text, and a guard that gets in the
  // way of normal work gets turned off.
  "_hook_str() { printf '%s' \"$_hook_flat\" | sed -n \"s/.*\\\"$1\\\"[[:space:]]*:[[:space:]]*\\\"\\\\(\\\\([^\\\"\\\\\\\\]\\\\|\\\\\\\\.\\\\)*\\\\)\\\".*/\\\\1/p\" | head -n 1; }",
  "HOOK_TOOL=$(_hook_str tool_name)",
  "HOOK_SESSION=$(_hook_str session_id)",
  // `UserPromptSubmit` (`on-prompt`) carries the user's message in `prompt`
  // (SPEC-0026, R-002) — same single-field extraction pattern as the fields
  // above, so an `on-prompt` hook can inspect the message before deciding.
  "HOOK_PROMPT=$(_hook_str prompt)",
  "HOOK_FILE=$(_hook_str file_path)",
  "[ -n \"$HOOK_FILE\" ] || HOOK_FILE=$(_hook_str path)",
  // The command reaches a hook in different fields depending on the tool
  // (SPEC-0023, R-001): `command` (Bash, terminal), `code` + `language`
  // (ctx_execute — only shell counts), `commands[]` (ctx_batch_execute).
  "HOOK_COMMAND=$(_hook_str command)",
  "if [ -z \"$HOOK_COMMAND\" ]; then",
  "  _hook_lang=$(_hook_str language)",
  "  case \"${_hook_lang:-shell}\" in shell|bash|sh|zsh) HOOK_COMMAND=$(_hook_str code) ;; esac",
  "fi",
  "if [ -z \"$HOOK_COMMAND\" ]; then",
  "  _hook_arr=$(printf '%s' \"$_hook_flat\" | sed -n 's/.*\"commands\"[[:space:]]*:[[:space:]]*\\[\\(\\([^]]\\|\\\\.\\)*\\)\\].*/\\1/p')",
  "  [ -n \"$_hook_arr\" ] && HOOK_COMMAND=$(printf '%s' \"$_hook_arr\" | sed 's/\"[[:space:]]*,[[:space:]]*\"/; /g; s/^[[:space:]]*\"//; s/\"[[:space:]]*$//')",
  "fi",
  "",
].join("\n");

const POSTAMBLE = [
  "",
  "# Emits the decision the fragment set. Without this, the fragment doesn't block.",
  "case \"$decision\" in",
  "  deny) printf '%s\\n' \"$message\" >&2; exit 2 ;;",
  "  ask)  printf '%s\\n' \"$message\" >&2; exit 2 ;;",
  "esac",
  // Additional context is the one thing a hook may put on stdout, and only
  // as the JSON the target expects (SPEC-0023, R-002). Silence otherwise.
  "if [ -n \"$context\" ]; then",
  "  _hook_ctx=$(printf '%s' \"$context\" | tr '\\n' ' ' | sed 's/\\\\/\\\\\\\\/g; s/\"/\\\\\"/g')",
  "  printf '{\"hookSpecificOutput\":{\"hookEventName\":\"%s\",\"additionalContext\":\"%s\"}}\\n' \"$HOOK_TARGET_EVENT\" \"$_hook_ctx\"",
  "fi",
  "exit 0",
].join("\n");

export interface SettingsEntry {
  matcher?: string;
  hooks: { type: "command"; command: string; blocking?: boolean }[];
}

export interface Settings {
  hooks: Partial<Record<TargetEvent, SettingsEntry[]>>;
}

/**
 * Assembles the target's configuration object.
 *
 * Returns a data structure, not text. Whoever serializes it is whoever
 * writes it, and the JSON serializer escapes exactly once.
 */
export function renderSettings(hooks: readonly TranslatedHook[]): Settings {
  const settings: Settings = { hooks: {} };
  for (const h of hooks) {
    const list = (settings.hooks[h.event] ??= []);
    list.push({
      ...(h.matcher !== undefined ? { matcher: h.matcher } : {}),
      hooks: [{ type: "command", command: h.command, ...(h.blocking ? { blocking: true } : {}) }],
    });
  }
  return settings;
}

/** Recovers the scripts in the order they were inserted, to check the round trip. */
export function extractScripts(settings: Settings): string[] {
  const order: TargetEvent[] = ["PreToolUse", "PostToolUse", "Stop", "SessionStart", "PreCompact", "UserPromptSubmit"];
  const out: string[] = [];
  for (const event of order) {
    for (const entry of settings.hooks[event] ?? []) {
      for (const h of entry.hooks) out.push(h.command);
    }
  }
  return out;
}
