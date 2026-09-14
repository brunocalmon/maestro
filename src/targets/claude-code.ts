import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { TargetAdapter, TargetEnvironment } from "./adapter.js";
import type { Hook } from "../hooks/source.js";
import { translateForClaudeCode, renderSettings } from "../hooks/claude-code.js";
import { createExtension, realTargetFileEnvironment } from "../extensions/create.js";
import { realChecksumEnvironment } from "../extensions/registry.js";
import {
  buildRouterBlock,
  buildAgentsPointer,
  buildConfigLanguageBlock,
  buildConfigLanguagePointer,
} from "../extensions/router.js";

const EVIDENCE = [".claude/settings.json", ".claude/settings.local.json", ".claude/"];

export const claudeCodeAdapter: TargetAdapter = {
  name: "claude-code",
  displayName: "Claude Code",
  settingsPath: ".claude/settings.json",
  skillDirs: [".claude/skills", ".agents/skills"],

  detectEvidence: (env: TargetEnvironment): boolean => {
    if (env.hasClaudeCode) return true;
    if (env.envVars?.CLAUDE_CODE !== undefined) return true;
    return EVIDENCE.some((e) => env.files.some((f) => f.startsWith(e)));
  },

  formatHooks: (hooks: Hook[]) => {
    const translated = hooks.map(translateForClaudeCode);
    const settings = renderSettings(translated);
    return { settings, installed: translated };
  },

  ensureInstructions: (root: string) => {
    const registryEnv = realChecksumEnvironment(root);
    const targetEnv = realTargetFileEnvironment(root);

    createExtension({
      category: "extension",
      name: "router",
      target: "CLAUDE.md",
      content: buildRouterBlock(),
      registryEnv,
      targetEnv,
    });

    createExtension({
      category: "extension",
      name: "agents-pointer",
      target: "AGENTS.md",
      content: buildAgentsPointer(),
      registryEnv,
      targetEnv,
    });

    createExtension({
      category: "extension",
      name: "config-language-rule",
      target: "CLAUDE.md",
      content: buildConfigLanguageBlock(),
      registryEnv,
      targetEnv,
    });

    createExtension({
      category: "extension",
      name: "config-language-pointer",
      target: "AGENTS.md",
      content: buildConfigLanguagePointer(),
      registryEnv,
      targetEnv,
    });
  },

  ensureDirectoryStructure: (root: string) => {
    const dir = resolve(root, ".claude");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  },
};
