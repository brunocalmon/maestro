/**
 * Canonical event a hook declares, before any translation.
 *
 * The first four are the original vocabulary; the generic ones
 * (`before-tool`, `after-tool`, `before-compact`, `on-prompt`) exist
 * because the context-mode upstream needs events the narrow set never
 * expressed (SPEC-0022, FR-007). Each target adapter declares which of
 * these it supports; the rest are reported as skipped, never silenced.
 */
export type CanonicalEvent =
  | "before-shell"
  | "after-file-edit"
  | "stop"
  | "session-start"
  | "before-tool"
  | "after-tool"
  | "before-compact"
  | "on-prompt";

/**
 * `script`: a fragment that sets `decision`/`message` and needs the
 * wrapper. `dispatch`: a bare command (`raw_command`) that reads the
 * event JSON itself — it gets no wrapper, so stdin and exit code reach it
 * intact (SPEC-0022, FR-005).
 */
export type HookKind = "script" | "dispatch";

export interface Hook {
  name: string;
  description: string;
  event: CanonicalEvent;
  blocking: boolean;
  script: string;
  /** Tool-name regex the target should match; overrides the per-event default (FR-001). */
  tools?: string;
  kind: HookKind;
}

const EVENTS: readonly CanonicalEvent[] = [
  "before-shell",
  "after-file-edit",
  "stop",
  "session-start",
  "before-tool",
  "after-tool",
  "before-compact",
  "on-prompt",
];

/** Extracts a frontmatter key's scalar value, ignoring the YAML block. */
function scalar(frontmatter: string, key: string): string | null {
  for (const line of frontmatter.split("\n")) {
    const m = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (m && m[1] === key) return (m[2] ?? "").trim();
  }
  return null;
}

/**
 * Extracts the script from the hook's body.
 *
 * The body is Markdown prose with a code block containing the script.
 * Only the block's content is the hook; the prose explains why it exists
 * and shouldn't reach the configuration file.
 */
function scriptFrom(body: string): string {
  const m = /```(?:bash|sh|shell)?\n([\s\S]*?)```/.exec(body);
  return m?.[1] ?? "";
}

/**
 * Reads a hook in the canonical format and returns a typed structure.
 *
 * Writes nothing and translates nothing: separating reading from
 * translation is what lets the script's fidelity be verified without
 * touching the filesystem.
 */
export function readHook(raw: string): Hook {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error("hook missing --- delimited frontmatter");
  const [, frontmatter = "", body = ""] = m;

  const name = scalar(frontmatter, "name");
  const event = scalar(frontmatter, "event");
  if (!name) throw new Error("hook missing a name");
  if (!event || !EVENTS.includes(event as CanonicalEvent)) {
    throw new Error(`hook ${name} declares an unknown event: ${event ?? "none"}`);
  }

  // The code block takes priority over `raw_command` when both exist on the
  // same hook, so a future complex hook has no ambiguity about which one
  // wins. A simple dispatch hook — just one command — declares
  // `raw_command` in the frontmatter instead of a body with a block.
  const fromBody = scriptFrom(body);
  const script = fromBody.length > 0 ? fromBody : (scalar(frontmatter, "raw_command") ?? "");
  const tools = scalar(frontmatter, "tools");

  return {
    name,
    description: (scalar(frontmatter, "description") ?? "").replace(/^>-\s*/, "").trim(),
    event: event as CanonicalEvent,
    blocking: scalar(frontmatter, "blocking") === "true",
    script,
    ...(tools ? { tools } : {}),
    kind: fromBody.length > 0 ? "script" : "dispatch",
  };
}
