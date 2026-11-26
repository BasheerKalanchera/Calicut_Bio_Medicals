<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Sales Loss Report — Manual E2E Test Plan

**Covers:** `docs/Sales-Loss-Report-Implementation-Plan.md` (Approved 25 Nov 2026, D1–D15, D6a).
**Built:** not built yet — Build & Test or Build, whichever has room (Basheer, 25 Nov 2026). Commit hashes filled in after the build.
**Where:** Dev only. Nothing here runs on UAT (D11).

**Written ahead of the build (Plan & Chore, 25 Nov 2026; corrected 26 Nov).** The Lost
pop-up, "Why this change?" pop-up, New Opportunity form and Overview labels below are
from today's code; the new screen's labels, column names and empty-list wording come
from the plan. The builder corrects them from the built code in P2 before the run.

**Decided while writing (Basheer, 25 Nov):** the zone filter includes the zones under
the one picked (D13); the "by Competitor" summary lists only named competitors (D14);
the "Competing product" box shows only when the reason is "Competitor Won" (D15).

**Not covered by this run (26 Nov, Basheer):** D7's middle case — an Opportunity with no
product line but a typed indicative value. Today's screens show the value box only from
Qualified onwards or once a product is added (`QuickLeadModal.tsx:608`,
`OpportunityDetailScreen.tsx:2001`), and Qualified needs a product, so the case can't
be made from the screens. The builder's automated test covers it.

## Checked against live data

Checked read-only on Dev, 25 Nov 2026 (admin connection, read-only transaction; whole
table, no RLS filter); EMS Hospital's zone and the lead sources checked the same way on
26 Nov 2026. Re-run in P4 just before the E2E.

- **Who sees:** same as the other reports (D3) — Haroon Sidheeq (General Manager) and
  Abdul Latheef P (Admin) see every Lost Opportunity; Basheer K (SBU Manager, Imaging)
  those owned by Imaging people; Fazal (Area Manager, Imaging, Kasaragod) his team —
  Fahad reports to him; Fahad (Sales Staff, Imaging) his own. Hide-checks, real people
  who must NOT see given rows: Fahad and Fazal must not see Basheer K's 6 Lost; Basheer K
  must not see the Critical Care test row (step 8); Vivek (Sales Staff, Critical Care, no
  Opportunities) and Marketing Test User see an empty list. The Reports menu has no role
  gate (`DemoApp.tsx:70–75`), so everyone sees the menu item.
- **Who can approve:** n/a — no approval step; marking Lost needs a Loss Reason and, for
  "Competitor Won", a Competitor Name (`validators.py:207`), plus the "Why this change?"
  note (BR-OP-22).
- **Who can save:** an Opportunity's owner marks it Lost from Overview → Edit
  Opportunity → Status "Lost" → Save → "Why this change?" → Save. Fahad and Nishad K V
  create their own test Opportunities (Owner = themselves). Creating at Negotiation
  needs a Lead Source, a product line, a Demo Start Date and an Expected Closure Date
  unless fast-tracked (`validators.py:75–105`); step 1 does not fast-track, so no
  manager is named and no notification goes out.
- **Existing values:** 6 Lost Opportunities on Dev, all Imaging, all owned by Basheer K,
  all lost at Lead, none with loss notes:
  - "zz NA E2E – project" (Aster MIMS Calicut), North Kerala — Competitor Won, "samsung",
    no product line, no indicative value → value "—"; closed 18 Nov 2026
  - "zz NA E2E – top bar" (Baby Memorial Hospital), North Kerala — Budget Cancelled, no
    product line, no indicative value → "—"; closed 18 Oct 2026
  - "new lead" (aster medicity), Ernakulam — Budget Cancelled, 1 line ₹1.00 L; closed
    17 Oct 2026
  - "Test opportunity" (Al Shifa Hospital Perinthalmanna), Malappuram — Competitor Won,
    "ge", 1 line ₹12.00 L; **no closed date**
  - "usg" (another hospital), North Kerala — Competitor Won, "Philips", 1 line ₹40.00 L;
    **no closed date**
  - "test Opp 3" (Aster MIMS Calicut), North Kerala — Competitor Won, "siemens", 1 line
    ₹21.00 L; **no closed date**
  The three with no closed date show only under All Time (D4 filters by closed date).
  No Lost Opportunity on Dev is past Lead, none is Critical Care and none is Fahad's, so
  sections A and B create three.
- **EMS Hospital** sits directly in North Kerala (not in a district under it), so "zz
  E2E Loss – price" (EMS Hospital) shows under the North Kerala zone filter (step 16).

## Figures and sources

- The 6 Lost Opportunities, hospitals, zones, owners, reasons, competitors, values and
  closed dates (India time) — Dev query, 25 Nov 2026
- 12 active users, roles, SBUs, zones, managers; Vivek has 0 Opportunities — Dev query,
  25 Nov 2026
- 8 Loss Reasons, all active; 8 stages Lead → Payment Pending — Dev query, 25 Nov 2026
- EMS Hospital's zone North Kerala; Lead Source "COLD_CALL" active — Dev query, 26 Nov
  2026; the picker shows the source's code name (`QuickLeadModal.tsx:568`)
- This Quarter = 2026-Q3, 1 Oct to 31 Dec 2026 — `scripts/quarter.py`, 25 Nov 2026
- Today's labels: "Edit Opportunity", "Status", "Loss Reason *", "Competitor Name *",
  "Why this change?", "Why the change? *", "New Opportunity", "+ Lead", "Indicative
  Value (Lakhs)", Overview "Loss Reason" / "Competitor Name" —
  `OpportunityDetailScreen.tsx:248, 1831, 1861, 2038–2045`, `CloseReminderModal.tsx:524,
  660`, `QuickLeadModal.tsx:441, 610`, `DemoApp.tsx:588`
- New Opportunity form fields: "Account *", "Stage *", "Lead Source", "Owner *", "Win
  Probability % *" (filled from the stage), "+ Add Products", "Fast-Track this
  Opportunity", "Demo Start Date", "Expected Closure Date"; the SBU box shows only for
  Admin and General Manager — `QuickLeadModal.tsx:115, 508, 544–568, 588, 599, 621–635,
  698`
- Zones: Malappuram sits under North Kerala, Ernakulam under South Kerala — Dev query,
  25 Nov 2026; the zone filter includes the zones under the one picked (D13)
- SonoScape E2 Portable USG Machine full price ₹16.00 L — Dev query, 24 Nov 2026
  (Margin Report E2E plan)
- Test Opportunities "zz E2E Loss – Samsung" (Al Shifa Hospital Perinthalmanna), "zz
  E2E Loss – price" (EMS Hospital), "zz E2E Loss – CC" (Aster MIMS Calicut); Competitor
  "Samsung " (trailing space), competing product "HS40", Expected Closure Date 31 Dec
  2026 — made-up test values
- Expected counts and sums below — worked out by hand from the figures above

**Tags:** every step starts with `[Simple]` or `[Complex: <reason>]`. Basheer runs both
kinds from these instructions; a step Claude drives in the browser says `[Complex:
Claude — <reason>]` (steps 7 and 21 only). Steps are grouped by login (regrouped 26 Nov,
before any step ran). Saves to Dev are "Basheer clicks, Claude watches"; Claude reads
each record back in the app. **These saves are permanent:** three Lost test
Opportunities and their Activity-tab notes stay on Dev.

**Phone:** step 27 is the phone, tablet and laptop look.

**Opportunities:** every Opportunity is named with its hospital in brackets.

**Expected figures assume the run is in November 2026.** In December, "This Month"
(step 18) leaves out "zz NA E2E – project" (Aster MIMS Calicut); everything else holds
until 31 Dec.

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
- P2. [Complex: builder — labels from code] The builder corrects every label, column
  name and message in this plan from the built code, and fills in **Built:**. —
- P3. [Simple] Dev `alembic current` = head; `docs/Physical-Schema.sql` regenerated
  since the migration (new column `opportunity.competitor_product_name`). —
- P4. [Complex: read-only Dev query] Claude re-runs the live-data check: the 6 Lost
  above unchanged; Fazal's team still includes Fahad; Nishad K V's team holds no one with
  a Lost Opportunity; EMS Hospital still in North Kerala; "COLD_CALL" still active. —

## A — Fahad (Sales Staff, Imaging): two losses, his own view, and the server check

1. [Complex: multi-step, saves to Dev] "+ Lead" → New Opportunity: Name "zz E2E Loss –
   Samsung"; Account * Al Shifa Hospital Perinthalmanna; Stage * Negotiation; Lead
   Source "COLD_CALL"; Owner * Fahad; leave Win Probability % * as the stage fills it;
   "+ Add Products" → SonoScape E2 Portable USG Machine, 1 × ₹16.00 L; leave "Fast-Track
   this Opportunity" unticked; Demo Start Date today; Expected Closure Date 31 Dec 2026
   → Save. No SBU box (Fahad's own SBU, Imaging). Basheer clicks, Claude watches.
   **Expected:** created at Negotiation, Indicative Value (auto) ₹16.00 L. —
2. [Simple] On "zz E2E Loss – Samsung" (Al Shifa Hospital Perinthalmanna) → Edit →
   Status "Lost", Loss Reason "Competitor Won", leave Competitor Name empty → Save.
   **Expected:** refused — Competitor Name is still required (unchanged). —
3. [Complex: saves to Dev] Same pop-up: Competitor Name "Samsung " (with a space at the
   end), Competing product "HS40" → Save → "Why this change?": "E2E: lost to Samsung" →
   Save. Basheer clicks, Claude watches. **Expected:** "Competing product" sits beside
   Competitor Name (under it on a phone), not marked required (D8, D15); Lost saves. —
4. [Simple] Overview card of "zz E2E Loss – Samsung" (Al Shifa Hospital Perinthalmanna).
   **Expected:** Loss Reason "Competitor Won", Competitor Name "Samsung", Competing
   product "HS40" (D8). —
5. [Complex: multi-step, saves to Dev] "+ Lead" → "zz E2E Loss – price"; Account * EMS
   Hospital; Stage * Lead; Owner * Fahad; no product; no value (the form shows no value
   box at Lead without a product) → Save. Then Edit → Status "Lost", Loss Reason
   "Price" → Save → "Why this change?": "E2E: price" → Save. Basheer clicks, Claude
   watches. **Expected:** no Competitor Name and no Competing product box for "Price"
   (D15); Lost saves. —
6. [Complex: several values] Reports → Sales Loss Report. **Expected:** menu item
   listed; This Quarter selected (D4); exactly two rows, his own: "zz E2E Loss – price"
   (EMS Hospital) — Fahad, Lead, Price, no competitor, value "—" (D7), today; "zz E2E
   Loss – Samsung" (Al Shifa Hospital Perinthalmanna) — Fahad, Negotiation, Competitor
   Won, Samsung, HS40, ₹16.00 L, today. **None of Basheer K's 6** (hide-check, D3). —
7. [Complex: Claude — reads the server reply] Still as Fahad, Claude asks the server for
   the Sales Loss Report with owner = Basheer K. **Expected:** an empty list, never
   Basheer K's rows (D3). —

## B — Nishad K V (Area Manager, Critical Care): the Critical Care loss

8. [Complex: multi-step, saves to Dev] "+ Lead" → "zz E2E Loss – CC"; Account * Aster
   MIMS Calicut; Stage * Lead; Owner * Nishad K V; no product, no value → Save (no SBU
   box; his own SBU, Critical Care). Then Edit → Status "Lost", Loss Reason "Technical
   Mismatch" → Save → "Why this change?": "E2E: CC loss" → Save. Basheer clicks, Claude
   watches. **Expected:** Lost saves. —
9. [Simple] Reports → Sales Loss Report, All Time. **Expected:** one row, "zz E2E Loss –
   CC" (Aster MIMS Calicut), value "—" (D7). No Imaging rows. —

## C — Haroon Sidheeq (General Manager): the whole report, and nothing else changed

10. [Complex: several values] Sales Loss Report, This Quarter. **Expected:** 6 rows,
    newest first: "zz E2E Loss – CC" (Aster MIMS Calicut), "zz E2E Loss – price" (EMS
    Hospital), "zz E2E Loss – Samsung" (Al Shifa Hospital Perinthalmanna), "zz NA E2E –
    project" (Aster MIMS Calicut) 18 Nov, "zz NA E2E – top bar" (Baby Memorial Hospital)
    18 Oct, "new lead" (aster medicity) 17 Oct (D6). —
11. [Simple] Look at the columns. **Expected:** Opportunity, customer, owner, stage lost
    at, Loss Reason, competitor, competing product, value, closed date, on one line; no
    loss notes column (D6). —
12. [Complex: several values] "By Loss Reason" summary. **Expected:** Budget Cancelled
    2, ₹1.00 L; Competitor Won 2, ₹16.00 L; Price 1, no value; Technical Mismatch 1, no
    value (wording from the code, P2). Counts add up to 6 (D5). —
13. [Complex: several values] "By Competitor" summary. **Expected:** one row — Samsung
    (or "samsung"; one row, not two, D9), 2, ₹16.00 L. Lost with no competitor named are
    not listed (D14). —
14. [Simple] Press "Budget Cancelled" in the reason summary. **Expected:** list shows
    "zz NA E2E – top bar" (Baby Memorial Hospital) and "new lead" (aster medicity) only
    (D5). Clear it. —
15. [Simple] Press the Samsung row in the competitor summary. **Expected:** "zz NA E2E –
    project" (Aster MIMS Calicut) and "zz E2E Loss – Samsung" (Al Shifa Hospital
    Perinthalmanna) only. Clear it. —
16. [Complex: several values] Filters one at a time, This Quarter. **Expected:** SBU
    Critical Care → "zz E2E Loss – CC" (Aster MIMS Calicut) only; owner Fahad → his two;
    Loss Reason Price → "zz E2E Loss – price" (EMS Hospital) only; zone Malappuram → "zz
    E2E Loss – Samsung" (Al Shifa Hospital Perinthalmanna) only; zone North Kerala → 5
    rows: "zz E2E Loss – CC" (Aster MIMS Calicut), "zz E2E Loss – price" (EMS Hospital),
    "zz E2E Loss – Samsung" (Al Shifa Hospital Perinthalmanna; Malappuram is under North
    Kerala, D13), "zz NA E2E – project" (Aster MIMS Calicut), "zz NA E2E – top bar" (Baby
    Memorial Hospital); zone South Kerala → "new lead" (aster medicity) (Ernakulam) only.
    Summaries follow each filter. —
17. [Complex: several values] All Time. **Expected:** 9 rows; "Test opportunity" (Al
    Shifa Hospital Perinthalmanna), "usg" (another hospital), "test Opp 3" (Aster MIMS
    Calicut) at the bottom with no closed date. Competitor Won 5, ₹89.00 L; competitors
    Samsung 2 ₹16.00 L, Philips 1 ₹40.00 L, siemens 1 ₹21.00 L, ge 1 ₹12.00 L. —
18. [Simple] This Month. **Expected:** 4 rows — the three "zz E2E Loss" and "zz NA E2E –
    project" (Aster MIMS Calicut) (November run). —
19. [Complex: cross-screen] This Quarter, Loss Reason "Competitor Won"; press "zz E2E
    Loss – Samsung" (Al Shifa Hospital Perinthalmanna). **Expected:** its Opportunity
    screen opens; Back returns to the Sales Loss Report with This Quarter and "Competitor
    Won" still set (D6). —
20. [Simple] Open "zz NA E2E – project" (Aster MIMS Calicut) → Overview. **Expected:**
    Competitor Name "samsung"; Competing product blank (old Lost, D8). —
21. [Complex: Claude — reads the server reply] Still as Haroon, Claude reads the
    Opportunity reply for "zz E2E Loss – Samsung" (Al Shifa Hospital Perinthalmanna).
    **Expected:** `competitor_name` "Samsung" (trimmed), `competitor_product_name`
    "HS40". —
22. [Simple] Open the Sales Report. **Expected:** name "Sales Report" (D12); looks and
    counts as before. —
23. [Simple] Reports menu. **Expected:** the other seven reports are listed and open. —
24. [Simple] Open "zz E2E Loss – price" (EMS Hospital) → Edit, change nothing, Cancel.
    **Expected:** nothing asked, nothing saved. —
25. [Simple] Product Performance, This Quarter → a product's "Lost" link. **Expected:**
    works as before (it reads product lines, so "zz E2E Loss – price" (EMS Hospital) is
    not there — unchanged). —
26. [Simple] Customer 360 of Al Shifa Hospital Perinthalmanna → Opportunities.
    **Expected:** "zz E2E Loss – Samsung" listed as Lost; nothing else changed (plan 3c). —
27. [Complex: phone layout] Still as Haroon, at 390, 768 and 1280 px: Sales Loss Report
    (both summaries, the list, Filters) and the Lost pop-up with "Competing product"
    (open it on "zz E2E Loss – price" (EMS Hospital) → Edit, pick "Competitor Won" to
    show the box, then Cancel — nothing saved). **Expected:** on a phone each summary is
    a block; each Lost Opportunity a card — name; customer and owner; reason and
    competitor; value, stage lost at and closed date; no notes (D6a); pressing a card
    opens the Opportunity; filters behind "Filters"; "Competing product" under
    Competitor Name; nothing runs past the card. —

## D — Abdul Latheef P (Admin)

28. [Simple] Sales Loss Report, All Time. **Expected:** the same 9 rows as step 17. —

## E — Basheer K (SBU Manager, Imaging)

29. [Complex: several values] Sales Loss Report, All Time. **Expected:** 8 rows — his 6
    and Fahad's 2; **not** "zz E2E Loss – CC" (Aster MIMS Calicut) (hide-check, D3). —

## F — Fazal (Area Manager, Imaging) and the empty lists

30. [Simple] As Fazal, Sales Loss Report, All Time. **Expected:** Fahad's two only; none
    of Basheer K's (hide-check). —
31. [Simple] As Vivek, Sales Loss Report, All Time. **Expected:** menu item shown; empty
    list with the empty-list wording (P2); summaries empty, no error. —
32. [Simple] As Marketing Test User, Sales Loss Report, All Time. **Expected:** empty,
    as step 31. —
