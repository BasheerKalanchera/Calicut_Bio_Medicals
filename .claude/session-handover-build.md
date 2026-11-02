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

## NOW (2 Nov, afternoon) — re-checking what `/build` merged (`a1c9d67`)
- `/build` merged to `main` 2 Nov (`a1c9d67`); Basheer restarted the Dev
  backend (11:29, after the files changed); Dev data re-read done (P3b in
  both plans). Plan edits, Tabs plan D17 and the 2 Nov archive entry and
  retro are **committed and pushed** (`79d3d3e`). 53 of 66 recorded.
- **All Target vs Actuals re-checks after the merge are done (2 Nov
  evening, all Pass): D2–D6, D8, D9, D10, E2, E4, F1, F2, A2, B2, B6, C1,
  C6** (Tabs A2, B3 Pass earlier). No Fails. Findings handed to `/build`:
  D13, D14 (below). D10 wording fixed to "one line each" (Basheer's call).
- **Target vs Actuals E2E (`docs/Target-vs-Actuals-Redesign-Manual-E2E-Test-Plan.md`):
  41 of 41 recorded (2 Nov), 3 Fails (B6, C6, D10) fixed by `/build` and
  merged; being re-checked as above. Detail: Progress-Archive 2 Nov.
- **Parked for re-check once `/build` lands them (handed over 2 Nov):**
  D13 plan amount under "Won % of plan" on the Quarter table → re-check
  TvA B2 (Haroon) and B5 (phone); D14 Overdue "Sort by" box (Most overdue
  first / Name A–Z) → re-check TvA D9 (order) and D10 (3 widths, as
  Haroon and Fazal). Add a test line for each in the plan when built
  (plan: `Target-vs-Actuals-Simpler-Table-Implementation-Plan.md`).
- Then a wider regression of both plans (Basheer wants it); record each
  re-run in the plan the moment it completes. Both plans' expected wording
  was rewritten 2 Nov from the branch code (new P1b, P3b, Sales Report F1).
- **Tabs E2E (`docs/Target-Coverage-Planning-Tabs-Manual-E2E-Test-Plan.md`)
  ON HOLD (Basheer, 2 Nov)** until `/build` lands **D17** (new My Targets
  tab, My Plan → My Plans, new tab order and opening tab; every Tabs step
  names the tabs, so all re-run once on the new layout). Done on `a1c9d67`:
  P1, P3b, A2, B3 Pass. B2 re-run not reported. A4, A5, B1, B5, C1, C2
  and the never-run B4, C3, C4, D–F wait. P2 (sign-ins) unrecorded.
- D17 is written in the Tabs implementation plan; one point open (keep or
  hide the SBU Target card on Team Targets). Write-up for `/build` goes
  through Plan & Chore (Basheer asked, 2 Nov); re-read D17 before
  rewriting the Tabs test plan.

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
