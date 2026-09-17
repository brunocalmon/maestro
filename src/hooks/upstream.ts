import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { CanonicalEvent, Hook } from "./source.js";

/**
 * Projects the hooks the context-mode package installs for itself.
 *
 * The maestro used to keep three Markdown hooks describing context-mode,
 * declared on the narrow four-event vocabulary. They fell behind the
 * upstream, which needs `Read|Grep|WebFetch`, `PreCompact` and
 * `UserPromptSubmit`. Reading the package's own `hooks/hooks.json` removes
 * that class of drift: events and matchers come from the source
 * (SPEC-0022, FR-006, DEC-005).
 */

/** Claude Code event → canonical event. Anything else is skipped. */
const EVENT_TO_CANONICAL: Record<string, CanonicalEvent> = {
  PreToolUse: "before-tool",
  PostToolUse: "after-tool",
  Stop: "stop",
  SessionStart: "session-start",
  PreCompact: "before-compact",
  UserPromptSubmit: "on-prompt",
};

interface UpstreamEntry {
  matcher?: string;
  hooks?: { type?: string; command?: string }[];
}

export interface UpstreamProjection {
  hooks: Hook[];
  /** Reason nothing was projected: file missing, unreadable, or without hooks. */
  skipped?: string;
}

export function projectContextModeHooks(hooksJsonPath: string): UpstreamProjection {
  if (!existsSync(hooksJsonPath)) return { hooks: [], skipped: `hooks.json not found at ${hooksJsonPath}` };
  let parsed: { hooks?: Record<string, UpstreamEntry[]> };
  try {
    parsed = JSON.parse(readFileSync(hooksJsonPath, "utf8")) as { hooks?: Record<string, UpstreamEntry[]> };
  } catch (error) {
    return { hooks: [], skipped: `hooks.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!parsed || typeof parsed !== "object" || !parsed.hooks || typeof parsed.hooks !== "object") {
    return { hooks: [], skipped: "hooks.json has no hooks object" };
  }

  // `${CLAUDE_PLUGIN_ROOT}` is what the plugin loader would substitute;
  // outside the plugin it's the package directory holding `hooks/`.
  const pluginRoot = dirname(dirname(resolve(hooksJsonPath)));
  const hooks: Hook[] = [];
  for (const [targetEvent, entries] of Object.entries(parsed.hooks)) {
    const event = EVENT_TO_CANONICAL[targetEvent];
    if (!event || !Array.isArray(entries)) continue;
    entries.forEach((entry, index) => {
      for (const h of entry?.hooks ?? []) {
        if (!h?.command) continue;
        const command = h.command.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, pluginRoot);
        const matcher = typeof entry.matcher === "string" && entry.matcher.length > 0 ? entry.matcher : undefined;
        hooks.push({
          name: `context-mode-${targetEvent.toLowerCase()}-${index}`,
          description: `context-mode upstream hook (${targetEvent}${matcher ? ` ${matcher}` : ""})`,
          event,
          blocking: false,
          script: command,
          ...(matcher ? { tools: matcher } : {}),
          kind: "dispatch",
        });
      }
    });
  }
  if (hooks.length === 0) return { hooks: [], skipped: "hooks.json declares no usable hooks" };
  return { hooks };
}
