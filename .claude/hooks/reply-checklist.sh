#!/bin/sh
# Per-message reminder (UserPromptSubmit), 2026-10-14. Rules at the top of
# CLAUDE.md get buried in long sessions; this puts the most-repeated slips
# (Process-Improvements P1, P3) next to every message. Plain print, no
# Python, so it adds no noticeable delay. Keep it short or it gets skimmed.
cat <<'EOF'
Reply checklist (P1, P3): (1) Numbers and counts: count with a tool first, or say "estimate, not counted". (2) Every figure, name or example says where it came from (Dev query + date, file, Basheer, or made-up). Quarters: run scripts/quarter.py. (3) Before saying what code, a test or a screen does, read it. (4) Plain language first, then the technical part.
EOF
exit 0
