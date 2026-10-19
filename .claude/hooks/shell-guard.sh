#!/bin/sh
# Guard rail (2026-10-03): refuse scripted edits to code files and commit
# messages saying "deal"; since 2026-10-19 also inline edit scripts (P77) and
# add -X utf8 to isolated python runs (P72). See shell_guard.py. Fails open:
# if the checker errors, the command goes through. Each refusal is logged to
# guard.log and signalled by exit 2 + stderr (as no-cd-guard.sh does); a
# rewrite is logged and passed on as JSON with exit 0.
input=$(cat)
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
out=$(printf '%s' "$input" | python "$dir/shell_guard.py" 2>/dev/null) || exit 0
[ -z "$out" ] && exit 0
cmd=$(printf '%s' "$input" | tr '\r\n' '  ' | sed -n 's/.*"command" *: *"\(.\{0,300\}\).*/\1/p' | sed -e 's/", *"[a-z_]*" *:.*//' -e 's/"}*$//')  # 300 chars since 2026-10-14 (P14)
case "$out" in
  *'"updatedInput"'*)
    printf '%s shell-guard rewrite -X utf8 | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$cmd" >> "$dir/guard.log" 2>/dev/null
    printf '%s\n' "$out"
    exit 0 ;;
esac
printf '%s shell-guard deny | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$cmd" >> "$dir/guard.log" 2>/dev/null
printf '%s\n' "$out" | sed -n 's/.*"permissionDecisionReason": *"\(.*\)".*/\1/p' >&2
exit 2
