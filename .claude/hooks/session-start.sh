#!/usr/bin/env sh
# SessionStart hook (wired in .claude/settings.json). Output is shown to
# Claude at the start of every session. Keep it short: Claude Code truncates
# large hook output to a ~2 KB preview.

H=.claude/session-handover.md
OLD=.claude/active_progress.md
DQ_LOG=/c/Backups/CabioUAT/data_quality_log.txt

# 1. Old handover name reappeared (e.g. a session started before the
#    2026-09-24 rename wrote to it).
if [ -f "$OLD" ]; then
  echo "!!! WARNING: $OLD exists again. It was renamed to $H on 2026-09-24. Merge anything current into $H, delete $OLD, and tell Basheer. !!!"
  echo
fi

# 2. UAT data-quality check due (every alternate day, run under Basheer's
#    supervision; scripts/uat_data_quality_check.py appends to DQ_LOG).
if [ -f "$DQ_LOG" ] && last=$(tail -n 1 "$DQ_LOG" | cut -c1-10) && [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge 2 ] && echo "REMINDER: UAT data-quality check is due (last run $last, $days days ago). Ask Basheer before running scripts/uat_data_quality_check.py (UAT rule)." && echo
else
  echo "REMINDER: UAT data-quality check has no recorded run yet. Ask Basheer before running scripts/uat_data_quality_check.py (UAT rule)."
  echo
fi

# 2b. UAT backup due (daily, run under Basheer's supervision;
#     scripts/backup_uat.ps1 writes cabio_uat_YYYY-MM-DD.dump to BK_DIR).
#     Dated from the newest dump's filename, not backup_log.txt: a failed run
#     still writes a log line but produces no dump.
BK_DIR=/c/Backups/CabioUAT
last=$(ls "$BK_DIR"/cabio_uat_*.dump 2>/dev/null | sed 's#.*/cabio_uat_\([0-9-]\{10\}\).*#\1#' | sort | tail -n 1)
if [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge 1 ] && echo "REMINDER: UAT backup is due (newest dump $last, $days day(s) old). Ask Basheer before running scripts/backup_uat.ps1 (UAT rule); first list the full backup folder and name every file the 14-day prune will delete." && echo
else
  echo "REMINDER: no UAT backup found in $BK_DIR. Ask Basheer before running scripts/backup_uat.ps1 (UAT rule)."
  echo
fi

# 2c. Documentation tidy-up due (daily for now; Basheer lowers the frequency
#     as errors fall — see .claude/skills/doc-integrity-sweep/SKILL.md).
SWEEP_EVERY_DAYS=1
SWEEP_LOG=docs/Doc-Integrity-Sweep-Log.md
last=$(grep -E '^- [0-9]{4}-[0-9]{2}-[0-9]{2}' "$SWEEP_LOG" 2>/dev/null | tail -n 1 | cut -c3-12)
if [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge "$SWEEP_EVERY_DAYS" ] && echo "REMINDER: documentation tidy-up is due (last sweep $last, $days day(s) ago). Load the doc-integrity-sweep skill and offer to run it." && echo
else
  echo "REMINDER: no documentation tidy-up recorded yet. Load the doc-integrity-sweep skill and offer to run it."
  echo
fi

# 3. Handover size alarm, then the handover itself.
[ -f "$H" ] || exit 0
n=$(wc -l < "$H")
if [ "$n" -gt 150 ]; then
  echo "!!! WARNING: $H is $n lines (limit 150). Before any other work, move finished threads to docs/Progress-Archive-<year>-<month>.md per CLAUDE.md Session handoff, and tell Basheer. !!!"
  echo
fi
cat "$H"
