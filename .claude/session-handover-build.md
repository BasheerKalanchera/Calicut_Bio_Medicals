# Handover — Build & Test session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Plan & Chore
keeps its own note: `.claude/session-handover-plan.md`. Only the Build & Test
session edits this note._

## Reminders
- api.ts guard is on (`5ca17aa`): a backend fix commit must carry the
  matching api.ts (`sh .githooks/check-api-types.sh --write` stages it).
- UAT runs `8b2ec8a` (moved 25 Oct, `b294865`). Until the first Part 2
  commit, main's app code = UAT's; after it, UAT fixes go by the
  hotfix-branch route (`docs/Deployment-Topology.md` "Fix to UAT ahead
  of a full promotion").

## NOW (5 Nov) — Customer with No Activity E2E running
- Finished and pushed (detail in Progress-Archive 3–5 Nov): Tabs E2E, TvA E2E
  37 of 37, sign-out re-test 4 of 4, MUI step 8 pictures 26 of 26 and pair
  review (docs `44a1999`). Pictures cover the look check, so the step 8 E2E
  is to be short. Dev server on 5173: restart only when Basheer asks.
- **5 Nov, later: Customer with No Activity E2E is running** (plan
  `docs/Customer-No-Activity-Report-Manual-E2E-Test-Plan.md`, 37 steps).
  P1, P2, A1, A2 Pass = 4 of 37. P2 re-run on Dev 5 Nov: Nishad K V 22 (not
  21), Elite 125 days; plan edited, uncommitted. **Next: A3** (Basheer, his
  Basheer K login, on Dev), then A4–A7, then B.
- **D16 added** to `docs/Exception-Report-Implementation-Plan.md` (uncommitted):
  a line above the tiles with SBU, zones, which contacts count, "28 of 38
  hospitals"; no per-row hint, no DB change. **Not built.** Files to touch:
  `reporting/service.py`, `schemas.py` (+ test), `types/api.ts` via
  `check-api-types.sh --write`, `NoActivityCustomersReportScreen.tsx`. Waiting
  on Basheer: build before B, or finish A3–A7 first (my suggestion). Needs a
  pre-E2E review of the change, then goes in the small-fixes `fix:` batch.
  Then update E2E A2/B wording. Log of the finding: Progress-Archive 5 Nov.
- **Small fix committed and pushed:** `ec8b9e2` — My Work "Showing" list
  leaves out Marketing Users (`MyWorkScreen.tsx`; Backlog "Marketing Users
  in the Rep pickers" for the other screens). tsc and lint passed 5 Nov.
  Break 5 Nov; E2E resumes next day at A3.
- MUI step 8 combined E2E (short, only what pictures can't show) is parked
  behind this one; fix plan wording "21 pictures" to 26 when resumed.
- Open: Sales Report and Opportunities On Hold likely need the same fixed
  header (Backlog, 3 Nov). Year view "of plan" parked for Plan & Chore.
- Dev read 3 Nov (P3c): own targets Oct–Dec 2026 only; SBU Imaging ₹280.0L,
  Critical Care ₹185.0L (+ ₹10.0L Jan–Mar 2027). Script in scratchpad.

## Earlier results (detail: Progress-Archive 2 Nov, committed)
- Target vs Actuals E2E: 41 of 41 recorded 2 Nov; 3 Fails (B6, C6, D10)
  fixed by `/build` and re-checked Pass after the `a1c9d67` merge. Findings
  D13, D14 are now built (above). About 24 steps not re-run: estimate, not
  counted; count from the plan before the wider regression.
- Tabs plan: on `a1c9d67`, P1, P3b, A2, B3 passed on the OLD layout; every
  Tabs step re-runs on the new one. P2 (sign-ins) unrecorded. D17's open
  point (SBU Target card) was settled: stays on Team Targets (`c23478a`).

## MUI round 1 Part 1 — step 8 is mine (Basheer, 1 Nov)
- Steps 1–7 are in main (1–4 `6a417cb`, `f8c61b3`, `394444a`; 5 `06a304b`,
  6 `0c4f728`; 7 `b1fdb3f`, `33293b8`, `5c26ed3`; all in main, git 5 Nov).
- Step 8: pictures done (26, see NOW); still to do: combined E2E. Remove
  Backlog "File deletes: ask 'Are you sure?' first" only when that E2E passes.
- Product Catalogue pictures done on both sides (see NOW).
- Part 2 (wording sweep) comes later; check report 1 Nov: 33 files / 862
  lines. Log Activity contact-box name still to check.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Weekly Harness Engineering review due; skipped in this session.
- Other deferred items live in the Backlog (6 rule gaps, small fixes,
  convention audit idea).
