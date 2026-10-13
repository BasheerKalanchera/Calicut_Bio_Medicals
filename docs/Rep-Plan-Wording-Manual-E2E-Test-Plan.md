<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Rep Plan Wording ("target" → "plan") — Manual E2E Test Plan

**Covers:** `docs/Rep-Plan-Wording-Implementation-Plan.md`.
**Built:** not built yet — commit hash filled in after the build.
**Where:** Dev.

**Nothing is saved.** Every step opens a screen or a dialog and cancels it,
so this plan leaves no records on Dev.

## Checked against live data

Checked read-only on Dev, 2026-10-13, as Admin (Abdul Latheef P), all
three RLS settings set and verified (role Admin, user id set, SBU NULL — Admin
has no SBU by design, migration 0022). Raw output: session scratchpad
`wording_e2e_data_out.txt` (session 4f3836c6).

- **Who sees:** Vivek (Sales Staff, Critical Care) sees his own plans only; Arun Adarsh (Area Manager, Critical Care) sees Vivek's in his team list; Rudrappa (Sales Staff, Imaging) has no 2027-Q1 plan; Haroon Sidheeq (GM) sees every SBU. The SBU target box shows to Admin, GM, SBU Manager and Area Manager, not to Sales Staff (`SBU_TARGET_VIEW_ROLES`).
- **Who can approve:** Vivek → Arun Adarsh; Rudrappa → Shruthi; Basheer K, Arun Adarsh, Nishad K V → Haroon Sidheeq (each person's manager on Dev today).
- **Who can save:** n/a — no step saves; the SBU target "Change" button is shown only to Admin and GM (`SBU_TARGET_EDIT_ROLES`) and is only looked at, not clicked.
- **Existing values:** 2026-Q3: Vivek ₹51.00 Pending Approval (last approved ₹60.00, 1 hospital); Arun ₹50.00 Approved; Basheer K ₹15.00 Rejected (last approved ₹20.00); Rudrappa ₹10.00 Approved. 2027-Q1: Vivek ₹45.00 Rejected (last approved ₹30.00, 3 hospitals); Arun ₹30.00 and Nishad ₹10.00 Pending Approval. SBU targets 2026-Q3: Imaging ₹100.00, Critical Care ₹150.00; none for 2027-Q1.

Button labels, messages and the order of checks are taken from the code
(`TargetPlanningScreen.tsx`, `TargetPlanDialog.tsx`, `TargetPlanDetails.tsx`,
`SbuTargetBox.tsx`, `TargetVsActualsSection.tsx`, `planning/service.py`),
not the design doc.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). No step
saves.

**Server messages** (the six refusals in `planning/service.py`) can't be
reached from the screens — the screens stop those saves first. They are
covered by the backend tests that match on the new text (P3), not by a
browser step.

## Pre-flight

- P1. [Simple] Basheer restarts the Dev backend after the wording commit and confirms it's running. —
- P2. [Simple] Frontend running; a normal window plus a private window, so two people can be signed in at once. —
- P3. [Complex: automated checks] Claude runs `/code-review` on the wording commit, then the full backend pytest, ruff, `npx tsc --noEmit` and `npm run lint`, and reports counts plainly, including any failures that existed before. —
- P4. [Complex: read-only DB check] Claude re-runs the data check just before step 1 and records any difference from the section above. —

## A — A rep's own plan (Target & Coverage Planning)

1. [Simple] As Vivek, open the menu. **Expected:** the menu item still reads "Target & Coverage Planning". Open it, quarter 2026-Q3. **Expected:** the card heading reads "My Plan" (not "My Target"); Critical Care ₹51.00L, Pending Approval. —
2. [Simple] As Vivek, 2026-Q3, click **Revise**. **Expected:** dialog title "Revise Target & Coverage Plan — 2026-Q3" (unchanged); the total line reads "Plan total: ₹51.00L"; the warning reads "₹51.00L is ₹9.00L below your approved plan of ₹60.00L — add hospitals or raise amounts to close the gap. You can still submit; your manager will see both figures." Click **Cancel**. —
3. [Simple] As Vivek, check the screen. **Expected:** no "SBU target for 2026-Q3" box (Sales Staff don't see it — unchanged). —
4. [Simple] As Rudrappa, Target & Coverage Planning, 2027-Q1. **Expected:** Imaging row reads "No plan set for 2027-Q1 yet." with a **Plan** button. Don't click it. —

## B — A manager's view (Target & Coverage Planning)

5. [Simple] As Arun Adarsh, Target & Coverage Planning, 2026-Q3. **Expected:** the team section heading reads "SBU Target & Plans" (not "SBU Target Rollup"); below it "SBU target for 2026-Q3: ₹150.00L" with no **Change** button. —
6. [Simple] As Arun, expand Vivek's row. **Expected:** "Last approved plan: ₹60.00L — this revision is ₹9.00L below it". —
7. [Complex: two dialogs, cancelled each time] As Arun, on Vivek's row click **Approve**. **Expected:** dialog title "Approve Vivek's plan?", line "2026-Q3 · ₹51.00L". **Cancel.** Click **Reject**. **Expected:** "Reject Vivek's plan?". **Cancel.** Vivek's row still Pending Approval. —
8. [Complex: layout shift after the view change] As Arun, switch to the annual view and click **Next fiscal year** until a year with no plans. **Expected:** "No plans set for <that fiscal year> yet." —
9. [Simple] As Haroon Sidheeq, Target & Coverage Planning, 2026-Q3, Imaging. **Expected:** heading "SBU Target & Plans"; "SBU target for 2026-Q3: ₹100.00L" with a **Change** button (don't click it); Basheer K's row Rejected. —

## C — Screens that keep "target"

10. [Simple] As Arun, Insights Dashboard, Critical Care, 2027-Q1. **Expected:** the card title still reads "Target vs Actuals". Expand Vivek's row. **Expected:** his hospital list shows a row "Last approved plan" ₹30.00L (not "Last approved target"). —
11. [Simple] As Haroon, Brand Target Tracking, Critical Care, 2027-Q1. **Expected:** the column still reads "Vendor Target"; the buttons read "Set Target" or "Revise" as before. Don't click them. —
