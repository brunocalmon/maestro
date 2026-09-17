/**
 * Rewrites a hook's leading command to a resolved absolute path, so the
 * generated hook works even on a machine that never installed the
 * dependency globally.
 *
 * Every hook's `raw_command` — `context-mode hook claude-code pretooluse`,
 * `code-review-graph update --brief` — was embedded verbatim, trusting
 * PATH at the moment Claude Code actually fires the hook inside the
 * consumer project. That's a different process, on a possibly different
 * machine, than the one running `maestro setup`; nothing guaranteed
 * PATH would resolve either binary there. `maestro` itself always
 * has both reachable at a known, absolute location — `context-mode` as
 * its own hard npm dependency, `code-review-graph` via the local bridge
 * in `bridge.ts` — so baking that path in at setup time, once, is strictly
 * more reliable than hoping the same name resolves again later, elsewhere.
 */

import { buildDispatchCommand } from "./shim.js";

/** Binary name (the hook's first token) → resolved absolute path, or null to keep relying on PATH. */
export type DependencyResolution = Record<string, string | null>;

/** Wraps a path for safe interpolation into a POSIX shell command line. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Replaces a script's leading command with its resolved path, when one is
 * known. Falls back to the script unchanged — relying on PATH exactly as
 * before — for any command this resolution doesn't mention, which is the
 * common case for every hook that isn't a dependency dispatch.
 */
export function resolveHookCommand(script: string, resolution: DependencyResolution): string {
  const match = /^(\S+)([\s\S]*)$/.exec(script);
  if (!match) return script;
  const bin = match[1];
  const rest = match[2] ?? "";
  if (bin === undefined) return script;
  const resolved = resolution[bin];
  if (!resolved) return script;
  return `${shellQuote(resolved)}${rest}`;
}

/**
 * Same resolution as `resolveHookCommand`, but the result is the runtime
 * shim: the recorded path when it still exists, else the same name on
 * `PATH` (SPEC-0022, FR-008). Used for dispatch hooks; a script hook's
 * fragment doesn't start with a binary and passes through unchanged.
 */
export function resolveDispatchCommand(script: string, resolution: DependencyResolution): string {
  const match = /^(\S+)([\s\S]*)$/.exec(script);
  if (!match) return script;
  const bin = match[1];
  const rest = match[2] ?? "";
  if (bin === undefined) return script;
  const resolved = resolution[bin];
  if (!resolved) return script;
  return buildDispatchCommand(bin, resolved, rest);
}

/**
 * Shell assignments a script fragment can read to find a dependency the
 * setup already located: `MAESTRO_BIN_<name>='<path>'`, with every
 * non-alphanumeric character of the name folded to `_`. Unresolved names
 * produce nothing, so the fragment's own `command -v` fallback applies
 * (SPEC-0023, FR-007).
 */
export function binVariables(resolution: DependencyResolution): string[] {
  return Object.entries(resolution)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0)
    .map(([bin, path]) => `MAESTRO_BIN_${bin.replace(/[^A-Za-z0-9]/g, "_")}=${shellQuote(path)}`);
}
