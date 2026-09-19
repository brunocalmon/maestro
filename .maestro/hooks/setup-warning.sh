#!/usr/bin/env bash
# Display setup warnings at the start of a session (first prompt only)
# This hook reads the setup status and injects a warning into the response

HOOK_INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

# Read suppression preferences
_prefs_file="$PROJECT_DIR/.maestro/setup.preferences"
_suppress_specsfy=false
_suppress_matt_pocock=false

if [ -f "$_prefs_file" ]; then
  _suppress_specsfy=$(grep -A2 'suppress_warnings:' "$_prefs_file" | grep 'specsfy:' | grep -o 'true\|false' || echo 'false')
  _suppress_matt_pocock=$(grep -A2 'suppress_warnings:' "$_prefs_file" | grep 'matt_pocock:' | grep -o 'true\|false' || echo 'false')
fi

# Check setup status
_specsfy_ok=1
_skills_ok=0

for _trace in PROJECT.md .specsfy/STACK.md .specsfy/RULES.md .specsfy/USER-PROFILE.md; do
  if [ ! -e "$PROJECT_DIR/$_trace" ]; then
    _specsfy_ok=0
    break
  fi
done

if [ -e "$PROJECT_DIR/AGENTS.md" ]; then
  grep -q '^## Agent skills' "$PROJECT_DIR/AGENTS.md" 2>/dev/null && _skills_ok=1
fi

# Build warning message based on what's incomplete
_warn_parts=""
if [ "$_specsfy_ok" != "1" ] && [ "$_suppress_specsfy" != "true" ]; then
  _warn_parts="${_warn_parts}ℹ️ **Setup: Specsfy incomplete.** Run \`/specsfy-setup\` or \`/suppress-setup-warning specsfy\`"
fi
if [ "$_skills_ok" != "1" ] && [ "$_suppress_matt_pocock" != "true" ]; then
  _warn_parts="${_warn_parts}${_warn_parts:+$'\n'}ℹ️ **Setup: Matt Pocock skills incomplete.** Run \`/setup-matt-pocock-skills\` or \`/suppress-setup-warning matt_pocock\`"
fi

# Store warning flag to avoid showing twice in same session
_warning_flag="$PROJECT_DIR/.maestro/.setup_warning_shown"

# Only show warning if: (1) there's something to warn about, (2) flag doesn't exist yet
if [ -n "$_warn_parts" ] && [ ! -f "$_warning_flag" ]; then
  # Create flag to avoid showing again this session
  mkdir -p "$(dirname "$_warning_flag")"
  touch "$_warning_flag"

  # Inject warning into context
  context="$_warn_parts"
  printf '{"hookSpecificOutput":{"hookEventName":"SetupWarning","additionalContext":"%s"}}\n' "$(printf '%s' "$_warn_parts" | sed 's/"/\\"/g; s/\\/\\\\/g')"
fi

exit 0
