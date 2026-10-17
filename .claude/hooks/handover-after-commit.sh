#!/bin/sh
# P16 (2026-10-17): after a successful git commit, remind Claude to update
# its session's handover note. Logic in handover_after_commit.py. A reminder,
# never a block: if the checker can't run, stay silent.
dir="${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/.claude/hooks"
python "$dir/handover_after_commit.py" 2>/dev/null
exit 0
