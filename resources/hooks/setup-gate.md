---
kind: hook
name: setup-gate
description: >-
  Blocks chat prompts in Claude Code until specsfy-setup and
  setup-matt-pocock-skills have actually run, except the invocation of
  either command itself.
event: on-prompt
self_check:
  - Does absence of a trace still deny, distinct from a genuine read error (which must fail open)?
  - Does the allowlist match only an exact command prefix, never a mention mid-sentence?
---

## Why this exists

`setup-check` (SessionStart) has warned about this gap since SPEC-0025, but a
warning shown once per session is easy to keep ignoring — this repository's
own `AGENTS.md` stayed without `## Agent skills` for the length of an entire
session before anyone noticed (`specs/completed/0025-.../spec.md`). This hook
makes the gap unusable instead of merely visible: every chat message is
denied, except the exact invocation of `/specsfy-setup` or
`/setup-matt-pocock-skills`, until the real traces those two conversational
skills leave behind actually exist (SPEC-0026, FR-001).

The check is always live, reading the same traces `setup-check` and
`diagnoseMaestroProject` already read (SPEC-0025) — no checklist, no
checksum, nothing persisted here to drift out of sync (SPEC-0026, DEC-001).
Absence of a trace is the normal "not configured yet" signal and must keep
denying; only a genuine read error (permission denied, not a missing file)
fails open, so a hook malfunction can never itself become the reason a
project stays locked out (NFR-002).

A deliberate, CLI-only deferral (`maestro setup --defer-conversational`) can
turn the block off without touching any of this file — it only adds a
`conversationalGateDeferral` entry to `.maestro/install.json` that this hook
compares against today's configuration contract hash.

## Script

```sh
_is_setup_command=0
case "$HOOK_PROMPT" in
  "/specsfy-setup"|"/specsfy-setup "*|"/setup-matt-pocock-skills"|"/setup-matt-pocock-skills "*)
    _is_setup_command=1 ;;
esac

if [ "$_is_setup_command" != "1" ]; then
  _fail_open=0
  _specsfy_ok=1

  # A `.specsfy/` that exists but can't be listed is a read error, not
  # "specsfy-setup never ran" — those are different situations and only the
  # first one may fail open.
  if [ -e "$PROJECT_DIR/.specsfy" ] && ! ls "$PROJECT_DIR/.specsfy" >/dev/null 2>&1; then
    _fail_open=1
  fi

  for _trace in PROJECT.md .specsfy/STACK.md .specsfy/RULES.md .specsfy/USER-PROFILE.md; do
    if [ -e "$PROJECT_DIR/$_trace" ]; then
      cat "$PROJECT_DIR/$_trace" >/dev/null 2>&1 || _fail_open=1
    else
      _specsfy_ok=0
    fi
  done

  _skills_ok=0
  if [ -e "$PROJECT_DIR/AGENTS.md" ]; then
    if cat "$PROJECT_DIR/AGENTS.md" >/dev/null 2>&1; then
      grep -q '^## Agent skills' "$PROJECT_DIR/AGENTS.md" 2>/dev/null && _skills_ok=1
    else
      _fail_open=1
    fi
  fi

  if [ "$_fail_open" != "1" ] && { [ "$_specsfy_ok" != "1" ] || [ "$_skills_ok" != "1" ]; }; then
    # Same material as `configurationContractId` in src/setup/defer.ts — keep
    # the two in sync if SPECSFY_SETUP_TRACES or AGENT_SKILLS_HEADING change.
    _contract_material='PROJECT.md
.specsfy/STACK.md
.specsfy/RULES.md
.specsfy/USER-PROFILE.md
## Agent skills'
    if command -v sha256sum >/dev/null 2>&1; then
      _contract_id=$(printf '%s' "$_contract_material" | sha256sum | cut -c1-16)
    else
      _contract_id=$(printf '%s' "$_contract_material" | shasum -a 256 | cut -c1-16)
    fi

    _install_json="$PROJECT_DIR/.maestro/install.json"
    _deferred=0
    if [ -f "$_install_json" ] && grep -q "\"contractId\"[[:space:]]*:[[:space:]]*\"$_contract_id\"" "$_install_json" 2>/dev/null; then
      _deferred=1
    fi

    if [ "$_deferred" != "1" ]; then
      decision=deny
      message="maestro: chat blocked until conversational setup finishes. Run /specsfy-setup and/or /setup-matt-pocock-skills."
    fi
  fi
fi
```
