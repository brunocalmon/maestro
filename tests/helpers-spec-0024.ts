import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { insertAnchor, readAnchor, computeChecksum } from "../src/extensions/anchor";
import { readExtensionRegistry, writeExtensionRegistry, realChecksumEnvironment, type ExtensionArtifact } from "../src/extensions/registry";
import { project } from "./helpers-spec-0022";

export const read = (root: string, rel: string): string => (existsSync(resolve(root, rel)) ? readFileSync(resolve(root, rel), "utf8") : "");
export const block = (root: string, rel: string, name: string): string | null => readAnchor(read(root, rel), "extension", name);
export const registry = (root: string) => readExtensionRegistry(realChecksumEnvironment(root));
export const artifact = (root: string, name: string) => registry(root).artifacts.find((a) => a.name === name);
export const count = (text: string, needle: string): number => text.split(needle).length - 1;

/** Registers an anchored block the way an older setup did: content in `target`, checksum in the registry. */
export function registerBlock(root: string, name: string, target: string, content: string, category: ExtensionArtifact["category"] = "extension"): void {
  const path = resolve(root, target);
  writeFileSync(path, insertAnchor(read(root, target), category, name, content));
  const env = realChecksumEnvironment(root);
  const reg = readExtensionRegistry(env);
  reg.artifacts = [...reg.artifacts.filter((a) => a.name !== name), { category, name, target, content, checksum: computeChecksum(content), createdAt: "2026-09-01T00:00:00.000Z" }];
  writeExtensionRegistry(reg, env);
}

export const OLD_ROUTER = "## maestro\n\nrouter text from an older release";
export const OLD_LANGUAGE = "## maestro: language\n\nlanguage rule from an older release";
export const OLD_FALLBACK = "## maestro: hooks fallback\n\nfallback text from an older release";

/** A root installed by a release that wrote content in CLAUDE.md and pointers in AGENTS.md. */
export function oldDirectionRoot(): string {
  const root = project();
  writeFileSync(resolve(root, "CLAUDE.md"), "<!-- specsfy:framework:start -->\n@.specsfy/Spec.md\n<!-- specsfy:framework:end -->\n");
  writeFileSync(resolve(root, "AGENTS.md"), "<!-- specsfy:framework:start -->\n## Framework Specsfy\n\nRead .specsfy/Spec.md.\n<!-- specsfy:framework:end -->\n");
  registerBlock(root, "router", "CLAUDE.md", OLD_ROUTER);
  registerBlock(root, "config-language-rule", "CLAUDE.md", OLD_LANGUAGE);
  registerBlock(root, "hooks-fallback", "CLAUDE.md", OLD_FALLBACK);
  registerBlock(root, "agents-pointer", "AGENTS.md", "For the `maestro` router, read the `maestro` section in `CLAUDE.md`.");
  registerBlock(root, "config-language-pointer", "AGENTS.md", "For the `maestro` language rule, read the `maestro: language` section in `CLAUDE.md`.");
  registerBlock(root, "hooks-fallback-pointer", "AGENTS.md", "For the `maestro` hooks fallback rules, read the `maestro: hooks fallback` section in `CLAUDE.md`.");
  return root;
}

export const AGENT_SKILLS_SECTION = "## Agent skills\n\n### Issue tracker\n\nIssues live in GitHub. See `docs/agents/issue-tracker.md`.\n\n### Domain\n\nSee `docs/agents/domain.md`.\n";

/** Writes a skill directory with a SKILL.md. */
export function skill(root: string, dir: string, name: string, body = `---\nname: ${name}\n---\n# ${name}\n`): string {
  const path = join(root, dir, name);
  mkdirSync(path, { recursive: true });
  writeFileSync(join(path, "SKILL.md"), body);
  return path;
}

export const claudeSkill = (root: string, name: string): string => read(root, join(".claude", "skills", name, "SKILL.md"));
export const agentsSkill = (root: string, name: string): string => read(root, join(".agents", "skills", name, "SKILL.md"));
export const installRecord = (root: string) => JSON.parse(read(root, ".maestro/install.json") || "{}") as { projections?: { name: string; checksum: string }[] };
