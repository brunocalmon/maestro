import { existsSync, lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Where skill sets live, relative to the project root. */
export const SKILLS_DIR = ".agents/skills";

export interface SkillsInspection {
  /** Names of present sets, relative to `SKILLS_DIR`. */
  dirs: string[];
  /** Paths that are a symlink, at any depth. */
  symlinks: string[];
  ok: boolean;
  reason?: string;
}

/**
 * Enumerates what's installed and refuses content that lives via symlink.
 *
 * The official installer creates a symlink by default, and `--copy` is
 * optional. Symlinked content lives outside the project: the hash stops
 * describing what the agent reads, two machines diverge without a record,
 * and Specsfy's tooling refuses a symlinked path. That's why detection
 * walks the whole tree, not just the first level.
 *
 * Takes the root as a parameter and never consults the working directory
 * or an environment variable.
 */
export function inspectSkills(root: string): SkillsInspection {
  const base = join(root, SKILLS_DIR);
  if (!existsSync(base)) return { dirs: [], symlinks: [], ok: true };

  const dirs: string[] = [];
  const symlinks: string[] = [];

  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = join(dir, entry.name);
      if (lstatSync(path).isSymbolicLink()) {
        symlinks.push(rel);
        continue;
      }
      if (entry.isDirectory()) {
        if (!prefix) dirs.push(rel);
        walk(path, rel);
      }
    }
  };
  walk(base, "");

  if (symlinks.length > 0) {
    return {
      dirs, symlinks, ok: false,
      reason: `symlinked content at ${symlinks.join(", ")}: skills need to live inside the project, as real files`,
    };
  }
  return { dirs, symlinks, ok: true };
}
