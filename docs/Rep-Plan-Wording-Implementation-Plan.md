# Rep Plan Wording ("target" → "plan") — Implementation Plan

**Status:** Built — `25fbeab` + `af4b4e9` (review and E2E fixes),
2026-10-14; E2E all Pass on Dev 2026-10-14. Approved 2026-10-13
(Basheer). Step 2 (docs) done 2026-10-14; step 3 (Basheer's quick look)
is covered by the E2E, which he ran himself. UAT with the next full move.
Build steps below are complete; kept as the original plan.
**Traceability rows:** none (wording only; supports 3.2 and 6.1).
**Design / discussion:** chat with Basheer 2026-10-09 (Target vs Actuals
E2E) and 2026-10-13; Backlog "App-wide: a rep's plan is called 'target' on
Target Planning" (closed 2026-10-14; this plan replaces it).

## Decisions

- "Target" means only the figure the GM sets for an SBU; every figure a rep
  or manager enters for themselves is a "plan" — Basheer, 2026-10-09,
  confirmed 2026-10-13
- The menu keeps "Target & Coverage Planning" — Basheer, 2026-10-13;
  confirmed 2026-10-14 (the screen also holds the GM's SBU target)
- The plan form's title becomes "Plan & Coverage — 2026-Q3" ("Revise Plan
  & Coverage — 2026-Q3" when revising): the form holds only the rep's own
  plan, no SBU target — Basheer, 2026-10-14, during the E2E (replaces the
  2026-10-13 choice to keep "Target & Coverage Plan"). Built as a small
  fix, in the end-of-E2E batch.
- The managers' section heading "SBU Target Rollup" becomes "SBU Target &
  Plans" (it holds the GM's SBU target box and the reps' plans) — Basheer,
  2026-10-13. Same heading for Area Managers too, although their list is
  only their team ("SBU Target & Team Plans" considered) — Basheer,
  2026-10-14
- The vendor target on Brand Target Tracking keeps the word "target" (a
  company commitment to a brand, not a rep's figure) — Basheer, 2026-10-13
- User manual and in-app help take the new wording in the already-approved
  User Manual and Help Catch-up plan, not in this one — Basheer, 2026-10-13
- The naming rule is written into the Frontend Standards as a new short
  section, so new screens follow it — Basheer, 2026-10-13
- The Insights Dashboard card keeps the name "Target vs Actuals": its main
  comparison is against the GM's SBU target, and its per-rep rows already
  say "plan" — Basheer, 2026-10-13
- The heading "SBU Target & Plans" stays in the yearly view too, though
  the SBU target box shows only in the quarterly view (code review of
  `25fbeab`) — Basheer, 2026-10-14
- Earlier features' test plans keep their recorded results; each gets a
  note at the top to read "target" as "plan" for a rep's figure when
  re-run (code review of `25fbeab`) — Basheer, 2026-10-14

## 1. In plain terms

On the Target & Coverage Planning screen, a rep's own figure is still called
their "target", while the Target vs Actuals card on the Insights Dashboard
already calls the same figure a "plan". After this change both say "plan".
The word "target" stays only for figures management sets: the GM's SBU
target and the vendor target per brand.

What people will see change — all on Target & Coverage Planning, except
the last row, which is the hospital list of a rep's row on the Insights
Dashboard's Target vs Actuals card:

| Today | After |
|---|---|
| Card heading "My Target" | "My Plan" |
| "No target set for 2026-Q3 yet." | "No plan set for 2026-Q3 yet." |
| "No targets set for 2026-Q3 yet." (manager's list) | "No plans set for 2026-Q3 yet." |
| "SBU Target Rollup" | "SBU Target & Plans" |
| "Approve Shruthi's target?" / "Reject Shruthi's target?" | "Approve Shruthi's plan?" / "Reject Shruthi's plan?" |
| Form total "Target: ₹20.00L" | "Plan total: ₹20.00L" |
| "₹15.00L is ₹5.00L below your approved target of ₹20.00L" | "…below your approved plan of ₹20.00L" |
| "Last approved target:" (plan details) | "Last approved plan:" |
| Hospital row "Last approved target" | "Last approved plan" |

And the messages the server shows when a save is refused:

| Today | After |
|---|---|
| "You can only set a target for your own SBU." | "You can only set a plan for your own SBU." |
| "You already have a target set for 2026-Q3 in this SBU." | "You already have a plan for 2026-Q3 in this SBU." |
| "You can only revise your own target." / "…delete your own target." | "…your own plan." |
| "You aren't authorized to approve or reject this target." | "…this plan." |
| "Brand splits must sum to exactly the target amount" | "…the plan total" |

Nothing is stored differently and no figure changes. Lands on Dev only;
reaches UAT with the combined Target Planning + Target vs Actuals UAT move.

## 2. Build order

1. Screen wording (the first table) and server messages (the second), with
   the tests that check those messages. Full backend tests, type check and
   lint. One commit, shown first for approval. Nothing stops working on Dev
   at any point — wording only.
2. Docs: naming rule in the Frontend Standards; a line in the User Manual
   and Help Catch-up plan; Backlog entry closed; Progress-Archive line.
   Goes in the next docs batch.
3. Quick look on Dev by Basheer: Target & Coverage Planning as a rep (My
   Plan card, plan form total and below-approved message) and as a manager
   (SBU Target & Plans, Approve dialog).

## 3. What could be affected

None — wording only. No data is fetched or saved differently; no screen
requests anything new. The server messages change text only, not when they
appear. Step 3's quick look covers the changed wording.

## 4. Not in this plan (with reasons)

- **Internal names** (table `target_plan`, field `target_amount_lakhs`,
  the screen's internal id, web addresses): renaming them needs a database
  change and an API change for no visible gain.
- **The menu name and form title**: kept, per the decisions above.
- **User manual and in-app help**: one mention today; updated once, in the
  User Manual and Help Catch-up plan, which was waiting on these screens.
- **Target vs Actuals card**: already uses "plan".

## 5. Business rules and records to update

- `docs/Frontend-Implementation-Standards.md`: new short section "Words:
  target vs plan".
- `docs/User-Manual-And-Help-Catchup-Implementation-Plan.md`: one line —
  use "plan" for a rep's figure.
- `docs/Backlog.md`: close "App-wide: a rep's plan is called 'target' on
  Target Planning".
- `docs/Progress-Archive-2026-10.md`: one line when built.
- No business rule changes wording (BR-PL rules already say "plan").

## 6. Technical addendum

- Frontend (`sales-os-app/src/`):
  - `screens/TargetPlanningScreen.tsx` lines 420, 454, 587, 731, 758
  - `components/TargetPlanDialog.tsx` lines 320, 326 (206 unchanged)
  - `components/TargetPlanDetails.tsx` line 36
- Backend `backend/app/domains/planning/service.py` lines 258, 264, 279,
  285, 326, 397, 426, 872.
- Tests that match on the old text:
  - `backend/tests/domains/planning/test_target_plan_service.py` lines 133,
    587, 651, 985
  - `backend/tests/domains/planning/test_target_vs_actual.py` line 237
- Checks: full backend suite, `npx tsc --noEmit`, `npm run lint`.
- Code comments and `types/api.ts` (generated) left as they are.
- Branch `main`. The other session's Target vs Actuals plan docs have
  uncommitted edits; this plan doesn't touch them.
