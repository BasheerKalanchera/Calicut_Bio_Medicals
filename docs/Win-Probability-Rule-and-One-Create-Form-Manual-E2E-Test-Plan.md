<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Win Probability Rule (and One Create Form) — Manual E2E Test Plan

**Covers:** `docs/Win-Probability-Rule-and-One-Create-Form-Implementation-Plan.md`,
steps 1–3 (one combined run after step 3, per the plan's step 3).
**Built:** step 2: Project Directory `a76b02d`, Customer 360 `86dd1a3`
(both pushed 2026-10-14); steps 1 and 3: `ae6bd14` (pushed 2026-10-15); pre-E2E review fix: `3e37c92` (pushed 2026-10-15).
**Where:** Dev.

## Checked against live data

Checked read-only on Dev, 2026-10-13, through the admin connection (no
visibility rule is under test, so the three RLS settings were not needed).
Re-checked just before the run, as the records below may change meanwhile.

- **Who sees:** n/a — no visibility change. Tester: Basheer K (SBU Manager,
  Imaging); every record below is his own, so no cross-user step.
- **Who can approve:** n/a — the "Fast-Track this Opportunity" tick box
  needs an approver and reason; the step only checks the date rule still
  applies with it ticked, and is not saved.
- **Who can save:** Basheer K, owner of every Opportunity used below.
- **Existing values:** stage standard chances on Dev: Lead 5, Qualified 20,
  Demo 35, Clinical Evaluation 55, Negotiation 70, Order 90, Delivery &
  Installation 95, Payment Pending 98. Active Opportunities before
  Negotiation: 37, of which 3 are at 50 % or more with no closure date
  ("MRI Deal", "New Cath Lab Equipment", Nishad K V's "Test demo lead").
  Records used:
  - "Ultrasound m/c" — KIMS Hospital Trivandrum, Lead, chance 35 (typed;
    standard 5), no date.
  - "Mims calicut" — Aster MIMS Calicut, Demo, chance 35 (= standard), no date.
  - "MRI Deal" — Government Medical College Kozhikode, Demo, chance 60, no date.
  - "New Cath Lab Equipment" — Aster MIMS Calicut, Lead, chance 75, no date.
  - Project "Another new project" — Aster MIMS Calicut (owner Basheer K).
  - A Marketing Lead in "New" status assigned to an Imaging user: not
    checked yet; picked at the re-check before the run.
  - For section E, also picked at the re-check: an Admin or General
    Manager login (step 29) and an existing installed asset at Aster MIMS
    Calicut (step 33).

Button labels, messages and the order of checks are taken from the code,
not the design doc. Today's labels: form title "New Opportunity" on all
four ways in (Project Directory's "Add Opportunity" removed in step 2,
`a76b02d`); "Expected Closure Date", "Win Probability %", "PO Date",
"Fast-Track this Opportunity" (renamed in `a76b02d`, D17). The notice text is
decided (D14), and so is the refusal (D18): "Win Probability is 50% or
more but there's no expected closure date - add one.", the same from the
server and on the create form. Both are checked against the built code
before the run.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Left on Dev permanently:** dates or chances changed on the four records
above; one On Hold → Active round trip on "New Cath Lab Equipment"; and
five new Opportunities named "zz Chance E2E – <way in>" (top bar, Customer
360, Project Directory, Marketing Lead convert, top bar on project page). Saves may add Activity
and Audit Log rows, which cannot be deleted.

## Pre-flight

- P1. [Simple] Dev backend restarted after step 1's backend change. —
- P2. [Simple] Screens running from `main` with steps 1–3; signed in as Basheer K. —
- P3. [Simple] Claude re-checks the records above read-only and fills in the Marketing Lead. —

## A — Opportunity page: a typed chance is kept (BR-OP-08, D1)

1. [Simple] Open "Ultrasound m/c" → Edit → change Stage from Lead to Qualified. **Expected:** Win Probability % stays 35. Then **Cancel**. —
2. [Simple] Open "Mims calicut" → Edit → change Stage from Demo to Qualified. **Expected:** Win Probability % changes from 35 to 20. Then **Cancel**. —

## B — Opportunity page: 50 % or more needs a date (BR-OP-19, D7, D9, D14, D16)

3. [Simple] Open "MRI Deal". **Expected:** notice "Win Probability is 50% or more but there's no expected closure date - add one." —
4. [Simple] Open "Ultrasound m/c" (chance 35). **Expected:** no notice. Edit: **Expected:** no Expected Closure Date box. —
5. [Complex: the box appears and disappears as the number changes, a layout shift] In the same Edit form, type 50, then 49, then 50 in Win Probability %. **Expected:** the Expected Closure Date box appears at 50, goes at 49, comes back at 50. —
6. [Simple] With chance 50 and no date, press **Save** (Basheer clicks, Claude watches). **Expected:** refused with "Win Probability is 50% or more but there's no expected closure date - add one."; nothing saved. —
7. [Simple] Add an Expected Closure Date a month ahead → **Save**. **Expected:** saved; page shows chance 50 and the date. —
8. [Simple] Open "MRI Deal" → Edit → add an Expected Closure Date → **Save**. **Expected:** saved; the notice from step 3 is gone. —
9. [Complex: separate products panel, check the save isn't refused] Open "New Cath Lab Equipment" (75 %, no date) → add one product in the products panel → save it. **Expected:** the product saves; the notice stays. —
10. [Complex: status change with its own required fields] Same Opportunity → Edit → Status On-Hold (fill the hold reason and reactivation date it asks for) → **Save**. **Expected:** saved, not refused by the date rule; notice no longer shows. —
11. [Simple] Edit → Status Active → **Save**. **Expected:** refused with "Win Probability is 50% or more but there's no expected closure date - add one." —
12. [Simple] Add an Expected Closure Date → **Save**. **Expected:** saved as Active; no notice. —
13. [Simple] Edit form check: the tick box reads "Fast-Track this Opportunity". Then **Cancel**. —

## C — One create form from every way in (step 2, D10, D11, D17)

14. [Complex: cross-screen, compares the form with the top-bar one] Customer 360 → Aster MIMS Calicut → Opportunities tab → add. **Expected:** the "New Opportunity" form opens with the hospital shown as a fixed name: no hospital search, no "+ Add Hospital"; "Fast-Track this Opportunity" label; PO Date box offered at Delivery & Installation. —
15. [Simple] Name "zz Chance E2E – Customer 360", Stage Lead, chance left at 5 → **Create** (Basheer clicks, Claude watches). **Expected:** form closes; the new Opportunity shows in the Opportunities tab without a page refresh. —
16. [Complex: cross-screen, two locked fields] Project Directory → "Another new project" → add an Opportunity. **Expected:** the same "New Opportunity" form, hospital Aster MIMS Calicut and the project both fixed. —
17. [Simple] Name "zz Chance E2E – Project Directory", Stage Lead → **Create**. **Expected:** it appears in the project's list without a refresh. —
18. [Complex: cross-screen, Marketing Lead queue] Marketing Lead review queue → the lead from P3 → Convert. **Expected:** the same form opens, filled from the lead. Name "zz Chance E2E – Marketing convert", Stage Lead → **Create**. **Expected:** the lead shows as converted. —

## D — Create form: 50 % or more needs a date (step 3, D7, D8)

19. [Complex: the box appears as the number changes, a layout shift] Top bar "+ Lead" → hospital Aster MIMS Calicut, Stage Lead, chance 60. **Expected:** Expected Closure Date box appears (today it shows only from Negotiation). —
19a. [Complex: the box must stay while the number changes, a layout shift] Same form: type an Expected Closure Date, then change Win Probability % to 40. **Expected:** the Expected Closure Date box stays, still showing the date. Clear the date. **Expected:** the box goes. Set the chance back to 60 for step 20. (Added 2026-10-15 for the pre-E2E review fix: a typed date was saved while its box was hidden.) —
20. [Simple] Leave the date empty → **Create**. **Expected:** the form shows "Win Probability is 50% or more but there's no expected closure date - add one." before sending; nothing is created. —
21. [Simple] Lead Source "REPEAT_ORDER", chance still 60, no date → **Create**. **Expected:** the same message; the date box shows for a Repeat Order too (D8). —
22. [Simple] Tick "Fast-Track this Opportunity", chance still 60, no date → **Create**. **Expected:** the same message (D8). Untick it. —
23. [Simple] Lead Source back to a normal source, name "zz Chance E2E – top bar", add an Expected Closure Date → **Create** (Basheer clicks, Claude watches). **Expected:** created; its page shows chance 60 and the date; no notice. —

Negotiation and later stages are outside BR-OP-19; that boundary is
covered by the backend tests (plan section 6), not by a manual step.

**Why section E (Basheer, 2026-10-14):** step 2 removed the code behind
both "+ Add" buttons — about 420 lines from Project Directory (`a76b02d`)
and about 345 from Customer 360 (`86dd1a3`) (git diff counts), including
lists those screens loaded. A code search on 2026-10-14 found nothing else
in the app still referring to the removed code; section E checks the same
on screen. Unless a step says Create, it ends with **Cancel** and saves
nothing.

## E — Regression: nothing else relied on the removed forms (step 2)

*The old forms' features, now in the shared form (Customer 360 → Aster MIMS Calicut → Opportunities tab → add):*

24. [Simple] Project list. **Expected:** offers "None" plus only Aster MIMS Calicut's projects, including "Another new project". —
25. [Simple] Lead Source REFERRAL. **Expected:** "External referrer (not Cabio staff)" tick box and a "Referred By" colleague list with names in it; ticking the box swaps the list for a text box. —
26. [Simple] Stage Demo. **Expected:** Demo Start Date and Demo End Date show. Stage Order: **Expected:** PO Number shows. —
27. [Complex: approver list depends on the chosen owner] Owner Basheer K, tick "Fast-Track this Opportunity". **Expected:** "Approved By" lists his manager and every General Manager; once one is picked, "Reason *" lists reasons. —
28. [Complex: separate products pop-up, value fills itself] "+ Add Products" → add one product → Done. **Expected:** the product shows in the form and Indicative Value (Lakhs) reads "(auto)" with its total. Cancel. —
29. [Complex: second login, a role that picks the SBU] Sign in as an Admin or General Manager (picked at P3) → same add form. **Expected:** "SBU *" box shows and Create without it is refused with "SBU is required"; after choosing Critical Care, the product list in "+ Add Products" shows Critical Care products. Cancel; sign back in as Basheer K. —

*Other forms on the same screens (they shared lists with the removed code):*

30. [Simple] Customer 360 → Aster MIMS Calicut → Projects tab → add. **Expected:** "New Project" opens; "Owner *" lists names. —
31. [Simple] Edit an existing project there. **Expected:** "Edit Project" shows its status and owner filled in, lists not empty. —
32. [Simple] Installed assets tab → add. **Expected:** "New Installed Asset" opens; "Product *" lists Imaging products. —
33. [Simple] Edit an existing installed asset (picked at P3). **Expected:** its product is shown, list not empty. —
34. [Simple] Opportunities tab: open an existing Opportunity, come back, use "Show all". **Expected:** opens its page; the list changes as before. —
35. [Simple] Project Directory → search "Another new project" → open it → Edit Project. **Expected:** status and owner lists filled. Back; "New Project" from the directory: hospital search and "Owner *" list work. —

*Ways in that must stay unlocked:*

36. [Complex: cross-screen, compares locked vs unlocked] On the Aster MIMS Calicut page, use the top-bar "+ Lead". **Expected:** hospital pre-filled but changeable (search box and "+ Add Hospital" shown). —
37. [Complex: top-bar form from a project page, refresh of the project's list] On "Another new project"'s page, top-bar "+ Lead". **Expected:** hospital and project pre-filled but changeable. Name "zz Chance E2E – top bar on project page", Stage Lead → **Create** (Basheer clicks, Claude watches). **Expected:** appears in the project's list without a refresh. —
38. [Simple] Step 18's Marketing Lead form. **Expected:** hospital changeable, not a fixed name. (Checked during step 18.) —

*Lists refreshed after a save:*

39. [Complex: cross-screen] After step 15: the hospital page's Opportunities tab count, and the Pipeline, show "zz Chance E2E – Customer 360" without a refresh. After step 17: the same for "zz Chance E2E – Project Directory", and Aster MIMS Calicut's Opportunities tab shows it too. —
