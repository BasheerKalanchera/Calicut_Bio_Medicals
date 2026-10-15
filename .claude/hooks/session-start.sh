#!/usr/bin/env sh
# SessionStart hook (wired in .claude/settings.json). Output is shown to
# Claude at the start of every session. Keep it short: Claude Code truncates
# large hook output to a ~2 KB preview.

H=.claude/session-handover.md
OLD=.claude/active_progress.md
DQ_LOG=/c/Backups/CabioUAT/data_consistency_reports/data_quality_log.txt

# 1. Old handover name reappeared (e.g. a session started before the
#    2026-09-24 rename wrote to it).
if [ -f "$OLD" ]; then
  echo "!!! WARNING: $OLD exists again. It was renamed to $H on 2026-09-24. Merge anything current into $H, delete $OLD, and tell Basheer. !!!"
  echo
fi

# 2. UAT data-quality check due (every alternate day, run under Basheer's
#    supervision; scripts/uat_data_quality_check.py appends to DQ_LOG).
#    Paused while .claude/dq-check-paused exists (reason inside; Basheer,
#    2026-10-15: until the next-action rules feature is built).
if [ -f .claude/dq-check-paused ]; then
  :
elif [ -f "$DQ_LOG" ] && last=$(tail -n 1 "$DQ_LOG" | cut -c1-10) && [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge 2 ] && echo "DUE TODAY: UAT data-quality check (last run $last, $days days ago). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. (UAT rule)" && echo
else
  echo "DUE TODAY: UAT data-quality check (no recorded run yet). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. (UAT rule)"
  echo
fi

# 2b. UAT backup due (daily, run under Basheer's supervision;
#     scripts/backup_uat.ps1 writes cabio_uat_YYYY-MM-DD.dump to BK_DIR).
#     Dated from the newest dump's filename, not backup_log.txt: a failed run
#     still writes a log line but produces no dump.
BK_DIR=/c/Backups/CabioUAT/DB_Backups
last=$(ls "$BK_DIR"/cabio_uat_*.dump 2>/dev/null | sed 's#.*/cabio_uat_\([0-9-]\{10\}\).*#\1#' | sort | tail -n 1)
if [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge 1 ] && echo "DUE TODAY: UAT backup (newest dump $last, $days day(s) old). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. Not even a folder listing; another session may already be doing it. If he says yes: list the backup folder, name every file the keep-newest-14 prune will delete, and ask again before running scripts/backup_uat.ps1 (UAT rule). After the run, end the report with the new dump's exact file name for Basheer to copy to Google Drive by hand (daily offsite copy, 2026-10-12)." && echo
else
  echo "DUE TODAY: UAT backup (none found in $BK_DIR). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. (UAT rule)"
  echo
fi

# 2c. Documentation tidy-up due (every alternate day, Basheer 2026-10-07):
#     counted from the last sweep on its own, not tied to any other task
#     (Basheer, 2026-10-15). See .claude/skills/doc-integrity-sweep/SKILL.md
#     "Frequency".
SWEEP_EVERY_DAYS=2
SWEEP_LOG=docs/Doc-Integrity-Sweep-Log.md
last=$(grep -E '^- [0-9]{4}-[0-9]{2}-[0-9]{2}' "$SWEEP_LOG" 2>/dev/null | tail -n 1 | cut -c3-12)
if [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge "$SWEEP_EVERY_DAYS" ] && echo "DUE TODAY: documentation tidy-up (last sweep $last, $days day(s) ago). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. Load the doc-integrity-sweep skill only after he says yes." && echo
else
  echo "DUE TODAY: documentation tidy-up (none recorded yet). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. Load the doc-integrity-sweep skill only after he says yes."
  echo
fi

# 2d. Harness Engineering review due every other day (Basheer, 2026-10-15; decided
#     daily 2026-10-08, replacing the weekly review; he sets the frequency
#     step by step). Last review is the newest "- YYYY-MM-DD" line in
#     docs/Process-Improvements.md. Steps: harness-engineering skill.
PI_LOG=docs/Process-Improvements.md
last=$(grep -E '^- [0-9]{4}-[0-9]{2}-[0-9]{2}' "$PI_LOG" 2>/dev/null | tail -n 1 | cut -c3-12)
if [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  if [ "$days" -ge 2 ]; then
    echo "DUE TODAY: Harness Engineering review, every other day (last review $last, $days day(s) ago; $PI_LOG). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. Load the harness-engineering skill only after he says yes." && echo
  fi
fi

# 3. Handover size alarm, then the handover itself.
[ -f "$H" ] || exit 0
n=$(wc -l < "$H")
if [ "$n" -gt 150 ]; then
  echo "!!! WARNING: $H is $n lines (limit 150). Before any other work, move finished threads to docs/Progress-Archive-<year>-<month>.md per CLAUDE.md Session handoff, and tell Basheer. !!!"
  echo
fi
cat "$H"
