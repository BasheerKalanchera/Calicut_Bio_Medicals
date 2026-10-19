#!/bin/sh
# Guard rail (2026-10-19, P24): handover notes warn above 75 lines and
# refuse a save above 100. See handover_length_guard.py. Fast path: saves to
# anything other than a handover note skip Python. Fails open on checker
# errors. Used for both PreToolUse (refuse) and PostToolUse (warn).
input=$(cat)
case "$input" in
  *session-handover-*) ;;
  *) exit 0 ;;
esac
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
out=$(printf '%s' "$input" | python "$dir/handover_length_guard.py" 2>/dev/null) || exit 0
[ -n "$out" ] && printf '%s\n' "$out"
exit 0
