import { spawnSync } from "node:child_process";

export type SubsystemStatus = "OK" | "FAIL" | "ABSENT";

export interface SubsystemResult {
  name: string;
  status: SubsystemStatus;
  detail?: string;
}

/**
 * Runs one subsystem's own diagnostic. Injected so tests never depend on
 * `specsfy`, `context-mode`, `skills` or `code-review-graph` actually being
 * on this machine's `PATH` (SPEC-0025, FR-005).
 */
export type SubsystemExecutor = (bin: string, args: readonly string[], timeoutMs: number) => SpawnOutcome;

export interface SpawnOutcome {
  /** `null` bin not found; `"timeout"` process didn't exit in time; a number is the real exit code. */
  status: number | "timeout" | null;
  output: string;
}

/** `spawnSync`-backed executor — the one `maestro doctor` uses for real. */
export const realSubsystemExecutor: SubsystemExecutor = (bin, args, timeoutMs) => {
  const r = spawnSync(bin, args, { encoding: "utf8", timeout: timeoutMs });
  if (r.error && (r.error as NodeJS.ErrnoException).code === "ENOENT") return { status: null, output: "" };
  if (r.signal === "SIGTERM" && r.status === null) return { status: "timeout", output: (r.stderr || r.stdout || "").trim() };
  return { status: r.status, output: (r.stderr || r.stdout || "").trim() };
};

interface SubsystemSpec {
  name: string;
  bin: string;
  args: readonly string[];
}

/**
 * The four sub-doctors this layer orchestrates. Each one is the real
 * diagnostic its own package ships; the maestro adds nothing to their
 * judgment, only surfaces it (SPEC-0025, PR-001, PR-003).
 */
function subsystemSpecs(root: string): readonly SubsystemSpec[] {
  return [
    { name: "specsfy", bin: "specsfy", args: ["doctor", "--project", root] },
    { name: "context-mode", bin: "context-mode", args: ["doctor"] },
    { name: "skills", bin: "skills", args: ["list"] },
    { name: "code-review-graph", bin: "code-review-graph", args: ["status"] },
  ];
}

/** Default timeout per sub-doctor: long enough for a real subprocess, short enough to never hang `doctor` (SPEC-0025, FR-005). */
export const SUBSYSTEM_TIMEOUT_MS = 20_000;

/**
 * Runs every sub-doctor and reports each one's own status — never lets one
 * subsystem's absence or failure keep the others from being checked
 * (SPEC-0025, NFR-002).
 */
export function runSubsystemDoctors(root: string, executor: SubsystemExecutor, timeoutMs: number = SUBSYSTEM_TIMEOUT_MS): SubsystemResult[] {
  return subsystemSpecs(root).map((spec) => {
    const outcome = executor(spec.bin, spec.args, timeoutMs);
    if (outcome.status === null) return { name: spec.name, status: "ABSENT" as const, detail: `${spec.bin} not found on PATH` };
    if (outcome.status === "timeout") return { name: spec.name, status: "FAIL" as const, detail: `timeout after ${timeoutMs}ms` };
    if (outcome.status === 0) return { name: spec.name, status: "OK" as const, detail: outcome.output || undefined };
    return { name: spec.name, status: "FAIL" as const, detail: outcome.output || `exit ${outcome.status}` };
  });
}
