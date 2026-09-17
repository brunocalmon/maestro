---
kind: hook
name: guard-secrets
description: >-
  Block shell commands that would print credential files into the transcript,
  where they become part of the conversation and any log of it.
event: before-shell
tools: Bash|mcp__.*(execute|run_in_terminal|shell).*
blocking: true
self_check:
  - Does this block the read paths without blocking ordinary work on the same files?
---

## Why this exists

A secret printed into a transcript has left the machine. It is in the
conversation, in whatever logs the editor keeps, and in any context sent onward.
Deleting the file afterwards does not undo that.

The check is deliberately narrow: it blocks commands that *display* a
credential file, not commands that reference one. Editing `.env`, or a script
that reads it at runtime, is ordinary work and stays allowed.

## Script

```sh
reason='Blocked: this command would print credentials into the transcript, where they cannot be recalled. Read the file with an editor tool, or reference the variable without displaying it.'

# A display command whose target really is a credential file. The trailing
# boundary matters: without it, ".env" also matches "notes.environment".
# `;`, `&` and `|` count as boundaries too, so a batch like `cat .env; pwd`
# (ctx_batch_execute joins its commands with `;`, SPEC-0023) is still caught.
if printf '%s' "$HOOK_COMMAND" | grep -qE \
  '(^|[;&|]|&&|\|\|)[[:space:]]*(cat|less|more|head|tail|bat|xxd|od|strings)([[:space:]]+-[^[:space:]]+)*[[:space:]]+[^[:space:]]*(\.env([.[:space:];&|"'"'"']|$)|id_rsa|id_ed25519|id_ecdsa|\.pem([[:space:];&|"'"'"']|$)|\.p12|\.pfx|\.netrc|credentials|secrets?\.(ya?ml|json|toml))'
then
  decision=deny
  message="$reason"
fi

# Wholesale environment dumps. Anchored to command position so a commit message
# or prompt that merely mentions printenv is not treated as running it.
if printf '%s' "$HOOK_COMMAND" | grep -qE \
  '(^|[;&|]|&&|\|\|)[[:space:]]*(printenv|env)([[:space:]]*$|[[:space:]]*\|)'
then
  decision=deny
  message="$reason"
fi
```
