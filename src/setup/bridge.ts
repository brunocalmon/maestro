import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Pinned version of the Python subsystem, checked against PyPI on 2026-08-24. */
export const PYTHON_SUBSYSTEM = "code-review-graph";
export const PINNED_VERSION = "2.3.7";

/** Virtual environment directory, always inside the project. */
export const VENV_DIR = ".venv-crg";

/**
 * The `maestro` package's root, not the target project's — same
 * distinction `packageRoot()` already makes in
 * `src/skills/executor.ts`/`src/framework/executor.ts`. `doctor.ts`'s
 * `defaultEnvironment()` already looks for `.venv-crg` here, not in the
 * target project's root: the two need to agree on where the local copy
 * lives, or `doctor` would keep reporting absence after a real,
 * successful installation.
 */
/** The `maestro` package's own installation root — shared with `hooks/resolve.ts`, which needs the same location to embed absolute paths into generated hooks. */
export const packageRoot = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const probe = (command: string, args: string[]): string | null => {
  try {
    const out = execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.trim().split(/\s+/).pop() ?? null;
  } catch {
    return null;
  }
};

const commandExists = (name: string): boolean => {
  try {
    execFileSync("which", [name], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

export interface BridgeEnvironment {
  /** Version of the project's local copy, or null. */
  localVenv: string | null;
  /** Version reachable via PATH, or null. */
  onPath: string | null;
  /** Whether `uv` is available to create the copy. */
  hasUv: boolean;
}

export interface BridgeResult {
  /** Specifier that would be installed, or null when there's nothing to do. */
  wouldInstall: string | null;
  /** Target directory, relative to the project. */
  targetDir: string;
  /** Always false: this tool never writes to the global environment. */
  touchesGlobal: boolean;
  /** Refusal reason, when there is one. */
  refused: string | null;
  /** Whether the installation actually ran. */
  executed: boolean;
}

/**
 * Creates the Python subsystem's local copy when it's missing from both sources.
 *
 * Never writes to the global environment. `uv tool install` would write to
 * `~/.local/share/uv/tools/`, outside the project, and the machine's
 * environment is managed by a declarative playbook whose rule is that
 * nothing gets installed manually. This bridge uses the project's virtual
 * environment, which costs about 262 MB and is therefore created on
 * request, not on every installation.
 */
export function bridgePythonSubsystem(opts: {
  env: BridgeEnvironment;
  execute: boolean;
  /** Where `.venv-crg/` gets created. Absent, uses the `maestro` package's root — the same place `doctor.ts` already checks. */
  cwd?: string;
}): BridgeResult {
  const base: BridgeResult = {
    wouldInstall: null,
    targetDir: VENV_DIR,
    touchesGlobal: false,
    refused: null,
    executed: false,
  };

  // The local copy takes precedence: if it exists, there's nothing to do.
  if (opts.env.localVenv !== null) return base;

  // The global one is fine to use, but doesn't dismiss the bridge when
  // someone asks for it; the caller decides that. Here, being on PATH
  // doesn't require action either.
  if (opts.env.onPath !== null) return base;

  if (!opts.env.hasUv) {
    return { ...base, refused: `${PYTHON_SUBSYSTEM} is absent and uv isn't available to create the local copy` };
  }

  const spec = `${PYTHON_SUBSYSTEM}==${PINNED_VERSION}`;
  if (!opts.execute) return { ...base, wouldInstall: spec };

  const cwd = opts.cwd ?? packageRoot();
  try {
    execFileSync("uv", ["venv", VENV_DIR], { cwd, stdio: "inherit" });
    execFileSync("uv", ["pip", "install", "--python", VENV_DIR, spec], { cwd, stdio: "inherit" });
    return { ...base, wouldInstall: spec, executed: true };
  } catch (error) {
    // `uv venv` doesn't depend on the network and may have already
    // created the directory before `uv pip install` fails (e.g. PyPI
    // unreachable) — reported as a bridge failure, never propagated as
    // an unhandled exception.
    const reason = error instanceof Error ? error.message : String(error);
    return { ...base, wouldInstall: spec, executed: false, refused: `installation failed: ${reason}` };
  }
}

/**
 * Real environment, used by the command line. Only reads before deciding;
 * the real write lives entirely in `bridgePythonSubsystem`.
 */
export function realBridgeEnvironment(root: string = packageRoot()): BridgeEnvironment {
  return {
    localVenv: (() => {
      const bin = resolve(root, VENV_DIR, "bin", PYTHON_SUBSYSTEM);
      return existsSync(bin) ? probe(bin, ["--version"]) : null;
    })(),
    onPath: probe(PYTHON_SUBSYSTEM, ["--version"]),
    hasUv: commandExists("uv"),
  };
}
