#!/bin/sh
# Cleanup (Basheer 2026-10-07): Python leaves a scripts/__pycache__ folder
# behind when one of our scripts imports another. The task that made it
# cleans it up: after any shell command that ran a .py file from scripts/,
# delete that folder. Python simply rebuilds it next time if needed.
# The backend's own cache is left alone (the server uses it while running).
input=$(cat)
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"
case "$input" in
  *scripts/*.py*|*'scripts\\'*.py*)
    rm -rf "$dir/scripts/__pycache__"
    ;;
esac
exit 0
