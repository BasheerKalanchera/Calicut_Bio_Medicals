#!/bin/sh
# P98 (2026-11-01, rule changed 2026-11-04): on Basheer's messages and after a
# successful git push, tell Claude the session's time worked and message count
# when a refresh is due. Rule and logic in session_clock.py. Never blocks: if
# it can't run, stay silent.
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
python "$dir/session_clock.py" 2>/dev/null
exit 0
