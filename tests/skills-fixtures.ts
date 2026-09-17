import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, symlinkSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

export const SPECSFY_SET = ["specsfy-01-inbox", "specsfy-04-validate", "specsfy-setup"];
export const MATTPOCOCK_SET = ["ask-matt", "code-review", "writing-shape"];

/** Disposable root with what `specsfy` already occupies in `.agents/skills/` (the canonical directory since SPEC-0024). */
export function projectWithSkills(prefix = "crs-sk-"): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  writeFileSync(join(root, "package.json"), '{"name":"disposable"}\n');
  // A Claude Code project: `.claude/` is the detection evidence; skills live in `.agents/skills`.
  mkdirSync(join(root, ".claude"), { recursive: true });
  for (const n of SPECSFY_SET) {
    mkdirSync(join(root, ".agents", "skills", n), { recursive: true });
    writeFileSync(join(root, ".agents", "skills", n, "SKILL.md"), `---\nname: ${n}\n---\nbody\n`);
  }
  return root;
}

/** Recursively lists the relative paths existing under a root. */
export function fileTree(root: string): string[] {
  if (!existsSync(root)) return [];
  const output: string[] = [];
  const walk = (dir: string, prefix: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      output.push(rel);
      if (e.isDirectory() && !e.isSymbolicLink()) walk(join(dir, e.name), rel);
    }
  };
  walk(root, "");
  return output.sort();
}

/** Replaces a skill directory with a link pointing outside the project. */
export function replaceWithSymlink(root: string, name: string): void {
  const target = mkdtempSync(join(tmpdir(), "crs-foreign-"));
  symlinkSync(target, join(root, ".agents", "skills", name + "-linked"), "dir");
}

export type Result = { status: number; skills?: string[] } | null;

/**
 * Executor injected in place of the real binary.
 *
 * `mode` decides which path gets exercised: `success` writes the
 * directories and lockfile like the installer would, `absent` returns
 * null as if the binary didn't exist, and `error` ends with a non-zero
 * code without completing.
 */
export function fakeExecutor(mode: "success" | "absent" | "error", root: string) {
  const calls: string[][] = [];
  const fn = (args: string[]): Result => {
    calls.push(args);
    if (mode === "absent") return null;
    // The real CLI offers `--list`, which enumerates without installing.
    // Conflict detection depends on this: without knowing the names
    // beforehand, the only option would be discovering the conflict after
    // already overwriting.
    if (args.includes("--list")) return { status: 0, skills: [...MATTPOCOCK_SET] };
    if (mode === "error") {
      // Leaves half written, so the case proves partial never becomes complete.
      mkdirSync(join(root, ".agents", "skills", MATTPOCOCK_SET[0]!), { recursive: true });
      return { status: 1 };
    }
    for (const n of MATTPOCOCK_SET) {
      mkdirSync(join(root, ".agents", "skills", n), { recursive: true });
      writeFileSync(join(root, ".agents", "skills", n, "SKILL.md"), `---\nname: ${n}\n---\nbody\n`);
    }
    writeLock(root, MATTPOCOCK_SET);
    return { status: 0 };
  };
  return { fn, calls };
}

/** Writes the lockfile in the shape observed by research, accumulating onto whatever already exists. */
export function writeLock(root: string, names: string[], source = "mattpocock/skills"): void {
  const path = join(root, "skills-lock.json");
  const skills: Record<string, unknown> = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as { skills?: Record<string, unknown> }).skills ?? {}
    : {};
  for (const n of names) {
    skills[n] = {
      source,
      sourceType: "github",
      skillPath: `skills/engineering/${n}/SKILL.md`,
      computedHash: `hash-${n}`,
    };
  }
  writeFileSync(path, JSON.stringify({ version: 1, skills }, null, 2));
}

/**
 * Fake executor that responds per source — `mattpocock/skills` or `promovaweb/specsfy`.
 *
 * `failFor`, when given, makes that specific source return `null` (binary
 * absent), while the other keeps installing normally — this is what
 * proves one source failing doesn't contaminate the other's report.
 */
export function dualSourceExecutor(failFor?: string) {
  const calls: string[][] = [];
  const fn = (args: string[], cwd: string): Result => {
    calls.push(args);
    const source = args.includes("mattpocock/skills")
      ? "mattpocock/skills"
      : args.includes("promovaweb/specsfy")
        ? "promovaweb/specsfy"
        : null;
    if (source === null) return null;
    if (source === failFor) return null;
    const set = source === "mattpocock/skills" ? MATTPOCOCK_SET : SPECSFY_SET;
    if (args.includes("--list")) return { status: 0, skills: [...set] };
    for (const n of set) {
      mkdirSync(join(cwd, ".agents", "skills", n), { recursive: true });
      writeFileSync(join(cwd, ".agents", "skills", n, "SKILL.md"), `---\nname: ${n}\n---\nbody\n`);
    }
    writeLock(cwd, set, source);
    return { status: 0 };
  };
  return { fn, calls };
}

/**
 * Oracle for confinement outside the project.
 *
 * Walking all of `$HOME` is expensive and unstable: other processes write
 * there during the run. This one observes the first level and, above all,
 * the exact path where the installer's global form would write — which is
 * where the violation would actually show up.
 */
export function outsideProject(): { topLevel: number; global: string[] } {
  const topLevel = existsSync(homedir()) ? readdirSync(homedir()).length : 0;
  // Both global skill directories the `skills` CLI could write to; the setup must touch neither.
  const global = [join(homedir(), ".claude", "skills"), join(homedir(), ".agents", "skills")]
    .flatMap((dir) => (existsSync(dir) ? readdirSync(dir).map((n) => `${dir}:${n}`) : []))
    .sort();
  return { topLevel, global };
}
