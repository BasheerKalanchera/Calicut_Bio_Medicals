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

## NOW (3 Nov) — fixed headers pushed (`a1f0147`); docs batch + retro pushed (`c3c7ae9`)
- `/build` merged D13/D14/D17 as `1bf0260`. TvA re-checks B2, B5, D9, D10,
  11: all Pass 3 Nov. D15 (Overdue) and D16 (Target vs Actuals, Pipeline
  tab, Pipeline Report) fixed in `a1f0147`, pushed; Basheer saw them on a
  phone only. Test wording for D13–D17 is in the plans (`c3c7ae9`,
  Tabs plan `32fe4ec`, both pushed). Retro done (6 corrections).
- D16 at 768 and 1280 px: Pass (Basheer, 3 Nov). Code review of
  `19141b8..HEAD` (medium): 8 findings, none a bug; two small fixes proposed
  (shared Pipeline header strip; Overdue "Sort by" always shown, greyed
  while empty): committed 3 Nov as `7fa039c`, pushed with docs batch
  `fe0bd00`; seen on Dev, looks good
  (Basheer). pytest 1,508 passed, ruff, tsc, lint clean. Retro for this
  part done (4 corrections), in Progress-Archive 3 Nov (late).
- **4 Nov: Tabs E2E done, 30 of 30 recorded (P1–F2 + new E4), all Pass.**
  Fails fixed in `413abf8` (pushed to origin/main): D4 (a "submitted" bell
  click on a decided plan now opens Team Plans, Tabs plan D7) and D18
  (Team Plans Annual view lists everyone as a reporting tree). tsc, lint
  clean; D4 and E4 re-run Pass on Dev. Detail, retro (4 corrections) and
  the Backlog entry (GM seeing reps' targets, waits for the leadership
  demo) are in Progress-Archive 4 Nov (Build & Test) and the docs batch.
- **Next:** (c) re-test `/build`'s sign-out fix; (d) TvA plan: 37 lettered
  steps, 5 re-run 3 Nov, about 32 not (approximate, counted from the plan).
  Further fixes go in a new `fix:` commit at the end. Then MUI step 8 below.
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
- Steps 1–4 done (`6a417cb`, `f8c61b3`, `394444a`); 5–7 are `/build`'s
  (5 `06a304b`, 6 `0c4f728` done; 7 Close Next Action + Next Actions next).
- Step 8: 21 "after" pictures into `Desktop\cabio\MUI-Round1-After\`,
  before-and-after page, one combined E2E; take it AFTER the Tabs fixes
  merge so the pictures show the final app. Remove Backlog "File deletes:
  ask 'Are you sure?' first" only when that E2E passes.
- Product Catalogue "before" pictures done (`Desktop\cabio\MUI-Round1-
  Before\11*`). "After" detail picture: use Haroon or Admin.
- Part 2 (wording sweep) comes later; check report 1 Nov: 33 files / 862
  lines. Log Activity contact-box name still to check.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Weekly Harness Engineering review due; skipped in this session.
- Other deferred items live in the Backlog (6 rule gaps, small fixes,
  convention audit idea).
