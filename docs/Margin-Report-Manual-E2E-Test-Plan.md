<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Margin Report — Manual E2E Test Plan

**Covers:** `docs/Margin-Report-Implementation-Plan.md` (Approved 24 Nov 2026, D1–D13;
D13a–D16, including D13f, added 25 Nov; D17–D21 added 26 Nov; D20 drops D17).
**Built:** all steps pushed (handed to Build & Test 24 Nov 2026, Basheer): saved cost
`18ae6c3`, first-cost fill `0084a92`, Won/Lost products lock `595241e` and `36a931a`,
server figures `d3baaa6`, screen `2cb5a0b`, pre-E2E review fixes `fb31c08`, D19–D21
changes made during the E2E `1852540`.
**Where:** Dev only. Nothing here runs on UAT; the UAT one-time cost fill (D12) waits for the price sheet there.

**Written ahead of the build (Plan & Chore, 24 Nov 2026).** Build & Test corrected the
button labels, menu names and messages from the built code on 26 Nov 2026 (P2).

## Checked against live data

Checked read-only on Dev, 24 Nov 2026, with all three RLS settings (user, role, SBU)
set and verified (signed in as Admin Abdul Latheef P; Admin has no SBU). On 26 Nov 2026
the costs, saved costs, Won lines and the S70 in the product picker were re-checked the
same way. Re-run in P4 just before the E2E.

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
- **Existing values:** 79 products (24 Nov), 3 with a catalog cost (26 Nov): SonoScape
  E2 ₹8.00 L, S50 Elite ₹25.00 L, S70 ₹24.00 L (the S70 is on no Won Opportunity).
  The E2 and S50 Elite Won lines carry those same costs, marked "filled in later";
  the E1 and X3 lines have none. 6 Won Opportunities, all Imaging, one product line
  each:
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
not the design doc (corrected from the built code 26 Nov 2026).

## Figures and sources

- 12 active users, their roles and SBUs — Dev query, 24 Nov 2026
- 79 products; S70 full price ₹48.00 L — Dev query, 24 Nov 2026
- Catalog costs E2 ₹8.00 L, S50 Elite ₹25.00 L, S70 ₹24.00 L, no other product has
  one; saved costs on the Won lines — Dev query, 26 Nov 2026
- Lowest prices: E2 ₹10.50 L to ₹11.50 L, S70 ₹33.00 L to ₹37.00 L; the S70 is an
  active Imaging product, 15th of 20 in the picker's list — Dev query, 26 Nov 2026
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
- S50 Elite cost changed to ₹22.00 L (step 17) and E1 costs ₹4.00 L then ₹3.50 L —
  made-up test values (₹3.50 L, not ₹4.50 L: a cost above E1's CEO's lowest ₹4.25 L
  is refused — Basheer, 26 Nov)
- New test Opportunity "zz E2E Margin – win" (Baby Memorial Hospital), its ₹30.00 L
  price, ₹1.00 L discount, ₹2.00 L trade-in "Old test USG", and the E2 added at
  ₹12.00 L in the correction — made-up test values
- Step 13 PO number "PO-E2E-MARGIN", the activity and next-action text; expected value
  ₹27 L (₹30 L − ₹1 L discount − ₹2 L trade-in) — made-up test values and their sum
- Steps 25e/25f price ₹31 L then ₹30 L and their reasons — made-up test values; the
  Opportunity values ₹39 L, ₹65 L and ₹66 L (steps 23–25f) — sums of the test prices
- Swap step 25b/25c: S70 cost ₹24.00 L — the 26 Nov Dev query; its ₹38.00 L price —
  made-up test value; no change-product control on a line, the × button and the Note
  wording — `OpportunityItemsList.tsx`, `opportunity/service.py`
  `_describe_item_changes` and `_replace_closed_items`, read 26 Nov 2026
- Expected sums and percentages below — worked out by script from the figures above,
  26 Nov 2026 (Plan & Chore checked them the same day); margin % rounded to one decimal.
  Figures for D20 (no-cost sales out of the table) reworked by script, 26 Nov, Build &
  Test; not re-checked by Plan & Chore

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Basheer runs Complex steps too, from these
instructions; a step Claude drives in the browser says `[Complex: Claude — <reason>]`
(two steps, H1–H2: reading what the screen doesn't show). Steps are grouped by login.
Saves to Dev are "Basheer clicks, Claude watches"; Claude reads the record back in the
app.

**Phone:** step 36 is the phone, tablet and laptop look of the Margin Report and the
reason box.

**Opportunities:** every Opportunity is named with its hospital in brackets.

**Sales with no saved cost (plan D20, Basheer 26 Nov):** they are in no row and no total,
in any grouping. They show only in the list "No cost entered — not in the margin" below
the table, where a click on a product opens its Opportunities. The total has no
Quantity. The figures below use this (section A: −₹1.00 L ÷ ₹48.00 L = −2.1%).

## Before the build applies its migration (set-up — order matters)

The migration is already applied to Dev. Its one-time fill (D12) copied the catalog
costs of that day: E2 ₹8.00 L, S50 Elite ₹25.00 L.

- P0. [Simple] Not to be run — the set-up is over. **Expected:** nothing to do; P4
  checks the saved costs. —

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
  Pass (26 Nov 2026; Basheer restarted it, process started 13:07, margin report
  address answers)
- P2. [Complex: Build & Test — labels from code] Build & Test corrects every label,
  menu name and message in this plan from the built code, and completes **Built:**. —
  Pass (26 Nov 2026, Build & Test; read from the screen and server code, not seen in a
  browser)
- P3. [Simple] Dev `alembic current` = head; `docs/Physical-Schema.sql` regenerated
  since the migration. — Pass (26 Nov 2026: `0068 (head)`; schema file committed with
  the migration, `18ae6c3`)
- P4. [Complex: read-only Dev query] Claude re-runs the live-data check: the 6 Won
  Opportunities carry saved costs E2 ₹8.00 L (three lines) and S50 Elite ₹25.00 L,
  marked "filled in later"; E1 and X3 lines have none. Catalog: E2 ₹8.00 L, S50 Elite
  ₹25.00 L, S70 ₹24.00 L, E1 and X3 none. — Pass (26 Nov 2026, Dev read-only as Admin:
  all as stated; no "zz E2E" Opportunity yet. Found: E1's CEO's lowest is ₹4.25 L, so a
  ₹4.50 L cost in step 28c would be refused; the step now uses ₹3.50 L)

## A — Haroon Sidheeq (General Manager): the report on existing data

1. [Simple] Open the Reports menu. **Expected:** "Margin Report" is listed. — Pass
(26 Nov 2026, Basheer)
2. [Simple] Open Margin Report. **Expected:** "Period" box shows "This Quarter", "Group
   by" box shows "Product", with "Oct–Dec 2026" beside them (D2, D7). — Pass
   (26 Nov 2026, Basheer)
3. [Complex: several values] Read the rows. **Expected:** two rows, no E1 row (D20):
   SonoScape E2 — Quantity 3, Sold for ₹19.00L, Cost ₹24.00L, Margin −₹5.00L, −26.3%
   (both in red, D18); SonoScape S50 Elite — Quantity 1, ₹29.00L, ₹25.00L, ₹4.00L,
   13.8%. — Pass (26 Nov 2026, Basheer)
4. [Simple] Read below the table. **Expected:** a list headed "No cost entered — not in
   the margin": columns Product, Sales, Value sold; one product — SonoScape E1, 1,
   ₹5.00L (D15, D20). — Pass (26 Nov 2026, Basheer)
5. [Complex: several values] Read the "Total" row at the top. **Expected:** Sold for
   ₹48.00L (₹53.00L would mean the no-cost sale is still counted, D20), Cost ₹49.00L,
   Margin −₹1.00L, −2.1%; Margin and Margin % in red with the minus sign (D18); no
   Quantity (D20). On a phone the card has no "Total" word and no % (D21). — Pass
   (26 Nov 2026, Basheer)
6. [Simple] Look under the row names for "cost filled in later". **Expected:** shown
   under E2 and S50 Elite, not E1 — every costed line here was filled by the one-time
   fill (D12). — Pass (26 Nov 2026, Basheer)
7. [Complex: several values] Group by Rep. **Expected:** Basheer K — Sold for
   ₹18.00L (E1's ₹5.00L left out, D20), Cost ₹16.00L, Margin ₹2.00L, 11.1%; Fahad —
   ₹30.00L, ₹33.00L, −₹3.00L, −10.0% (both in red, D18). Rows add up to the Total
   row. — Pass (26 Nov 2026, Basheer)
8. [Complex: several values] Group by Brand, then SBU, then Zone. **Expected:** Brand —
   one row, SonoScape; SBU — one row, Imaging; Zone — a zone includes the zones listed
   under it, so the top-level rows add up to the Total row; below the table, "Each
   zone's figures include the zones listed under it." Under all three, the same
   no-cost list as step 4 (D20). — Pass (26 Nov 2026, Basheer)
9. [Simple] Period "This Month". **Expected:** no rows (nothing won in November yet);
   the message "No Opportunities won in this period.", not an error. — Pass (26 Nov
   2026, Basheer)
10. [Complex: several values] Period "All Time", by Product. **Expected:** "All time"
    beside the boxes; rows and Total as steps 3 and 5 (no X3 row); the no-cost list now
    has two products — SonoScape E1, 1, ₹5.00L, and SonoScape X3, 1, ₹4.00L (from "USG
    2", another hospital) (D20). — Pass (26 Nov 2026, Basheer)
11. [Complex: cross-screen] This Quarter, by Product: click the S50 Elite row.
    **Expected:** the Pipeline list opens, labelled "SonoScape S50 Elite USG Machine,
    Won, This Quarter", with one Opportunity, "Test new fastrack opportunity from
    Project 360" (Aster MIMS Calicut); no cost anywhere on it (D10). — Pass (26 Nov
    2026, Basheer)
11a. [Complex: cross-screen] Margin Report, This Quarter: in the no-cost list click
    SonoScape E1. **Expected:** the Pipeline list opens, labelled "SonoScape E1 Portable
    USG Machine, Won, This Quarter", with one Opportunity, "zz NA E2E – fast track Won"
    (Baby Memorial Hospital) (D20). — Pass (26 Nov 2026, Basheer)
12. [Complex: cross-screen] Sales Report, This Quarter, by Product: click a row.
    **Expected:** the right Pipeline list opens, as before (plan section 3). — Pass
    (26 Nov 2026, Basheer)

## B — Basheer K (SBU Manager, Imaging): a new Won, and the lock

13. [Complex: multi-step, saves to Dev] Top bar "+ Lead": name "zz E2E Margin – win",
    hospital Baby Memorial Hospital, Stage Payment Pending, Lead Source Repeat Order
    (Fast-Track not ticked). "+ Add Products" → "Add Product": SonoScape S50 Elite, Qty
    1, Price ₹L 30, Disc ₹L 1 → "+ Add Product"; then "Buyback": Machine description
    "Old test USG", Credit ₹L 2 → "− Add Buyback" → Done. PO Number "PO-E2E-MARGIN", PO
    Date today → Create → fill the "First activity" pop-up (Details and Follow-up) →
    Create. Then Edit → status Won → tick "I confirm full payment has been received *" →
    Save → "Why this change?": fill "Why the change?", leave the follow-up empty → Save.
    Basheer clicks, Claude watches. **Expected:** Won saves; value ₹27L; closed date
    today, shown as before (plan section 3). —
14. [Simple] On "zz E2E Margin – win" (Baby Memorial Hospital) → Products tab.
    **Expected:** no Edit button (D13). —
15. [Simple] Open Lost "new lead" (aster medicity) → Products tab. **Expected:** no Edit
    button. —
16. [Simple] Open the Reports menu. **Expected:** no "Margin Report". —

## C — Haroon Sidheeq: cost saved on the Won day, and a correction

17. [Simple] Product Catalog → SonoScape S50 Elite → Edit → "Cost" 22.00 → "Save
    Changes". Basheer clicks, Claude watches. **Expected:** saved. —
18. [Complex: several values] Margin Report, This Month, by Product. **Expected:** S50
    Elite — Quantity 1, Sold for ₹29.00L, Cost ₹25.00L (saved on the Won day, not
    today's ₹22.00L), Margin ₹4.00L, 13.8% (D4); no "cost filled in later" mark on
    it. —
19. [Simple] Read the line below the table. **Expected:** "Trade-ins: ₹2.00L — not in
    the margin" (D6). —
20. [Complex: several values] This Quarter, by Product. **Expected:** S50 Elite —
    Quantity 2, Sold for ₹58.00L, Cost ₹50.00L, Margin ₹8.00L, 13.8% — the older Won
    keeps its ₹25.00L too; "cost filled in later" shows under it (the older sale). —
21. [Simple] "zz E2E Margin – win" (Baby Memorial Hospital) → Products tab.
    **Expected:** Edit shown ("+ Add" appears only on an Opportunity with no
    products). —
21a. [Simple] Edit → Save without changing anything. **Expected:** no pop-up, nothing
    saved, no new note on the Activity tab (D13b). —
21b. [Complex: saves to Dev] "zz E2E Margin – win" (Baby Memorial Hospital) →
    Activity tab → + Log → Type "Call" → "Next Action *" tab: type "zz E2E – Haroon
    follow-up"; leave the due date (tomorrow) and "Assign Next Action To" ("Me
    (default)") as they are → Log. Basheer clicks, Claude watches. **Expected:** saved;
    the Next Actions tab shows it open, assigned to Haroon (steps 23 and 25 need it,
    D13d). —
22. [Simple] Products tab → Edit → "Add Product": SonoScape E2, Qty 1, Price ₹L 12 →
    "+ Add Product" → Save; then Save in the pop-up with the box empty. **Expected:**
    the "Why this change?" pop-up opens with one box, "Who asked for this change, and
    why? *", no next-action questions (D13c); the empty Save shows "Say who asked for
    this change, and why" and nothing is saved. —
23. [Complex: saves to Dev] Type the reason "Fahad: PO shows E2 added" → Save. Basheer
    clicks, Claude watches. **Expected:** saved; both lines shown; Opportunity value
    ₹39L. Not refused even though Haroon has an open next action of their own on this
    Opportunity (D13d; set up in step 21b). —
24. [Complex: several values] Margin Report, This Month, by Product. **Expected:** S50
    Elite still Cost ₹25.00L (kept, D13); E2 — Quantity 1, ₹12.00L, Cost ₹8.00L
    (today's catalog cost), Margin ₹4.00L, 33.3%. —
25. [Simple] "zz E2E Margin – win" (Baby Memorial Hospital) → Activity tab.
    **Expected:** one new Note by Haroon reading "Products changed on this Won
    Opportunity." / "Reason: Fahad: PO shows E2 added" / "- Added: SonoScape E2
    Portable USG Machine x 1 at ₹12.00 L each" (D13a, D13c); Haroon's own next action
    still open and no new next action (D13d). The history log shows the E2 line
    added. —
25a. [Simple] Fahad's Active "Test one more direct Opportunity" (EMS Hospital) →
    Edit → change the stage → Save. **Expected:** the usual "Why this change?" pop-up
    with its next-action questions, unchanged by the new mode. Cancel; don't save
    (D13e, pop-up re-test). —
25b. [Complex: saves to Dev] "zz E2E Margin – win" (Baby Memorial Hospital) → Products
    tab → Edit → remove the SonoScape E2 line with its × → under "Add Product" pick
    SonoScape S70 USG Machine, Qty 1, Price ₹L 38 → "+ Add Product" → Save → reason
    "Fahad: PO shows S70, not E2" → Save. Basheer clicks, Claude watches. (The screen
    can't change the product on an existing line, so a swap is remove + add.)
    **Expected:** saved; S50 Elite and S70 shown, no E2; Opportunity value ₹65L.
    Activity tab: one new Note
    "Products changed on this Won Opportunity." / "Reason: Fahad: PO shows S70, not E2" /
    "- Added: SonoScape S70 USG Machine x 1 at ₹38.00 L each" / "- Removed: SonoScape E2
    Portable USG Machine x 1". —
25c. [Complex: several values] Margin Report, This Month, by Product. **Expected:** no E2
    row; S70 — Quantity 1, ₹38.00L, Cost ₹24.00L (the catalog cost on the day of the
    swap, not E2's ₹8.00L) (D13f), Margin ₹14.00L, 36.8%, no "cost filled in later"
    mark; S50 Elite unchanged. —
25d. [Complex: multi-step] "zz E2E Margin – win" (Baby Memorial Hospital) → Products
    tab → Edit → remove the SonoScape S50 Elite line with its × → add it again under
    "Add Product": Qty 1, Price ₹L 30, Disc ₹L 1 → "+ Add Product" → Save.
    **Expected:** no pop-up, nothing saved, no new Note on the Activity tab (D13g,
    D13b). —
25e. [Complex: saves to Dev] Same tab (S50 Elite catalog cost still ₹22.00L) → Edit →
    remove S50 Elite → add it again at Qty 1, Price ₹L 31, Disc ₹L 1 → Save → reason
    "Fahad: PO price is 31" → Save. Basheer clicks, Claude watches. **Expected:**
    saved; Opportunity value ₹66L; one new Note with a "Changed" line for the S50
    Elite price, nothing Added or Removed. Margin Report, This Month, by Product: S50
    Elite Sold for ₹30.00L, Cost ₹25.00L (kept, not ₹22.00L), Margin ₹5.00L, 16.7%
    (D13g). —
25f. [Complex: saves to Dev] Same again at Price ₹L 30 → reason "Fahad: price back to
    30" → Save. Basheer clicks, Claude watches. **Expected:** saved; Opportunity value
    ₹65L; S50 Elite Sold for ₹29.00L, Cost ₹25.00L, Margin ₹4.00L, 13.8%, so the
    later totals hold. —
26. [Simple] Lost "new lead" (aster medicity) → Products tab. **Expected:** Edit shown
    for Haroon. Don't save. —
27. [Simple] Product Catalog → S50 Elite → Edit → "Cost" back to 25.00 → "Save
    Changes". **Expected:** saved (Dev tidy). —

## D — Abdul Latheef P (Admin)

28. [Simple] Reports → Margin Report, This Quarter. **Expected:** menu item shown;
    Total Sold for ₹115.00L, Cost ₹98.00L, Margin ₹17.00L, 14.8%; the no-cost list
    shows SonoScape E1, 1, ₹5.00L (D20). —
28a. [Complex: saves to Dev] Product Catalog → SonoScape E1 (no cost yet) → Edit →
    "Cost" 4.00 → "Save Changes". Basheer clicks, Claude watches. **Expected:** saved
    (first cost, D16). —
28b. [Complex: several values] Margin Report, This Quarter, by Product. **Expected:** E1
    now has a row — Quantity 1, Sold for ₹5.00L, Cost ₹4.00L, Margin ₹1.00L, 20.0%,
    marked "cost filled in later"; the no-cost list is gone; Total Sold for ₹120.00L,
    Cost ₹102.00L, Margin ₹18.00L, 15.0% (D16, D20). The S50 Elite, E2 and S70 rows
    unchanged. —
28c. [Complex: saves to Dev] Product Catalog → E1 → Edit → "Cost" 3.50 → "Save
    Changes", then Margin Report. **Expected:** E1 still at ₹4.00L a unit — changing an
    existing cost touches no past sale (D16, D4). E1 keeps a Dev cost afterwards (test
    value). —

## E — Fahad (Sales Staff, Imaging): hide-checks

29. [Simple] Open the Reports menu. **Expected:** no "Margin Report". —
30. [Simple] His Won "Test new fastrack opportunity from Project 360" (Aster MIMS
    Calicut) → Products tab. **Expected:** no Edit button. —
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

34. [Simple] As Haroon, Sales Report → "Period" box: choose This Quarter, This Month,
    All Time. **Expected:** beside the box "Oct–Dec 2026", "Nov 2026", "All time";
    figures load for each; the screen looks as before. —
35. [Complex: phone layout] Reason box on a Won Opportunity's Products tab (as Haroon)
    at 390, 768, 1280 px. **Expected:** box and Save fit; nothing runs past the card. —
36. [Complex: phone layout] Margin Report at 390, 768, 1280 px, every group-by, the
    no-cost and trade-in lines; at each width make the window short enough to scroll.
    **Expected:** at 390: "Margin Report" on one line with the Period and Group by boxes,
    the Period box showing "Oct–Dec 2026" ("Nov 2026", "All time" when changed); below
    it one totals card of one line — "Sold for …", "Cost …", "Margin …", with no
    "Total" word, no % and no Quantity (D21); each row a block — name on top, then
    Quantity, then Sold for and Cost side by side, then Margin and Margin % side by
    side; each product in the no-cost list a block with an arrow. At 768 and 1280: title
    band, date beside the boxes, Total row under the column headings, no Quantity in it.
    At every width the title, boxes and totals (and on a laptop the headings) stay put
    while only the rows scroll; nothing runs past the card (D19–D21, plan "On a
    phone"). —
