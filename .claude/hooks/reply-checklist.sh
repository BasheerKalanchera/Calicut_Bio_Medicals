#!/bin/sh
# Per-message reminder (UserPromptSubmit), 2026-10-14. Rules at the top of
# CLAUDE.md get buried in long sessions; this puts the most-repeated slips
# (Process-Improvements P1, P3) next to every message. Plain print, no
# Python, so it adds no noticeable delay. Keep it short or it gets skimmed.
cat <<'EOF'
Reply checklist (P1, P3): (1) Numbers and counts: count with a tool first, or say "estimate, not counted". (2) Every figure, name or example says where it came from (Dev query + date, file, Basheer, or made-up). Quarters: run scripts/quarter.py. (3) Before saying what code, a test or a screen does, read it. (4) Plain language first, then the technical part.
EOF
# Session start by command (Basheer, 2026-10-16, P83): show that session's
# handover note the moment /plan-and-chore or /build-and-test is typed.
# /build (parallel Build session, 2026-10-17) works in a worktree, so its
# note is read from the main folder (git's common dir), never the copy.
D=${CLAUDE_PROJECT_DIR:-.}/.claude
M=$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --path-format=absolute --git-common-dir 2>/dev/null)/../.claude
case "$(cat)" in
  *'"prompt":"/plan-and-chore'*|*'"prompt": "/plan-and-chore'*) echo; cat "$D/session-handover-plan.md" ;;
  *'"prompt":"/build-and-test'*|*'"prompt": "/build-and-test'*) echo; cat "$D/session-handover-build.md" ;;
  *'"prompt":"/build"'*|*'"prompt": "/build"'*|*'"prompt":"/build '*|*'"prompt": "/build '*) echo; cat "$M/session-handover-build-parallel.md" ;;
esac
exit 0
