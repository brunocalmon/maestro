import { assessConfiguration, nextStepsNote, type ConfigurationAssessment } from "../setup/layout.js";

export type FindingLevel = "FAIL" | "WARN";

export interface MaestroFinding {
  level: FindingLevel;
  area: string;
  message: string;
}

/**
 * What the maestro itself guarantees, read straight off `assessConfiguration`
 * — the same function `setup` uses to decide what to install, so this layer
 * can never claim a gap that `setup` doesn't also see (SPEC-0025, FR-007).
 *
 * `FAIL`: something `setup` would repair, or a real defect (broken hook,
 * stale direction, orphaned marker). `FAIL` moves `exitCode` to 1.
 * `WARN`: a pending conversational configuration step, or third-party
 * content the maestro doesn't own — never affects `exitCode` (PR-004).
 */
export function diagnoseMaestro(assessment: ConfigurationAssessment): MaestroFinding[] {
  const findings: MaestroFinding[] = [];

  if (assessment.legacyHookEntries.length > 0) {
    findings.push({ level: "FAIL", area: "hooks", message: `legacy inline hook entries still installed: ${assessment.legacyHookEntries.join(", ")}` });
  }
  if (assessment.missingHookScripts.length > 0) {
    findings.push({ level: "FAIL", area: "hooks", message: `settings.json references a hook script that no longer exists: ${assessment.missingHookScripts.join(", ")}` });
  }
  if (assessment.wrongDirectionBlocks.length > 0) {
    findings.push({ level: "FAIL", area: "instructions", message: `blocks installed in CLAUDE.md instead of AGENTS.md (pre-SPEC-0024 direction): ${assessment.wrongDirectionBlocks.join(", ")}` });
  }
  if (assessment.unpairedMarkers.length > 0) {
    findings.push({ level: "FAIL", area: "instructions", message: `anchor markers without a matching pair: ${assessment.unpairedMarkers.join(", ")}` });
  }
  for (const section of assessment.unknownSections) {
    findings.push({ level: "WARN", area: "instructions", message: `non-standard content in CLAUDE.md: ${section.replace(/^##\s*/, "")}` });
  }
  for (const p of assessment.divergentProjections) {
    findings.push({ level: "WARN", area: "skills", message: `projected skill diverged from the source: ${p.name}` });
  }
  for (const h of assessment.uncoveredFallbackHooks) {
    findings.push({ level: "FAIL", area: "hooks", message: `hooks-fallback rule points at a hook with no installed script: ${h.name}` });
  }

  const note = nextStepsNote(assessment);
  if (note) {
    for (const trace of assessment.missingTraces) findings.push({ level: "WARN", area: "configuration", message: `missing ${trace} — run /specsfy-setup` });
    if (assessment.missingSkillSection) findings.push({ level: "WARN", area: "configuration", message: `AGENTS.md has no "## Agent skills" section — run /setup-matt-pocock-skills` });
  }
  for (const block of assessment.missingBlocks) {
    findings.push({ level: "FAIL", area: "instructions", message: `expected block missing: ${block}` });
  }

  return findings;
}

/** Read-only entry point: reads the disk once, diagnoses, never writes (PR-001). */
export function diagnoseMaestroProject(root: string, target: "claude-code" | "antigravity" = "claude-code"): MaestroFinding[] {
  return diagnoseMaestro(assessConfiguration(root, target));
}
