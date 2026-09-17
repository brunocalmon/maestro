#!/usr/bin/env bash
HOOK_INPUT=$(cat)
decision=allow
message=''
context=''
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
_hook_flat=$(printf '%s' "$HOOK_INPUT" | tr '\n' ' ')
_hook_str() { printf '%s' "$_hook_flat" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\\(\\([^\"\\\\]\\|\\\\.\\)*\\)\".*/\\1/p" | head -n 1; }
HOOK_TOOL=$(_hook_str tool_name)
HOOK_SESSION=$(_hook_str session_id)
HOOK_FILE=$(_hook_str file_path)
[ -n "$HOOK_FILE" ] || HOOK_FILE=$(_hook_str path)
HOOK_COMMAND=$(_hook_str command)
if [ -z "$HOOK_COMMAND" ]; then
  _hook_lang=$(_hook_str language)
  case "${_hook_lang:-shell}" in shell|bash|sh|zsh) HOOK_COMMAND=$(_hook_str code) ;; esac
fi
if [ -z "$HOOK_COMMAND" ]; then
  _hook_arr=$(printf '%s' "$_hook_flat" | sed -n 's/.*"commands"[[:space:]]*:[[:space:]]*\[\(\([^]]\|\\.\)*\)\].*/\1/p')
  [ -n "$_hook_arr" ] && HOOK_COMMAND=$(printf '%s' "$_hook_arr" | sed 's/"[[:space:]]*,[[:space:]]*"/; /g; s/^[[:space:]]*"//; s/"[[:space:]]*$//')
fi

HOOK_EVENT="before-shell"
HOOK_TARGET_EVENT="PreToolUse"
MAESTRO_BIN_context_mode='/home/bcalmon/Projects/maestro/node_modules/.bin/context-mode'

# >>> hook fragment
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

# <<< hook fragment

# Emits the decision the fragment set. Without this, the fragment doesn't block.
case "$decision" in
  deny) printf '%s\n' "$message" >&2; exit 2 ;;
  ask)  printf '%s\n' "$message" >&2; exit 2 ;;
esac
if [ -n "$context" ]; then
  _hook_ctx=$(printf '%s' "$context" | tr '\n' ' ' | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"hookSpecificOutput":{"hookEventName":"%s","additionalContext":"%s"}}\n' "$HOOK_TARGET_EVENT" "$_hook_ctx"
fi
exit 0