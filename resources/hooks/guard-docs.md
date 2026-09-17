---
kind: hook
name: guard-docs
description: >-
  Stop the Specsfy documentator's build from overwriting docs/ with its
  skeleton when run without --check.
event: before-tool
tools: Bash|mcp__.*(execute|run_in_terminal|shell).*
blocking: true
self_check:
  - Does this let `--check` through, since that mode writes nothing?
  - Does an explicit MAESTRO_ALLOW_DOCS_BUILD=1 prefix still let a deliberate rewrite run?
---

## Why this exists

`build_documentation.mjs` treats everything inside the
`<!-- specsfy:documentator -->` block as its own and rewrites it with a
mechanical skeleton on every run without `--check`. Real documentation that
was written inside that block is lost — it happened twice on 2026-09-17 in
this repository, the second time by the agent itself while fixing the first
(`findings/external/FIND-EXT-001`). The definitive fix belongs upstream; until
it lands, this hook turns an accidental run into an explicit choice.

## Script

```sh
case "$HOOK_COMMAND" in
  *build_documentation.mjs*)
    case "$HOOK_COMMAND" in
      *--check*|MAESTRO_ALLOW_DOCS_BUILD=1*) ;;
      *)
        decision=deny
        message="Blocked: build_documentation.mjs without --check rewrites every docs/ block with the Specsfy skeleton (see findings/external/FIND-EXT-001). Run it with --check to verify, or prefix the command with MAESTRO_ALLOW_DOCS_BUILD=1 after backing docs/ up if you really mean to rewrite it."
        ;;
    esac
    ;;
esac
```
