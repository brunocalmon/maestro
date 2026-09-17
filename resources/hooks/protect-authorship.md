---
kind: hook
name: protect-authorship
description: >-
  Stop a commit that carries an AI co-author trailer before it is written,
  complementing the commit-msg hook that strips them.
event: before-shell
tools: Bash|mcp__.*(execute|run_in_terminal|shell).*
blocking: true
self_check:
  - Does this leave human co-author trailers alone?
---

## Why this exists

The commit-msg git hook already removes these trailers, and that hook is the
reliable guarantee because it applies to every commit from every tool. This one
catches the same thing earlier, at the point the agent composes the command, so
the intent is visible rather than silently corrected.

Human co-author trailers are untouched here as well. They are a true statement
about who wrote the code.

## Script

```sh
cmd="$HOOK_COMMAND"

case "$cmd" in
  *"git commit"*)
    trailer=$(printf '%s' "$cmd" | grep -io 'co-authored-by:[^"]*' || printf '')
    case "$trailer" in
      *[Cc]laude*|*[Aa]nthropic*|*[Cc]ursor*|*[Cc]opilot*|*[Gg]emini*|*[Aa]ntigravity*|*noreply@*)
        decision=deny
        message="Blocked: this commit message credits an AI agent as co-author. Commit authorship belongs to the person who owns the work. Remove the trailer and commit again."
        ;;
    esac
    ;;
esac
```
