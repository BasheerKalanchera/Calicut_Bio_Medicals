# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- 22 Oct retro done (Progress-Archive, 6 corrections). Next session:
  Part 1 E2E on Dev (below).
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).

## Next: Annual Target Planning Part 1, built here
- After Part 1's E2E: build Part 2 here (plan steps 5–7; Basheer 22
  Oct). Plan & Chore writes Part 2's E2E sections meanwhile. Part 2 also
  builds D70/D71 (GM hand-types one brand quarter's target, flag column
  on brand_vendor_target — small migration); Q-C still open with Basheer.
- 22 Oct: review fixes committed and pushed `ed669e7` (archive 22 Oct).
  **Next: Part 1 E2E on Dev** — load `cabio-e2e-testing` first.
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
  `/code-review high` found 10, all checked against the code.
- Small-fixes batch at E2E end: missing space before ₹, approve/reject
  dialog (TargetPlanningScreen:775) — not made yet.
- Also in that batch (uncommitted): Area Managers' heading "Team Plans"
  (TargetPlanningScreen:594, Basheer yes 22 Oct).
- Lesson (21 Oct): he found the raw review list hard to follow — bring
  it sorted by what users would notice, screen first, from the start.

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
