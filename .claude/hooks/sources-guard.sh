#!/bin/sh
# Guard rail (2026-10-14): plans and test plans list each figure and example
# with its source. See sources_guard.py. Fast path: saves to anything other
# than a plan or test plan skip Python. Fails open on checker errors.
input=$(cat)
case "$input" in
  *[Ii]mplementation-[Pp]lan.md*|*[Ee]2[Ee]-[Tt]est-[Pp]lan.md*) ;;
  *) exit 0 ;;
esac
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
out=$(printf '%s' "$input" | python "$dir/sources_guard.py" 2>/dev/null) || exit 0
[ -n "$out" ] && printf '%s\n' "$out"
exit 0
