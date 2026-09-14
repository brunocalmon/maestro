import { existsSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";

/**
 * Markers that make a directory look like a project's root.
 *
 * Lives in a named constant, not scattered across a condition, because
 * section 13 of the spec records it as a reversible assumption: if
 * validation turns out too loose or too strict, the adjustment happens here.
 */
export const PROJECT_MARKERS = [".git", "package.json", ".claude", ".agents", ".gemini", "AGENTS.md"] as const;

export type RootCheck =
  | { ok: true; root: string }
  | { ok: false; reason: string };

/**
 * Confirms the given path can receive the configuration.
 *
 * The observation that led to `R-001` found three protocol servers
 * running, two with the home directory as working directory and one
 * pointing at another project. None had the correct root. That's why this
 * function never consults `process.cwd()` or an environment variable: the
 * only data it considers is the argument it receives.
 *
 * Returns the result instead of throwing, so the caller chooses how to
 * report the refusal.
 */
export function validateRoot(input: unknown): RootCheck {
  if (typeof input !== "string" || input.length === 0) {
    return { ok: false, reason: "the project_root parameter is required and must be an absolute path" };
  }

  // Refuse instead of resolving: resolving a relative path would need a
  // base, and the only one available to the process is the working
  // directory — exactly the dependency this fatia removes.
  if (!isAbsolute(input)) {
    return { ok: false, reason: `path ${input} is relative; provide an absolute path` };
  }

  if (!existsSync(input)) {
    return { ok: false, reason: `path not found: ${input}` };
  }

  if (!statSync(input).isDirectory()) {
    return { ok: false, reason: `path ${input} exists but isn't a directory` };
  }

  const found = PROJECT_MARKERS.some((m) => existsSync(join(input, m)));
  if (!found) {
    return {
      ok: false,
      reason: `path ${input} doesn't look like a project: none of ${PROJECT_MARKERS.join(", ")} was found`,
    };
  }

  return { ok: true, root: input };
}
