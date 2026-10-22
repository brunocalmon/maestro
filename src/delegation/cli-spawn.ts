import { spawnSync } from "node:child_process";

export type SpawnResult =
  | { ok: true; stdout: string; stderr: string; exitCode: number }
  | { ok: false; reason: string };

export interface SpawnOptions {
  /** Defaults to 120s (`SPEC-0019`, section 8). */
  timeoutMs?: number;
}

/**
 * Runs one CLI backend subprocess, capturing stdout/stderr/exit code
 * without interpreting them (`PR-004`) — same `spawnSync`-with-timeout
 * pattern already used by `scripts/pinned-skills.mjs` and
 */
export function spawnCliAgent(command: string, args: readonly string[], options: SpawnOptions = {}): SpawnResult {
  const timeout = options.timeoutMs ?? 120_000;
  const run = spawnSync(command, [...args], { encoding: "utf8", timeout });

  if (run.error && (run.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
    return { ok: false, reason: `spawn of "${command}" timeout after ${timeout}ms` };
  }
  if (run.signal === "SIGTERM" && run.status === null) {
    return { ok: false, reason: `spawn of "${command}" timeout after ${timeout}ms` };
  }
  if (run.error) {
    return { ok: false, reason: run.error.message };
  }

  return { ok: true, stdout: run.stdout ?? "", stderr: run.stderr ?? "", exitCode: run.status ?? -1 };
}
