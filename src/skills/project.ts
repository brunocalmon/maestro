import { createHash } from "node:crypto";
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Projects skills from the canonical directory to a target's own one.
 *
 * `.agents/skills` is where the `skills` CLI (`-a universal`) and the
 * Specsfy's specialists land; the Claude Code 2.1.x doesn't read it
 * (FIND-EXT-002), so the maestro copies each skill into `.claude/skills`.
 * Every copy is recorded with the checksum of what was written, which is
 * how a later run tells "the copy I made" from "a copy someone edited": the
 * former is refreshed when the source changes, the latter is left alone and
 * reported (SPEC-0024, FR-006, PR-004).
 */

export interface ProjectionRecord {
  name: string;
  checksum: string;
}

export interface ProjectionResult {
  copied: string[];
  updated: string[];
  /** Present in the target with content that differs from the recorded copy (or never recorded): kept as is. */
  kept: string[];
  /** Skipped: the source is (or contains) a symlink. */
  skipped: string[];
  records: ProjectionRecord[];
}

/** Content hash of a directory: relative paths and file bytes, in sorted order. */
export function directoryChecksum(dir: string): string {
  const hash = createHash("sha256");
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) { walk(path); continue; }
      hash.update(relative(dir, path).replaceAll("\\", "/"));
      hash.update("\0");
      hash.update(readFileSync(path));
      hash.update("\0");
    }
  };
  walk(dir);
  return hash.digest("hex");
}

function containsSymlink(dir: string): boolean {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (lstatSync(path).isSymbolicLink()) return true;
    if (entry.isDirectory() && containsSymlink(path)) return true;
  }
  return false;
}

export function projectSkills(root: string, from: string, to: string, previous: readonly ProjectionRecord[] = []): ProjectionResult {
  const result: ProjectionResult = { copied: [], updated: [], kept: [], skipped: [], records: [] };
  const source = join(root, from);
  if (!existsSync(source)) return result;
  const target = join(root, to);
  const recorded = new Map(previous.map((p) => [p.name, p.checksum]));

  for (const entry of readdirSync(source, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const src = join(source, entry.name);
    if (lstatSync(src).isSymbolicLink() || containsSymlink(src)) { result.skipped.push(entry.name); continue; }
    const dest = join(target, entry.name);
    const sourceChecksum = directoryChecksum(src);

    if (!existsSync(dest)) {
      mkdirSync(target, { recursive: true });
      cpSync(src, dest, { recursive: true });
      result.copied.push(entry.name);
      result.records.push({ name: entry.name, checksum: sourceChecksum });
      continue;
    }

    const destChecksum = directoryChecksum(dest);
    const known = recorded.get(entry.name);
    if (known === undefined && destChecksum === sourceChecksum) {
      // Identical to the source without a record (a bundled skill the setup
      // delivers to both directories, or an earlier manual copy): adopt it.
      result.records.push({ name: entry.name, checksum: sourceChecksum });
      continue;
    }
    if (known === undefined || destChecksum !== known) {
      // Someone else's copy, or one edited after we made it: not ours to replace.
      result.kept.push(entry.name);
      if (known !== undefined) result.records.push({ name: entry.name, checksum: known });
      continue;
    }
    if (destChecksum !== sourceChecksum) {
      rmSync(dest, { recursive: true, force: true });
      cpSync(src, dest, { recursive: true });
      result.updated.push(entry.name);
    }
    result.records.push({ name: entry.name, checksum: sourceChecksum });
  }
  return result;
}
