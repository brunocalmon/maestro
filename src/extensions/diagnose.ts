import type { ExtensionRegistry } from "./registry.js";
import type { TargetFileEnvironment } from "./create.js";
import { resolveTargetPath } from "./create.js";
import { readAnchor, computeChecksum } from "./anchor.js";

export interface DivergentArtifact {
  name: string;
  target: string;
  reason: "checksum-mismatch" | "checksum-missing";
}

/**
 * Pure read function — never writes anything (`PR-082`, `NFR-082`).
 * `presentNames` are extension names found on disk with no matching
 * registry entry (`checksum-missing`, `AC-135`); the real `doctor`
 * resolves that list by listing `.maestro/extensions/`.
 */
export function diagnoseExtensions(
  registry: ExtensionRegistry,
  targetEnv: TargetFileEnvironment,
  presentNames: readonly string[],
): DivergentArtifact[] {
  const divergent: DivergentArtifact[] = [];

  for (const artifact of registry.artifacts) {
    // A hook script's `target` (SPEC-0022, `.maestro/hooks/<name>.sh`) is
    // already the real path — `resolveTargetPath` only knows the router
    // files and its own `.maestro/extensions/` convention, and running a
    // hook's target through it produced a path nothing ever wrote to,
    // so every hook looked divergent on every `doctor` run (SPEC-0025,
    // found running this check for real). Everything else keeps going
    // through `resolveTargetPath` as before.
    const path = artifact.category === "hook" ? artifact.target : resolveTargetPath(artifact.target);
    // A hook script (SPEC-0022) is the whole file, not an anchored block.
    const realContent = artifact.category === "hook"
      ? (targetEnv.read(path) || null)
      : readAnchor(targetEnv.read(path), artifact.category, artifact.name);
    const realChecksum = realContent === null ? null : computeChecksum(realContent);
    if (realChecksum !== artifact.checksum) {
      divergent.push({ name: artifact.name, target: artifact.target, reason: "checksum-mismatch" });
    }
  }

  // Presence on disk comes from the filename, which is the resolved
  // `target` (`resolveTargetPath`), never the extension's `name` — the
  // two diverge whenever the person names the extension differently from
  // the hook it targets, the common case. Comparing against `name` made
  // every intact artifact in that situation look like an orphan (real
  // finding from actually running `dist/cli.js doctor`, T021).
  const registeredTargets = new Set(registry.artifacts.map((a) => a.target));
  for (const name of presentNames) {
    if (!registeredTargets.has(name)) {
      divergent.push({ name, target: name, reason: "checksum-missing" });
    }
  }

  return divergent;
}
