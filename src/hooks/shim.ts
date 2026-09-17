/**
 * Builds the shell line a dispatch hook is installed with.
 *
 * `resolveHookCommand` used to bake the absolute path found at setup time
 * into the hook. That path stops existing the moment the project (or the
 * package holding the binary) is renamed or moved, and the hook fails
 * silently — this repository's own settings carried a path under the
 * project's previous name. The shim keeps the guarantee (the recorded
 * path wins when it exists) and adds the fallback: the same name on
 * `PATH`. When it falls back it says so on stderr, so a wrong homonym is
 * visible (SPEC-0022, FR-008, FIND-SEC-001).
 *
 * POSIX `sh` only — no bash-isms — because the hook runs on whatever host
 * the agent runs on.
 */

/** Wraps a value for safe interpolation into a POSIX shell command line. */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function buildDispatchCommand(bin: string, recordedPath: string, args: readonly string[] | string): string {
  const rest = typeof args === "string" ? args.trim() : args.map(shellQuote).join(" ");
  const notFound = `maestro: ${bin} not found (recorded path ${recordedPath} missing and not on PATH); run maestro setup`;
  const fallback =
    `p=$(command -v ${shellQuote(bin)} 2>/dev/null) || { printf '%s\\n' ${shellQuote(notFound)} >&2; exit 0; }; ` +
    `printf '%s\\n' "maestro: ${bin} resolved from PATH: $p" >&2`;
  return `p=${shellQuote(recordedPath)}; if [ ! -x "$p" ]; then ${fallback}; fi; exec "$p"${rest ? ` ${rest}` : ""}`;
}
