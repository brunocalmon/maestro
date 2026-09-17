import { readExtensionRegistry, realChecksumEnvironment, type ChecksumEnvironment } from "./registry.js";
import { createExtension, realTargetFileEnvironment, resolveTargetPath, type TargetFileEnvironment } from "./create.js";
import { readAnchor } from "./anchor.js";
import { realQuarantineEnvironment, type QuarantineEnvironment } from "./repair.js";
import { migrateExtensionTargets, DIRECTION_PLAN, type MigrationResult } from "./migrate.js";
import { relocateForeignSections, type RelocationResult } from "./foreign.js";
import { buildRouterBlock, buildConfigLanguageBlock, buildHooksFallbackBlock, buildAgentsImport } from "./router.js";

export interface InstructionEnvs {
  registryEnv: ChecksumEnvironment;
  targetEnv: TargetFileEnvironment;
  quarantineEnv: QuarantineEnvironment;
  now?: () => string;
}

export function realInstructionEnvs(root: string): InstructionEnvs {
  return {
    registryEnv: realChecksumEnvironment(root),
    targetEnv: realTargetFileEnvironment(root),
    quarantineEnv: realQuarantineEnvironment(root),
  };
}

export interface InstructionsResult {
  migration: MigrationResult;
  /** What happened to known third-party sections (SPEC-0024, FR-003/FR-004). */
  foreign: RelocationResult;
  /** True when CLAUDE.md already imported AGENTS.md outside our anchors, so no block was added. */
  importAlreadyPresent: boolean;
}

/** The blocks every target receives in AGENTS.md, under the same names (SPEC-0024, FR-001). */
const SHARED_BLOCKS: readonly { name: string; content: () => string }[] = [
  { name: "router", content: buildRouterBlock },
  { name: "config-language-rule", content: buildConfigLanguageBlock },
  { name: "hooks-fallback", content: buildHooksFallbackBlock },
];

/**
 * Installs the maestro's instructions in the one direction the Specsfy
 * already uses: full content in `AGENTS.md`, a single `@AGENTS.md` import in
 * `CLAUDE.md` (DEC-001). Runs the direction migration first, so a project
 * installed by an older release ends up in the same layout as a new one.
 *
 * `createExtension` is idempotent by refusal (a registered name is left
 * alone), which is what keeps a migrated block's content — the artifact's,
 * not this release's — from being replaced.
 */
export function ensureInstructions(opts: { claudeImport: boolean; envs: InstructionEnvs }): InstructionsResult {
  const { envs } = opts;
  const migration = migrateExtensionTargets(DIRECTION_PLAN, envs);
  // Only for the target that owns CLAUDE.md: elsewhere there is nothing to relocate.
  const foreign = opts.claudeImport
    ? relocateForeignSections(envs)
    : { moved: [], deduplicated: [], conflicting: [], drifted: [] };

  for (const block of SHARED_BLOCKS) {
    createExtension({ category: "extension", name: block.name, target: "AGENTS.md", content: block.content(), registryEnv: envs.registryEnv, targetEnv: envs.targetEnv });
  }

  let importAlreadyPresent = false;
  if (opts.claudeImport) {
    const claude = envs.targetEnv.read(resolveTargetPath("CLAUDE.md"));
    const registered = readExtensionRegistry(envs.registryEnv).artifacts.some((a) => a.name === "agents-import");
    const inBlock = readAnchor(claude, "extension", "agents-import") !== null;
    const outsideBlock = !inBlock && /^\s*@AGENTS\.md\s*$/m.test(claude);
    if (outsideBlock && !registered) {
      importAlreadyPresent = true;
    } else {
      createExtension({ category: "extension", name: "agents-import", target: "CLAUDE.md", content: buildAgentsImport(), registryEnv: envs.registryEnv, targetEnv: envs.targetEnv });
    }
  }
  return { migration, foreign, importAlreadyPresent };
}
