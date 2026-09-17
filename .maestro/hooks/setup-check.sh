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

HOOK_EVENT="session-start"
HOOK_TARGET_EVENT="SessionStart"
MAESTRO_BIN_context_mode='/home/bcalmon/Projects/maestro/node_modules/.bin/context-mode'

# >>> hook fragment
if [ ! -f "$PROJECT_DIR/.maestro/install.json" ] || [ ! -d "$PROJECT_DIR/.specsfy" ]; then
  cat <<'EOF'
maestro: this project hasn't completed setup yet (missing .maestro/install.json or .specsfy/). Run the `setup` tool (or `maestro setup` from a terminal) before relying on its hooks, skills or the Specsfy framework — some of what's configured so far may be partial.
EOF
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