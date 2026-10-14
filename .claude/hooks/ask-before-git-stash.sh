#!/bin/sh
# Guard rail (2026-09-27, rewritten 2026-09-28): parallel Claude sessions
# share this working folder, so anything that sets uncommitted work aside
# could sweep up another session's unsaved edits. stash_guard.py reads what
# the command actually does (see its docstring) and asks Basheer only when
# it really stashes. If the checker can't run, fall back to asking whenever
# the command mentions "stash" -- a broken guard must never go silent.
#
# 2026-09-30 evening: every run leaves a line in guard.log, to show whether
# the hook is called at all (see no-cd-guard.sh). "Ask" stays a JSON
# decision -- exit code 2 would block outright instead of asking.
input=$(cat)
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
cmd=$(printf '%s' "$input" | tr '\r\n' '  ' | sed -n 's/.*"command" *: *"\(.\{0,300\}\).*/\1/p' | sed -e 's/", *"[a-z_]*" *:.*//' -e 's/"}*$//')
# 2026-10-14 (P14): "ask" lines keep 300 characters; allow lines keep 60.
log() {
  c=$cmd; case "$1" in allow*) c=$(printf '%s' "$cmd" | cut -c1-60) ;; esac
  printf '%s stash %s | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" "$c" >> "$dir/guard.log" 2>/dev/null
}
if out=$(printf '%s' "$input" | python "$dir/stash_guard.py" 2>/dev/null); then
  if [ -n "$out" ]; then log "ask"; printf '%s\n' "$out"; else log "allow"; fi
  exit 0
fi
case "$input" in
  *[Ss][Tt][Aa][Ss][Hh]*)
    log "ask (checker failed)"
    printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"The stash guard rail could not run its checker, and this command mentions stash. Another session may have unsaved work in this folder. Allow only if you are sure it is safe."}}'
    ;;
esac
exit 0
