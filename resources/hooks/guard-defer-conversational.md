---
kind: hook
name: guard-defer-conversational
description: >-
  Blocks any agent tool from running `maestro setup --defer-conversational`
  on the person's behalf — that decision only counts when made directly in
  a real terminal.
event: before-tool
tools: Bash|mcp__.*(execute|run_in_terminal|shell).*
blocking: true
self_check:
  - Does this deny regardless of which shell-capable tool carries the command?
  - Does an unrelated command, or an event with no command at all, stay unaffected?
---

## Why this exists

`setup-gate` (SPEC-0026) blocks the chat until conversational setup finishes,
with a deliberate escape hatch: `maestro setup --defer-conversational`. If an
agent could run that command on the person's behalf from inside a blocked
chat, the escape hatch would just be another door in the allowlist — the
person would never have actually decided anything, the agent would have
decided for them. This guard closes that door: the command only works run
directly in a terminal, outside any tool an agent controls.

It denies outright rather than asking, unlike `guard-destructive` — there is
no legitimate reason for an agent to run this specific command through a
tool, so there is nothing to confirm.

## Script

```sh
cmd="$HOOK_COMMAND"

if printf '%s' "$cmd" | grep -qE 'maestro[[:space:]]+setup[[:space:]]+.*--defer-conversational'; then
  decision=deny
  message="Blocked: --defer-conversational only counts run directly in a real terminal, outside any agent tool. Ask the person to run it themselves."
fi
```
