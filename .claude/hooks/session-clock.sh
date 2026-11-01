#!/bin/sh
# P98 (2026-11-01): after a successful git push, tell Claude the session's
# real running time and Basheer's message count for the 2-hour / 25-message
# checkpoint. Logic in session_clock.py. Never blocks: if it can't run, stay
# silent.
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
python "$dir/session_clock.py" 2>/dev/null
exit 0
