import { anchorMarkers, computeChecksum, readAnchor } from "./anchor.js";
import { readExtensionRegistry, writeExtensionRegistry, type ChecksumEnvironment, type ExtensionArtifact } from "./registry.js";
import { resolveTargetPath, type TargetFileEnvironment } from "./create.js";

/**
 * Sections other tools write into CLAUDE.md that belong in AGENTS.md.
 *
 * Only what is listed here is ever moved (SPEC-0024, DEC-003): a heading
 * the maestro doesn't recognize is a person's text, and moving a person's
 * text is the kind of help that destroys trust in the tool. The table starts
 * with the one block `setup-matt-pocock-skills` writes.
 */
export interface ForeignSignature {
  heading: string;
  origin: string;
  /** Artifact name in the registry. */
  name: string;
}

export const FOREIGN_SIGNATURES: readonly ForeignSignature[] = [
  { heading: "## Agent skills", origin: "mattpocock/skills", name: "foreign:agent-skills" },
];

export interface RelocationResult {
  /** Sections moved from CLAUDE.md to AGENTS.md this run. */
  moved: string[];
  /** Sections removed from CLAUDE.md because AGENTS.md already had the identical text. */
  deduplicated: string[];
  /** Sections left in CLAUDE.md because AGENTS.md has a different version; reported, never merged. */
  conflicting: string[];
  /** Registered foreign content whose text in AGENTS.md changed since the registration. */
  drifted: string[];
}

/** Extracts a level-2 section (heading up to the next `## `) from Markdown, or null. */
export function extractSection(markdown: string, heading: string): { text: string; from: number; to: number } | null {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i] ?? "")) { end = i; break; }
  }
  const from = lines.slice(0, start).join("\n").length + (start > 0 ? 1 : 0);
  const to = lines.slice(0, end).join("\n").length;
  return { text: markdown.slice(from, to).replace(/\n+$/, "") + "\n", from, to };
}

const removeRange = (markdown: string, from: number, to: number): string =>
  (markdown.slice(0, from) + markdown.slice(to)).replace(/\n{3,}/g, "\n\n");

/**
 * Moves known third-party sections from CLAUDE.md to AGENTS.md, wraps them
 * in the same `<!-- maestro:foreign:<name>:start/end -->` anchor every other
 * managed block uses, and records them as `foreign` — tracked by checksum so
 * drift is visible, never rewritten, repaired or quarantined by the maestro
 * (FR-003, FR-004). Wrapping is a deliberate standardization, not a content
 * change: the anchor sits around the third-party text as-is, in its
 * original position, so `AGENTS.md` looks and diffs the same as any other
 * maestro-managed section (owner requirement, follow-up to SPEC-0024).
 */
export function relocateForeignSections(envs: { registryEnv: ChecksumEnvironment; targetEnv: TargetFileEnvironment; now?: () => string }): RelocationResult {
  const result: RelocationResult = { moved: [], deduplicated: [], conflicting: [], drifted: [] };
  const claudePath = resolveTargetPath("CLAUDE.md");
  const agentsPath = resolveTargetPath("AGENTS.md");
  let claude = envs.targetEnv.read(claudePath);
  let agents = envs.targetEnv.read(agentsPath);
  const registry = readExtensionRegistry(envs.registryEnv);
  let claudeChanged = false;
  let agentsChanged = false;
  let registryChanged = false;

  for (const sig of FOREIGN_SIGNATURES) {
    const inClaude = extractSection(claude, sig.heading);
    const inAgents = extractSection(agents, sig.heading);
    const registered = registry.artifacts.find((a) => a.name === sig.name);

    if (inClaude) {
      if (inAgents === null) {
        const separator = agents.length === 0 || agents.endsWith("\n") ? (agents.endsWith("\n\n") || agents.length === 0 ? "" : "\n") : "\n\n";
        agents = `${agents}${separator}${inClaude.text}`;
        agentsChanged = true;
        claude = removeRange(claude, inClaude.from, inClaude.to);
        claudeChanged = true;
        result.moved.push(sig.heading);
      } else if (inAgents.text.trim() === inClaude.text.trim()) {
        claude = removeRange(claude, inClaude.from, inClaude.to);
        claudeChanged = true;
        result.deduplicated.push(sig.heading);
      } else {
        result.conflicting.push(sig.heading);
      }
    }

    // Standardize: whatever plain (unanchored) text now sits in AGENTS.md —
    // moved here just now, already there from a prior run, or written there
    // directly because CLAUDE.md didn't exist when the third-party skill ran
    // — gets wrapped in place with the anchor, without moving it to the end
    // of the file or touching anything outside its own range.
    if (readAnchor(agents, "foreign", sig.name) === null) {
      const plain = extractSection(agents, sig.heading);
      if (plain) {
        const { start, end } = anchorMarkers("foreign", sig.name);
        const content = plain.text.replace(/\n$/, "");
        const block = `${start}\n${content}\n${end}\n`;
        agents = agents.slice(0, plain.from) + block + agents.slice(plain.to);
        agentsChanged = true;
      }
    }

    // Whatever ended up in AGENTS.md must be tracked so drift has something
    // to compare against. Without this, content that never touched
    // CLAUDE.md (the common case) was silently never registered, and
    // `drifted` could never fire for it (SPEC-0024 gap).
    const current = readAnchor(agents, "foreign", sig.name);
    if (current !== null) {
      if (!registered) {
        const artifact: ExtensionArtifact = {
          category: "foreign", name: sig.name, target: "AGENTS.md", origin: sig.origin,
          content: current, checksum: computeChecksum(current),
          createdAt: (envs.now ?? (() => new Date().toISOString()))(),
        };
        registry.artifacts = [...registry.artifacts, artifact];
        registryChanged = true;
      } else if (computeChecksum(current) !== registered.checksum) {
        // Drift is only reported: the content is the other tool's (PR-002).
        result.drifted.push(sig.heading);
      }
    }
  }

  if (claudeChanged) envs.targetEnv.write(claudePath, claude);
  if (agentsChanged) envs.targetEnv.write(agentsPath, agents);
  if (registryChanged) writeExtensionRegistry(registry, envs.registryEnv);
  return result;
}
