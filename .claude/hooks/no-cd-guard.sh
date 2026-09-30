#!/bin/sh
# Guard rail (2026-09-30): refuse shell commands that change folder (cd and
# friends) -- the change carries over to later commands. cd_guard.py reads
# what the command actually does (see its docstring). If the checker can't
# run, fall back to refusing a command that starts with cd -- a broken guard
# must never go silent.
#
# Hardened 2026-09-30 evening: a live `cd` went through unblocked in one
# session although the checker refuses it when replayed by hand. So every
# run now leaves a line in guard.log (proves whether the hook is called at
# all), and a refusal is also signalled by exit code 2 + stderr, which
# Claude Code honours even if the JSON decision is lost.
input=$(cat)
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
cmd=$(printf '%s' "$input" | tr '\r\n' '  ' | sed -n 's/.*"command" *: *"\(.\{0,60\}\).*/\1/p')

log() { printf '%s no-cd %s | %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" "$cmd" >> "$dir/guard.log" 2>/dev/null; }

deny() {
  log "deny"
  printf '%s\n' "$1" >&2
  exit 2
}

if out=$(printf '%s' "$input" | python "$dir/cd_guard.py" 2>/dev/null); then
  if [ -n "$out" ]; then
    deny "Blocked by the no-cd guard rail: this command changes folder, which carries over to later commands. Redo it with absolute paths (or \`git -C <dir>\` for git) and no folder change."
  fi
  log "allow"
  exit 0
fi
case "$input" in
  *'"command":"cd '*|*'"command": "cd '*)
    deny "Blocked by the no-cd guard rail (checker could not run): this command starts with cd. Redo it with absolute paths and no folder change."
    ;;
esac
log "allow (checker failed)"
exit 0
