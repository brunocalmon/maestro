<!-- maestro:extension:router:start -->
## maestro

To create, adjust or repair a local extension (a hook, a rule, or this
router itself), trigger the `maestro-extension-creator` skill
instead of reading `.maestro/extensions/` directly.
<!-- maestro:extension:router:end -->
<!-- maestro:extension:config-language-rule:start -->
## maestro: language

Read `.maestro/config.yaml` before generating a document or deciding
what language to answer in. Reply in the conversation's language. Write a
generated document in `language.default`, unless its path matches one of
`language.exceptions`. Notice when the conversation reveals a value that
`config.yaml` is missing or has out of date, and offer to update it.
<!-- maestro:extension:config-language-rule:end -->
<!-- maestro:extension:hooks-fallback:start -->
## maestro: hooks fallback

These hooks run on their own; each line applies only in the condition it names.

- `guard-destructive`, `guard-secrets` and `protect-authorship` guard shell commands in any tool; if `maestro doctor` reports one of them absent or inert, review destructive commands, credential reads and commit trailers yourself before running them.
- `code-review-graph-update` keeps the code graph current after any edit and `graph-hint` points at it once per session; if `maestro doctor` reports them absent or inert, refresh the graph yourself after editing and prefer it over bulk Grep.
<!-- maestro:extension:hooks-fallback:end -->

<!-- maestro:foreign:foreign:agent-skills:start -->
## Agent skills

### Issue tracker

GitHub Issues (brunocalmon/maestro), via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (CONTEXT.md + docs/adr/ at repo root). See `docs/agents/domain.md`.
<!-- maestro:foreign:foreign:agent-skills:end -->
