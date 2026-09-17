import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { TargetAdapter, TargetEnvironment } from "./adapter.js";
import type { CanonicalEvent, Hook } from "../hooks/source.js";
import { translateForClaudeCode } from "../hooks/claude-code.js";
import { partitionByEvent } from "./claude-code.js";
import { ensureInstructions as ensureSharedInstructions, realInstructionEnvs } from "../extensions/instructions.js";

const EVIDENCE = [".agents/", ".gemini/"];

/** Antigravity has no settings file to run compaction or prompt hooks from; those are reported as skipped. */
const SUPPORTED: readonly CanonicalEvent[] = ["before-shell", "before-tool", "after-file-edit", "after-tool", "stop", "session-start"];

export const antigravityAdapter: TargetAdapter = {
  name: "antigravity",
  displayName: "Google Antigravity",
  settingsPath: null,
  skillDirs: [".agents/skills"],
  supportedEvents: SUPPORTED,

  detectEvidence: (env: TargetEnvironment): boolean => {
    if (env.hasAntigravity) return true;
    if (
      env.envVars?.ANTIGRAVITY !== undefined ||
      env.envVars?.GEMINI_CLI !== undefined ||
      env.envVars?.ANTIGRAVITY_AGENT !== undefined
    ) {
      return true;
    }
    return EVIDENCE.some((e) => env.files.some((f) => f.startsWith(e)));
  },

  formatHooks: (hooks: Hook[], bins = {}) => {
    const { accepted, skipped } = partitionByEvent(hooks, SUPPORTED, "antigravity");
    const installed = accepted.map((h) => translateForClaudeCode(h, bins));
    return { settings: null, installed, skipped };
  },

  ensureInstructions: (root: string) => {
    // SPEC-0024: same blocks and names as every target, in AGENTS.md; no CLAUDE.md here.
    return ensureSharedInstructions({ claudeImport: false, envs: realInstructionEnvs(root) });
  },

  ensureDirectoryStructure: (root: string) => {
    const dir = resolve(root, ".agents", "skills");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  },
};
