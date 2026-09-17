---
kind: hook
name: skills-project-session
description: >-
  At session start, copies into .claude/skills any skill that exists only in
  .agents/skills, so the Claude Code sees what other installers put there.
event: session-start
self_check:
  - Does this only add what is missing, never touching a skill already present in .claude/skills?
  - Does it stay silent, with no stdout, and do nothing without .claude/ or .agents/skills?
---

## Why this exists

`.agents/skills` is the canonical directory (the `skills` CLI with
`-a universal`, the Specsfy's specialists), and the Claude Code 2.1.x doesn't
read it (`findings/external/FIND-EXT-002`). The `setup` projects it with
checksums; this hook is the cheap safety net between setups: a plain
additive copy, in shell, needing no `maestro` binary (SPEC-0024, DEC-005).

## Script

```sh
if [ -d "$PROJECT_DIR/.claude" ] && [ -d "$PROJECT_DIR/.agents/skills" ]; then
  for _src in "$PROJECT_DIR"/.agents/skills/*/; do
    [ -d "$_src" ] || continue
    _name=$(basename "$_src")
    if [ ! -e "$PROJECT_DIR/.claude/skills/$_name" ]; then
      mkdir -p "$PROJECT_DIR/.claude/skills" 2>/dev/null
      cp -R "$_src" "$PROJECT_DIR/.claude/skills/$_name" 2>/dev/null
    fi
  done
fi
```
