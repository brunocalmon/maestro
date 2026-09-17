import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { translateForClaudeCode } from "../src/hooks/claude-code";
import type { Hook } from "../src/hooks/source";
import { corpusHook } from "./helpers-spec-0022";

/** Tool names observed on this machine that execute shell outside `Bash` (SPEC-0023, R-001). */
export const CTX_EXECUTE = "mcp__plugin_context-mode_context-mode__ctx_execute";
export const CTX_BATCH = "mcp__plugin_context-mode_context-mode__ctx_batch_execute";
export const TERMINAL = "mcp__terminal__run_in_terminal";
export const PLAYWRIGHT_CODE = "mcp__plugin_playwright_playwright__browser_run_code_unsafe";

/** A trailer that the authorship guard must refuse, assembled so the literal never sits in a shell command line. */
export const AI_TRAILER = ["Co-Authored", "-By: Cla", "ude <noreply@anthropic.com>"].join("");

/** Writes the generated script of a hook (from the corpus or synthetic) to a temp file and returns its path. */
export function scriptFor(hook: Hook | string, bins?: Record<string, string | null>): string {
  const h = typeof hook === "string" ? corpusHook(hook) : hook;
  // `bins` is the SPEC-0023 extension of translateForClaudeCode; older signatures ignore it.
  const translated = (translateForClaudeCode as unknown as (x: Hook, b?: Record<string, string | null>) => { scriptBody?: string })(h, bins);
  if (!translated.scriptBody) throw new Error(`hook ${h.name} produced no script body`);
  const dir = mkdtempSync(join(tmpdir(), "spec0023-script-"));
  const path = join(dir, `${h.name}.sh`);
  writeFileSync(path, translated.scriptBody);
  chmodSync(path, 0o755);
  return path;
}

export interface RunResult { status: number | null; stdout: string; stderr: string; ms: number }

/** Runs a hook script with an event on stdin, `CLAUDE_PROJECT_DIR` pointing at `root`. */
export function runScript(path: string, event: unknown, root: string, env: Record<string, string> = {}): RunResult {
  const started = performance.now();
  const r = spawnSync("bash", [path], {
    input: JSON.stringify(event),
    encoding: "utf8",
    cwd: root,
    env: { ...process.env, CLAUDE_PROJECT_DIR: root, ...env },
    timeout: 20_000,
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "", ms: performance.now() - started };
}

export const shellEvent = (tool: string, command: string, extra: Record<string, unknown> = {}) =>
  tool === CTX_EXECUTE
    ? { session_id: "s-test", tool_name: tool, tool_input: { language: "shell", code: command, ...extra } }
    : tool === CTX_BATCH
      ? { session_id: "s-test", tool_name: tool, tool_input: { commands: [command], ...extra } }
      : { session_id: "s-test", tool_name: tool, tool_input: { command, ...extra } };

/** Temp git repository with one committed file, so `git status --porcelain` is meaningful. */
export function gitRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "spec0023-repo-"));
  const git = (...args: string[]) => spawnSync("git", args, { cwd: root, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
  git("init", "-q");
  writeFileSync(join(root, "x.ts"), "export const a = 1;\n");
  git("add", ".");
  git("commit", "-q", "-m", "init");
  mkdirSync(join(root, ".maestro", "state"), { recursive: true });
  return root;
}

/** Fake `code-review-graph` binary that appends its argv to a log file. */
export function fakeCrg(): { bin: string; log: string; calls: () => string[] } {
  const dir = mkdtempSync(join(tmpdir(), "spec0023-crg-"));
  const log = join(dir, "calls.log");
  const bin = join(dir, "code-review-graph");
  writeFileSync(bin, `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}'\nexit 0\n`);
  chmodSync(bin, 0o755);
  return { bin, log, calls: () => (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean) : []) };
}

export const stateFile = (root: string, name: string): string => resolve(root, ".maestro", "state", name);
