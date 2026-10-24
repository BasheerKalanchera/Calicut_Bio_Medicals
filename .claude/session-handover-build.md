# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).

## Next: Annual Target Planning Part 1, built here
- After Part 1's E2E: build Part 2 here (plan steps 5–7; Basheer 22
  Oct). Plan & Chore writes Part 2's E2E sections meanwhile. Part 2 also
  builds D70/D71 (GM hand-types one brand quarter's target, flag column
  on brand_vendor_target — small migration); Q-C still open with Basheer.
- Part 1 built and pushed: `f2f5edd`, `642f04c`, `ed669e7`, and
  `be27712` (22 Oct: seasonal pattern "Save pattern" greyed out until
  100 %, Basheer — phone use, no reload). Dev at 0063 (22 Oct, `6016e6a`).
- Part 1 done 24 Oct: E2E 65 of 65, last fix `48e737b` pushed,
  post-commit checklist done (docs `802510f`, pushed). A8
  hint wording still awaiting Basheer.
- **Next:** UAT move is early Sun 25 Oct; Plan & Chore is doing the
  pre-move steps (Basheer 24 Oct) — this session doesn't touch it unless
  asked. After the move: Part 2 build here (ask first).
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
