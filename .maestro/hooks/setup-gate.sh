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

HOOK_EVENT="on-prompt"
HOOK_TARGET_EVENT="UserPromptSubmit"
MAESTRO_BIN_context_mode='/home/bcalmon/Projects/maestro/node_modules/.bin/context-mode'

# >>> hook fragment
_is_setup_command=0
case "$HOOK_PROMPT" in
  "/specsfy-setup"|"/specsfy-setup "*|"/setup-matt-pocock-skills"|"/setup-matt-pocock-skills "*)
    _is_setup_command=1 ;;
esac

if [ "$_is_setup_command" != "1" ]; then
  _fail_open=0
  _specsfy_ok=1

  # A `.specsfy/` that exists but can't be listed is a read error, not
  # "specsfy-setup never ran" — those are different situations and only the
  # first one may fail open.
  if [ -e "$PROJECT_DIR/.specsfy" ] && ! ls "$PROJECT_DIR/.specsfy" >/dev/null 2>&1; then
    _fail_open=1
  fi

  for _trace in PROJECT.md .specsfy/STACK.md .specsfy/RULES.md .specsfy/USER-PROFILE.md; do
    if [ -e "$PROJECT_DIR/$_trace" ]; then
      cat "$PROJECT_DIR/$_trace" >/dev/null 2>&1 || _fail_open=1
    else
      _specsfy_ok=0
    fi
  done

  _skills_ok=0
  if [ -e "$PROJECT_DIR/AGENTS.md" ]; then
    if cat "$PROJECT_DIR/AGENTS.md" >/dev/null 2>&1; then
      grep -q '<!-- maestro:extension:agent-skills:start -->' "$PROJECT_DIR/AGENTS.md" 2>/dev/null && _skills_ok=1
    else
      _fail_open=1
    fi
  fi

  if [ "$_fail_open" != "1" ] && { [ "$_specsfy_ok" != "1" ] || [ "$_skills_ok" != "1" ]; }; then
    # Same material as `configurationContractId` in src/setup/defer.ts — keep
    # the two in sync if SPECSFY_SETUP_TRACES or AGENT_SKILLS_HEADING change.
    _contract_material='PROJECT.md
.specsfy/STACK.md
.specsfy/RULES.md
.specsfy/USER-PROFILE.md
## Agent skills'
    if command -v sha256sum >/dev/null 2>&1; then
      _contract_id=$(printf '%s' "$_contract_material" | sha256sum | cut -c1-16)
    else
      _contract_id=$(printf '%s' "$_contract_material" | shasum -a 256 | cut -c1-16)
    fi

    _install_json="$PROJECT_DIR/.maestro/install.json"
    _deferred=0
    if [ -f "$_install_json" ] && grep -q "\"contractId\"[[:space:]]*:[[:space:]]*\"$_contract_id\"" "$_install_json" 2>/dev/null; then
      _deferred=1
    fi

    if [ "$_deferred" != "1" ]; then
      # Read suppression preferences
      _prefs_file="$PROJECT_DIR/.maestro/setup.preferences"
      _suppress_specsfy=0
      _suppress_matt_pocock=0

      if [ -f "$_prefs_file" ]; then
        _suppress_specsfy=$(grep -A2 'suppress_warnings:' "$_prefs_file" | grep 'specsfy:' | grep -o 'true\|false' || echo 'false')
        _suppress_matt_pocock=$(grep -A2 'suppress_warnings:' "$_prefs_file" | grep 'matt_pocock:' | grep -o 'true\|false' || echo 'false')
      fi

      # Build warning message based on what's incomplete
      _warn_parts=""
      if [ "$_specsfy_ok" != "1" ] && [ "$_suppress_specsfy" != "true" ]; then
        _warn_parts="${_warn_parts}ℹ️ Setup: Specsfy incomplete. Run /specsfy-setup or /suppress-setup-warning specsfy"
      fi
      if [ "$_skills_ok" != "1" ] && [ "$_suppress_matt_pocock" != "true" ]; then
        _warn_parts="${_warn_parts}${_warn_parts:+$'\n'}ℹ️ Setup: Matt Pocock skills incomplete. Run /setup-matt-pocock-skills or /suppress-setup-warning matt_pocock"
      fi

      # Store warning in session context if any warning applies
      if [ -n "$_warn_parts" ]; then
        context="SETUP_WARNINGS: $_warn_parts"
      fi
    fi
  fi
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