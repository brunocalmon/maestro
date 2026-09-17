import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Layer the dependency belongs to. `agent`, from fatia 1d, is informative — never affects `exitCode`. */
export type Layer = "npm" | "python" | "agent";

/** Origin that resolved the dependency. Local always takes precedence over global. */
export type Origin = "local" | "global";

export interface DependencyResult {
  name: string;
  layer: Layer;
  present: boolean;
  origin: Origin | null;
  version: string | null;
  hint?: string;
  /** Only for `layer: "agent"`: demonstrated hands-off invocation capability (SPEC-0008). */
  supported?: boolean;
}

import { reportSkills, type SkillReportRow } from "./skills/record.js";
import { readTrace, type TraceRead } from "./telemetry/read.js";
import { detectBackends, realBackendEnvironment, type BackendEnvironment } from "./backends/detect.js";
import { readExtensionRegistry, realChecksumEnvironment } from "./extensions/registry.js";
import { realTargetFileEnvironment, listPresentExtensionNames } from "./extensions/create.js";
import { diagnoseExtensions, type DivergentArtifact } from "./extensions/diagnose.js";
import { diagnoseAgents, type ProfileProblem } from "./agents/diagnose.js";
import { runSubsystemDoctors, realSubsystemExecutor, type SubsystemResult } from "./doctor/subsystems.js";
import { diagnoseMaestroProject, type MaestroFinding } from "./doctor/maestro.js";

export interface Report {
  results: DependencyResult[];
  exitCode: number;
  /** Registered skill sets, when a root is given. */
  skills?: SkillReportRow[];
  /** Statement of the guarantee's scope for the sets. */
  note?: string;
  /** Identifier of the last recorded run, when a root is given. */
  trace?: TraceRead;
  /** Divergent extension artifact, when a root is given — never repairs, only reports (`PR-082`). */
  divergentExtensions?: DivergentArtifact[];
  /** Agent profile divergence, when a root is given — same read-only contract (`SPEC-0015`, `FR-004`). */
  divergentAgents?: ProfileProblem[];
  /** Each subsystem's own diagnostic (`specsfy doctor`, `context-mode doctor`, `skills list`, `code-review-graph status`), when a root is given (`SPEC-0025`, `FR-005`). */
  subsystems?: SubsystemResult[];
  /** What the maestro itself guarantees — hooks, instruction direction, projections, configuration traces (`SPEC-0025`, `FR-006`). `FAIL` items move `exitCode`; `WARN` items never do. */
  maestro?: MaestroFinding[];
}

/**
 * Resolution sources, injected so the check is testable.
 *
 * Without injection, a test would consult the real PATH and would only
 * prove which machine it ran on.
 */
export interface Environment {
  /** Version of the npm package in the project's node_modules, or null. */
  resolveNpm(name: string): string | null;
  /** Version of the globally installed npm package, or null. */
  resolveGlobalNpm?(name: string): string | null;
  /** Version of the Python subsystem in the project's virtual environment, or null. */
  resolveLocalPython(): string | null;
  /** Version of the Python subsystem reachable via PATH, or null. */
  resolveOnPath(): string | null;
}

export const NPM_SUBSYSTEMS = ["@promovaweb/specsfy", "context-mode"] as const;
export const PYTHON_SUBSYSTEM = "code-review-graph";

const NPM_HINT =
  "declared in dependencies; resolve it locally with a project install, without installing globally";
const PYTHON_HINT =
  `${PYTHON_SUBSYSTEM} is a Python tool installed by uv, not an npm package; ` +
  "create the project's local copy via setup's explicit bridge, or make it available on PATH";

/** Applies the resolution rule: prefer local, accept global. */
function pick(local: string | null, global: string | null): { origin: Origin | null; version: string | null } {
  if (local !== null) return { origin: "local", version: local };
  if (global !== null) return { origin: "global", version: global };
  return { origin: null, version: null };
}

/**
 * Checks the project's three dependencies and reports each one's origin and version.
 *
 * Installs nothing, from any origin: installing belongs to setup, and the
 * target environment is managed by a declarative playbook.
 */
export function inspectDependencies(
  env: Environment,
  root?: string,
  backendEnv: BackendEnvironment = realBackendEnvironment(),
  diagnoseExtensionsFn: (root: string) => DivergentArtifact[] = realDiagnoseExtensions,
  diagnoseAgentsFn: (root: string) => ProfileProblem[] = (r) => diagnoseAgents(r),
  subsystemsFn: (root: string) => SubsystemResult[] = (r) => runSubsystemDoctors(r, realSubsystemExecutor),
  maestroFn: (root: string) => MaestroFinding[] = diagnoseMaestroProject,
): Report {
  const results: DependencyResult[] = [];

  for (const name of NPM_SUBSYSTEMS) {
    const { origin, version } = pick(env.resolveNpm(name), env.resolveGlobalNpm?.(name) ?? null);
    const present = origin !== null;
    results.push({ name, layer: "npm", present, origin, version, ...(present ? {} : { hint: NPM_HINT }) });
  }

  const { origin, version } = pick(env.resolveLocalPython(), env.resolveOnPath());
  const present = origin !== null;
  results.push({
    name: PYTHON_SUBSYSTEM,
    layer: "python",
    present,
    origin,
    version,
    ...(present ? {} : { hint: PYTHON_HINT }),
  });

  // Informative layer: agent backend never installed by this project
  // (PR-031), so absence never enters `dependenciesOk` (PR-032).
  for (const backend of detectBackends(backendEnv)) {
    results.push({
      name: backend.name,
      layer: "agent",
      present: backend.present,
      origin: backend.present ? "global" : null,
      version: backend.version,
      supported: backend.supported,
    });
  }

  const dependenciesOk = results.filter((r) => r.layer !== "agent").every((r) => r.present);
  if (root === undefined) return { results, exitCode: dependenciesOk ? 0 : 1 };

  // Read-only: `doctor` reports drift and doesn't repair it. Destructive
  // repair remains out of scope.
  const sets = reportSkills(root);

  // Extension divergence is maestro' own responsibility, not a
  // third-party dependency's — it enters the exitCode directly, unlike
  // the `agent` layer (`DEC-084`).
  const divergent = diagnoseExtensionsFn(root);

  // Same reasoning as the extensions above: an agent profile pointing at a
  // file that isn't there is this project's own inconsistency, so it enters
  // the exitCode directly (`SPEC-0015`, `FR-004`).
  const divergentAgents = diagnoseAgentsFn(root);

  // Each sub-doctor is its own subsystem's judgment, not this project's —
  // same treatment as the dependency layer above: absence or failure
  // enters the exit code (`SPEC-0025`, `FR-005`), same as an npm/python
  // dependency that isn't present.
  const subsystems = subsystemsFn(root);
  const subsystemsOk = subsystems.every((s) => s.status === "OK");

  // The maestro's own guarantees. Only `FAIL` moves the exit code — `WARN`
  // is a pending conversational step or third-party content, never a
  // defect the maestro can repair by itself (`SPEC-0025`, `PR-004`).
  const maestro = maestroFn(root);
  const maestroOk = maestro.every((f) => f.level !== "FAIL");

  return {
    results,
    skills: sets.results,
    note: sets.note,
    trace: readTrace(root),
    divergentExtensions: divergent,
    divergentAgents,
    subsystems,
    maestro,
    exitCode:
      dependenciesOk && sets.exitCode === 0 && divergent.length === 0 && divergentAgents.length === 0 && subsystemsOk && maestroOk
        ? 0
        : 1,
  };
}

const projectRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..");

const readInstalledVersion = (manifestPath: string): string | null => {
  if (!existsSync(manifestPath)) return null;
  const version: unknown = (JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>)["version"];
  return typeof version === "string" ? version : null;
};

const probe = (command: string, args: string[]): string | null => {
  try {
    const out = execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.trim().split(/\s+/).pop() ?? null;
  } catch {
    return null;
  }
};

/** Real source, used by the command line — the only place that touches disk to diagnose an extension. */
function realDiagnoseExtensions(root: string): DivergentArtifact[] {
  return diagnoseExtensions(
    readExtensionRegistry(realChecksumEnvironment(root)),
    realTargetFileEnvironment(root),
    listPresentExtensionNames(root),
  );
}

/** Real environment, used by the command line. Only reads; never installs. */
export function defaultEnvironment(root: string = projectRoot()): Environment {
  return {
    resolveNpm: (name) => readInstalledVersion(resolve(root, "node_modules", name, "package.json")),
    resolveLocalPython: () => {
      const bin = resolve(root, ".venv-crg", "bin", PYTHON_SUBSYSTEM);
      return existsSync(bin) ? probe(bin, ["--version"]) : null;
    },
    resolveOnPath: () => probe(PYTHON_SUBSYSTEM, ["--version"]),
  };
}
