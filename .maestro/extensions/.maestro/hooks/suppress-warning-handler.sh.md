<!-- maestro:extension:hook:suppress-warning-handler:start -->
#!/usr/bin/env bash
# Handle /suppress-setup-warning command
# Intercepts the command and updates .maestro/setup.preferences

HOOK_INPUT=$(cat)
decision=allow
message=''
context=''
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

_hook_flat=$(printf '%s' "$HOOK_INPUT" | tr '\n' ' ')
_hook_str() { printf '%s' "$_hook_flat" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\\(\\([^\"\\\\]\\|\\\\.\\)*\\)\".*/\\1/p" | head -n 1; }
HOOK_PROMPT=$(_hook_str prompt)

# Check if this is a suppress-warning command
case "$HOOK_PROMPT" in
  "/suppress-setup-warning "*)
    # Extract component (specsfy, matt_pocock, or all)
    _component=$(printf '%s' "$HOOK_PROMPT" | sed 's|^/suppress-setup-warning[[:space:]]*||')
    _component=${_component%% *}  # Get first word

    PREFS_FILE="$PROJECT_DIR/.maestro/setup.preferences"

    if [ ! -f "$PREFS_FILE" ]; then
      decision=deny
      message="Setup preferences file not found at $PREFS_FILE"
    else
      case "$_component" in
        specsfy)
          sed -i 's/^\([[:space:]]*specsfy:\)[[:space:]]*false/\1 true/' "$PREFS_FILE"
          context="✓ Specsfy setup warning suppressed. Re-enable with: sed -i 's/specsfy: true/specsfy: false/' $PREFS_FILE"
          ;;
        matt_pocock)
          sed -i 's/^\([[:space:]]*matt_pocock:\)[[:space:]]*false/\1 true/' "$PREFS_FILE"
          context="✓ Matt Pocock skills setup warning suppressed. Re-enable with: sed -i 's/matt_pocock: true/matt_pocock: false/' $PREFS_FILE"
          ;;
        all)
          sed -i 's/^\([[:space:]]*specsfy:\)[[:space:]]*false/\1 true/' "$PREFS_FILE"
          sed -i 's/^\([[:space:]]*matt_pocock:\)[[:space:]]*false/\1 true/' "$PREFS_FILE"
          context="✓ All setup warnings suppressed."
          ;;
        *)
          decision=deny
          message="Usage: /suppress-setup-warning <specsfy|matt_pocock|all>"
          ;;
      esac

      # Clear the "already shown this session" flag
      rm -f "$PROJECT_DIR/.maestro/.setup_warning_shown" 2>/dev/null
    fi
    ;;
esac

# Output decision
case "$decision" in
  deny) printf '%s\n' "$message" >&2; exit 2 ;;
esac

if [ -n "$context" ]; then
  _hook_ctx=$(printf '%s' "$context" | tr '\n' ' ' | sed 's/\\/\\\\/g; s/"/\\"/g')
  printf '{"hookSpecificOutput":{"hookEventName":"SuppressWarning","additionalContext":"%s"}}\n' "$_hook_ctx"
fi

exit 0

<!-- maestro:extension:hook:suppress-warning-handler:end -->
