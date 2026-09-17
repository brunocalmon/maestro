---
kind: hook
name: graph-hint
description: >-
  Once per session, before the first Grep or Glob, reminds the agent that a
  code review graph exists for this project.
event: before-tool
tools: Grep|Glob
self_check:
  - Does this stay silent when there is no graph, and after the first hint of a session?
---

## Why this exists

A rule in CLAUDE.md saying "use the graph" costs context on every turn and is
still ignored. A hook can say it exactly once, at the moment it matters — the
first bulk search of a session — and say nothing otherwise (SPEC-0023,
DEC-003). A missing or read-only state directory only means the hint may
repeat; it never blocks.

## Script

```sh
if [ -d "$PROJECT_DIR/.code-review-graph" ]; then
  _mark="$PROJECT_DIR/.maestro/state/graph-hint-${HOOK_SESSION:-none}"
  if [ -z "$HOOK_SESSION" ] || [ ! -f "$_mark" ]; then
    context="A code review graph exists for this project (.code-review-graph/): prefer code-review-graph search, query or impact over bulk Grep/Glob; the graph is kept current by the code-review-graph-update hook."
    if [ -n "$HOOK_SESSION" ]; then
      mkdir -p "$PROJECT_DIR/.maestro/state" 2>/dev/null
      : > "$_mark" 2>/dev/null
    fi
  fi
fi
```
