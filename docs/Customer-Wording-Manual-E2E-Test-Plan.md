<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Customer wording ("Hospital" → "Customer", "deal" → "Opportunity") — Manual E2E Test Plan

**Covers:** `docs/Customer-Wording-Implementation-Plan.md` (all three
commits: MUI restyle, wording, code names).
**Built:** not yet — Build & Test started 2026-11-16. Commit hashes go
here after the fact.
**Where:** Dev.

**Almost nothing is saved.** Every step opens a screen, a filter or a
pop-up and cancels it. The one exception is step 12: the New Customer
pop-up's similar-name warning only appears after **Create** is clicked,
and the server refuses the save to show it. If the warning doesn't
appear, a test customer is created on Dev — so that step is "Basheer
clicks, Claude watches".

Written ahead of the build (Plan & Chore, 2026-11-16). The **Expected**
text below is the current text with the agreed words swapped in. P5
re-reads every changed line in the built code and corrects any Expected
that differs, before step 1.

## Checked against live data

Checked read-only on Dev, 2026-11-16, as Admin (Abdul Latheef P), all
three RLS settings set and verified (role Admin, user id set, SBU NULL —
Admin has no SBU by design, migration 0022). Raw output: session
scratchpad `wording_e2e_data_out.txt` and `wording_e2e_data2_out.txt`
(session 2dd09487).

- **Who sees:** Vivek (Sales Staff, Critical Care) sees his own 2026-Q3 plan; Arun Adarsh (Area Manager, Critical Care, South Kerala and three more zones) sees Vivek's in his team list; Haroon Sidheeq (GM) sees every SBU and the Audit Log; Nishad K V (Area Manager, North Kerala) sees North Kerala customers and owns "Test demo lead" (Aster MIMS Calicut).
- **Who can approve:** n/a — no step approves or rejects; the Approve and Reject buttons are only looked at.
- **Who can save:** n/a except step 12: Nishad K V can add a customer (North Kerala on file). Every active Sales Staff and Area Manager has a territory, and the roles without one (Admin, SBU Manager, GM) are exempt — so the "No territory assigned yet" pop-up can't be reached on Dev; its words are covered by the server test (P3) and the code read (P5).
- **Existing values:** 2026-Q3 plans — Vivek ₹66.00L Approved, 3 customers (2 of them "Test hospital 2" and "Test hospital 3", no customer type); Arun ₹50.00L Approved, 0 customers; Fahad ₹25.00L Approved, 1 ("new customer"); Basheer K ₹55.00L Pending Approval, 3; Haroon Critical Care ₹20.00L Pending, 2; Rudrappa ₹10.00L Approved, 0. Ratings on all customers: 35 Not classified, 2 Medium, 1 High, 1 Low. North Kerala customers include "aster md", "aster1" and "Aster MIMS Calicut".

Button labels, messages and the order of checks are taken from the code
(`QuickLeadModal.tsx`, `AddHospitalModal.tsx`, `LogActivityModal.tsx`,
`MarketingLeadCreateModal.tsx`, `TargetPlanningScreen.tsx`,
`TargetPlanDialog.tsx`, `TargetPlanDetails.tsx`,
`TargetVsActualsPerson.tsx`, `MyWorkScreen.tsx`, `RateHospitalsScreen.tsx`,
`Customer360Screen.tsx`, `NoActivityCustomersReportScreen.tsx`,
`OpportunityPipelineScreen.tsx`, `ProjectDirectoryScreen.tsx`,
`AuditLogScreen.tsx`, `OpportunityDetailScreen.tsx`, `DemoApp.tsx`,
`helpContent.tsx`, `account/service.py`), read 2026-11-16 before the build,
not the design doc.

## Figures and sources

- Current quarter 2026-Q3 (1 Oct – 31 Dec 2026) — `scripts/quarter.py`, 2026-11-16.
- Plans, customer counts and statuses above — Dev query, 2026-11-16 (`wording_e2e_data_out.txt`).
- Reps' zones and customers by zone — Dev query, 2026-11-16 (`wording_e2e_data2_out.txt`).
- "Test demo lead" (Aster MIMS Calicut), Clinical Evaluation, Active, owner Nishad K V — Dev query, 2026-11-16.
- Rating counts 35 / 2 / 1 / 1 — Dev query, 2026-11-16 (all customers, Admin view).
- "aster mds" (step 12) — made-up name, chosen to look like "aster md" in North Kerala.
- The three MUI screens and their counts — the implementation plan's Figures section.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Basheer runs Complex steps too,
from exact instructions; a step Claude drives in the browser says
`[Complex: Claude — <reason>]`. Saves to Dev are "Basheer clicks, Claude
watches"; Claude reads the record back in the app.

**Phone:** the screens this plan changes get `[Complex: phone layout]`
steps in section G, at 390, 768 and 1280 px.

**Opportunities:** every step that names an Opportunity puts its customer
beside it in brackets.

**Server messages** (document removal, split change on a Won or Lost
Opportunity, the plan messages in `planning/service.py`, the account
messages): the screens stop those cases first, so they're covered by the
backend tests that check the new text (P3), not by a browser step.

## Pre-flight

- P1. [Simple] Basheer restarts the Dev backend after the last commit of the build (the code-names commit changes server web addresses) and confirms it's running. — **Pass** (16 Nov): Basheer restarted the servers before P4/P5. The wording build is still uncommitted; the code-names commit (step 7) will need another restart before section F.
- P2. [Simple] Frontend running; a normal window plus a private window, so two people can be signed in at once. Hard-refresh both (Ctrl+Shift+R) so the phone-app cache doesn't serve the old screens. — **Pass** (Basheer, 16 Nov): normal and private windows both open and refreshed.
- P3. [Complex: automated checks] Claude runs `/code-review` on the three commits, then the full backend pytest, ruff, `npx tsc --noEmit` and `npm run lint`, and reports counts plainly, including any failures that existed before. — **Pass for the wording build** (16 Nov, uncommitted code): `/code-review medium` found nothing to fix; pytest 1572 passed; ruff, `tsc -b`, lint and the MUI check pass. The step 0 restyle was checked before its commit `2d2939d`. **Repeat after step 7** (the code-names commit) before section F.
- P4. [Complex: read-only DB check] Claude re-runs the two data checks just before step 1 and records any difference from the section above. — **Pass** (16 Nov): both checks re-run read-only on Dev as Admin, all three settings verified (Admin, user id set, SBU none); output identical to the earlier files, no difference. Raw output: scratchpad `p4_data_out.txt`, `p4_data2_out.txt` (session 23c9662d).
- P5. [Complex: code read] Claude re-reads every changed line in the built code and corrects any Expected below that differs from it; and searches the screens and server again for "hospital" and "deal" (the old prototype `App.jsx` excepted) and lists anything left that isn't in group C. — **Pass** (16 Nov, wording build, uncommitted): every Expected in steps 4–20 matches the built text. Two corrections made: step 16's screen name (singular) and the "section F" slip above. Nothing user-readable still says "hospital" or "deal" apart from group C; the rest is code names and web addresses for step 7. To re-run after step 7: the same search, expecting only group C.

## A — The three restyled screens look the same (MUI commit)

1. [Complex: visual check] As Nishad K V, open **Projects**. **Expected:** colours, text sizes and spacing look as before the build — headings, status labels, cards and the empty text; nothing smaller, larger or a different colour. — **Pass** (Basheer, as Haroon, 17 Nov): he thought the customer names looked slightly different; the code read shows the same font, size, weight (700) and colour, with only line height 1.5→1.43 (about 1px) and letter spacing 0.02px different, so he accepted it as Pass.
2. [Complex: visual check] As Nishad, open **New Opportunity** (the Quick Lead pop-up). **Expected:** looks as before, including the small green heading above the customer details and the field labels. **Cancel.** — **Pass for the pop-up and field labels** (Basheer, as Haroon, 17 Nov; Haroon also sees the "SBU *" field). The green heading ("From the marketing lead …") only shows when the pop-up is opened by converting a marketing lead, so it was not on screen from "+ Lead" and was checked in step 2b below (Pass).
3. [Complex: visual check] As Haroon Sidheeq, open **Audit Log**. **Expected:** looks as before — the record type labels on each row, the "show more" link, the filter chips. — **Pass** (Basheer, as Haroon, 17 Nov).

2b. [Simple] (added 17 Nov — step 2's green heading only shows when converting a marketing lead) As Haroon, **Marketing Leads**, a lead waiting for a decision, click **Convert**. **Expected:** the New Opportunity pop-up opens with the green box "From the marketing lead …" (small capital heading, Source line, note) looking as before. **Cancel.** — **Pass** (Basheer, as Haroon, 17 Nov).

## B — Words on forms and pop-ups

4. [Simple] As Nishad, **New Opportunity**. **Expected:** the button under the customer field reads "+ Add Customer" (not "+ Add Hospital"). **Cancel.** — **Pass** (Basheer, as Haroon, 17 Nov).
5. [Simple] As Nishad, open **Log Activity** from the menu or My Work. Open the Opportunity field. **Expected:** the first choice reads "None — customer-level". Close without saving. — **Pass** (Basheer, as Haroon, 17 Nov).
6. [Simple] As a Marketing User (Haroon cannot — the Marketing Leads menu item is Marketing-User only, `DemoApp.tsx:126`; corrected 17 Nov), open the **Marketing Lead** create pop-up. **Expected:** the customer field's help line reads "Not in the list? Leave blank and describe the customer in the note below -- the rep will sort it out." **Cancel.** — **Pass** (Basheer, as a Marketing User, 18 Nov).
7. [Simple] As Nishad, open **Test demo lead** (Aster MIMS Calicut), click **Edit**. **Expected:** below the Win Probability field: "Automatically High Priority — this Opportunity is past Demo stage". **Cancel.** — **Pass** (Basheer, as Haroon, 17 Nov).

## C — Planning screens

8. [Simple] As Arun Adarsh, **Target & Coverage Planning**, 2026-Q3. **Expected:** the team list's column reads "Customers" (not "Hospitals"); Vivek's row shows 3. Expand Vivek's row. **Expected:** the plan's table column reads "Customer" and its total row "3 customers". — **Pass** (Basheer, as Haroon, **Team Plans** tab, 17 Nov). Note: the screen shows the quarter as "Oct – Dec 2026"; "2026-Q3" is the internal code (`scripts/quarter.py`) and is not shown.
9. [Simple] As Haroon, Target & Coverage Planning, 2026-Q3, Critical Care. Expand Arun's row (0 customers). **Expected:** "No customers on this plan — it was set before customer-wise planning." — **Pass** (Basheer, as Haroon, 17 Nov).
10. [Complex: dialog, cancelled] As Vivek, Target & Coverage Planning, 2026-Q3, click **Revise**. **Expected:** the section heading reads "Customers *"; the search box reads "Search to add a customer from your area"; the count line "3 customers". Type "zzz" in the search. **Expected:** "No customers in your area match". **Cancel** — nothing saved. — **Pass** (Basheer, as Haroon, 17 Nov; Haroon's own plan, so the count line is his, not Vivek's 3 — step 22 repeats the Revise check as Vivek).
11. [Simple] As Arun, **Insights Dashboard**, Target vs Actuals, 2026-Q3. Expand Vivek's row. **Expected:** the view switch reads "By customer"; the table column "Customer". — **Pass** (Basheer, as Haroon, 17 Nov; quarter shown as "Oct – Dec 2026"; recorded from his "also it is Oct – Dec 2026" after step 8's Pass — to be confirmed by him).

## D — Lists and searches

12. [Complex: Basheer clicks, Claude watches — the only step that could save] As Nishad, **Customer Directory**, **+ Add**. Name "aster mds", zone North Kerala, click **Create**. **Expected:** a warning appears instead of a save. If it lists several matches: "This looks similar to customers already in the directory:"; if one: "Did you mean <name>? It's already in the directory." (unchanged). Click **Cancel**. If no warning appears and the customer is saved, record Fail and Claude notes the new record in Progress-Archive. — **Pass** (Basheer, as Haroon, 17 Nov): several matches, the warning "This looks similar to customers already in the directory:" showed; nothing saved.
13. [Simple] As Nishad, **My Work**. **Expected:** the tab reads "My customers"; the Summary card group reads "My customers" with the line "My customers this quarter (Oct – Dec 2026)". — **Pass** (Basheer, as Haroon, 17 Nov): the screen shows "Oct – Dec 2026" (code read: `MyWorkScreen.tsx:294`, `formatPlanningPeriod`); the plan's "2026-Q3" was the internal code, corrected here and in 14, 22, 24.
14. [Simple] As Vivek, My Work, **My customers** tab. **Expected:** heading "My customers this quarter (Oct – Dec 2026)" with 3; the table column reads "Customer". As Rudrappa (0 customers on his approved plan): **Expected:** "No approved customer plan for this quarter." — **Pass** (Basheer, 17 Nov; he reported "14 pass" without saying which login he used for Vivek and Rudrappa).
15. [Simple] As Haroon, open the menu. **Expected:** the menu item reads "Rate Customers". Open it. **Expected:** title "Rate Customers"; search box "Search customers"; column "Customer". Type "zzz". **Expected:** "No customers match these filters." — **Pass** (Basheer, as Haroon, 18 Nov).
16. [Simple] As Haroon, **Customer with No Activity** report (the menu item and screen name are singular). **Expected:** the column reads "Customer"; the summary line ends "… of N customers" (or "1 customer"). — **Pass** (Basheer, as Haroon, 18 Nov).
17. [Simple] As Haroon, **Opportunity Pipeline**. **Expected:** search box "Search by opportunity or customer...". — **Pass** (Basheer, as Haroon, 18 Nov).
17b. [Simple] (added 18 Nov — menu rename agreed by Basheer) As Haroon, hard-refresh, then look at the side menu. **Expected:** the item reads "Opportunity Pipeline" (not "Pipeline"); "Pipeline Report" is unchanged further down. Open it. **Expected:** the screen heading reads "Opportunity Pipeline" and the "?" help panel title reads "Opportunity Pipeline — Help". — **Pass** (Basheer, as Haroon, 18 Nov).
18. [Simple] As Haroon, **Projects**. **Expected:** search box "Search by project or customer..."; type "zzz". **Expected:** "No projects or customers matching "zzz"." — **Pass** (Basheer, as Haroon, 18 Nov).
19. [Simple] As Nishad, **Customer 360** for a customer with no pending next actions (Elite Diagnostics, North Kerala; if it has some, pick another). **Expected:** "No pending next actions at this customer." — **Pass** (Basheer, as Haroon, 18 Nov; Haroon's login used instead of Nishad's — same wording for every role).
20. [Simple] As Haroon, **Audit Log**, open the table filter. **Expected:** the list has "Plan", "Plan Customer" and "Plan Brand Split", and no "Plan Hospital". Close it unchanged. — **Pass** (Basheer, as Haroon, 18 Nov).

## E — Help panels

21. [Simple] Open the **?** help on Projects (Project 360), Customer Directory (Account Management), Customer 360, Opportunity Pipeline (title now "Opportunity Pipeline — Help"), Opportunity Detail, Next Actions and Product Catalog. **Expected:** no "deal" anywhere; "hospital" only in "a hospital expansion" (Project 360, kept on purpose). — **Pass** (Basheer, as Haroon, 18 Nov).

## F — After the code-names commit: every screen still loads

The code-names commit renames what the server and the screens pass to
each other. Users see no difference; these steps check nothing broke.

22. [Simple] As Vivek, Target & Coverage Planning, Oct – Dec 2026. **Expected:** the plan loads with ₹66.00L and 3 customers. Click **Revise**, type "test" in the customer search. **Expected:** customers in his area are offered (the search works), with no error message. **Cancel.** —
23. [Simple] As Vivek, My Work: the My customers tab and the Weekly Follow-up list load, with no error message. —
24. [Simple] As Arun, Insights Dashboard, Target vs Actuals, Oct – Dec 2026, expand Vivek. **Expected:** his customer rows load. —
25. [Simple] As Haroon, Rate Customers loads its list; **Stagnant Opportunities** report loads (rows or its empty text, no error). —
26. [Simple] As Abdul Latheef P (Admin), Customer Directory, **+ Add**, type "North" in the zone field. **Expected:** North Kerala is offered. **Cancel** — nothing saved. —

## G — Phone, tablet and laptop look

27. [Complex: phone layout] At 390, 768 and 1280 px: My Work (both tabs, every row opened), Target & Coverage Planning (team list cards, Vivek's row expanded), the Revise pop-up. **Expected:** "My customers" and "Customers" sit where the old words did; nothing runs past a card or wraps oddly. Also open the side menu: "Opportunity Pipeline" fits on one line. — **Pass** (Basheer, as Haroon, 18 Nov; 390, 768 and 1280 px).
28. [Complex: phone layout] At 390, 768 and 1280 px: Rate Customers (menu, search box, rows), New Opportunity pop-up ("+ Add Customer"), Log Activity pop-up; and the Opportunity Pipeline screen heading with the Kanban/List switch beside it. **Expected:** as above. — **Pass** (Basheer, as Haroon, 18 Nov; 390, 768 and 1280 px).
29. [Complex: phone layout] At 390, 768 and 1280 px: the three restyled screens — Projects, the Quick Lead pop-up, the Audit Log (rows opened, "show more" clicked). **Expected:** they look as before the build; nothing runs past a card. — **Pass** (Basheer, as Haroon, 18 Nov; 390, 768 and 1280 px).
