#!/bin/sh
# Guard rail (2026-09-27): parallel Claude sessions share this working folder,
# so `git stash` would sweep up another session's unsaved work. Asks Basheer
# instead of refusing, so a genuine need is never blocked.
input=$(cat)
case "$input" in
  *"git stash"*)
    printf '%s
' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"Claude wants to run git stash. Another session may have unsaved work in this folder. Allow only if you are sure it does not, or consider a separate worktree instead."}}'
    ;;
esac
exit 0
