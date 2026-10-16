# Annual Target Planning — Implementation Plan

**Status:** Draft, 2026-10-16.
**Traceability rows:** signed 3.1 ("Target splitting by product category,
quarterly/annual tracking") — this plan finishes its "annual" part (D10).
**Design / discussion:** `docs/Discussion-Annual-Target-Planning-2026-10.md`
(raised by Haroon and Latheef Bhai at the 15 Oct 2026 demo).

## Decisions

- D1. The year runs April to March, as the app already does (the 15 Oct
  demo showed it; no objection) — Basheer, 2026-10-16.
- D2. A brand's yearly target is entered once on Brand Target Tracking;
  the app splits it into four equal quarters, each adjustable (discussion
  Q1) — Basheer, 2026-10-15.
- D3. The yearly figure is stored, so it stays fixed when a quarter is
  moved; the screen warns while the quarters don't add up to it
  (discussion S1, Q3) — Basheer, 2026-10-16.
- D4. The SBU's yearly target is the total of its brands by default. The
  GM may set a different figure, higher or lower; the brand total is
  always shown next to it (discussion Q2) — Basheer, 2026-10-16.
- D5. Until the GM sets a figure, the SBU's yearly target follows the brand
  total whenever a brand target changes; once set, it stays as set
  (discussion S2) — Basheer, 2026-10-16.
- D6. The GM spreads the SBU's year across the four quarters by hand; the
  screen warns while the quarters don't add up to the year (discussion
  Q3) — Basheer, 2026-10-15.
- D7. Reps are expected to plan only the quarter in progress, but may plan
  any later quarter in detail; nothing is locked (discussion S3, Q4) —
  Basheer, 2026-10-16.
- D8. Reps see their SBU's yearly and quarterly targets, read-only
  (discussion Q5) — Basheer, 2026-10-15.
- D9. The rest of FY 2026-27 (2026-Q3, 2026-Q4) stays quarter by quarter;
  the yearly layer is first used for FY 2027-28 (discussion Q6) — Basheer,
  2026-10-16.
- D10. This finishes the "annual" part of signed row 3.1 (Phase 1), not
  new work (discussion Q7) — Basheer, 2026-10-16.
- D11. The equal split happens only when the GM presses "Split equally
  into quarters"; it never overwrites quarters on its own. When the
  amount doesn't divide evenly, the last quarter takes the paise left
  over — proposed.
- D12. The yearly figures go in two new tables (one for brands, one for
  SBUs), not as a "yearly" row inside today's quarterly tables — proposed.
- D13. The GM can clear the SBU's own yearly figure, which makes it follow
  the brand total again — proposed.
- D14. Where reps see the SBU targets (D8): a read-only line above "My
  Plan" on Target & Coverage Planning, e.g. "Imaging target FY 2027-28:
  ₹1,300 L · this quarter: ₹325 L" — proposed.
- D15. The app does not stop a GM entering a yearly figure for FY 2026-27;
  D9 is followed by simply not entering one — proposed.
- D16. Target vs Actuals on the Insights Dashboard stays quarterly; no
  yearly Target vs Actuals in this plan — proposed.
- D17. Goes to UAT after the next full UAT move, which brings Target vs
  Actuals and the SBU target there first — proposed.

## Figures and sources

- Mindray ₹400 L, SonoScape ₹500 L, other brands ₹300 L, Imaging total
  ₹1,200 L, GM's figure ₹1,300 L, ₹325 L a quarter — made-up examples.
- 2026-Q3 = 01 Oct 2026 to 31 Dec 2026; 2026-Q4 = 01 Jan 2027 to 31 Mar
  2027; 2027-Q1 = 01 Apr 2027 to 30 Jun 2027 — `scripts/quarter.py`,
  2026-10-16.
- Latest migration `0061_sbu_target_area_manager_read.py` —
  `backend/alembic/versions`, listed 2026-10-16.
- Who sees the SBU target today (Admin, GM; SBU and Area Managers their
  own SBU's) — `docs/Physical-Schema.sql` policy `sbu_target_read`, and
  `TargetPlanningScreen.tsx:60-61`, read 2026-10-16.
- A rep may plan any quarter today; only a second plan for the same
  quarter is refused — `backend/app/domains/planning/service.py`
  `create_target_plan`, read 2026-10-16.
- Existing quarterly brand and SBU targets on Dev: not counted (a
  read-only Dev check, shown first, at build step 1).

## 1. In plain terms

**What changes for the GM.** Four quarterly entries per brand become one yearly entry:
- **Brand Target Tracking** gets a "Year" view. The GM types each brand's
  yearly target from the vendor, presses "Split equally into quarters",
  and adjusts any quarter. If the quarters stop adding up to the year,
  the screen says by how much.
- The same screen shows the **SBU's yearly total**, the sum of its brands.
- **Target & Coverage Planning**, Annual view, shows the SBU's yearly
  target. It starts as the brand total. The GM may type a different
  company figure, higher or lower; the brand total stays next to it. The
  GM spreads the year over the four quarters the same way: split equally,
  then adjust, with a warning while they don't add up.
- The Quarterly view's SBU target box works as today; it also shows the
  year it belongs to.

**What changes for managers and reps.** Managers see the yearly and
quarterly SBU targets as they see the quarterly one today. Reps now see
them too, read-only, above their own plan. Planning itself is unchanged:
a rep plans the current quarter hospital by hospital, and may plan a later
quarter if they already know about it.

**What doesn't change.** Quarterly brand targets, quarterly SBU targets,
plans, approvals and Target vs Actuals work as today. This year's
remaining quarters (Oct–Dec 2026, Jan–Mar 2027) stay quarter by quarter;
first real use is April 2027.

**Why two new tables (D12).** Today's brand and SBU target tables hold one
figure per quarter. The yearly figure is a different thing: it is what
the vendor gave, and it must stay put when a quarter is moved. Keeping it
in its own table means every screen that reads quarterly targets today
keeps working untouched. Putting yearly rows inside the quarterly tables
would make each of those screens tell the two kinds apart.

**Where it lands.** Dev only, through all steps. UAT later, after the next
full UAT move (D17), because the SBU target isn't on UAT yet.

## 2. Build order

1. **Database** (migration 0062). Two new tables for yearly brand and SBU
   targets; who may read and change them; reps can read their own SBU's
   targets (yearly and quarterly). Before writing it: a read-only Dev
   count of existing brand and SBU targets, shown first. Apply to Dev,
   regenerate `docs/Physical-Schema.sql`. Checkpoint commit.
   *Stops working on Dev until the next step:* nothing.
2. **Server.** Read and save the yearly figures; "split equally" writes
   the four quarterly figures in one save; the SBU yearly target comes
   back with the brand total and whether it is the GM's own figure.
   Tests. Checkpoint commit. *Stops working:* nothing.
3. **Brand Target Tracking: Year view** (D2, D3, D11; SBU total, D4).
   Checkpoint commit. *Stops working:* nothing.
4. **Target & Coverage Planning** — Annual view SBU yearly target and its
   quarters (D4–D6, D13); Quarterly view box shows its year; reps' read-only
   line (D8, D14). Checkpoint commit. *Stops working:* nothing.
5. **Docs and test.** Business rules, rule matrix, ADR-019 addendum,
   Traceability 3.1 note, user manual and in-app help; pre-E2E review;
   manual E2E on Dev (test plan written after approval).

## 3. What could be affected

Found by a code search on 2026-10-16 for the two quarterly target tables
and their screens:
- (a) **Screens that request it directly:** Brand Target Tracking (brand
  targets and the brand "committed" totals); Target & Coverage Planning
  (SBU target box, Quarterly view; the Annual view's rollup).
- (b) **Reports or links that open those screens:** none found; both are
  menu screens.
- (c) **Other screens that reuse its data:** Insights Dashboard → Target vs
  Actuals reads the quarterly SBU target (`TargetVsActualsSection.tsx`,
  server `TargetVsActualRepository`). A quarter changed through "split
  equally" must show there, as a typed one does today.
- Not affected: the old SBU-target figures in `App.jsx` (the legacy
  dashboard) are kept in the browser only, never in these tables.

Each gets a check before and after, in the E2E test plan.

## 4. Not in this plan (with reasons)

- **Yearly Target vs Actuals** (D16): the quarter view answers "how are we
  doing"; a yearly one can follow once a year's figures exist.
- **A planning lock on future quarters** (D7): Basheer chose to keep
  detailed planning of later quarters open.
- **A quarter-review screen:** Target vs Actuals with "Previous quarter"
  already covers it (discussion section 5e).
- **Calendar-year vendor targets** (D1): the app's year is April to March.

## 5. Business rules and records to update

- Business-Rules: new BR-PL-09 (a yearly brand target and its quarters;
  warning while they don't add up) and BR-PL-10 (the SBU yearly target:
  brand total by default, GM's own figure, follows until set; who sees
  it). Matrix rows in the same commit.
- ADR-019 (Planning Calendar Model): addendum — a yearly figure per
  fiscal year beside the quarterly periods.
- Traceability row 3.1: note that the annual part is built by this plan.
- `docs/UAT-User-Manual.md` and in-app help for both screens.
- `docs/Discussion-Annual-Target-Planning-2026-10.md`: Status → answered,
  pointing here.

## 6. Technical addendum

- **Tables (migration 0062):**
  - `brand_annual_target` (`brand_id` FK, `fiscal_year` int = FY start
    year, e.g. 2027 = FY 2027-28, `target_amount_lakhs` NUMERIC(15,2) ≥ 0,
    audit columns); unique (`brand_id`, `fiscal_year`).
  - `sbu_annual_target` (`sbu_id` FK, `fiscal_year`, `target_amount_lakhs`
    ≥ 0, audit columns); unique (`sbu_id`, `fiscal_year`). A row exists
    only when the GM set a figure (D5); no row = brand total.
  - RLS: insert/update Admin and GM on both (as `brand_vendor_target`,
    `sbu_target`); read `brand_annual_target` everyone (as
    `brand_vendor_target_read`); read `sbu_annual_target` and widen
    `sbu_target_read` to every role for their own SBU (D8).
- **Server** (`backend/app/domains/planning/`): new routes under
  `/planning/brand-vendor-targets/annual` and `/planning/sbu-targets/annual`
  (GET by `fiscal_year`, PUT one figure, DELETE for D13); POST
  `.../split` writes the four quarterly `brand_vendor_target` /
  `sbu_target` rows in one transaction (D11; remainder to Q4). SBU
  response: `target_amount_lakhs`, `brand_total_lakhs`, `is_own_figure`,
  `quarters_total_lakhs`. Service checks Admin/GM (`_require_admin_or_gm`).
- **Frontend:** `BrandTargetTrackingScreen.tsx` (Quarter / Year toggle,
  as on Target Planning); `TargetPlanningScreen.tsx` (Annual view box
  replacing the `!isAnnual` guard at `:604`; reps' line, D14);
  `SbuTargetBox.tsx`; `services/targetPlanning.ts`; `types/targetPlanning.ts`.
  Fiscal year helpers: `getFiscalYearOfPeriod`, `getPlanningYearQuarters`,
  `fiscalYearLabel` (already used by the Annual view).
- **Tests:** repository and service tests for both tables, the split
  (rounding, one transaction), D5 follow-until-set, D13 clear, RLS read
  for a rep; frontend type check and lint.
