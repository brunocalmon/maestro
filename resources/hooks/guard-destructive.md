---
kind: hook
name: guard-destructive
description: >-
  Ask for confirmation before shell commands that discard work irreversibly.
event: before-shell
tools: Bash|mcp__.*(execute|run_in_terminal|shell).*
blocking: true
self_check:
  - Does this ask rather than deny, so deliberate use stays possible?
  - Are the patterns anchored to command position, so a quoted argument that mentions a command is not treated as running it?
---

## Why this exists

These commands are all legitimate and all unrecoverable. The asymmetry is what
matters: confirming one costs a moment, and running one by mistake costs work
that no longer exists anywhere.

It asks rather than denies. A hook that makes a legitimate operation impossible
gets disabled, and then it protects nothing at all.

Every pattern is anchored to **command position** — the start of the command, or
just after a `;`, `|`, `&&` or `||`. Matching anywhere in the string would flag
`git commit -m "remove rm -rf from the docs"`, which runs nothing dangerous. A
guard that trips on ordinary work is a guard that gets switched off.

Destructive SQL is the exception: it lives inside a quoted argument by nature,
so it is matched only when the command also invokes a database client.

## Script

```sh
cmd="$HOOK_COMMAND"

# Command position: start of string, or immediately after a separator.
POS='(^|[;&|]|&&|\|\|)[[:space:]]*'

if printf '%s' "$cmd" | grep -qE "${POS}rm[[:space:]]+(-[a-zA-Z]*[[:space:]]+)*-?[a-zA-Z]*[rRf][a-zA-Z]*[[:space:]]+/[[:space:]]*$"; then
  decision=deny
  message="Blocked: this deletes from the filesystem root."

elif printf '%s' "$cmd" | grep -qE "${POS}rm[[:space:]]+-[a-zA-Z]*(rf|fr|Rf|fR)"; then
  decision=ask
  message="Recursive force delete. Confirm the path is what you intend before continuing."

elif printf '%s' "$cmd" | grep -qE "${POS}git[[:space:]]+push([[:space:]]+[^;&|]*)?[[:space:]]+(--force([[:space:]]|$)|-f([[:space:]]|$))"; then
  decision=ask
  message="Force push rewrites published history and can discard commits other people have. Confirm the branch and that nobody else is on it."

elif printf '%s' "$cmd" | grep -qE "${POS}git[[:space:]]+(reset[[:space:]]+--hard|clean[[:space:]]+-[a-zA-Z]*f|checkout[[:space:]]+\.[[:space:]]*$)"; then
  decision=ask
  message="This discards uncommitted work permanently. Confirm nothing in the working tree is worth keeping."

elif printf '%s' "$cmd" | grep -qiE '(psql|mysql|mariadb|sqlite3|mongo|mongosh|redis-cli|clickhouse)' \
  && printf '%s' "$cmd" | grep -qiE '(drop[[:space:]]+(table|database|schema)|truncate[[:space:]]+table|delete[[:space:]]+from[^;]*$)'; then
  decision=ask
  message="Destructive database statement. Confirm the target is not production and that a backup exists."
fi
```
