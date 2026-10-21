# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- Retros for both 21 Oct sessions done (Progress-Archive). Next
  session: the parked review fixes below.
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
- Step 3 (screens) committed and pushed 21 Oct as `642f04c` (with
  D64): Brand Target Tracking
  rewritten (calendar year, seasonal pattern box, one line per brand with
  quarters underneath, D64), SBU box read-only, new TeamTargetsPanel +
  "Your target" line, Target vs Actuals Target column and wording, month
  labels. tsc clean, lint 0 errors. Not yet tried in the browser.
- Step 4 docs (BR-PL-10/11/12, ADR-019 addendum, User Manual, etc.)
  went out in Plan & Chore's docs batch `20eea0a`, pushed.
- Pre-E2E review 21 Oct: Dev at 0062 (head), Physical-Schema current;
  pytest 1346 passed, ruff/tsc clean, lint 0 errors (133 warnings).
  `/code-review high` found 10, all checked against the code. Parked by
  Basheer 21 Oct evening — resume tomorrow morning. Nothing edited yet.
- Fixes as re-sorted for him (fix, then E2E):
  1. Brand Target Tracking pattern box loses unsaved typing on window
     switch (`key` has `dataUpdatedAt`, BrandTargetTrackingScreen:322).
  2. "Year starts in" box open when the brand has a figure in another
     year, then errors (:450; add a has-any-figure field to the row).
  3. Missing space before ₹, approve/reject dialog
     (TargetPlanningScreen:775) — small-fixes batch at E2E end.
  Quiet fixes: negative quarter from rounding (`split_brand_year`,
  service:632 — largest share takes remainder); refresh list after a
  refused save (:268); remove old hand-typed brand quarter route
  (router:283–302, follows D54 — Basheer asked, answered: no hand
  editing). Dropped: N+1 lookups, duplicate repository helpers.
- **Open, for Basheer:** Q2 — Team targets panel lists only SBU
  Manager / Area Manager / Sales Rep (`sbu_top_people`, repository:442)?
  Q3 — heading "Team Plans" for Area Managers instead of "SBU Target &
  Plans" (TargetPlanningScreen:594)? Recommended yes to both.
- Lesson (21 Oct): he found the raw review list hard to follow — bring
  it sorted by what users would notice, screen first, from the start.
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
