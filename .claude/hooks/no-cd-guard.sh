#!/bin/sh
# Guard rail (2026-09-30): refuse shell commands that change folder (cd and
# friends) -- the change carries over to later commands. cd_guard.py reads
# what the command actually does (see its docstring). If the checker can't
# run, fall back to refusing a command that starts with cd -- a broken guard
# must never go silent.
input=$(cat)
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
if out=$(printf '%s' "$input" | python "$dir/cd_guard.py" 2>/dev/null); then
  [ -n "$out" ] && printf '%s\n' "$out"
  exit 0
fi
case "$input" in
  *'"command":"cd '*|*'"command": "cd '*)
    printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked by the no-cd guard rail (checker could not run): this command starts with cd. Redo it with absolute paths and no folder change."}}'
    ;;
esac
exit 0
