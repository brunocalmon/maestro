import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { TargetEnvironment } from "../hooks/detect.js";

/**
 * Observes the project to feed detection.
 *
 * Isolated in its own module because it's the only part that touches the
 * filesystem: the decision itself receives the result as a parameter, and
 * that's what makes detection verifiable without depending on the machine.
 */
export function detectEnvironment(root: string = process.cwd()): TargetEnvironment {
  const files: string[] = [];

  const claudeDir = resolve(root, ".claude");
  const hasClaudeCode = existsSync(claudeDir);
  if (hasClaudeCode) {
    try {
      files.push(".claude/", ...readdirSync(claudeDir).map((f) => `.claude/${f}`));
    } catch {
      files.push(".claude/");
    }
  }

  const agentsDir = resolve(root, ".agents");
  const geminiDir = resolve(root, ".gemini");
  const hasAntigravity = existsSync(agentsDir) || existsSync(geminiDir);
  if (existsSync(agentsDir)) {
    try {
      files.push(".agents/", ...readdirSync(agentsDir).map((f) => `.agents/${f}`));
    } catch {
      files.push(".agents/");
    }
  }
  if (existsSync(geminiDir)) {
    try {
      files.push(".gemini/", ...readdirSync(geminiDir).map((f) => `.gemini/${f}`));
    } catch {
      files.push(".gemini/");
    }
  }

  return {
    hasClaudeCode,
    hasAntigravity,
    files,
  };
}
