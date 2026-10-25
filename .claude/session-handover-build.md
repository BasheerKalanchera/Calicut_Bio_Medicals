# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).

## Now: Annual Target Planning Part 2, step 5 (Year view + D77)
- Part 1 done 24 Oct (E2E 65 of 65, last fix `48e737b`); on UAT since
  the 25 Oct move (UAT on `8b2ec8a`, database 0063). A8 hint wording
  still awaiting Basheer.
- Basheer 25 Oct: start step 5. In progress: Year-view mock-up for
  Target vs Actuals (Insights Dashboard), shown before any code; D77
  (quarter picker's right arrow inside the card on a phone) rides along.
  Mock-up (Dev Oct–Dec figures, Jan–Mar made up), look approved 25 Oct:
  https://claude.ai/artifact/NnyXKSzDYwoqvy6WXV4p9j. Person rows: whole
  year (D78, written to plan + test plan I5). Year view leaves out
  Expected/Likely finish/zones/brands (D79); three-line phone header
  (D77). All design questions decided 25 Oct; Basheer: build starts
  26 Oct, not before. Next: check in, then build backend + frontend,
  add test plan section I steps for D77/D79, checks, checkpoint commit.
  Docs for D77–D79 (plan, test plan, this note) not yet committed.
- After step 5: step 6 (notifications, Brands Billing to Cabio, and
  D70–D73 — needs a small migration, not yet in plan §6; check in
  first), then step 7 (docs and test).
- Lesson (21 Oct): he found the raw review list hard to follow — bring
  it sorted by what users would notice, screen first, from the start.

## UAT move
- Basheer 20 Oct: "move everything together" — no Wednesday 21 Oct
  move. 24 Oct: the full move goes as soon as Part 1's E2E finishes;
  manual + help follow a day or two later (User Manual plan D15). Do
  the move before any Part 2 / My Work code lands on main. Haroon
  needs telling the new date (not drafted).
- Plan & Chore writes the UAT move plan while this session finishes
  the E2E (Basheer 24 Oct; he relays D15 to it himself).
  `docs/UAT-Promotion-2026-10-Plan.md` (model:
  `docs/UAT-Promotion-2026-09-Plan.md`): everything on main incl. D22,
  Part 1, migrations 0055–0063; fresh-install check the day before, RLS smoke test on Dev, UAT
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
