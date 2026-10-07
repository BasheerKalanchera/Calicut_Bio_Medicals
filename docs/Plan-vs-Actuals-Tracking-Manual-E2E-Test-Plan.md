<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Target vs Actuals — Manual E2E Test Plan

**Covers:** `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` (Target vs Actuals card, PO date gates, split credit BR-FIN-09 = step 6b) and `docs/Target-Coverage-Roster-Implementation-Plan.md` (Target Planning team list, step 6), plus a re-run of `docs/Hospital-Wise-Target-Planning-Manual-E2E-Test-Plan.md` (38 steps, section K).
**Built:** `0f7d75a`, `231fbd0`, `903ad41`, step 6 roster commits, `2e2e4c0` (split credit + review fixes). This plan replaces the earlier run (2026-10-03/04, stopped); that run's notes are in Progress-Archive-2026-10.
**Where:** Dev.

**Quarters used:** sections A–J run in **2026-Q3 (Oct–Dec 2026)**, the current quarter, because actuals (wins, PO dates, late Opportunities) only exist there. Section K runs in **2027-Q1 (Apr–Jun 2027)**, the first quarter with no plans at all, so its new plans don't disturb the totals A–J check. 2026-Q4 (Jan–Mar 2027) already has plans.

**Permanent records this plan leaves on Dev (approved by Basheer, 2026-10-07):**
SBU targets 2026-Q3, Imaging ₹100L and Critical Care ₹150L (can be changed later, not deleted); Fahad's "Test opportunity" (EMS Hospital, ₹1L) becomes Won (Won is never reopened); Basheer K's 2026-Q3 Al Shifa plan ₹20L with a rejected revision to ₹15L; Rudrappa's 2026-Q3 plan approved by Shruthi; "New USG m/c" gets the past closing date 2026-10-01; section K's 2027-Q1 plans, ratings and notes.

## Checked against live data

Read-only on Dev, 2026-10-07 13:46 UTC, as Admin, with all three RLS settings (user, role, SBU) set and verified; every count matched the admin connection. Raw output: session scratchpad `e2e_data2_out.txt` (session 1e7c86e6).

- **Who sees:** Imaging: Basheer K (SBU Manager), Fazal and Shruthi (Area Managers), Fahad (Marketing User), Rudrappa (Sales Staff). Critical Care: Arun Adarsh and Nishad K V (Area Managers), Vivek (Sales Staff). Haroon Sidheeq (GM, no SBU) and Abdul Latheef P (Admin) see both SBUs. Scope: Arun sees Arun + Vivek; Fazal sees Fazal + Fahad; Shruthi sees Shruthi + Rudrappa; Basheer K sees all of Imaging except Haroon's row; Nishad, Vivek, Rudrappa and Fahad see only themselves. The SBU target box is refused below SBU Manager ("Only SBU Managers and above may see SBU targets.").
- **Who can approve:** a plan goes to the planner's own manager: Rudrappa → Shruthi, Vivek → Arun, Fahad → Fazal; Basheer K, Fazal, Shruthi, Arun and Nishad → Haroon. Only that manager gets the Approve/Reject buttons (found in the Hospital-Wise run, 2026-10-01).
- **Who can save:** SBU targets: Admin or GM. Stage moves: the Opportunity owner (Fahad for "Test opportunity"). Won: GM (Haroon). A user's SBU and manager: Admin. Changing a user's SBU clears a manager from the other SBU (must be re-picked); zones are kept.
- **Existing values:** as read on 2026-10-07:
  - Plans exist only in 2026-Q2, Q3 and Q4. **2026-Q3:** Imaging: Rudrappa PENDING ₹10 (no hospitals). Critical Care: Arun APPROVED ₹50 (no hospitals); Vivek PENDING ₹51 (was ₹60 approved; KIMS Hospital Trivandrum). **2026-Q4:** Arun PENDING ₹30, Nishad PENDING ₹10, Vivek REJECTED ₹45 (counts ₹30). **2026-Q2:** Haroon ₹120 Imaging and ₹80 Critical Care, Vivek ₹65 Critical Care, all approved. **2027-Q1:** empty for everyone. No SBU targets set. No former team members.
  - **Imaging 2026-Q3 as Admin:** Planned 10.00, PO received 0, Won 18.00 (Basheer K: 2 × ₹9 at Al Shifa Hospital Perinthalmanna, PO-TEST-1703/1704, closed 2026-10-03, no PO date), Expected 66.50, Likely finish 84.50, "5 of 6 haven't submitted". As Basheer K: 4 of 5, Expected 31.50, Likely 49.50.
  - **Past closing date:** Fahad "Test Gate override oppotunity (renamed for TC-19/22)" (Maulana, due 2026-09-03, 20.00); Fazal "New oppotunity fast track" (Aster DM, 2026-10-01, 25.00); Haroon "Activity visibility test" (Aster DM, 2026-09-21, 50.00).
  - **At Order:** Fahad's "Test opportunity" (EMS Hospital, ₹1.00, 90 %, no PO number or date). Nothing is at Payment Pending.
  - **Splits:** "New USG m/c" (Qualified, no closing date): Basheer K 50 / Vivek 50; the owner Fazal is not in the split; Vivek's home SBU is Critical Care.
  - **Annual FY 2026-27, Critical Care, as Admin:** ₹316 (Vivek 146, Arun 80, Haroon 80, Nishad 10); Arun's view 226; Vivek's view 146.
  - **Hospital pickers:** Basheer K's offers Al Shifa (Hospital-Wise step 35, 2026-10-01). Vivek's area holds exactly KIMS Hospital Trivandrum, Test hospital 2 and Test hospital 3 (re-filed 2026-09-30); Rudrappa's holds none. Ratings: KIMS High, Test hospital 2 Medium, Test hospital 3 Low, aster medicity Not rated.

Button labels, messages and the order of checks are taken from the code (`TargetVsActualsSection.tsx`, `SbuTargetBox.tsx`, `TargetPlanningScreen.tsx`, `TargetPlanDialog.tsx`, `OpportunityDetailScreen.tsx`, `opportunity/validators.py`, `planning/service.py`), not the design doc. Money shows as "₹18.0L" on the card and as "₹18.00L" in the plan dialog.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value; Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift, multi-step, cross-screen/cross-role, or a genuine visual check). Saves to Dev are "Basheer clicks, Claude watches": Claude reads the record back through the app in the tester's session.

## Pre-flight

- P1. [Simple] Basheer restarts the Dev backend (after `2e2e4c0`) and confirms it's running. —
- P2. [Simple] Frontend running; a normal window plus a private window, for two people at once. —
- P3. [Complex: read-only DB check] Claude re-runs the scope and data check just before step A1 and records any difference from the section above. —

## A — The card, as Admin (Imaging, 2026-Q3)

1. [Simple] Insights Dashboard, SBU Imaging. **Expected:** chip "Current quarter · as of <today>"; tiles Planned ₹10.0L, PO received ₹0.0L, Won (paid) ₹18.0L "180% of planned", Expected this quarter ₹66.5L, Likely finish ₹84.5L. —
2. [Simple] **Expected:** "5 of 6 haven't submitted a plan"; rows Basheer K, Fahad, Fazal, Haroon, Rudrappa, Shruthi; no Critical Care person. —
3. [Simple] **Expected:** "Against SBU target": SBU row "Target not set", planned ₹10.0L, won ₹18.0L; Company row "Waits for every SBU's target", planned ₹111.0L. —
4. [Complex: expand row, read notes] Expand Basheer K. **Expected:** hospital line "Unplanned", Won ₹18.0L (brand SonoScape); note "2 Opportunities past Order have no PO date, so …"; note "… open Opportunities have no expected closure date, so they aren't counted in Expected." —
5. [Complex: expand rows] Expand Fahad, Fazal, Haroon. **Expected:** each has the badge "1 past closing date" and the late line: "Test Gate override oppotunity (renamed for TC-19/22) — Maulana … (was due 2026-09-03)" ₹20.0L; "New oppotunity fast track — Aster DM … (was due 2026-10-01)" ₹25.0L; "Activity visibility test — Aster DM … (was due 2026-09-21)" ₹50.0L. None says "shared". —
6. [Simple] Expand Rudrappa, then Shruthi. **Expected:** Rudrappa Planned ₹10.0L (pending); Shruthi "No plan started for this quarter." —
7. [Simple] "By zone". **Expected:** North Kerala Won ₹18.0L; "Not in a zone" Planned ₹10.0L; footer "SBU total". —

## B — Target Planning matches the card

1. [Complex: cross-screen comparison] Target & Coverage Planning, Imaging 2026-Q3, as Admin. **Expected:** the same six people as A2; "Total: ₹10.0L · 5 of 6 haven't submitted"; Rudrappa Pending Approval; the other five "Not started". —
2. [Complex: cross-screen comparison] Switch both screens to Critical Care 2026-Q3. **Expected:** total ₹101; "2 of 4 haven't submitted"; Arun Approved ₹50; Vivek Pending ₹51 with "was ₹60.0L approved"; the card shows the same people and Planned ₹101.0L. —

## C — Past and upcoming quarters, rejected revision

1. [Simple] Card, Critical Care, "Previous quarter" arrow (2026-Q2). **Expected:** chip "Past quarter"; Expected shows "—"; Planned ₹145.0L; "2 of 4 haven't submitted"; Company row planned ₹265.0L. —
2. [Simple] "Next quarter" arrow to 2026-Q4. **Expected:** chip "Upcoming quarter"; Planned ₹70.0L; "1 of 4 haven't submitted"; Vivek ₹30.0L with "₹30.0L approved still counts"; expanded: "Revision was sent back. The last approved target (₹30.0L) still counts until a new one is approved." —
3. [Simple] Target Planning, Critical Care 2026-Q4. **Expected:** total ₹70; Vivek Rejected with "₹30.0L approved still counts". —

## D — SBU targets (Basheer clicks, Claude watches)

1. [Simple] As Haroon, card, Imaging 2026-Q3. **Expected:** "SBU target for 2026-Q3: Not set", button "Set target", caption "Set by the GM. Target vs Actuals measures the SBU's Won against it." —
2. [Simple] "Set target", type -5 in "₹ Lakhs", Save. **Expected:** "Enter 0 or more"; nothing saved. —
3. [Simple] Type 100, Save. **Expected:** box shows ₹100.0L and a "Change" button; SBU row target ₹100.0L; Company row still "Waits for every SBU's target". —
4. [Simple] Switch to Critical Care, set 150. **Expected:** Company row target ₹250.0L. —
5. [Simple] As Basheer K, Imaging. **Expected:** box shows ₹100.0L with no "Set target"/"Change" button. —
6. [Complex: cross-role, hide check] As Fazal (Imaging), then as Arun (Critical Care). **Expected:** no SBU target box, no SBU or Company target row. —

## E — Plan → approval → actuals (Basheer clicks, Claude watches)

1. [Complex: cross-role] As Shruthi, Target Planning, Imaging 2026-Q3, "Needs Your Approval": Approve Rudrappa's ₹10. **Expected:** Approved; card still Planned ₹10.0L. —
2. [Simple] As Basheer K, Imaging 2026-Q3, "Plan": add Al Shifa Hospital Perinthalmanna ₹20, brand split ₹20, "Save draft". **Expected:** Draft. —
3. [Complex: cross-role, hide check] As Haroon. **Expected:** Target Planning shows Basheer K "Draft" with the amount "—"; card Planned still ₹10.0L; Basheer K's expanded row: "Plan is still a draft. Its figures show once it's submitted." —
4. [Simple] As Basheer K, "Submit for approval". **Expected:** Pending Approval. —
5. [Complex: cross-role] As Haroon, Approve. **Expected:** card Planned ₹30.0L, Won ₹18.0L "60% of planned"; "4 of 6 haven't submitted"; Basheer K's hospital table: Al Shifa Planned ₹20.0L, Won ₹18.0L, no "Unplanned" line. —
6. [Simple] As Basheer K, "Revise": Al Shifa ₹15, brand ₹15. **Expected:** "₹15.00L is ₹5.00L below your approved target of ₹20.00L … You can still submit". Note "E2E revision", Submit. —
7. [Simple] Card as Haroon. **Expected:** Basheer K ₹15.0L with "was ₹20.0L approved"; Planned ₹25.0L. —
8. [Complex: cross-role] As Haroon, Reject with note "E2E reject". **Expected:** Basheer K ₹20.0L with "₹20.0L approved still counts"; expanded: "Revision was sent back. The last approved target (₹20.0L) still counts until a new one is approved."; Planned back to ₹30.0L; Target Planning shows the same. —

## F — PO date gates and PO received (Fahad's "Test opportunity", EMS Hospital, ₹1L)

Fahad moves the stages; Haroon marks it Won. Basheer clicks, Claude watches.

1. [Simple] As Fahad, "Edit Opportunity", Stage → Delivery & Installation, PO number and PO date empty, save. **Expected:** "PO Date is required to advance to Delivery & Installation stage"; nothing saved. —
2. [Complex: server-only check] PO date today, PO number still empty, save. **Expected:** the server refuses: "PO Number is required to advance to Delivery & Installation stage."; nothing saved. —
3. [Simple] PO number "PO-E2E-1007", PO date tomorrow, save. **Expected:** "PO Date can't be in the future". —
4. [Simple] PO date today, save. **Expected:** stage Delivery & Installation; card as Admin: PO received ₹1.0L. —
5. [Simple] Stage → Payment Pending, save. **Expected:** saved. —
6. [Complex: server-only check] Empty the PO date, save at Payment Pending. **Expected:** "PO Date can't be removed once the Opportunity is past the Order stage."; after a reload the PO date is still there. —
7. [Complex: cross-role] As Haroon: Status Won, empty the PO date, save. **Expected:** refused before saving: "PO Date is required to mark an opportunity as Won". —
8. [Simple] Restore the PO date, Status Won, payment tick off, save. **Expected:** "Confirm that full payment has been received to mark this Opportunity as Won". —
9. [Complex: irreversible] Tick "I confirm full payment has been received *", save. **Expected:** Won. Card: Fahad Won ₹1.0L; headline Won ₹19.0L; SBU row won ₹19.0L. —

## G — Shared Opportunity past its closing date ("New USG m/c")

1. [Complex: read before/after] Claude records the Expected for Basheer K and Fazal and the Imaging headline. As Basheer K, set "New USG m/c" Expected Closure Date to 2026-10-01, save (Basheer clicks, Claude watches). —
2. [Complex: expand rows] Card as Admin, Imaging. **Expected:** Basheer K: "New USG m/c — <account> (was due 2026-10-01) · shared, owner Fazal, 50%" at his 50 % share; Fazal: the same line "· shared, 0%" at ₹0.0L. Basheer K's Expected rises by his share; the headline by the full weighted value. —
3. [Complex: cross-role, hide check] Critical Care card as Admin, then as Vivek. **Expected:** "New USG m/c" is not listed. —
4. [Simple] As Fazal, Imaging. **Expected:** the roster line ends "· Totals show only your team members' shares of shared Opportunities". —

## H — Former team member (Rudrappa, moved and moved back)

1. [Complex: admin change] As Admin, User Directory: Rudrappa's SBU → Critical Care, manager Arun Adarsh, save (Basheer clicks, Claude watches). —
2. [Simple] Target Planning, Imaging 2026-Q3. **Expected:** Rudrappa under "No longer on this team — their plans still count in the total", Approved ₹10; total unchanged; the count is now over 5 people. —
3. [Simple] Card, Imaging, then Critical Care. **Expected:** Imaging: no Rudrappa row, Planned unchanged, "… of 5 haven't submitted". Critical Care: Rudrappa listed with "No plan started for this quarter."; "3 of 5 haven't submitted". —
4. [Complex: admin change] Move him back: SBU Imaging, re-pick manager Shruthi, save. **Expected:** A2's six rows return; Shruthi's view shows Rudrappa again. —

## I — Annual view

1. [Simple] Target Planning, Annual, FY 2026-27, Critical Care, as Admin. **Expected:** "Total: ₹316 across 4 reps for FY 2026-27" (format as shown on screen); Annual Total Vivek ₹146, Arun ₹80, Haroon ₹80, Nishad ₹10. —
2. [Complex: cross-role] As Arun: total ₹226. As Vivek: ₹146. —

## J — Hide checks (read-only, Imaging/Critical Care 2026-Q3)

1. [Complex: cross-role, hide check] Rudrappa. **Expected:** only his own row; "Total (your view)"; no SBU target box. —
2. [Complex: cross-role, hide check] Fahad. **Expected:** only Fahad. —
3. [Complex: cross-role, hide check] Shruthi. **Expected:** Shruthi + Rudrappa; not Fazal, Fahad or Basheer K. —
4. [Complex: cross-role, hide check] Vivek, Critical Care. **Expected:** only Vivek; no Imaging card; "New USG m/c" not listed. —
5. [Complex: cross-role, hide check] Basheer K, Imaging. **Expected:** no Haroon row; SBU row still SBU-wide. —
6. [Complex: cross-role, hide check] Arun. **Expected:** Arun + Vivek; not Nishad. —

## K — Hospital-Wise Target Planning re-run (quarter 2027-Q1, Apr–Jun 2027)

Steps 1–38 follow `docs/Hospital-Wise-Target-Planning-Manual-E2E-Test-Plan.md`, adapted: quarter 2027-Q1; hospitals are already re-filed and rated, so the rating steps use aster medicity and rating changes; step 12 reflects the team list (step 6); step 27 runs with both windows as Arun (only the rep's own manager gets the buttons); step 30 checks an older plan read-only; messages are today's wording. Step 39 links back to the card.

### Rate Hospitals (as Haroon)

1. [Simple] Open **Rate Hospitals**. **Expected:** filtered to "Not rated yet"; aster medicity listed, KIMS not (already High); each row has a rating, a note box and a greyed-out **Save**. —
2. [Simple] On aster medicity pick **High**, don't Save; change the filter to "All ratings" and back. **Expected:** still Not rated. —
3. [Simple] Pick **Medium**, note "E2E rating", **Save**. **Expected:** leaves "Not rated yet"; filter Medium shows it with the note. —
4. [Simple] Change Test hospital 3 to **Medium**, Save; then back to **Low**, Save. **Expected:** Low. —
5. [Simple] On KIMS change only the note to "ICU expansion planned (E2E)", Save. **Expected:** filter High shows KIMS with the new note. —

### Who sees ratings and notes

6. [Simple] As Haroon, KIMS's customer page. **Expected:** **High** chip and the note. —
7. [Simple] As Vivek: no **Rate Hospitals** in the menu; KIMS's page shows **High** but no note. —
8. [Complex: direct API call] Vivek's session: `PATCH /accounts/{KIMS}/business-potential` with KIMS's current values → **403** "Only Admin/GM may rate a hospital's Business Potential." (Basheer pastes it in the console). —

### Vivek's draft

9. [Simple] As Vivek, **Target & Coverage Planning**, quarter **2027-Q1**. **Expected:** no target; a **Plan** button. —
10. [Simple] **Plan**, open the hospital picker. **Expected:** only KIMS, Test hospital 2 and Test hospital 3, each with its rating chip; "Al Shifa" and "aster medicity" find nothing. —
11. [Simple] Add all three at **₹0**. **Expected:** KIMS a red warning, Test hospital 2 and 3 yellow; total ₹0.00L. **Save draft** → Draft. —
12. [Complex: cross-role, hide check] As Arun, 2027-Q1. **Expected:** Vivek's plan not in Needs Your Approval; the team list shows Vivek "Draft" with the amount "—" and no hospitals. —

### Submit (as Vivek)

13. [Simple] Reopen the draft: KIMS **₹30** (Weekly, objective Demo new ventilator), Test hospital 2 **₹15** (Monthly), Test hospital 3 **₹0** (Quarterly). **Expected:** total ₹45.00L; KIMS's red warning goes; Test hospital 3's yellow stays; no change-note box. —
14. [Simple] Brand split **EDAN ₹40**, **Submit for approval**. **Expected:** blocked: "Your brand amounts add up to ₹40.00L, but the plan total is now ₹45.00L. Add ₹5.00L more before submitting." EDAN **₹45**, Submit → **Pending Approval**. —

### Same-SBU overlap

15. [Simple] As Arun, 2027-Q1, **Plan**: KIMS **₹20**, aster medicity **₹10**. **Expected:** a warning on KIMS naming Vivek. EDAN ₹30, Submit → Pending Approval (warning doesn't block). —
16. [Simple] As Nishad, 2027-Q1, **Plan**: Al Shifa Hospital Perinthalmanna **₹10**, EDAN ₹10, Submit → Pending Approval. —
17. [Complex: direct API call] `GET /planning/targets/overlaps` for Al Shifa, Critical Care, 2027-Q1 in Vivek's, Arun's and Haroon's sessions. **Expected:** Vivek and Arun empty; Haroon one `SAME_SBU_OVERLAP` naming Nishad K V. —

### First approval (as Arun)

18. [Simple] Needs Your Approval: Vivek 2027-Q1 ₹45, 3 hospitals, no "Revised". Expand: hospitals with ratings, visit frequencies, amounts, "EDAN ₹45"; no change note. —
19. [Simple] **Approve**. As Vivek: Approved. —

### Revising below the approved total (as Vivek)

20. [Simple] **Revise**: remove Test hospital 2. **Expected:** total ₹30.00L; "₹30.00L is ₹15.00L below your approved target of ₹45.00L … You can still submit". EDAN ₹30, note "Lost Test hospital 2 to a competitor", Submit → Pending Approval. —
21. [Simple] As Arun: **Revised**, 2 hospitals; expanded: "Why it changed: Lost Test hospital 2…" and "Last approved target: ₹45.00L — this revision is ₹15.00L below it". —

### Plan changed while the manager was reviewing (normal window Arun, private window Vivek)

22. [Complex: two windows] Arun: **Approve** on Vivek's plan; leave the dialog open. —
23. [Complex: two windows] Vivek: **Revise**, change only KIMS's objective to Demo and training; Submit with the note empty → "Please add a short note saying why the plan changed."; note "Objective updated", Submit. —
24. [Complex: two windows] Arun: **Approve** in the open dialog. **Expected:** dialog closes; "The rep changed this plan while you were reviewing it. Please check the latest version below and review again."; row shows "Objective updated"; still Pending Approval. —
25. [Simple] Arun: **Approve** again. **Expected:** Approved; expanded "Last change (approved): Objective updated"; no "Last approved target" line. —

### Plan already decided (both windows Arun)

26. [Simple] Vivek: **Revise**, add Test hospital 2 back at ₹15 (total ₹45), EDAN ₹45, note "Won Test hospital 2 back", Submit. —
27. [Complex: two windows] Private window (Arun): **Approve**, leave the dialog open. Normal window (Arun): **Reject**, note "Recheck TH2 amount". —
28. [Complex: two windows] Private window: **Approve**. **Expected:** dialog closes; "This plan is no longer waiting for approval — it has already been decided. Please check the latest version below."; Vivek's plan stays Rejected. —
29. [Simple] Arun's team list, expanded: "Last change (rejected): Won Test hospital 2 back"; "Last approved target: ₹30.00L" still shown. —

### Older plan without hospitals (read-only)

30. [Simple] As Arun, quarter **2026-Q3**: his Approved ₹50 plan (no hospitals) shows normally. **Revise**: Submit is blocked until a hospital is added. **Cancel** — don't save (a revision here would change section B's totals). —

### Server guards (Vivek's session; Basheer pastes, Claude watches; all refused)

31. [Complex: direct API call] `POST /planning/targets` for Imaging, 2027-Q1, KIMS ₹1 → **403** "You can only set a target for your own SBU."; nothing created. —
32. [Complex: direct API call] `PATCH` Vivek's 2027-Q1 plan with KIMS ₹10.005 → **422**; plan unchanged. —
33. [Complex: direct API call] Arun's session: `POST /planning/targets/{id}/approve` without `expected_updated_at` → **422** "Field required"; nothing decided. —

### Who can read hospital lines

34. [Complex: read-only DB check] `target_plan_account` rows for Vivek's 2027-Q1 plan as each user (all three settings set and verified). **Expected:** Vivek and Arun see them; Nishad 0; Rudrappa 0. —

### Territory edge cases

35. [Simple] As Basheer K, 2027-Q1, **Plan**, open the picker. **Expected:** hospitals from any zone (Al Shifa, Aster DM). **Cancel.** —
36. [Simple] As Rudrappa, 2027-Q1, **Plan**. **Expected:** the picker offers no hospitals. **Cancel.** —

### Regression

37. [Simple] As Haroon, **Brand Target Tracking**, Critical Care, 2027-Q1. **Expected:** EDAN Team Committed ₹85 = Vivek ₹45 (Rejected) + Arun ₹30 + Nishad ₹10. —
38. [Simple] Menu per role: **Rate Hospitals** for Haroon and Abdul Latheef only; Target & Coverage Planning for everyone; Pipeline and Insights load normally. —

### Link back to the card

39. [Simple] Insights Dashboard, Critical Care, 2027-Q1, as Admin. **Expected:** chip "Upcoming quarter"; Planned ₹70.0L (Vivek's rejected revision counts his last approved ₹30 + Arun ₹30 + Nishad ₹10); Won (paid) ₹0.0L; "1 of 4 haven't submitted". —

## Close-out

- Record Pass/Fail beside each step as it completes.
- List the permanent Dev records (top of this plan) in Progress-Archive.
- Scorecard row moves to Done only when every step above is checked off.
