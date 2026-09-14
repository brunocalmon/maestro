import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { TargetAdapter, TargetEnvironment } from "./adapter.js";
import type { Hook } from "../hooks/source.js";
import { translateForClaudeCode } from "../hooks/claude-code.js";
import { createExtension, realTargetFileEnvironment } from "../extensions/create.js";
import { realChecksumEnvironment } from "../extensions/registry.js";
import { buildRouterBlock, buildConfigLanguageBlock } from "../extensions/router.js";

const EVIDENCE = [".agents/", ".gemini/"];

export const antigravityAdapter: TargetAdapter = {
  name: "antigravity",
  displayName: "Google Antigravity",
  settingsPath: null,
  skillDirs: [".agents/skills"],

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

  formatHooks: (hooks: Hook[]) => {
    const installed = hooks.map(translateForClaudeCode);
    return { settings: null, installed };
  },

  ensureInstructions: (root: string) => {
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);

    createExtension({
      category: "extension",
      name: "agents-router",
      target: "AGENTS.md",
      content: buildRouterBlock(),
      registryEnv,
      targetEnv,
    });

    createExtension({
      category: "extension",
      name: "agents-config-language-rule",
      target: "AGENTS.md",
      content: buildConfigLanguageBlock(),
      registryEnv,
      targetEnv,
    });
  },

  ensureDirectoryStructure: (root: string) => {
    const dir = resolve(root, ".agents", "skills");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  },
};
