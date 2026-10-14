<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Rep Plan Wording ("target" → "plan") — Manual E2E Test Plan

**Covers:** `docs/Rep-Plan-Wording-Implementation-Plan.md`.
**Built:** `25fbeab` (2026-10-14); review and E2E fixes `af4b4e9`
(2026-10-14). **Result:** P1–P4 and steps 1–12 all Pass on Dev, 2026-10-14.
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

- P1. [Simple] Basheer restarts the Dev backend after the wording commit and confirms it's running. — **Pass** 2026-10-14 (restarted after the uncommitted review fixes too).
- P2. [Simple] Frontend running; a normal window plus a private window, so two people can be signed in at once. —
- P3. [Complex: automated checks] Claude runs `/code-review` on the wording commit, then the full backend pytest, ruff, `npx tsc --noEmit` and `npm run lint`, and reports counts plainly, including any failures that existed before. — **Pass** 2026-10-14: review of `25fbeab` found 7; 1 fixed in docs (plan status), 3 fixed in code (not-found message, Audit Log filter, comments — uncommitted, step 12 added), 1 handled by a note on 4 older test plans, 2 left by decision (yearly heading; server-side row label). After the fixes: pytest 1231 passed, ruff clean, tsc clean, lint 0 errors (186 warnings, all pre-existing).
- P4. [Complex: read-only DB check] Claude re-runs the data check just before step 1 and records any difference from the section above. — **Pass** 2026-10-14: re-run as Admin (all three settings checked), output identical to 2026-10-13 (session scratchpad `wording_e2e_data_out.txt`, session 2fd0f9cf).

## A — A rep's own plan (Target & Coverage Planning)

1. [Simple] As Vivek, open the menu. **Expected:** the menu item still reads "Target & Coverage Planning". Open it, quarter 2026-Q3. **Expected:** the card heading reads "My Plan" (not "My Target"); Critical Care ₹51.00L, Pending Approval. — **Pass** 2026-10-14 (Basheer).
2. [Simple] As Vivek, 2026-Q3, click **Revise**. **Expected:** dialog title "Revise Plan & Coverage — 2026-Q3" (changed 2026-10-14, small fix, uncommitted until the end-of-E2E batch); the total line reads "Plan total: ₹51.00L"; the warning reads "₹51.00L is ₹9.00L below your approved plan of ₹60.00L — add hospitals or raise amounts to close the gap. You can still submit; your manager will see both figures." Click **Cancel**. — **Pass** 2026-10-14 (Basheer), on the new title. Basheer asked during this step for "Target" to leave the form's title (the form holds no SBU target); changed and re-checked.
3. [Simple] As Vivek, check the screen. **Expected:** no "SBU target for 2026-Q3" box (Sales Staff don't see it — unchanged). — **Pass** 2026-10-14 (Basheer).
4. [Simple] As Rudrappa, Target & Coverage Planning, 2027-Q1. **Expected:** Imaging row reads "No plan set for 2027-Q1 yet." with a **Plan** button. Don't click it. — **Pass** 2026-10-14 (Basheer).

## B — A manager's view (Target & Coverage Planning)

5. [Simple] As Arun Adarsh, Target & Coverage Planning, 2026-Q3. **Expected:** the team section heading reads "SBU Target & Plans" (not "SBU Target Rollup"); below it "SBU target for 2026-Q3: ₹150.00L" with no **Change** button. — **Pass** 2026-10-14 (Basheer).
6. [Simple] As Arun, expand Vivek's row. **Expected:** "Last approved plan: ₹60.00L — this revision is ₹9.00L below it". — **Pass** 2026-10-14 (Basheer).
7. [Complex: two dialogs, cancelled each time] As Arun, on Vivek's row click **Approve**. **Expected:** dialog title "Approve Vivek's plan?", line "2026-Q3 · ₹51.00L". **Cancel.** Click **Reject**. **Expected:** "Reject Vivek's plan?". **Cancel.** Vivek's row still Pending Approval. — **Pass** 2026-10-14 (Basheer ran it himself, by his choice; nothing saved).
8. [Complex: layout shift after the view change] As Arun, switch to the annual view and click **Next fiscal year** until a year with no plans. **Expected:** "No plans set for <that fiscal year> yet." — **Pass** 2026-10-14 (Basheer ran it himself). Note: the SBU target line shows only in the Quarterly view (by design), which briefly looked like a missing line for Area Managers.
9. [Simple] As Haroon Sidheeq, Target & Coverage Planning, 2026-Q3, Imaging. **Expected:** heading "SBU Target & Plans"; "SBU target for 2026-Q3: ₹100.00L" with a **Change** button (don't click it); Basheer K's row Rejected. — **Pass** 2026-10-14 (Basheer).

## C — Screens that keep "target"

10. [Simple] As Arun, Insights Dashboard, 2027-Q1 (Critical Care is his only SBU, so there is no SBU choice). **Expected:** the card title still reads "Target vs Actuals". Expand Vivek's row. **Expected:** his hospital list shows a row "Last approved plan" ₹30.00L (not "Last approved target"). — **Pass** 2026-10-14 (Basheer; step text corrected: Arun has no SBU choice).
11. [Simple] As Haroon, Brand Target Tracking, Critical Care, 2027-Q1. **Expected:** the column still reads "Vendor Target"; the buttons read "Set Target" or "Revise" as before. Don't click them. — **Pass** 2026-10-14 (Basheer).

## D — Audit Log (code review fix, uncommitted until the end-of-E2E batch)

12. [Simple] As Haroon, Audit Log. Open the table filter (shows "All Tables"). **Expected:** the list has "Plan", "Plan Hospital" and "Plan Brand Split", and no "Target Plan". Close the list without changing anything. — **Pass** 2026-10-14 (Basheer; run before step 10, as he was already signed in as Haroon).
