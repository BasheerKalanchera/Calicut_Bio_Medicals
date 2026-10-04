<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Plan vs Actuals Tracking — Manual E2E Test Plan

**Covers:** `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md`.
**Built:** backend `0f7d75a`, frontend and legacy-plan fix `231fbd0`; code-review fixes (plans shown only within the viewer's scope, "Total (your view)" label, `/zone-rollup` retired) `903ad41` (partial checkpoint); people from another SBU get no row unless they have a plan in the viewed SBU (totals still count them), added during E2E 2026-10-04, pending commit.
**Where:** Dev.

**Won cannot be undone** (Business-Rules: Won and Lost Opportunities are never
reopened). Every Opportunity created or moved to Won below is a permanent
test record on the shared Dev DB. They are all named `PVA test …` so they
can be found later. Nothing else in this plan is irreversible.

## Checked against live data

Checked read-only on Dev, 2026-10-03, with all three RLS settings (user,
role, SBU) set and verified (Admin). Raw output is in the session scratchpad.

**Re-checked 2026-10-04 (same way, read-only, Dev; output in the session scratchpad), which corrects the notes below where they differ:**
- Nishad K V is an **Area Manager** (North Kerala), not Sales Staff. Arun Adarsh's 2026-Q3 plan is APPROVED 50.00; Vivek's 2026-Q3 plan is PENDING 51.00; 2026-Q4 already has Critical Care plans: Arun Adarsh 30.00 and Nishad K V 10.00 (both pending). Imaging has nothing in 2026-Q4.
- Haroon's own 2026-Q2 plans have no SBU on his profile, so only Admin/GM see them. Basheer K (SBU Manager) does not.
- **What each person's scope lets through (plan owners with a submitted plan):** Vivek: himself only. Arun Adarsh: himself and Vivek, not Nishad. Nishad K V: himself only. Fazal: nobody until step S (not Rudrappa). Shruthi: Rudrappa. Rudrappa: himself. Basheer K: Rudrappa. Admin/GM: everyone. Steps R1–R6 use these.
- Steps that look for Haroon's rows, or for Critical Care, are run signed in as Haroon (Basheer K cannot see them).

- **Who sees:** Imaging has Basheer K (SBU Manager), Fazal and Shruthi (Area Managers), Fahad (Marketing User), Rudrappa (Sales Staff); Critical Care has Arun Adarsh and Nishad K V (Area Managers) and Vivek (Sales Staff); Haroon Sidheeq (General Manager) and Abdul Latheef P (Admin) see both SBUs.
- **Who can approve:** every Area Manager reports to Haroon; Rudrappa reports to Shruthi, Vivek to Arun Adarsh, Fahad to Fazal. The approver picker offers the planner's manager chain, to be confirmed at step S5.
- **Who can save:** Won is GM only (Haroon), and the win is credited to the Opportunity owner; the owner picker's choices are to be confirmed at step W1 before any record is created.
- **Existing values:** 2026-Q3 Imaging has one plan, Rudrappa PENDING_APPROVAL total 10.00 with no hospital lines (legacy), and none for Fazal or Shruthi. 2026-Q3 Critical Care has Arun Adarsh APPROVED 50.00 with no hospital lines (legacy) and Vivek PENDING_APPROVAL 50.00 with KIMS Hospital Trivandrum 50.00. 2026-Q2 has Haroon 120.00 (Imaging), Haroon 80.00 and Vivek 65.00 (Critical Care), all APPROVED, no hospital lines. No Opportunity is at Payment Pending; three sit at Order (all Fahad, undated) and six at Negotiation. Three are past their closing date: "Test Gate override oppotunity (renamed for TC-19/22)" (Fahad, 3 Sep), "Activity visibility test" (Haroon, 21 Sep), "New oppotunity fast track" (Fazal, 1 Oct, Aster DM, 25.00, 70%). Critical Care has no late-stage Opportunity. Two Opportunities are Won since 1 Apr, both owned by Basheer K (no plan), closed 3 Oct 2026, 9.00 each at Al Shifa Hospital Perinthalmanna.

Button labels, messages and the order of checks are taken from the code
(`TargetPlanDialog.tsx`, `TargetPlanningScreen.tsx`,
`OpportunityDetailScreen.tsx`, `PlanVsActualSection.tsx`), not the design doc.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

## Pre-flight

- P1. [Simple] Dev backend restarted since the last backend change (scope fix in `planning/repository.py`, `/zone-rollup` removal). —
- P2. [Simple] Frontend running; Basheer signed in as Basheer K (SBU Manager) in one browser, Haroon Sidheeq (GM) available in another. —
- P3. [Simple] Open Insights Dashboard; the "Plan vs Actuals" card shows "This quarter" (2026-Q3). Note the starting figures for Imaging, per person. — Pass 2026-10-04 (as Haroon; card shows 2026-Q3; Imaging Rudrappa 10.00).

## A — Legacy plans (no hospitals): nothing to create

1. [Simple] Insights Dashboard, SBU Imaging, quarter 2026-Q3. **Expected:** Rudrappa row Planned 10.00 (pending plans count). — Pass 2026-10-04.
2. [Complex: expand row, compare three tables] Expand Rudrappa. **Expected:** Brand table total 10.00; Hospital table shows one line "Not assigned to a hospital" 10.00. The By zone table is dashboard-level, not inside the row: it shows "Not in a zone" including this 10.00. — Pass 2026-10-04 (figures matched).
3. [Simple] Signed in as Haroon, switch SBU to Critical Care. **Expected:** Arun Adarsh Planned 50.00 (approved, no hospitals); expanding shows "Not assigned to a hospital" 50.00. Vivek Planned 51.00 (pending); expand and record his hospital lines (KIMS Hospital Trivandrum is known). Basheer K (SBU Manager, Imaging) must NOT appear: he belongs to Imaging and has no plan in Critical Care (he is only linked to a Dev test Opportunity, "Test +lead screen"). People from another SBU get no row unless they have a plan in the viewed SBU (decided 2026-10-04; their wins still count in the totals). A Critical Care person with no plan would still show, at Planned 0.00 with "No submitted plan for this quarter." in the expanded row (covered by unit tests; no such person exists on Dev now). — Pass 2026-10-04: Arun 50.00, "Not assigned to a hospital" 50.00 (EDAN 25, Magnamed 25); Vivek 51.00, KIMS Hospital Trivandrum 51.00 (EDAN 20, ELECTROSCIENCE 31); Basheer K row gone after the first (wrong) no-plan-no-row change (Basheer confirmed on screen 2026-10-04); **re-check after the corrected "other SBU" rule, pending.**

## S — Setup: proper hospital-wise plans

Basheer clicks, Claude watches. Planner: Fazal (Imaging Area Manager, no plan yet).

1. [Simple] Sign in as Fazal. Target Planning, "My Target", Imaging 2026-Q3, click "Plan". **Expected:** dialog titled "Target & Coverage Plan — 2026-Q3". —
2. [Complex: hospital picker scope unknown] In "Search to add a hospital from your area" add Aster DM and Aster MIMS Calicut. **Expected:** both offered; if either is not, record which hospitals Fazal can pick and substitute them (the Won steps follow the substitutes). —
3. [Simple] Set "Amount (₹ Lakhs)": Aster DM 20, Aster MIMS Calicut 10; fill the brand split to total 30. **Expected:** no "Add … more before submitting." message. —
4. [Simple] Click "Submit for approval". **Expected:** plan listed as pending, no "Needs Brand Split" chip. —
5. [Complex: cross-role] As Haroon, Target Planning, "Needs Your Approval", click "Approve" on Fazal's 30.00 plan. **Expected:** status Approved. —
6. [Simple] Insights Dashboard, Imaging 2026-Q3. **Expected:** Fazal Planned 30.00; Hospital table Aster DM 20.00 and Aster MIMS Calicut 10.00, Won 0.00; Brand total 30.00. —
7. [Simple] Repeat for Critical Care 2026-Q3: sign in as Nishad K V (Area Manager; his 2026-Q4 plan of 10.00 is a different quarter and stays), plan one hospital for 10, submit; Haroon approves. **Expected:** Nishad Planned 10.00 for 2026-Q3 (checked as Haroon). —

## W — Actuals: Opportunities moved to Won

Test Opportunities (permanent once Won): `PVA test planned`, `PVA test unplanned`, `PVA test other person`.

1. [Simple] Create `PVA test planned` at Aster DM, owner Fazal, value 8. **Expected:** saved. If Fazal is not offered as owner, stop and record the picker's choices. —
2. [Simple] Create `PVA test unplanned` at a hospital Fazal did not plan (e.g. Al Shifa Hospital Perinthalmanna), owner Fazal, value 5. —
3. [Simple] Create `PVA test other person` at Aster DM, owner Shruthi (no plan), value 4. —
4. [Complex: multi-step, stage gate] For each of the three: open the Opportunity, "Edit Opportunity", set Stage to Payment Pending, save. **Expected:** stage shows Payment Pending; Status "Won" stays disabled ("— save at Payment Pending first") until saved at that stage. —
5. [Complex: Expected figure] Insights Dashboard before any Won. **Expected:** Fazal's Expected includes the three test Opportunities weighted by win probability, plus "New oppotunity fast track" (25 × 70% = 17.50 if still Negotiation). Likely finish = Won + Expected. —
6. [Complex: cross-role, irreversible] As Haroon: open `PVA test planned`, "Edit Opportunity", Status Won, tick "I confirm full payment has been received *", Payment Note "PVA E2E", save. **Expected:** Opportunity Won. —
7. [Simple] Insights Dashboard Imaging 2026-Q3. **Expected:** Fazal Won 8.00; Aster DM line Won 8.00 against Planned 20.00; Aster DM's zone row Won 8.00; Company total Won up by 8.00. —
8. [Complex: irreversible] As Haroon mark `PVA test unplanned` Won the same way. **Expected:** Fazal's hospital table gains line "Unplanned" (Planned 0, Won 5.00); Fazal's Won 13.00. —
9. [Complex: irreversible] As Haroon mark `PVA test other person` Won. **Expected:** Shruthi appears with Planned 0.00, Won 4.00 and an "Unplanned" line; Fazal's figures unchanged. —
10. [Simple] Compare the "Won so far" tile with the sum of the person rows. **Expected:** equal; Likely finish and "% of plan" updated. —

## C — Closed outside the quarter

1. [Simple] Previous quarter view (2026-Q2) after step W10. **Expected:** none of the three `PVA test` wins appear there (they closed in 2026-Q3); the two 3 Oct wins by Basheer K do not appear either. A back-dated close would need a database edit and is not part of this plan. —

## L — Late Opportunities

1. [Complex: expand row] Imaging 2026-Q3, expand Fazal. **Expected:** "Closing date passed" lists "New oppotunity fast track" (closing 1 Oct 2026). —
2. [Simple] Signed in as Haroon (Basheer K cannot see his row), expand Haroon's row. **Expected:** "Closing date passed" lists "Activity visibility test"; undated Opportunities show an "open Opportunities have no …" note. —

## E — Previous and upcoming quarter

1. [Simple] Signed in as Haroon, click the "Previous quarter" arrow (2026-Q2). **Expected:** chip "Past quarter"; Expected column shows "—"; Haroon Planned 120.00 (Imaging). —
2. [Simple] Signed in as Haroon, click the "Next quarter" arrow until 2026-Q4. **Expected:** chip "Upcoming quarter"; Imaging shows "Nothing planned or won for this quarter."; Critical Care shows Arun Adarsh 30.00 and Nishad K V 10.00. —

## R — Role scope (read-only)

Colleagues outside a person's scope are hidden entirely (plan and actuals),
even though they plan in the same SBU. Run after step S.

1. [Complex: cross-role, hide check] Sign in as Fazal, Imaging 2026-Q3. **Expected:** only Fazal's own row; Rudrappa's pending 10.00 plan does not appear; total label "Total (your view)", total equals Fazal's row. —
2. [Complex: cross-role, hide check] Sales Executive: sign in as Vivek (Critical Care Sales Staff), Critical Care 2026-Q3. **Expected:** only Vivek's own row (Planned 51.00); Arun Adarsh's approved 50.00 plan does not appear; label "Total (your view)"; no Imaging data and no SBU switch to Imaging. —
3. [Complex: cross-role, hide check] Sign in as Arun Adarsh, Critical Care 2026-Q4. **Expected:** only Arun's own 30.00; Nishad's 10.00 does not appear. Then 2026-Q3: Arun and Vivek both shown, not Nishad. —
4. [Complex: cross-role] Sign in as Basheer K (SBU Manager), Imaging 2026-Q3. **Expected:** Rudrappa, Fazal and Shruthi's rows visible; label "Total (your view)"; 2026-Q2 does not show Haroon's 120.00 plan. —
5. [Simple] Sign in as Haroon. **Expected:** both SBUs selectable, all people visible including Haroon's Q2 plans; label "Company total". —
6. [Simple] Sign in as Rudrappa (Imaging Sales Staff), Imaging 2026-Q3. **Expected:** own row only, label "Total (your view)". (No colleague plan exists in this quarter, so this is a confirm, not a hide check.) —

## Close-out

- Record Pass/Fail beside each step as it completes.
- List the test Opportunities left on Dev in Progress-Archive.
- Scorecard row moves to Done only when every step above is checked off.
