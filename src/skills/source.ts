/**
 * Accepted sources for engineering skill sets, via the same `skills` installer.
 *
 * `mattpocock/skills`'s author doesn't publish to the npm registry. The
 * `mattpocock-skills` package that exists there is a third-party publish,
 * and the path the author's README documents is
 * `npx skills@latest add mattpocock/skills`. This is the only source
 * configured for Maestro-managed skill installation.
 * Skills enter the agent's context as instructions, so provenance is a
 * rule, not a preference.
 */
export const OFFICIAL_SOURCE = "mattpocock/skills";

/** The source configured for Maestro-managed skill installation. */
export const OFFICIAL_SOURCES = [OFFICIAL_SOURCE] as const;

export type SourceCheck =
  | { ok: true; source: string }
  | { ok: false; reason: string };

/**
 * Accepts either official source and refuses everything else.
 *
 * Returns a result instead of throwing, so the caller chooses how to
 * report it. Doesn't touch the filesystem, so the rule is exercisable
 * without installing anything.
 */
export function resolveSource(input: unknown): SourceCheck {
  const accepted = OFFICIAL_SOURCES.join(", ");
  if (typeof input !== "string" || input.length === 0) {
    return { ok: false, reason: `unrecognized source: missing value. Accepted ones are ${accepted}` };
  }
  if (!(OFFICIAL_SOURCES as readonly string[]).includes(input)) {
    return { ok: false, reason: `unrecognized source: ${input}. Accepted ones are ${accepted}` };
  }
  return { ok: true, source: input };
}
