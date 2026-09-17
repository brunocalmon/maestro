/**
 * Minimalist router — a "proxy one-liner" (ADR 001, Epic 2.2): teaches the
 * agent to trigger the facade skill declaratively, instead of reading the
 * whole extension artifacts. Kept small on purpose — the context-saving
 * gain only holds if the router itself doesn't grow.
 */
export function buildRouterBlock(): string {
  return [
    "## maestro",
    "",
    "To create, adjust or repair a local extension (a hook, a rule, or this",
    "router itself), trigger the `maestro-extension-creator` skill",
    "instead of reading `.maestro/extensions/` directly.",
    "",
    "Instructions for agents live in `AGENTS.md`. A skill or tool that wants to",
    "add instructions writes them there; `CLAUDE.md` keeps only the",
    "`@AGENTS.md` import and what the Specsfy framework places in it.",
  ].join("\n");
}

/**
 * The one line the maestro leaves in CLAUDE.md: the Claude Code import of
 * AGENTS.md, where every instruction lives (SPEC-0024, DEC-001). Its own
 * anchored block, so a migration can tell it apart from a hand-written
 * import.
 */
export function buildAgentsImport(): string {
  return "@AGENTS.md";
}

/**
 * @deprecated SPEC-0024 moved the content itself into AGENTS.md; kept only
 * so older registered pointers can be recognized and removed on migration.
 */
export function buildAgentsPointer(): string {
  return "For the `maestro` router, read the `maestro` section in `CLAUDE.md`.";
}

/**
 * Language/config.yaml instruction — a separate anchored block from
 * `buildRouterBlock`, never grown into it: `createExtension` refuses to
 * update a name already registered, so folding this into `"router"` would
 * make it unreachable in any project that already ran `setup` once (DEC-002,
 * SPEC-0012).
 */
export function buildConfigLanguageBlock(): string {
  return [
    "## maestro: language",
    "",
    "Read `.maestro/config.yaml` before generating a document or deciding",
    "what language to answer in. Reply in the conversation's language. Write a",
    "generated document in `language.default`, unless its path matches one of",
    "`language.exceptions`. Notice when the conversation reveals a value that",
    "`config.yaml` is missing or has out of date, and offer to update it.",
  ].join("\n");
}

/** Minimal pointer, without duplicating the block's text — points at CLAUDE.md. */
export function buildConfigLanguagePointer(): string {
  return "For the `maestro` language rule, read the `maestro: language` section in `CLAUDE.md`.";
}

/**
 * Fallback rules for the hooks — a block of its own, for the same reason
 * `buildConfigLanguageBlock` is (DEC-002, SPEC-0012), and deliberately
 * short: each item names a hook and what to do only when `maestro doctor`
 * says that hook is absent or inert. With the hooks active the block is
 * inert by construction, so it never repeats what a hook already does
 * (SPEC-0023, PR-001).
 */
export function buildHooksFallbackBlock(): string {
  return [
    "## maestro: hooks fallback",
    "",
    "These hooks run on their own; each line applies only in the condition it names.",
    "",
    "- `guard-destructive`, `guard-secrets` and `protect-authorship` guard shell commands in any tool; if `maestro doctor` reports one of them absent or inert, review destructive commands, credential reads and commit trailers yourself before running them.",
    "- `code-review-graph-update` keeps the code graph current after any edit and `graph-hint` points at it once per session; if `maestro doctor` reports them absent or inert, refresh the graph yourself after editing and prefer it over bulk Grep.",
    "- `guard-docs` keeps the Specsfy documentator build from overwriting docs/; if `maestro doctor` reports it absent or inert, run that script only with `--check`.",
  ].join("\n");
}

/** Minimal pointer, without duplicating the block's text — points at CLAUDE.md. */
export function buildHooksFallbackPointer(): string {
  return "For the `maestro` hooks fallback rules, read the `maestro: hooks fallback` section in `CLAUDE.md`.";
}
