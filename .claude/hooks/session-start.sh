#!/usr/bin/env sh
# SessionStart hook (wired in .claude/settings.json). Output is shown to
# Claude at the start of every session. Keep it short: Claude Code truncates
# large hook output to a ~2 KB preview.

# One handover note per session type (Basheer, 2026-10-16, P83). The
# every-message hook (reply-checklist.sh) shows the right one when
# /plan-and-chore or /build-and-test is typed; block 3 re-shows it after a
# context summary.
HP=.claude/session-handover-plan.md
HB=.claude/session-handover-build.md
# Parallel Build session (/build, 2026-10-17) keeps its note in its
# worktree (found via git's common dir); before that exists, the main copy.
MC=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)/../.claude
HBP=$MC/worktrees/build/.claude/session-handover-build-parallel.md
[ -f "$HBP" ] || HBP=$MC/session-handover-build-parallel.md
# Test session (/test, 2026-10-17) runs in the main folder.
HT=.claude/session-handover-test.md
OLD=.claude/session-handover.md
INPUT=$(cat)
DQ_LOG=/c/Backups/CabioUAT/data_consistency_reports/data_quality_log.txt

# Skipped reminders: when Basheer skips a due-today item, Claude adds the line
# "YYYY-MM-DD <key>" to $SKIP; that reminder stays quiet for the rest of the
# day, so a restart doesn't ask again (Basheer, 2026-10-16). Keys: dq-check,
# uat-backup, doc-tidy-up, harness-review.
SKIP=.claude/due-today-skipped
TODAY=$(date +%Y-%m-%d)
skipped() { grep -q "^$TODAY $1" "$SKIP" 2>/dev/null; }
skip_note() { echo "If he skips it, add the line \"$TODAY $1\" to $SKIP so a restart doesn't ask again."; }

# 1. Old single handover note reappeared (e.g. a session started before the
#    2026-10-16 split wrote to it).
if [ -f "$OLD" ]; then
  echo "!!! WARNING: $OLD exists again. It was split into $HP and $HB on 2026-10-16. Move anything current into the matching note, delete $OLD, and tell Basheer. !!!"
  echo
fi

# 2. UAT data-quality check due (every alternate day, run under Basheer's
#    supervision; scripts/uat_data_quality_check.py appends to DQ_LOG).
#    Paused while .claude/dq-check-paused exists (reason inside; Basheer,
#    2026-10-15: until the next-action rules feature is built).
if [ -f .claude/dq-check-paused ] || skipped dq-check; then
  :
elif [ -f "$DQ_LOG" ] && last=$(tail -n 1 "$DQ_LOG" | cut -c1-10) && [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge 2 ] && echo "DUE TODAY: UAT data-quality check (last run $last, $days days ago). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. (UAT rule) $(skip_note dq-check)" && echo
else
  echo "DUE TODAY: UAT data-quality check (no recorded run yet). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. (UAT rule) $(skip_note dq-check)"
  echo
fi

# 2b. UAT backup due (daily, run under Basheer's supervision;
#     scripts/backup_uat.ps1 writes cabio_uat_YYYY-MM-DD.dump to BK_DIR).
#     Dated from the newest dump's filename, not backup_log.txt: a failed run
#     still writes a log line but produces no dump.
BK_DIR=/c/Backups/CabioUAT/DB_Backups
last=$(ls "$BK_DIR"/cabio_uat_*.dump 2>/dev/null | sed 's#.*/cabio_uat_\([0-9-]\{10\}\).*#\1#' | sort | tail -n 1)
if skipped uat-backup; then
  :
elif [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge 1 ] && echo "DUE TODAY: UAT backup (newest dump $last, $days day(s) old). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. Not even a folder listing; another session may already be doing it. If he says yes: list the backup folder, name every file the keep-newest-14 prune will delete, and ask again before running scripts/backup_uat.ps1 (UAT rule). After the run, end the report with the new dump's exact file name for Basheer to copy to Google Drive by hand (daily offsite copy, 2026-10-12). $(skip_note uat-backup)" && echo
else
  echo "DUE TODAY: UAT backup (none found in $BK_DIR). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. (UAT rule) $(skip_note uat-backup)"
  echo
fi

# 2c. Documentation tidy-up due (every alternate day, Basheer 2026-10-07):
#     counted from the last sweep on its own, not tied to any other task
#     (Basheer, 2026-10-15). See .claude/skills/doc-integrity-sweep/SKILL.md
#     "Frequency".
SWEEP_EVERY_DAYS=2
SWEEP_LOG=docs/Doc-Integrity-Sweep-Log.md
last=$(grep -E '^- [0-9]{4}-[0-9]{2}-[0-9]{2}' "$SWEEP_LOG" 2>/dev/null | tail -n 1 | cut -c3-12)
if skipped doc-tidy-up; then
  :
elif [ -n "$last" ]; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  [ "$days" -ge "$SWEEP_EVERY_DAYS" ] && echo "DUE TODAY: documentation tidy-up (last sweep $last, $days day(s) ago). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. Load the doc-integrity-sweep skill only after he says yes. $(skip_note doc-tidy-up)" && echo
else
  echo "DUE TODAY: documentation tidy-up (none recorded yet). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. Load the doc-integrity-sweep skill only after he says yes. $(skip_note doc-tidy-up)"
  echo
fi

# 2d. Harness Engineering review due weekly (Basheer, 2026-10-21; was every
#     other day from 2026-10-15, daily from 2026-10-08). Last review is the newest "- YYYY-MM-DD" line in
#     docs/Process-Improvements.md. Steps: harness-engineering skill.
PI_LOG=docs/Process-Improvements.md
last=$(grep -E '^- [0-9]{4}-[0-9]{2}-[0-9]{2}' "$PI_LOG" 2>/dev/null | tail -n 1 | cut -c3-12)
if [ -n "$last" ] && ! skipped harness-review; then
  days=$(( ( $(date +%s) - $(date -d "$last" +%s) ) / 86400 ))
  if [ "$days" -ge 7 ]; then
    echo "DUE TODAY: Harness Engineering review, weekly (last review $last, $days day(s) ago; $PI_LOG). Put it in the 'Due today' list in your first reply and wait for Basheer's answer; run nothing for it until he says yes. Load the harness-engineering skill only after he says yes. $(skip_note harness-review)" && echo
  fi
fi

# 3. Handover size alarms. After a context summary ("source":"compact"),
#    re-show this session's note: the first /plan-and-chore,
#    /build-and-test, /build or /test in the transcript says which; if none,
#    show all. On a fresh start nothing is shown yet (the command isn't typed).
for f in "$HP" "$HB" "$HBP" "$HT"; do
  [ -f "$f" ] || continue
  n=$(wc -l < "$f")
  if [ "$n" -gt 75 ]; then
    echo "!!! WARNING: $f is $n lines (limit 75). Before any other work, move finished threads to docs/Progress-Archive-<year>-<month>.md per CLAUDE.md Session handoff, and tell Basheer. !!!"
    echo
  fi
done
case "$INPUT" in *'"source":"compact"'*|*'"source": "compact"'*) ;; *) exit 0 ;; esac
tp=$(printf '%s' "$INPUT" | sed -n 's/.*"transcript_path": *"\([^"]*\)".*/\1/p' | sed 's#\\\\#/#g')
kind=$(grep -o -m1 -E 'command-name>/(plan-and-chore|build-and-test|build|test)<' "$tp" 2>/dev/null | head -n 1)
case "$kind" in
  *plan-and-chore\<) cat "$HP" ;;
  *build-and-test\<) cat "$HB" ;;
  */build\<) cat "$HBP" ;;
  */test\<) cat "$HT" ;;
  *) echo "Session type unknown (no /plan-and-chore, /build-and-test, /build or /test found); all four notes follow."; echo; cat "$HP"; echo; cat "$HB"; echo; cat "$HBP"; echo; cat "$HT" ;;
esac
