#!/usr/bin/env bash
# Suppress setup warnings for a specific component
# Usage: ./suppress-setup-warning.sh <specsfy|matt_pocock|all>

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$1}"
[ -z "$PROJECT_DIR" ] && PROJECT_DIR="."
COMPONENT="${2:-$1}"

PREFS_FILE="$PROJECT_DIR/.maestro/setup.preferences"

if [ ! -f "$PREFS_FILE" ]; then
  echo "Error: $PREFS_FILE not found"
  exit 1
fi

case "$COMPONENT" in
  specsfy)
    sed -i 's/^\([[:space:]]*specsfy:\)[[:space:]]*false/\1 true/' "$PREFS_FILE"
    echo "✓ Specsfy warning suppressed"
    ;;
  matt_pocock)
    sed -i 's/^\([[:space:]]*matt_pocock:\)[[:space:]]*false/\1 true/' "$PREFS_FILE"
    echo "✓ Matt Pocock skills warning suppressed"
    ;;
  all)
    sed -i 's/^\([[:space:]]*specsfy:\)[[:space:]]*false/\1 true/' "$PREFS_FILE"
    sed -i 's/^\([[:space:]]*matt_pocock:\)[[:space:]]*false/\1 true/' "$PREFS_FILE"
    echo "✓ All setup warnings suppressed"
    ;;
  *)
    echo "Usage: suppress-setup-warning.sh <specsfy|matt_pocock|all>"
    exit 1
    ;;
esac

# Clear the "already shown this session" flag
rm -f "$PROJECT_DIR/.maestro/.setup_warning_shown"

exit 0
