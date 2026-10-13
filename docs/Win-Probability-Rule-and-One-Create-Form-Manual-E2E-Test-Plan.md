<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Win Probability Rule (and One Create Form) — Manual E2E Test Plan

**Covers:** `docs/Win-Probability-Rule-and-One-Create-Form-Implementation-Plan.md`,
steps 1–3 (one combined run after step 3, per the plan's step 3).
**Built:** not yet; commit hashes filled in after the fact.
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

Button labels, messages and the order of checks are taken from the code,
not the design doc. Today's labels: form title "New Opportunity" (top bar
and Customer 360), "Add Opportunity" (Project Directory, removed in step
2); "Expected Closure Date", "Win Probability %", "PO Date", "Fast-Track
this Deal" (→ "Fast-Track this Opportunity", D17). The notice text is
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
four new Opportunities named "zz Chance E2E – <way in>" (top bar, Customer
360, Project Directory, Marketing Lead convert). Saves may add Activity
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
20. [Simple] Leave the date empty → **Create**. **Expected:** the form shows "Win Probability is 50% or more but there's no expected closure date - add one." before sending; nothing is created. —
21. [Simple] Lead Source "REPEAT_ORDER", chance still 60, no date → **Create**. **Expected:** the same message; the date box shows for a Repeat Order too (D8). —
22. [Simple] Tick "Fast-Track this Opportunity", chance still 60, no date → **Create**. **Expected:** the same message (D8). Untick it. —
23. [Simple] Lead Source back to a normal source, name "zz Chance E2E – top bar", add an Expected Closure Date → **Create** (Basheer clicks, Claude watches). **Expected:** created; its page shows chance 60 and the date; no notice. —

Negotiation and later stages are outside BR-OP-19; that boundary is
covered by the backend tests (plan section 6), not by a manual step.
