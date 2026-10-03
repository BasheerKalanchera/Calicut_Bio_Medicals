#!/bin/sh
# Guard rail (2026-10-03): refuse scripted edits to code files and commit
# messages saying "deal". See shell_guard.py. Fails open: if the checker
# errors, the command goes through. Each refusal is logged to guard.log and
# signalled by exit 2 + stderr (as no-cd-guard.sh does).
input=$(cat)
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
out=$(printf '%s' "$input" | python "$dir/shell_guard.py" 2>/dev/null) || exit 0
[ -z "$out" ] && exit 0
cmd=$(printf '%s' "$input" | tr '\r\n' '  ' | sed -n 's/.*"command" *: *"\(.\{0,60\}\).*/\1/p')
printf '%s shell-guard deny | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$cmd" >> "$dir/guard.log" 2>/dev/null
printf '%s\n' "$out" | sed -n 's/.*"permissionDecisionReason": *"\(.*\)".*/\1/p' >&2
exit 2
