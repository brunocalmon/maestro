import type { Hook } from "../hooks/source.js";
import type { TranslatedHook, Settings } from "../hooks/claude-code.js";

export interface TargetEnvironment {
  hasClaudeCode: boolean;
  hasAntigravity?: boolean;
  files: readonly string[];
  envVars?: Record<string, string | undefined>;
}

export interface DetectionResult {
  found: boolean;
  target: string;
  reason: string;
}

export interface TargetAdapter {
  name: string;
  displayName: string;
  settingsPath: string | null;
  skillDirs: string[];
  detectEvidence: (env: TargetEnvironment) => boolean;
  formatHooks: (hooks: Hook[]) => { settings: Settings | null; installed: TranslatedHook[] };
  ensureInstructions: (root: string) => void;
  ensureDirectoryStructure: (root: string) => void;
}
