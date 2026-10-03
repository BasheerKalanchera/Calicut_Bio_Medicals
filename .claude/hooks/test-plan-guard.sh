#!/bin/sh
# Guard rail (2026-10-03): manual E2E test plans must record the live-data
# check and tag every step. See test_plan_guard.py. Fast path: saves to
# anything other than a test plan skip Python. Fails open on checker errors.
input=$(cat)
case "$input" in
  *[Ee]2[Ee]-[Tt]est-[Pp]lan.md*) ;;
  *) exit 0 ;;
esac
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
out=$(printf '%s' "$input" | python "$dir/test_plan_guard.py" 2>/dev/null) || exit 0
[ -n "$out" ] && printf '%s\n' "$out"
exit 0
