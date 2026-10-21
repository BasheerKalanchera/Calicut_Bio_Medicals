# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- Retro for 21 Oct done (Progress-Archive). Next session: step 3.
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).

## Next: Annual Target Planning Part 1, built here
- Built in the main folder (Basheer 21 Oct); `/build` is idle, its
  worktree and branch removed (merged `d8e1d03`).
- Steps 1+2 in one checkpoint (D58, Basheer 21 Oct: no one uses the old
  screens meanwhile). Committed and pushed as checkpoint `f2f5edd`
  (migration 0062, server, tests, Physical-Schema, api.ts). Applied to
  Dev 21 Oct, `alembic current` = 0062 (head). pytest 1346, ruff/tsc
  clean, lint 0 errors. D59–D63 in the plan (uncommitted, docs batch).
- Until step 3: the SBU target box on Target & Coverage Planning can't
  save; yearly target screens don't exist yet.
- Next: check in with Basheer, then step 3 (screens).
- Committed and pushed 21 Oct: vendor script wording `187fe06`; docs
  batch `c6708f9` (D58–D63, SonoScape examples rule).

## UAT move
- Basheer 20 Oct: "move everything together" — no Wednesday 21 Oct
  move; the one full move waits for the User Manual and Annual Target
  Part 1 (D52). Haroon needs telling the new date (not drafted).
- Then the UAT move plan `docs/UAT-Promotion-2026-10-Plan.md` (model:
  `docs/UAT-Promotion-2026-09-Plan.md`): include D22, Part 1, migration
  0062; fresh-install check the day before, RLS smoke test on Dev, UAT
  backup (ask first); WhatsApp message for Haroon (not drafted); after
  the move delete `.claude/dq-check-paused` and run the UAT data-quality
  check (ask first).

## Waiting on Basheer
- Republish of both scorecard pages (exact diff shown 19 Oct, not yet
  answered): https://claude.ai/artifact/7qRxCt4BTooYDSzvvg1xPB and
  https://claude.ai/artifact/VcwUvDNArFv22x2Aghvx3Z — could go out with
  the UAT move.

## Not yet scheduled
- The other 6 rule gaps: Backlog "Business rules vs code — 6 gaps
  awaiting decision".
