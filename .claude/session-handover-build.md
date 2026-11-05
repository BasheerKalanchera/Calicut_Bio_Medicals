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
- 3 Nov work (D13–D17 merged, `a1f0147`, `7fa039c`, docs `c3c7ae9`/`fe0bd00`)
  is pushed and in Progress-Archive 3 Nov.
- **4 Nov: Tabs E2E done, 30 of 30, all Pass.** Fixes `413abf8`, pushed.
  Detail, retro and the Backlog entry: Progress-Archive 4 Nov.
- **4 Nov: sign-out double login screen fixed** (`70b517a`, pushed; docs
  `b22e3e0`). Detail: Progress-Archive 4 Nov.
- **5 Nov: sign-out re-test of `a3018c2` done, 4 of 4 Pass** (button, sign-in,
  two tabs, idle by clock jump). Entry in Progress-Archive 5 Nov, uncommitted.
- **5 Nov: MUI step 8 "after" pictures done, 26 of 26**, in
  `Desktop\cabio\MUI-Round1-After\` (same file names as the Before folder;
  03 and 11c taken as Haroon, rest as Basheer K). Comparison page built (not
  yet viewed by Basheer): scratchpad `MUI-Round1-Before-After.html`.
- **Next (5 Nov):** combined MUI round 1 E2E (steps 1–7 are all in main).
  Draft it, tag Simple/Complex, then run with Basheer.
- **4 Nov: TvA E2E done, 37 of 37 Pass**; fix commit `a3018c2` (GM Target
  cell, tab sign-out line), pushed; docs `1f6fea2`. Detail and retro:
  Progress-Archive 4 Nov.
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
