import { readAnchor, removeAnchor, insertAnchor, computeChecksum } from "./anchor.js";
import { readExtensionRegistry, writeExtensionRegistry, type ChecksumEnvironment, type ExtensionArtifact } from "./registry.js";
import { resolveTargetPath, type TargetFileEnvironment } from "./create.js";
import type { QuarantineEnvironment } from "./repair.js";

/**
 * One step of a direction change: move the block `name` from `from` to
 * `to`, optionally under a new name, or drop it altogether (`remove`).
 */
export interface MigrationStep {
  name: string;
  from: string;
  to?: string;
  rename?: string;
  remove?: boolean;
}

export interface MigrationResult {
  migrated: string[];
  quarantined: { name: string; quarantinePath: string }[];
  removed: string[];
}

/**
 * Moves registered blocks between instruction files without recreating
 * them (SPEC-0024, DEC-002).
 *
 * `createExtension` refuses a name that is already registered, so a
 * release that changes where a block lives cannot simply install it again:
 * a consumer that ran an older setup would keep the old layout forever.
 * This walks the registry instead. A block whose on-disk content still
 * matches its checksum is moved verbatim (the content is the artifact's, not
 * this release's); one that diverged goes to quarantine and the registered
 * content is what gets moved — never a silent overwrite (PR-003). Blocks of
 * other tools and text outside our anchors are never touched.
 */
export function migrateExtensionTargets(
  plan: readonly MigrationStep[],
  envs: { registryEnv: ChecksumEnvironment; targetEnv: TargetFileEnvironment; quarantineEnv: QuarantineEnvironment; now?: () => string },
): MigrationResult {
  const registry = readExtensionRegistry(envs.registryEnv);
  const result: MigrationResult = { migrated: [], quarantined: [], removed: [] };
  const stamp = (envs.now ?? (() => new Date().toISOString()))().replace(/[:.]/g, "-");
  let changed = false;

  for (const step of plan) {
    const artifact = registry.artifacts.find((a) => a.name === step.name && a.target === step.from);
    if (!artifact) continue;
    const fromPath = resolveTargetPath(step.from);
    const current = envs.targetEnv.read(fromPath);
    const onDisk = readAnchor(current, artifact.category, artifact.name);

    if (step.remove) {
      if (onDisk !== null) envs.targetEnv.write(fromPath, removeAnchor(current, artifact.category, artifact.name));
      registry.artifacts = registry.artifacts.filter((a) => a !== artifact);
      result.removed.push(step.name);
      changed = true;
      continue;
    }

    const to = step.to ?? step.from;
    const newName = step.rename ?? artifact.name;
    if (onDisk !== null && computeChecksum(onDisk) !== artifact.checksum) {
      const quarantinePath = `${stamp}-${artifact.name}`;
      envs.quarantineEnv.write(quarantinePath, onDisk);
      result.quarantined.push({ name: artifact.name, quarantinePath });
    }
    if (onDisk !== null) envs.targetEnv.write(fromPath, removeAnchor(current, artifact.category, artifact.name));

    const toPath = resolveTargetPath(to);
    // Reading again: `from` and `to` may be the same file (a pure rename).
    const destination = envs.targetEnv.read(toPath);
    const moved: ExtensionArtifact = { ...artifact, name: newName, target: to };
    envs.targetEnv.write(toPath, insertAnchor(destination, moved.category, moved.name, moved.content));
    registry.artifacts = registry.artifacts.map((a) => (a === artifact ? moved : a));
    result.migrated.push(newName);
    changed = true;
  }

  if (changed) writeExtensionRegistry(registry, envs.registryEnv);
  return result;
}

/** The direction change SPEC-0024 introduced: maestro content in AGENTS.md, one import line in CLAUDE.md. */
export const DIRECTION_PLAN: readonly MigrationStep[] = [
  { name: "router", from: "CLAUDE.md", to: "AGENTS.md" },
  { name: "config-language-rule", from: "CLAUDE.md", to: "AGENTS.md" },
  { name: "hooks-fallback", from: "CLAUDE.md", to: "AGENTS.md" },
  { name: "agents-pointer", from: "AGENTS.md", remove: true },
  { name: "config-language-pointer", from: "AGENTS.md", remove: true },
  { name: "hooks-fallback-pointer", from: "AGENTS.md", remove: true },
  { name: "agents-router", from: "AGENTS.md", rename: "router" },
  { name: "agents-config-language-rule", from: "AGENTS.md", rename: "config-language-rule" },
  { name: "agents-hooks-fallback", from: "AGENTS.md", rename: "hooks-fallback" },
];
