#!/bin/sh
# Guard rail (2026-09-29): refuse marking an implementation plan Approved
# while a decision in it is still "proposed". See plan_decisions_guard.py.
# Fast path: saves to anything other than a plan skip Python entirely.
# Fails open: if the checker errors, the save goes through (the daily doc
# tidy-up re-checks all plans), so a bug here never blocks plan editing.
input=$(cat)
case "$input" in
  *[Ii]mplementation-[Pp]lan.md*) ;;
  *) exit 0 ;;
esac
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
out=$(printf '%s' "$input" | python "$dir/plan_decisions_guard.py" 2>/dev/null) || exit 0
[ -n "$out" ] && printf '%s\n' "$out"
exit 0
