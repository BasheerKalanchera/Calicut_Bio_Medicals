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

## NOW (2 Nov) — manual E2E of what `/build` merged (`515a2f2`)
- Docs batch `396e3da` is on `main`, **not pushed**. 2 Nov edits to the
  Target vs Actuals plan, Progress-Archive-2026-11 and this note are
  **uncommitted**. Nothing to test until `/build` merges.
- Dev backend restarted by Basheer 1 Nov. Total 66 steps; run 49 of 66.
- **Target vs Actuals E2E (`docs/Target-vs-Actuals-Redesign-Manual-E2E-Test-Plan.md`):
  41 of 41 recorded (2 Nov); E1–E4 and F1–F4 all Pass.** 3 Fails stand:
  B6 (arrow hover text), C6 (person screen opens scrolled down; header
  hidden, name row fixed), D10 (Overdue list not one block per person).
  Also for `/build`: "SBU" row label → SBU name; "No plan" for the dash
  (Quarter); inactive accounts marked (needs `is_active` from the
  server); NEW 2 Nov: hide the other Insights tabs while a person's
  screen is open; Sales Report to show the period's dates beside the box.
  All write-ups given to Basheer. Detail: Progress-Archive 2 Nov.
- **WAITING on `/build`** to fix and merge to `main` (unmerged on
  `worktree-build` 2 Nov: `f2b72c6`, `22e3526`, `30766c7`, `8d0d0b3`).
  **Then, in order:** review the new code; re-run A2, B2, B6, C1, C6, D9,
  D10, E2, E4; a wider regression of both plans (Basheer wants it);
  record the re-runs in the plans. Plan wording still to correct: B2
  expected rows ("SBU" label), C6/D9/D10 re-checks.
- **Tabs E2E (`docs/Target-Coverage-Planning-Tabs-Manual-E2E-Test-Plan.md`):
  8 of 25 recorded, ON HOLD** — P3, A1–A5, B1 (Fail), B2 Pass. P1/P2 still
  unrecorded (Basheer to confirm). B3, B4, C, D, E, F not run.
- B1 failed: Needs Your Approval lists every pending plan in any period
  (4 for Haroon). Decided with Basheer 1 Nov — plan D12–D16, build step 3:
  approval list follows period + SBU with a "N more waiting in other
  periods" line; SBU on every tab; tab order My Plan / Needs Your Approval
  / Team Plans / Team Targets; opening tab rule kept; Annual My Plan
  "Your target" line. Pushed on `main` as `c9c5372`.
- **Next:** `/build` has built D12–D16 (1 Nov; fix commits `30766c7`,
  `8d0d0b3`, not yet merged). After its merge: review the new code,
  rewrite the Tabs test plan (B1, C2, A2–A5 order, new steps), re-run A–C,
  run D–F.

## MUI round 1 Part 1 — step 8 is mine (Basheer, 1 Nov)
- Steps 1–4 done (`6a417cb`, `f8c61b3`, `394444a`); 5–7 are `/build`'s
  (5 `06a304b`, 6 `0c4f728` done; 7 Close Next Action + Next Actions next).
- Step 8: 21 "after" pictures into `Desktop\cabio\MUI-Round1-After\`,
  before-and-after page, one combined E2E; take it AFTER the Tabs fixes
  merge so the pictures show the final app. Remove Backlog "File deletes:
  ask 'Are you sure?' first" only when that E2E passes.
- GAP: Product Catalogue has no "before" picture — take it from a temporary
  copy of `515a2f2` (parent of `394444a`) on a second port, Dev data, read-
  only, 390/768/1280 px + brochure ✕ "Delete this file?" at 390 px, saved
  `11-Product-Catalogue-<width>.png`; then delete the copy. Don't miss it.
- Part 2 (wording sweep) comes later; check report 1 Nov: 33 files / 862
  lines. Log Activity contact-box name still to check.

## Parked
- Annual Target E2E section L (11 steps, three widths): re-read against the
  new screens; Tabs plan covers its L1–L3 (D11). Detail: Progress-Archive
  28–30 Oct. Dev test data left as found (Maquet ₹100 L; Medion ₹100 L).
- Weekly Harness Engineering review due; skipped in this session.
- Other deferred items live in the Backlog (6 rule gaps, small fixes,
  convention audit idea).
