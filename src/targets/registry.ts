import type { TargetAdapter, TargetEnvironment, DetectionResult } from "./adapter.js";
import { claudeCodeAdapter } from "./claude-code.js";
import { antigravityAdapter } from "./antigravity.js";

const ADAPTERS: Record<string, TargetAdapter> = {
  "claude-code": claudeCodeAdapter,
  antigravity: antigravityAdapter,
};

export const DEFAULT_TARGET = "claude-code";

export const KNOWN_TARGETS: readonly string[] = Object.keys(ADAPTERS);

export function getTargetAdapter(name: string): TargetAdapter | undefined {
  return ADAPTERS[name];
}

export function detectTarget(env: TargetEnvironment, explicitTarget?: string): DetectionResult {
  if (explicitTarget !== undefined) {
    if (!KNOWN_TARGETS.includes(explicitTarget)) {
      return {
        found: false,
        target: explicitTarget,
        reason: `unknown target "${explicitTarget}"; known targets: ${KNOWN_TARGETS.join(", ")}`,
      };
    }
    return { found: true, target: explicitTarget, reason: `explicit: --target ${explicitTarget}` };
  }

  // Check evidence for each target adapter
  if (claudeCodeAdapter.detectEvidence(env)) {
    return { found: true, target: "claude-code", reason: "evidence found: .claude/" };
  }

  if (antigravityAdapter.detectEvidence(env)) {
    return { found: true, target: "antigravity", reason: "evidence found: .agents/ or .gemini/" };
  }

  return {
    found: false,
    target: DEFAULT_TARGET,
    reason: `no evidence of target use; none of .claude/, .agents/, .gemini/ is present`,
  };
}
