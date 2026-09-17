import { resolveSource } from "./source.js";
import { inspectSkills } from "./inventory.js";
import type { SkillRecordEntry } from "./record.js";

/** This fatia's only target; fatia 1d opens the others. */
/**
 * `universal` lands in `.agents/skills`, the one canonical directory every
 * source (this installer, the Specsfy's specialists) shares; targets that
 * don't read it get a projection (SPEC-0024, DEC-004).
 */
export const TARGET_AGENT = "universal";

/** Returns `null` when the executable doesn't exist. */
export type Executor = (args: string[], cwd: string) => { status: number; skills?: string[] } | null;

/**
 * `add`'s real argv, extracted so it can be reused by whoever needs to
 * know the command without running it — the approval plan from fatia 1i
 * (`PR-062`: what's shown is what runs, never a parallel description).
 */
export function buildSkillsAddArgs(source: string): string[] {
  return ["add", source, "-a", TARGET_AGENT, "--skill", "*", "--copy", "-y"];
}

export interface InstallOptions {
  root: string;
  source: unknown;
  execute: Executor;
  previous?: SkillRecordEntry[] | null;
}

export interface InstallResult {
  installed: string[];
  report: string;
  isError: boolean;
  changed: boolean;
}

const failure = (report: string): InstallResult => ({ installed: [], report, isError: true, changed: false });

/**
 * Installs the set at the given root, via the official path.
 *
 * The installer's global form is never built anywhere in this function,
 * so the rule against installing outside the project doesn't depend on
 * the caller's discipline.
 */
export function installSkills(opts: InstallOptions): InstallResult {
  const source = resolveSource(opts.source);
  if (!source.ok) return failure(source.reason);

  const base = buildSkillsAddArgs(source.source).slice(1);

  // Enumerating before writing is what allows refusing a conflict without
  // having already overwritten it. Finding out afterward would be finding
  // out too late.
  const listing = opts.execute(["add", ...base, "--list"], opts.root);
  if (listing === null) {
    return failure(`the official installer isn't available: no set was installed from ${source.source}`);
  }
  if (listing.status !== 0) {
    return failure(`the installer exited with code ${listing.status} while enumerating: no set was installed`);
  }

  const candidates = listing.skills ?? [];
  const present = new Set(inspectSkills(opts.root).dirs);
  const previous = new Set((opts.previous ?? []).map((e) => e.name));
  const conflicts = candidates.filter((n) => present.has(n) && !previous.has(n));
  if (conflicts.length > 0) {
    return failure(`name conflict with content already present: ${conflicts.join(", ")}. Nothing was written`);
  }

  const alreadyDone = candidates.length > 0 && candidates.every((n) => previous.has(n));

  const execution = opts.execute(["add", ...base], opts.root);
  if (execution === null) {
    return failure(`the official installer isn't available: no set was installed from ${source.source}`);
  }
  if (execution.status !== 0) {
    return failure(`the installer exited with code ${execution.status}: the set wasn't installed`);
  }

  return {
    installed: candidates,
    report: alreadyDone
      ? `already configured: ${candidates.length} skills unchanged from ${source.source}`
      : `${candidates.length} skills copied from ${source.source}`,
    isError: false,
    changed: !alreadyDone,
  };
}
