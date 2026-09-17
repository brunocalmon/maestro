import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { SkippedHook, TargetAdapter, TargetEnvironment } from "./adapter.js";
import type { CanonicalEvent, Hook } from "../hooks/source.js";
import { translateForClaudeCode, renderSettings } from "../hooks/claude-code.js";
import { ensureInstructions as ensureSharedInstructions, realInstructionEnvs } from "../extensions/instructions.js";

const EVIDENCE = [".claude/settings.json", ".claude/settings.local.json", ".claude/"];

const SUPPORTED: readonly CanonicalEvent[] = [
  "before-shell", "before-tool", "after-file-edit", "after-tool", "stop", "session-start", "before-compact", "on-prompt",
];

/** Splits hooks into the ones this target runs and the ones it must report as skipped. */
export function partitionByEvent(hooks: Hook[], supported: readonly CanonicalEvent[], target: string): { accepted: Hook[]; skipped: SkippedHook[] } {
  const accepted: Hook[] = [];
  const skipped: SkippedHook[] = [];
  for (const h of hooks) {
    if (supported.includes(h.event)) accepted.push(h);
    else skipped.push({ name: h.name, event: h.event, reason: `event ${h.event} unsupported by ${target}` });
  }
  return { accepted, skipped };
}

export const claudeCodeAdapter: TargetAdapter = {
  name: "claude-code",
  displayName: "Claude Code",
  settingsPath: ".claude/settings.json",
  skillDirs: [".claude/skills", ".agents/skills"],
  projectsSkillsTo: ".claude/skills",
  supportedEvents: SUPPORTED,

  detectEvidence: (env: TargetEnvironment): boolean => {
    if (env.hasClaudeCode) return true;
    if (env.envVars?.CLAUDE_CODE !== undefined) return true;
    return EVIDENCE.some((e) => env.files.some((f) => f.startsWith(e)));
  },

  formatHooks: (hooks: Hook[], bins = {}) => {
    const { accepted, skipped } = partitionByEvent(hooks, SUPPORTED, "claude-code");
    const translated = accepted.map((h) => translateForClaudeCode(h, bins));
    const settings = renderSettings(translated);
    return { settings, installed: translated, skipped };
  },

  ensureInstructions: (root: string) => {
    // SPEC-0024: content in AGENTS.md, one import line in CLAUDE.md.
    return ensureSharedInstructions({ claudeImport: true, envs: realInstructionEnvs(root) });
  },

  ensureDirectoryStructure: (root: string) => {
    const dir = resolve(root, ".claude");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  },
};
