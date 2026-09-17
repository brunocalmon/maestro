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