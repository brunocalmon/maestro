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
HOOK_PROMPT=$(_hook_str prompt)
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

HOOK_EVENT="before-tool"
HOOK_TARGET_EVENT="PreToolUse"
MAESTRO_BIN_context_mode='/home/bcalmon/Projects/maestro/node_modules/.bin/context-mode'

# >>> hook fragment
cmd="$HOOK_COMMAND"

if printf '%s' "$cmd" | grep -qE 'maestro[[:space:]]+setup[[:space:]]+.*--defer-conversational'; then
  decision=deny
  message="Blocked: --defer-conversational only counts run directly in a real terminal, outside any agent tool. Ask the person to run it themselves."
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