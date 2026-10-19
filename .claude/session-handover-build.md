# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Next-action rules — close several at once (plan D22), then UAT Wed 21 Oct
- Haroon saw the demo 19 Oct and wants the rules on UAT by Wednesday
  21 Oct (Basheer). Full move needed (see Progress-Archive 2026-10,
  entry "2026-10-19 — Next-action rules: demo to Haroon…").
- Gap: two or more of one's own open next actions on an Opportunity
  never come down (closing one needs a follow-up). Basheer chose the
  "middle way" 19 Oct: close several at once with one "what happened"
  and one follow-up, in the close form and Log Activity's warning; the
  "Why this change?" pop-up stays pick-one. Written in BR-ACT-05, plan
  D22, matrix (uncommitted at time of writing — check `git log`).
- **Next (20 Oct):** get Basheer's yes to the build plan shown 19 Oct,
  including two proposed choices: (1) Log Activity opens the close form
  with all of them ticked, the close form from Next Actions starts with
  the others unticked; (2) the follow-up pre-fills from the one pressed
  (Log Activity: the most recently set). Then build: `ReminderUpdate`
  `also_close_ids`, checked in `ReminderService.patch_reminder` (open,
  same Opportunity, same person; same closing activity); tests in
  `backend/tests/domains/activity/test_activity_service.py`;
  `CloseReminderModal` "Also close" ticks; `LogActivityModal` drops the
  per-row Close buttons. About 4 E2E steps added to the test plan; one
  `fix:` commit, shown first. Nothing on Dev breaks in between.
- Then the UAT move plan `docs/UAT-Promotion-2026-10-Plan.md` (model:
  `docs/UAT-Promotion-2026-09-Plan.md`): 245 commits, migrations
  0055–0061; fresh-install check the day before, RLS smoke test on Dev,
  UAT backup (ask first); D8 WhatsApp message for Haroon (not drafted);
  after the move delete `.claude/dq-check-paused` and run the UAT
  data-quality check (ask first).

## Waiting on Basheer
- Republish of both scorecard pages (exact diff shown 19 Oct, not yet
  answered): https://claude.ai/artifact/7qRxCt4BTooYDSzvvg1xPB and
  https://claude.ai/artifact/VcwUvDNArFv22x2Aghvx3Z — could go out with
  the UAT move.

## Not yet scheduled
- The other 6 rule gaps: Backlog "Business rules vs code — 6 gaps
  awaiting decision".
- Annual Target Planning: plan being replanned, "do not build" (`107bccc`,
  2026-10-17); this session runs its E2E once it is rebuilt and merged.
