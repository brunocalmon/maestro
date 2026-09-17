import type { CanonicalEvent, Hook } from "../hooks/source.js";
import type { TranslatedHook, Settings } from "../hooks/claude-code.js";
import type { DependencyResolution } from "../hooks/resolve.js";
import type { InstructionsResult } from "../extensions/instructions.js";

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

/** A hook the adapter refused, with the reason — reported, never silenced (SPEC-0022, FR-007). */
export interface SkippedHook {
  name: string;
  event: CanonicalEvent;
  reason: string;
}

export interface TargetAdapter {
  name: string;
  displayName: string;
  settingsPath: string | null;
  skillDirs: string[];
  /** Directory this target reads skills from when it doesn't read `.agents/skills`; absent, no projection (SPEC-0024). */
  projectsSkillsTo?: string;
  /** Canonical events this target can actually run. */
  supportedEvents: readonly CanonicalEvent[];
  detectEvidence: (env: TargetEnvironment) => boolean;
  formatHooks: (hooks: Hook[], bins?: DependencyResolution) => { settings: Settings | null; installed: TranslatedHook[]; skipped: SkippedHook[] };
  /** Installs the instruction blocks; returns what the direction migration did, for the report (SPEC-0024). */
  ensureInstructions: (root: string) => InstructionsResult | void;
  ensureDirectoryStructure: (root: string) => void;
}
