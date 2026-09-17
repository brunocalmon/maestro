---
kind: hook
name: code-review-graph-update
description: >-
  Keeps the code review graph current after any tool that may have changed
  the working tree, without touching the conversation.
event: after-tool
tools: Edit|Write|MultiEdit|NotebookEdit|Bash|mcp__.*
self_check:
  - Does this run the CLI only when the working tree actually changed since the last run?
  - Does it stay silent on success rather than injecting context?
---

## Why this exists

Editing goes through `Edit`/`Write`, but also through `sed -i`, heredocs and
`git rm` in `Bash`, and through MCP tools. A hook keyed on the editing tools
alone left this repository's graph frozen for eighteen days (`FIND-INT-002`).
The only reliable signal is the working tree itself: hash `git status
--porcelain` (ignoring `.maestro/` and `.code-review-graph/`, which this very
hook and the CLI write to), and run the update exactly when the hash moves
(SPEC-0023, DEC-002).

## Script

```sh
_crg="${MAESTRO_BIN_code_review_graph:-$(command -v code-review-graph 2>/dev/null)}"
if [ -n "$_crg" ]; then
  _state="$PROJECT_DIR/.maestro/state"
  _hash=""
  if git -C "$PROJECT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if command -v sha256sum >/dev/null 2>&1; then
      _hash=$(git -C "$PROJECT_DIR" status --porcelain -- . ':(exclude).maestro' ':(exclude).code-review-graph' 2>/dev/null | sha256sum | cut -d' ' -f1)
    else
      _hash=$(git -C "$PROJECT_DIR" status --porcelain -- . ':(exclude).maestro' ':(exclude).code-review-graph' 2>/dev/null | shasum -a 256 | cut -d' ' -f1)
    fi
  fi
  _prev=""
  [ -f "$_state/crg-tree.hash" ] && _prev=$(cat "$_state/crg-tree.hash" 2>/dev/null)
  if [ -z "$_hash" ] || [ "$_hash" != "$_prev" ]; then
    (cd "$PROJECT_DIR" && "$_crg" update --brief >/dev/null 2>&1)
    if [ -n "$_hash" ]; then
      mkdir -p "$_state" 2>/dev/null
      printf '%s\n' "$_hash" > "$_state/crg-tree.hash" 2>/dev/null
    fi
  fi
fi
```
