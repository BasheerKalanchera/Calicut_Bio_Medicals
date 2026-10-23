# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- 23 Oct retro done (Progress-Archive, 8 corrections). Next session:
  carry on Part 1 E2E on Dev (below).
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).

## Next: Annual Target Planning Part 1, built here
- After Part 1's E2E: build Part 2 here (plan steps 5–7; Basheer 22
  Oct). Plan & Chore writes Part 2's E2E sections meanwhile. Part 2 also
  builds D70/D71 (GM hand-types one brand quarter's target, flag column
  on brand_vendor_target — small migration); Q-C still open with Basheer.
- Part 1 built and pushed: `f2f5edd`, `642f04c`, `ed669e7`, and
  `be27712` (22 Oct: seasonal pattern "Save pattern" greyed out until
  100 %, Basheer — phone use, no reload). Dev at 0062 (21 Oct).
- **In progress: Part 1 E2E on Dev** — 40 of 64 steps Pass (P1–P5,
  A1–A10, B1–B9, C1–C5 incl. C3a, D1–D7, E1–E3; A8 hint wording awaiting
  Basheer). **Next:** C6 (as Haroon, already signed in on the test
  tab), C7, B10, D8, then E4–E6, F, G (incl. new G3a), H.
- D75 (SBU Target + Team Targets own cards, Annual views, "Team Plans"
  for all, no repeated SBU target for Admin/GM) committed `dd9cdb9`;
  Brand Target Tracking phone layout `c2f025d`. Pushed with the 23 Oct
  docs batch. Post-commit checklist for D75 once its steps pass.
- Small-fixes batch at E2E end: missing space before ₹, approve/reject
  dialog (TargetPlanningScreen ~775) — not made yet.
- User Manual "SBU Target & Plans" → passed to Plan & Chore's note
  (Basheer yes 23 Oct).
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
