import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readHook } from "../hooks/source.js";
import { HOOKS_DIR } from "../hooks/claude-code.js";
import { isLegacyEntry, isMaestroEntry, LEGACY_HOOK_NAMES } from "../hooks/identity.js";
import { readAnchor } from "../extensions/anchor.js";
import { extractSection } from "../extensions/foreign.js";
import { directoryChecksum } from "../skills/project.js";

/**
 * "Configured" means more than "installed": the on-disk trail a
 * conversational skill leaves once it actually ran (`specsfy-setup`,
 * `setup-matt-pocock-skills`). This is the fixed table the checks below
 * compare against — a real signal of what those skills do today, not a
 * flag the maestro itself writes (SPEC-0025, R-002, FIND-PROD-001).
 */
export const SPECSFY_SETUP_TRACES: readonly string[] = [
  "PROJECT.md",
  ".specsfy/STACK.md",
  ".specsfy/RULES.md",
  ".specsfy/USER-PROFILE.md",
];

/** The section `setup-matt-pocock-skills` writes, moved to AGENTS.md since SPEC-0024. */
export const AGENT_SKILLS_HEADING = "## Agent skills";

/** The three blocks every target installs in AGENTS.md, under the same names (SPEC-0024). */
export const SHARED_INSTRUCTION_BLOCKS: readonly string[] = ["router", "config-language-rule", "hooks-fallback"];

const hooksDir = (): string => resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "resources", "hooks");

export interface ExpectedLayout {
  /** Canonical hook names, read from the resources/hooks/ corpus — never a hardcoded list, so this never lags behind it. */
  hooks: string[];
  /** Blocks maestro installs in AGENTS.md for every target. */
  agentsBlocks: readonly string[];
  /** Whether the target also expects the `agents-import` block in CLAUDE.md. */
  claudeImport: boolean;
  /** Files a completed `specsfy-setup` leaves behind. */
  traces: readonly string[];
  /** Heading the `setup-matt-pocock-skills` skill writes into AGENTS.md. */
  agentSkillsHeading: string;
}

/**
 * What a fully configured project should have — derived only from the
 * hook corpus and fixed tables, never from `.maestro/install.json` or any
 * other recorded state. `setup` and `doctor` import the same function, so
 * they can never disagree about what "expected" means (SPEC-0025, FR-007,
 * DEC-005): a state file would age the moment code changes under it.
 */
export function expectedLayout(target: "claude-code" | "antigravity" = "claude-code"): ExpectedLayout {
  const hooks = readdirSync(hooksDir())
    .filter((f) => f.endsWith(".md"))
    .map((f) => readHook(readFileSync(join(hooksDir(), f), "utf8")).name)
    .sort();
  return {
    hooks,
    agentsBlocks: SHARED_INSTRUCTION_BLOCKS,
    claudeImport: target === "claude-code",
    traces: SPECSFY_SETUP_TRACES,
    agentSkillsHeading: AGENT_SKILLS_HEADING,
  };
}

export interface DivergentProjection {
  name: string;
}

export interface UncoveredFallbackHook {
  name: string;
}

export interface ConfigurationAssessment {
  missingTraces: string[];
  missingSkillSection: boolean;
  missingBlocks: string[];
  legacyHookEntries: string[];
  missingHookScripts: string[];
  /** A maestro block found in CLAUDE.md instead of AGENTS.md — the pre-SPEC-0024 direction. */
  wrongDirectionBlocks: string[];
  /** Anchor markers with a start and no matching end, or vice versa, in AGENTS.md/CLAUDE.md — includes markers from any prefix, not only `maestro:`. */
  unpairedMarkers: string[];
  /** Level-2 sections in CLAUDE.md that are neither a known block nor a known third-party signature. */
  unknownSections: string[];
  /** Skills projected into .claude/skills whose content no longer matches what was recorded. */
  divergentProjections: DivergentProjection[];
  /** Hooks the `hooks-fallback` block names that have no installed script. */
  uncoveredFallbackHooks: UncoveredFallbackHook[];
}

const readIfExists = (path: string): string => (existsSync(path) ? readFileSync(path, "utf8") : "");

/** Finds every `<!-- prefix:...:start -->` / `:end -->` HTML comment and reports the ones without a matching counterpart. */
function findUnpairedMarkers(text: string): string[] {
  const starts = [...text.matchAll(/<!--\s*([\w.-]+(?::[\w.-]+)*):start\s*-->/g)].map((m) => m[1]!);
  const ends = [...text.matchAll(/<!--\s*([\w.-]+(?::[\w.-]+)*):end\s*-->/g)].map((m) => m[1]!);
  const unpaired: string[] = [];
  for (const s of starts) if (!ends.includes(s)) unpaired.push(`${s}:start`);
  for (const e of ends) if (!starts.includes(e)) unpaired.push(`${e}:end`);
  return unpaired;
}

/** Level-2 (`## `) headings in `text`, in order. */
function level2Headings(text: string): string[] {
  return text.split("\n").filter((l) => /^## /.test(l));
}

/**
 * Compares the disk against `expectedLayout`, without writing anything
 * (PR-001). Every field is a gap; an empty assessment means fully
 * configured.
 */
export function assessConfiguration(root: string, target: "claude-code" | "antigravity" = "claude-code"): ConfigurationAssessment {
  const layout = expectedLayout(target);
  const agents = readIfExists(join(root, "AGENTS.md"));
  const claude = readIfExists(join(root, "CLAUDE.md"));

  const missingTraces = layout.traces.filter((t) => !existsSync(join(root, t)));
  const missingSkillSection = extractSection(agents, layout.agentSkillsHeading) === null;

  const missingBlocks = layout.agentsBlocks.filter((name) => readAnchor(agents, "extension", name) === null);
  const wrongDirectionBlocks = layout.agentsBlocks.filter((name) => readAnchor(claude, "extension", name) !== null);
  if (layout.claudeImport && readAnchor(claude, "extension", "agents-import") === null && !/^\s*@AGENTS\.md\s*$/m.test(claude)) {
    missingBlocks.push("agents-import");
  }

  const unpairedMarkers = [...findUnpairedMarkers(agents), ...findUnpairedMarkers(claude)];

  // A level-2 heading in CLAUDE.md is "known" only when it's a signature the
  // maestro recognizes and relocates (SPEC-0024); a maestro block itself
  // never shows up as a bare `## ` heading outside its anchor comments.
  const unknownSections = level2Headings(claude).filter((h) => h.trim() !== layout.agentSkillsHeading);

  const settingsPath = join(root, ".claude", "settings.json");
  let legacyHookEntries: string[] = [];
  let recognizedHookNames = new Set<string>();
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as { hooks?: Record<string, { matcher?: string; hooks: { command: string }[] }[]> };
      for (const entries of Object.values(settings.hooks ?? {})) {
        for (const entry of entries) {
          if (isLegacyEntry(entry, [...layout.hooks, ...LEGACY_HOOK_NAMES])) legacyHookEntries.push(entry.matcher!);
          const name = isMaestroEntry(entry);
          if (name) recognizedHookNames.add(name);
        }
      }
    } catch {
      legacyHookEntries = ["<settings.json is not valid JSON>"];
    }
  }
  const missingHookScripts = layout.hooks.filter((name) => recognizedHookNames.has(name) && !existsSync(join(root, HOOKS_DIR, `${name}.sh`)));

  const divergentProjections: DivergentProjection[] = [];
  const installJsonPath = join(root, ".maestro", "install.json");
  if (existsSync(installJsonPath)) {
    try {
      const record = JSON.parse(readFileSync(installJsonPath, "utf8")) as { projections?: { name: string; checksum: string }[] };
      for (const p of record.projections ?? []) {
        const dir = join(root, ".claude", "skills", p.name);
        if (!existsSync(dir)) continue;
        if (directoryChecksum(dir) !== p.checksum) divergentProjections.push({ name: p.name });
      }
    } catch {
      // Malformed record: nothing to compare against.
    }
  }

  const fallbackBlock = readAnchor(agents, "extension", "hooks-fallback") ?? "";
  const uncoveredFallbackHooks: UncoveredFallbackHook[] = [];
  for (const name of layout.hooks) {
    if (fallbackBlock.includes(`\`${name}\``) && !existsSync(join(root, HOOKS_DIR, `${name}.sh`))) {
      uncoveredFallbackHooks.push({ name });
    }
  }

  return {
    missingTraces,
    missingSkillSection,
    missingBlocks,
    legacyHookEntries,
    missingHookScripts,
    wrongDirectionBlocks,
    unpairedMarkers,
    unknownSections,
    divergentProjections,
    uncoveredFallbackHooks,
  };
}

/**
 * The one line `maestro setup`'s report and the generated README carry
 * while configuration is incomplete — naming only the skill that is
 * actually missing, never both when only one is (SPEC-0025, FR-003,
 * NFR-003).
 */
export function nextStepsNote(assessment: ConfigurationAssessment): string | null {
  const skills: string[] = [];
  if (assessment.missingTraces.length > 0) skills.push("/specsfy-setup");
  if (assessment.missingSkillSection) skills.push("/setup-matt-pocock-skills");
  if (skills.length === 0) return null;
  return `next: run ${skills.join(" and ")} in your agent`;
}
