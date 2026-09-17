---
kind: hook
name: setup-check
description: >-
  At session start, notices when this project isn't fully configured —
  installed but not yet walked through by the conversational setup skills —
  and names exactly which one to run.
event: session-start
self_check:
  - Does this stay silent when setup already completed, instead of nagging every session?
  - Does it name the specific skill to run, not a generic "run setup" that already happened?
---

## Why this exists

`maestro setup` installs files; it can't run a conversation. `specsfy-setup`
and `setup-matt-pocock-skills` are skills only an agent can trigger, and
nothing used to say they were still pending — a project could have every
hook installed and still have no `PROJECT.md`, no `.specsfy/STACK.md`, none
of what those skills produce (`findings/internal/FIND-INT-003`). This hook
checks for their actual trail, not a flag the maestro writes about itself
(`SPEC-0025`, R-002): `PROJECT.md`, `.specsfy/STACK.md`, `.specsfy/RULES.md`
and `.specsfy/USER-PROFILE.md` for `specsfy-setup`; the `## Agent skills`
section in `AGENTS.md` for `setup-matt-pocock-skills`. Silent the moment both
trails are complete.

## Script

```sh
if [ ! -f "$PROJECT_DIR/.maestro/install.json" ] || [ ! -d "$PROJECT_DIR/.specsfy" ]; then
  cat <<'EOF'
maestro: this project hasn't completed setup yet (missing .maestro/install.json or .specsfy/). Run the `setup` tool (or `maestro setup` from a terminal) before relying on its hooks, skills or the Specsfy framework — some of what's configured so far may be partial.
EOF
else
  _missing=""
  for _trace in PROJECT.md .specsfy/STACK.md .specsfy/RULES.md .specsfy/USER-PROFILE.md; do
    [ -f "$PROJECT_DIR/$_trace" ] || _missing="$_missing $_trace"
  done
  _skills_section=1
  [ -f "$PROJECT_DIR/AGENTS.md" ] && grep -q '^## Agent skills' "$PROJECT_DIR/AGENTS.md" && _skills_section=0

  if [ -n "$_missing" ] || [ "$_skills_section" = "1" ]; then
    _next=""
    [ -n "$_missing" ] && _next="/specsfy-setup"
    if [ "$_skills_section" = "1" ]; then
      if [ -n "$_next" ]; then _next="$_next and /setup-matt-pocock-skills"; else _next="/setup-matt-pocock-skills"; fi
    fi
    echo "maestro: this project is installed but not fully configured. Run $_next in this agent."
    [ -n "$_missing" ] && echo "maestro: missing from /specsfy-setup:$_missing"
    [ "$_skills_section" = "1" ] && echo "maestro: missing from /setup-matt-pocock-skills: \"## Agent skills\" section in AGENTS.md"
  fi
fi
```
