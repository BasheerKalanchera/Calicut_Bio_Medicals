<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Margin Report — Manual E2E Test Plan

**Covers:** `docs/Margin-Report-Implementation-Plan.md` (Approved 24 Nov 2026, D1–D13;
D13a–D16 added 25 Nov).
**Built:** not built yet — handed to Build & Test 24 Nov 2026 (Basheer). Commit hashes filled in after the build.
**Where:** Dev only. Nothing here runs on UAT; the UAT one-time cost fill (D12) waits for the price sheet there.

**Written ahead of the build (Plan & Chore, 24 Nov 2026).** Button labels, menu names
and messages below come from the plan, not the code. Build & Test corrects them from
the built code in P2 before the run.

## Checked against live data

Checked read-only on Dev, 24 Nov 2026, with all three RLS settings (user, role, SBU)
set and verified (signed in as Admin Abdul Latheef P; Admin has no SBU). Re-run in P4
just before the E2E.

- **Who sees:** the Margin Report — General Manager and Admin only (D9). Dev has one
  each: Haroon Sidheeq (General Manager), Abdul Latheef P (Admin). Hide-checks, real
  people who must NOT see it: Fahad (Sales Staff, Imaging — owns the Won "Test new
  fastrack opportunity from Project 360" (Aster MIMS Calicut)), Basheer K (SBU Manager,
  Imaging), Fazal (Area Manager, Imaging), Marketing Test User (Marketing User).
- **Who can approve:** n/a — there is no approval step. A Won/Lost product change
  needs a reason, not an approver (D13; reason-only "Why this change?" pop-up,
  saved as an Activity-tab Note, D13a–D13d — Basheer, 25 Nov).
- **Who can save:** products on a Won or Lost Opportunity — Haroon Sidheeq and Abdul
  Latheef P only, with a reason (D13). Products on an open Opportunity — unchanged;
  checked here with Fahad on his own "Test one more direct Opportunity" (EMS Hospital),
  Active. Catalog cost — General Manager and Admin (BR-CAT-04).
- **Existing values:** 79 products, 1 with a cost (SonoScape S70 USG Machine, cost
  ₹24.00 L), which is on no Won Opportunity. 6 Won Opportunities, all Imaging,
  one product line each, none with a cost today:
  - "zz NA E2E – fast track Won" (Baby Memorial Hospital), Basheer K, closed 18 Oct —
    SonoScape E1 Portable USG Machine, 1 × ₹5.00 L = ₹5.00 L
  - "Test new fastrack opportunity from Project 360" (Aster MIMS Calicut), Fahad,
    closed 15 Oct — SonoScape S50 Elite USG Machine, 1 × ₹29.00 L = ₹29.00 L
  - "Test opportunity" (EMS Hospital), Fahad, closed 10 Oct — SonoScape E2 Portable
    USG Machine, 1 × ₹1.00 L = ₹1.00 L
  - "Test usg oder with Buyback" (Al Shifa Hospital Perinthalmanna), Basheer K, closed
    3 Oct — SonoScape E2, 1 × ₹9.00 L = ₹9.00 L (no trade-in line on it any more)
  - "New opportunity test" (Al Shifa Hospital Perinthalmanna), Basheer K, closed 3 Oct
    — SonoScape E2, 1 × ₹9.00 L = ₹9.00 L
  - "USG 2" (another hospital), Basheer K, **no closed date** — SonoScape X3 USG
    Machine, 1 × ₹4.00 L = ₹4.00 L. With no closed date it shows only under All Time
    (the Sales Report's period filter works the same way).
  No Won Opportunity has a trade-in line (7 trade-in lines on Dev, all on open
  Opportunities), so section B creates one. Lost Opportunity with a product line:
  "new lead" (aster medicity), Basheer K, 1 line. Statuses: Won and Lost are closed;
  Active, On-Hold, Stalled are open.

Button labels, messages and the order of checks are taken from the code,
not the design doc — **not yet: corrected from the built code in P2.**

## Figures and sources

- 12 active users, their roles and SBUs — Dev query, 24 Nov 2026
- 79 products, 1 with a cost (S70, ₹24.00 L, full price ₹48.00 L) — Dev query, 24 Nov 2026
- The 6 Won Opportunities, hospitals, owners, closed dates (India time), lines and
  values — Dev query, 24 Nov 2026
- "USG 2" has no closed date; the Sales Report counts closed-date filters only when a
  period is chosen — Dev query, 24 Nov 2026; `backend/app/domains/reporting/repository.py`
  lines 244–247, 288–291
- 7 trade-in lines, all on open Opportunities — Dev query, 24 Nov 2026
- Lost "new lead" (aster medicity), 1 line — Dev query, 24 Nov 2026
- "Test one more direct Opportunity" (EMS Hospital), Active, Fahad, 1 line — Dev query,
  24 Nov 2026
- SonoScape E2 full price ₹16.00 L, S50 Elite ₹37.00 L, E1 ₹6.00 L, X3 none — Dev
  query, 24 Nov 2026
- This Quarter = 2026-Q3, 1 Oct to 31 Dec 2026 — `scripts/quarter.py`, 24 Nov 2026
- Test costs ₹5.00 L (E2), ₹20.00 L then ₹22.00 L (S50 Elite) — made-up test values
- New test Opportunity "zz E2E Margin – win" (Baby Memorial Hospital), its ₹30.00 L
  price, ₹1.00 L discount, ₹2.00 L trade-in "Old test USG", and the ₹8.00 L E2 added in
  the correction — made-up test values
- Expected sums and percentages below — worked out by hand from the figures above;
  margin % rounded to one decimal

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Basheer runs Complex steps too, from these
instructions; a step Claude drives in the browser says `[Complex: Claude — <reason>]`
(two steps, H1–H2: reading what the screen doesn't show). Steps are grouped by login.
Saves to Dev are "Basheer clicks, Claude watches"; Claude reads the record back in the
app.

**Phone:** step 36 is the phone, tablet and laptop look of the Margin Report and the
reason box.

**Opportunities:** every Opportunity is named with its hospital in brackets.

**Margin % with some no-cost lines (plan D14, Basheer 25 Nov):** on the totals row and
on any row with some no-cost lines, margin ÷ the sold-for of the **costed lines only**
(₹13.00 L ÷ ₹48.00 L = 27.1% for section A), not ÷ all sold-for (24.5%). The figures
below use this.

## Before the build applies its migration (set-up — order matters)

The one-time fill (D12) copies the catalog cost on the day the migration is applied, so
the test costs must be in the catalog **before** Basheer runs `alembic upgrade head`.

- P0. [Simple] As Haroon Sidheeq, Product Catalog → SonoScape E2 Portable USG Machine →
  set Cost to 5.00; SonoScape S50 Elite USG Machine → Cost 20.00. Leave E1 and X3 with
  no cost. **Expected:** both saved; Claude reads them back in the Catalog. —

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
- P2. [Complex: Build & Test — labels from code] Build & Test corrects every label,
  menu name and message in this plan from the built code, and fills in **Built:**. —
- P3. [Simple] Dev `alembic current` = head; `docs/Physical-Schema.sql` regenerated
  since the migration. —
- P4. [Complex: read-only Dev query] Claude re-runs the live-data check: the 6 Won
  Opportunities now carry saved costs E2 ₹5.00 L and S50 Elite ₹20.00 L, marked "filled
  in later"; E1 and X3 lines have none. —

## A — Haroon Sidheeq (General Manager): the report on existing data

1. [Simple] Open the Reports menu. **Expected:** "Margin Report" is listed. —
2. [Simple] Open Margin Report. **Expected:** period "This Quarter", group by "Product"
   (D2, D7). —
3. [Complex: several values] Read the rows. **Expected:** SonoScape E2 — Quantity 3,
   Sold for ₹19.00 L, Cost ₹15.00 L, Margin ₹4.00 L, 21.1%; SonoScape S50 Elite —
   Quantity 1, ₹29.00 L, ₹20.00 L, ₹9.00 L, 31.0%. —
4. [Simple] Read the no-cost list. **Expected:** one product listed — SonoScape E1,
   1 sale, ₹5.00 L, no cost entered, not in the margin (wording from the code, P2)
   (D5, D15). —
5. [Complex: several values] Read the totals row at the top. **Expected:** Sold for
   ₹53.00 L (no-cost lines included, D5), Cost ₹35.00 L, Margin ₹13.00 L, 27.1% (D14). —
6. [Simple] Look for the "cost filled in later" mark. **Expected:** shown — every costed
   line here was filled by the one-time fill (D12). —
7. [Complex: several values] Group by Rep. **Expected:** Basheer K — costed Sold for
   ₹18.00 L, Cost ₹10.00 L, Margin ₹8.00 L, 44.4%, plus E1's ₹5.00 L in his sold-for;
   Fahad — ₹30.00 L, ₹25.00 L, ₹5.00 L, 16.7%. Rows add up to the totals row. —
8. [Complex: several values] Group by Brand, then SBU, then Zone. **Expected:** Brand —
   one row, SonoScape; SBU — one row, Imaging; Zone — rows add up to the totals row. —
9. [Simple] Period "This Month". **Expected:** no rows (nothing won in November yet);
   an empty message, not an error. —
10. [Complex: several values] Period "All Time". **Expected:** totals as step 5 plus
    "USG 2" (another hospital): no-cost line reads 2 lines worth ₹9.00 L; Sold for
    ₹57.00 L; Cost, Margin, % unchanged. —
11. [Complex: cross-screen] This Quarter, by Product: click the S50 Elite row.
    **Expected:** the Pipeline list opens with one Opportunity, "Test new fastrack
    opportunity from Project 360" (Aster MIMS Calicut); no cost anywhere on it (D10). —
12. [Complex: cross-screen] Sales Report, This Quarter, by Product: click a row.
    **Expected:** the right Pipeline list opens, as before (plan section 3). —

## B — Basheer K (SBU Manager, Imaging): a new Won, and the lock

13. [Complex: multi-step, saves to Dev] Create "zz E2E Margin – win" (Baby Memorial
    Hospital), Imaging: SonoScape S50 Elite, quantity 1, price ₹30.00 L, discount ₹1.00
    L; trade-in line "Old test USG" ₹2.00 L. Take it to Won the fast-track way (as "zz NA
    E2E – fast track Won" (Baby Memorial Hospital) was). Basheer clicks, Claude watches.
    **Expected:** Won saves; revenue and closed date (today) shown as before (plan
    section 3). —
14. [Simple] On "zz E2E Margin – win" (Baby Memorial Hospital) → Products tab.
    **Expected:** no Edit and no + Add (D13). —
15. [Simple] Open Lost "new lead" (aster medicity) → Products tab. **Expected:** no Edit
    and no + Add. —
16. [Simple] Open the Reports menu. **Expected:** no "Margin Report". —

## C — Haroon Sidheeq: cost saved on the Won day, and a correction

17. [Simple] Product Catalog → SonoScape S50 Elite → Cost 22.00 → Save. Basheer clicks,
    Claude watches. **Expected:** saved. —
18. [Complex: several values] Margin Report, This Month, by Product. **Expected:** S50
    Elite — Quantity 1, Sold for ₹29.00 L, Cost ₹20.00 L (saved on the Won day, not
    today's ₹22.00 L), Margin ₹9.00 L, 31.0% (D4); no "filled in later" mark on it. —
19. [Simple] Read the trade-in line. **Expected:** one information line, trade-ins
    ₹2.00 L, outside the margin (D6). —
20. [Complex: several values] This Quarter, by Product. **Expected:** S50 Elite —
    Quantity 2, Sold for ₹58.00 L, Cost ₹40.00 L, Margin ₹18.00 L, 31.0% — the older Won
    keeps its ₹20.00 L too. —
21. [Simple] "zz E2E Margin – win" (Baby Memorial Hospital) → Products tab.
    **Expected:** Edit and + Add shown. —
21a. [Simple] Edit → Save without changing anything. **Expected:** no pop-up, nothing
    saved, no new note on the Activity tab (D13b). —
22. [Simple] + Add SonoScape E2, quantity 1, price ₹8.00 L → Save. **Expected:** the
    "Why this change?" pop-up opens with one reason box, "Who asked for this change,
    and why?", no next-action questions (D13c); its Save can't go through with the box
    empty. —
23. [Complex: saves to Dev] Type the reason "Fahad: PO shows E2 added" → Save. Basheer
    clicks, Claude watches. **Expected:** saved; both lines shown. Not refused even
    though Haroon has an open next action of his own on this Opportunity (D13d; Build &
    Test adds that next action to pre-flight from the built code). —
24. [Complex: several values] Margin Report, This Month, by Product. **Expected:** S50
    Elite still Cost ₹20.00 L (kept, D13); E2 — Quantity 1, ₹8.00 L, Cost ₹5.00 L
    (today's catalog cost), Margin ₹3.00 L, 37.5%. —
25. [Simple] "zz E2E Margin – win" (Baby Memorial Hospital) → Activity tab.
    **Expected:** one new Note by Haroon listing the change (E2 added, 1 unit) and the
    reason "Fahad: PO shows E2 added" (D13a, D13c); Haroon's own next action still open
    and no new next action (D13d). The history log shows the E2 line added. —
25a. [Simple] Fahad's Active "Test one more direct Opportunity" (EMS Hospital) →
    Edit → change the stage → Save. **Expected:** the usual "Why this change?" pop-up
    with its next-action questions, unchanged by the new mode. Cancel; don't save
    (D13e, pop-up re-test). —
26. [Simple] Lost "new lead" (aster medicity) → Products tab. **Expected:** Edit shown
    for Haroon. Don't save. —
27. [Simple] Product Catalog → S50 Elite → Cost back to 20.00 → Save. **Expected:**
    saved (Dev tidy). —

## D — Abdul Latheef P (Admin)

28. [Simple] Reports → Margin Report, This Quarter. **Expected:** menu item shown; same
    totals Haroon sees after step 24. —
28a. [Complex: saves to Dev] Product Catalog → SonoScape E1 (no cost yet) → Cost 4.00 →
    Save. Basheer clicks, Claude watches. **Expected:** saved (first cost, D16). —
28b. [Complex: several values] Margin Report, This Quarter, by Product. **Expected:** E1
    now has a row with Cost at ₹4.00 L a unit, marked "cost filled in later"; the
    no-cost list is gone; Margin % and totals now include E1 (D14, D16). S50 Elite and
    E2 unchanged. Claude works the expected figures from step 4's E1 line before the
    run. —
28c. [Complex: saves to Dev] Product Catalog → E1 → Cost 4.50 → Save, then Margin
    Report. **Expected:** E1 still at ₹4.00 L a unit — changing an existing cost
    touches no past sale (D16, D4). E1 keeps a Dev cost afterwards (test value). —

## E — Fahad (Sales Staff, Imaging): hide-checks

29. [Simple] Open the Reports menu. **Expected:** no "Margin Report". —
30. [Simple] His Won "Test new fastrack opportunity from Project 360" (Aster MIMS
    Calicut) → Products tab. **Expected:** no Edit, no + Add. —
31. [Simple] His open "Test one more direct Opportunity" (EMS Hospital) → Products tab →
    Edit. **Expected:** the edit form opens as before; Cancel, don't save. —

## F — Fazal (Area Manager) and Marketing Test User

32. [Simple] As Fazal, open the Reports menu. **Expected:** no "Margin Report". —
33. [Simple] As Marketing Test User, open the menu. **Expected:** no "Margin Report". —

## H — Claude in the browser (only what the screen doesn't show)

- H1. [Complex: Claude — reads the server reply] As Haroon, open "zz E2E Margin – win"
  (Baby Memorial Hospital); read the Opportunity reply. **Expected:** no cost field
  anywhere in it (BR-CAT-04). —
- H2. [Complex: Claude — reads the server reply] As Fahad, ask the server for the
  margin report directly. **Expected:** refused (403) (D9). —

## G — Phone, tablet, laptop

34. [Simple] Basheer looks at nothing else changing on the Sales Report. **Expected:**
    Sales Report looks as before. —
35. [Complex: phone layout] Reason box on a Won Opportunity's Products tab (as Haroon)
    at 390, 768, 1280 px. **Expected:** box and Save fit; nothing runs past the card. —
36. [Complex: phone layout] Margin Report at 390, 768, 1280 px, every group-by and the
    no-cost and trade-in lines. **Expected:** on a phone each row is a block — name on
    top, then Sold for, Cost, Margin and Margin % on two short lines; totals block above
    the rows; period and group-by boxes stacked above that (plan "On a phone"); nothing
    runs past the card. —
