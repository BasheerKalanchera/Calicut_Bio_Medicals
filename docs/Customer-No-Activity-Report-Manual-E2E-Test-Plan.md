<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Customer with No Activity Report — Manual E2E Test Plan

**Covers:** `docs/Exception-Report-Implementation-Plan.md`, D2–D13 and D15,
one run after the build. Written 2026-11-04, ahead of the build.
**Built:** not yet built.
**Where:** Dev.

**What this run proves.** The right customers are on each person's list,
in the right order, and the people who shouldn't see a customer don't.
Sections A and B only read. Section C saves test records and checks that
each one moves a customer on or off the list as decided.

## Checked against live data

Checked read-only on Dev, 2026-11-04 09:04–09:08 IST, app connection as
Abdul Latheef P (Admin), all three RLS settings set and verified, rolled
back. **These lists change with the calendar:** P2 re-runs the check just
before the run and updates the expected figures below.

- **Who sees:** Haroon Sidheeq (General Manager, all customers) 27 listed:
  1 gone quiet, 26 never contacted. Basheer K (SBU Manager, Imaging, all
  customers) 28 listed: 1 gone quiet, 27 never contacted. Nishad K V (Area
  Manager, Critical Care, no team) 21, all never contacted. Arun Adarsh
  (Area Manager, Critical Care, team: Vivek) 3. Fazal (Area Manager,
  Imaging, team: Fahad) 7. Shruthi (Area Manager, Imaging, team: Rudrappa)
  4. Vivek (Sales Staff, Critical Care) 2. Fahad (Sales Staff, Imaging) 1.
  Rudrappa (Sales Staff, Imaging) 1. Hide-checks: Vivek must NOT see "new
  customer" (Mangalore) or "EMS cooperative hospital Cherpulassery"
  (Palakkad, on Arun Adarsh's list). Fahad must NOT see "Test hospital 3"
  (Kottayam) or "astar" (Kasaragod).
- **Who can approve:** n/a — nothing in this feature is approved.
- **Who can save:** only Admin and General Manager can add a product (C1,
  Haroon Sidheeq). SBU Manager can add a customer in any zone (C7, Basheer
  K). C2, C4, C5 and C8 are Basheer K's. C9's Opportunity is Arun Adarsh's;
  "Test hospital 3" is in Vivek's zone, so it is in Arun Adarsh's team scope.
- **Existing values:** 38 customers, none of type Dealer. 6 branches. No
  Opportunity is accessory-only. The one accessory product, ECG Cable
  (Critical Care), is inactive and retired, so C1 adds a test product. No
  activity is dated in the future. "Test customer 3", "Test Hospital" and
  "Test hospital 3" have no activity and no Opportunities. "Test hospital 2"
  (Kollam): one Critical Care contact, Vivek, 29 Oct 2026. "Elite
  Diagnostics" (North Kerala): last Imaging contact 3 Jul 2026 by Basheer K,
  none by Critical Care or anyone with no SBU; 1 Active Imaging Opportunity,
  1 installed asset. "Aster MIMS Calicut" (North Kerala): Nishad K V 1 Aug
  2026 (over 90 days), Haroon Sidheeq 31 Oct 2026. "EMS Hospital" (North
  Kerala): Imaging contact only, Fahad, 29 Oct 2026; 1 Active Critical Care
  Opportunity. "asdf - Test Regression" is a branch of "Al Shifa Hospital
  Perinthalmanna"; the branch has no activity, the main hospital was
  contacted 9 Sep 2026 by Fazal.

Labels on existing forms are taken from the code (`QuickLeadModal.tsx`,
`CloseReminderModal.tsx`, `LogActivityModal.tsx`, `AddHospitalModal.tsx`,
`ProductCatalogScreen.tsx`, `OpportunityItemAddRow.tsx`, read 2026-11-04).
The new screen doesn't exist yet: its tile wording and empty message are
read from the built code at P2, and written into the steps.

## Figures and sources

- Every list count, name, zone, date and "days" figure above and below —
  read-only Dev queries, 2026-11-04 09:04–09:08 IST (scratchpad
  `exception_e2e_dev_data.txt`, `exception_e2e_expected.txt`,
  `exception_e2e_accessory.txt`, `exception_e2e_zones.txt`)
- Dates that will change the lists: Al Shifa Hospital Perinthalmanna joins
  Nishad K V's list from 5 Nov 2026 (Haroon Sidheeq's contact of 6 Aug);
  Test Bangalore Customer joins the Imaging lists from 14 Nov 2026 (Abdul
  Latheef P's contact of 16 Aug) and Maulana from 16 Nov 2026 (18 Aug) —
  worked out from the same queries
- Only General Manager and Admin add products — `ProductCatalogScreen.tsx:30`
- Accessories are offered through "+ Add Accessory" — `OpportunityItemAddRow.tsx:155`
- Creating an Opportunity opens the "First activity" pop-up —
  `QuickLeadModal.tsx:389`, `CloseReminderModal.tsx:418`
- Manager Note asks for no next action — `LogActivityModal.tsx:114`
- The date box has no upper limit, and the server has no future-date
  check — `LogActivityModal.tsx:411-416`, search of
  `backend/app/domains/activity/`, 2026-11-04
- Names starting "zz NoActivity", the Win Probability of 10, the dates in
  C5 and C8 — made up for this run

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]`. Basheer runs Complex steps too,
from exact instructions; a step Claude runs says so — `[Complex: Claude —
<reason>]` (Basheer, 2026-10-29). Saves to Dev are "Basheer clicks, Claude
watches"; Claude reads the record back in the app.

**Phone:** D1 and D2 are the first look at this screen at 390, 768 and
1280 px. On a phone each customer is a card; on a tablet or laptop, a table.

**Opportunities:** every Opportunity is named with its hospital in
brackets.

**Not tested on Dev** (backend tests cover them):
- Exactly 89 and 90 days — live dates can't be set to order; the check is
  "90 or more" (D6).
- A rep's count of Active Opportunities that aren't their own (D15) — no
  Sales Staff tester on Dev has such a line today.
- A person picking someone outside their team through a hand-made request
  gets an empty list — the Rep picker never offers it.

**Left on Dev permanently:** C1's product and new model (the product can be
made inactive), C2's
Opportunity and Visit, C4's Manager Note, C5's Call and next action, C7's
customer, C8's future-dated Visit and next action, C9's Opportunity and
Visit. Activities can't be deleted.

## Pre-flight

- P1. [Simple] Dev backend restarted after the build's last backend
  change; `alembic current` on Dev = the new head; Physical-Schema.sql
  regenerated. —
- P2. [Simple] Live-data check re-run (Claude, read-only): every list
  count and name below updated for the day of the run; no Dealer added;
  "Test customer 3", "Test Hospital" and "Test hospital 3" still with no
  activity; hide-check people still outside those zones. Tile wording and
  empty message read from the built code and written into the steps. —
- P3. [Simple] Signed in as Basheer K in one window; private windows for
  the other testers as each section asks. —

## A — The screen (Basheer K)

1. [Simple] Open the Reports menu. **Expected:** "Customer with No
   Activity" is listed; tapping it opens the screen with that title. —
2. [Simple] Look above the list. **Expected:** two number tiles, gone quiet
   1 and never contacted 27. No box to change the 90 days (D6, D8a). —
3. [Simple] Read the first row. **Expected:** Elite Diagnostics, North
   Kerala, last activity 3 Jul 2026, Basheer K, 124 days, 1 Active
   Opportunity, 1 installed asset (D8, D9; days go up by one each day). —
4. [Simple] Read the second row. **Expected:** "Never contacted", with no
   date, name or days; every row after it is the same (D8). —
5. [Simple] Find "asdf - Test Regression", then look for "Al Shifa Hospital
   Perinthalmanna". **Expected:** the branch is listed; the main hospital
   isn't (D11). —
6. [Simple] Tap "Elite Diagnostics". **Expected:** its customer page opens.
   Go back. **Expected:** the report list again (D13). —
7. [Simple] Open Reports → Stagnant Opportunities, then Reports → Daily
   Activity Report. **Expected:** both open as before (plan section 3). —

## B — Who sees what

1. [Complex: cross-role] Haroon: open the screen. **Expected:** tiles 1 and
   26. "Test hospital 2" isn't listed: Vivek's contact counts in the
   all-customers view (D5). —
2. [Simple] Basheer K: find "Test hospital 2". **Expected:** listed as
   "Never contacted": an Imaging list ignores a Critical Care contact (D5). —
3. [Simple] Haroon: Rep picker → Vivek. **Expected:** exactly "KIMS Hospital
   Trivandrum" and "Test hospital 3", the same as Vivek's own list in B8
   (plan section 1). —
4. [Complex: cross-role] Nishad K V: open the screen. **Expected:** 21
   listed, including "astar" (Kasaragod), which sits in a zone below North
   Kerala (D4). No Rep picker: no team (D13). —
5. [Simple] Nishad K V: find "EMS Hospital" and "Aster MIMS Calicut".
   **Expected:** EMS Hospital is listed as "Never contacted" with 1 Active
   Opportunity: Fahad's Imaging contact doesn't count (D5). Aster MIMS
   Calicut isn't listed: Haroon's contact of 31 Oct counts for both SBUs
   (D5). —
6. [Complex: cross-role] Arun Adarsh: open the screen. **Expected:** 3
   listed: "EMS cooperative hospital Cherpulassery", "KIMS Hospital
   Trivandrum", "Test hospital 3". "Test hospital 2" isn't listed: Vivek's
   contact counts for their manager too (D3, D5). —
7. [Simple] Arun Adarsh: Rep picker. **Expected:** offers Arun Adarsh and
   Vivek, nobody else. Pick Vivek. **Expected:** 2 listed (D3). —
8. [Complex: hide-check, cross-role] Vivek: open the screen. **Expected:**
   exactly "KIMS Hospital Trivandrum" and "Test hospital 3". "new customer"
   and "EMS cooperative hospital Cherpulassery" are NOT listed. No Rep
   picker. Zone picker offers Vivek's 6 zones (D3, D4, D13). —
9. [Simple] Vivek: Zone picker → Kottayam. **Expected:** only "Test hospital
   3". —
10. [Complex: hide-check, cross-role] Fahad: open the screen. **Expected:**
    exactly "new customer". "Test hospital 3" and "astar" are NOT listed. No
    Rep picker, no Zone picker: one zone, none below (D13). —
11. [Complex: cross-role] Fazal: open the screen. **Expected:** 7 listed.
    Rep picker offers Fazal and Fahad. Pick Fahad. **Expected:** only "new
    customer". Back to all, Zone picker → Kozhikode. **Expected:** "aster",
    "aster hospital", "Aster MIMS Mother Hospital Areekode" (D3, D13). —
12. [Complex: cross-role] Shruthi: open the screen. **Expected:** 4 listed,
    including "kims" (Cluster 1, Rudrappa's zone). Pick Rudrappa.
    **Expected:** only "kims" (D3, D4). —
13. [Complex: cross-role] Marketing Test User, who has no zones: open the
    screen. **Expected:** the clear empty message, no error (plan
    addendum). —
14. [Simple] Nishad K V: Zone picker → Kozhikode. **Expected:** the picker
    shows, though Nishad holds only North Kerala, and offers it and the 5
    zones below it. The list narrows to "aster", "aster hospital" and "Aster
    MIMS Mother Hospital Areekode". "Government Medical College Kozhikode" and
    "Meitra Hospital Kozhikode" drop out: they are filed under North Kerala
    itself (D13, plan's "Known limit"). —

## C — What moves a customer on or off the list (saves; Basheer clicks, Claude watches)

1. [Complex: saves to Dev] Haroon: Product Catalog → Add Product. SBU
   Imaging, any Imaging Brand, "+ Add new model", New model name "zz NoActivity
   accessory", any Category offered, Add Model. Product Type Accessory, Add
   Product. **Expected:** saved, and listed in the catalogue as Accessory. —
2. [Complex: saves to Dev] Basheer K: New Opportunity. Name "zz NoActivity
   accessory opp", Account "Test customer 3", Stage Lead, Owner Basheer K,
   Win Probability 10. "+ Add Products" → "+ Add Accessory" → "zz NoActivity
   accessory", Done. Create. On the "First activity" pop-up: Type Visit, fill
   the rest, Create. **Expected:** "zz NoActivity accessory opp" (Test
   customer 3) opens, with the accessory on it and the Visit in its
   activity. —
3. [Simple] Basheer K: this screen, refresh. **Expected:** "Test customer 3"
   is still listed as "Never contacted": a visit on an accessory-only
   Opportunity doesn't count (D7). —
4. [Complex: saves to Dev] Basheer K: at "Test Hospital" (Bangalore), Log
   Activity, Manager Note, "This Note Is For" Basheer K, fill the rest, save.
   Refresh this screen. **Expected:** "Test Hospital" is still listed as
   "Never contacted": a Manager Note doesn't count (D2). —
5. [Complex: saves to Dev] Basheer K: at "Test Hospital", Log Activity, Call,
   today's date, next action "zz NoActivity follow-up" due a week later, save.
   Refresh this screen. **Expected:** "Test Hospital" is gone; the
   never-contacted tile is one lower (D2). —
6. [Complex: cross-role] Shruthi and Haroon: refresh. **Expected:** "Test
   Hospital" is gone from both, and "Test customer 3" is on both (D5, D7). —
7. [Complex: saves to Dev] Basheer K: Customers, add a customer through the
   New Customer form. Name "zz NoActivity dealer", Zone Bangalore, Customer
   Type Dealer, Create. Refresh this screen. **Expected:** "zz NoActivity
   dealer" is listed as "Never contacted" (D10). —
8. [Complex: saves to Dev] Basheer K: at "zz NoActivity dealer", Log Activity,
   Visit, Date & Time a week ahead, next action due the week after, save.
   Refresh this screen. **Expected:** it is still listed as "Never contacted":
   a future-dated visit doesn't count (D12). —
9. [Complex: saves to Dev] Arun Adarsh: New Opportunity. Name "zz NoActivity
   colleague", Account "Test hospital 3", Stage Lead, Owner Arun Adarsh, Win
   Probability 10, no products. Create. "First activity" pop-up: Type Visit,
   fill the rest, Create. Refresh this screen. **Expected:** "Test hospital 3"
   is gone: an Opportunity with no products counts (D7). —
10. [Complex: hide-check, cross-role] Vivek: this screen, refresh; then
    Pipeline. **Expected:** "Test hospital 3" is gone, leaving "KIMS Hospital
    Trivandrum". "zz NoActivity colleague" (Test hospital 3) is NOT in Vivek's
    Pipeline: the report counts a colleague's work, and the rep still can't
    see it (D15). —
11. [Simple] Basheer K: this screen. **Expected:** "Test hospital 3" is still
    listed as "Never contacted": Arun Adarsh's Critical Care visit doesn't
    count for Imaging (D5). —

## D — Phone, tablet, laptop

1. [Complex: phone layout] Basheer K at 390, 768 and 1280 px, this screen,
   scrolling the whole list and using each picker. **Expected:** at 390 each
   customer is a card (name, zone, last activity or "Never contacted", days
   badge, counts); at 768 and 1280, a table. Title, pickers and two tiles
   stay fixed while the list scrolls. Nothing runs past the card. —
2. [Complex: phone layout] Vivek at 390 px. **Expected:** no Rep picker and
   no gap where it would sit; Zone picker fits; nothing runs past the card. —
