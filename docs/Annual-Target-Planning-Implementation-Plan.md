# Annual Target Planning — Implementation Plan

**Status:** Approved by Basheer, 2026-10-16. Not yet built. E2E test plan:
`docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md`. Build order: next,
once the Next-Action Rules build and its E2E are done (Basheer,
2026-10-16).
**Traceability rows:** signed 3.1 ("Target splitting by product category,
quarterly/annual tracking") — this plan finishes its "annual" part (D10).
**Design / discussion:** `docs/Discussion-Annual-Target-Planning-2026-10.md`
(raised by Haroon and Latheef Bhai at the 15 Oct 2026 demo).

## Decisions

- D1. The year runs April to March, as the app already does (the 15 Oct
  demo showed it; no objection) — Basheer, 2026-10-16.
- D2. ~~The app splits a brand's yearly target into four quarters~~ —
  withdrawn 2026-10-16: brand targets are yearly only (D12).
- D3. ~~Warning while a brand's quarters don't add up to its year~~ —
  withdrawn 2026-10-16: brands have no quarters (D12).
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
- D9. The rest of FY 2026-27 (2026-Q3, 2026-Q4) stays quarter by quarter
  for the SBU target; the yearly layer is first used for FY 2027-28
  (discussion Q6) — Basheer, 2026-10-16. For brands, see D12a; for the
  FY 2026-27 yearly SBU figure, D22a.
- D10. This finishes the "annual" part of signed row 3.1 (Phase 1), not
  new work (discussion Q7) — Basheer, 2026-10-16.
- D11. No automatic split anywhere: the GM types each quarter's portion of
  the SBU's yearly target by hand (D6). Applies to the SBU target only —
  Basheer, 2026-10-16.
- D12. Brand targets are **yearly only**, because vendors give annual
  figures: Brand Target Tracking shows and takes one yearly figure per
  brand, with no quarters. The yearly figures (brand and SBU) go in two new
  tables, not as a "yearly" row inside today's quarterly tables —
  Basheer, 2026-10-16.
- D12a. FY 2026-27: Brand Target Tracking shows each brand's existing four
  quarterly figures added up into one yearly figure. From FY 2027-28
  (April 2027) Haroon types the yearly figure directly — Basheer,
  2026-10-16.
- D13. The GM can clear the SBU's own yearly figure, which makes it follow
  the brand total again — Basheer, 2026-10-16.
- D14. Where reps see the SBU targets (D8): a read-only line above "My
  Plan" on Target & Coverage Planning, e.g. "Imaging target FY 2027-28:
  ₹1,300 L · this quarter: ₹325 L" — Basheer, 2026-10-16.
- D15. The app does not stop a GM entering a yearly figure for FY 2026-27;
  D9 is followed by simply not entering one — Basheer, 2026-10-16.
- D16. Target vs Actuals on the Insights Dashboard gets a **yearly view**
  beside the quarterly one — Basheer, 2026-10-16. How it reads: D22.
- D17. Built, tested and moved to UAT **with the next full UAT move** —
  it must land before that move — Basheer, 2026-10-16.
- D18. When a rep submits or revises a plan, the person who approves it
  (their own manager) gets a bell notification; a revision's message
  carries the rep's change note. Not the GM or Admin as well. A rep with
  no manager above them notifies no one (15 Oct demo ask) — Basheer,
  2026-10-16.
- D19. When a plan is approved or rejected, the rep gets a bell
  notification with the manager's note — Basheer, 2026-10-16.
- D20. Plan notifications go to the in-app bell only, like every other
  notification; no email or WhatsApp — Basheer, 2026-10-16.
- D21. Clicking a plan notification opens Target & Coverage Planning at
  that quarter, showing that rep's plan — Basheer, 2026-10-16.
- D22. The yearly Target vs Actuals view: the year's SBU target (the GM's
  figure, else the brand total) against Won revenue for the whole year;
  each rep's yearly figure is the four quarters added up, each quarter
  counted as the Quarter view's "Team plans" counts it (pending or
  approved; a rejected plan falls back to its last approved figure), so
  the two views always agree; brands show their yearly target against
  Won — Basheer, 2026-10-16 (wants to see how it looks: a mock-up is
  shown before build step 5).
- D22a. FY 2026-27 only: the SBU's yearly target is its quarterly SBU
  targets added up, on Target & Coverage Planning and in the Year view —
  that year was planned quarter by quarter (D9), and its brand total is
  incomplete (on Dev, 2026-10-16: Critical Care brand total ₹120 L
  against ₹270 L of quarterly targets; Imaging no brand target against
  ₹260 L). From FY 2027-28, D4/D5 apply — Basheer, 2026-10-16.

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
- No notification is sent for plans today — no `notify_*` call in
  `backend/app/domains/planning/`, searched 2026-10-16.
- Adydev reports to Nishad (D18 example) —
  `docs/Zone-Hierarchy-Territory-Data-2026-08.md`.
- Existing quarterly brand and SBU targets on Dev: not counted (a
  read-only Dev check, shown first, at build step 1).

## 1. In plain terms

**What changes for the GM.**
- **Brand Target Tracking** becomes a yearly screen. The GM types each
  brand's yearly target as the vendor gives it; there are no quarters for
  brands. The screen moves year by year, and shows each brand's target,
  what the team has committed across the year's four quarters, and the
  gap. It also shows the **SBU's yearly total**, the sum of its brands.
  For this year (FY 2026-27) it shows the quarterly figures already
  entered, added up per brand.
- **Target & Coverage Planning**, Annual view, shows the SBU's yearly
  target. It starts as the brand total. The GM may type a different
  company figure, higher or lower; the brand total stays next to it. The
  GM types each quarter's share by hand, with a warning while the four
  don't add up to the year.
- The Quarterly view's SBU target box works as today; it also shows the
  year it belongs to.

**What changes for managers and reps.** Managers see the yearly and
quarterly SBU targets as they see the quarterly one today. Reps now see
them too, read-only, above their own plan. Planning itself is unchanged:
a rep plans the current quarter hospital by hospital, and may plan a later
quarter if they already know about it.

**Notifications on plans (asked at the 15 Oct demo).** When a rep submits
or revises a plan, their manager gets a notification on the bell, e.g.
"Adydev submitted his plan for Oct–Dec 2026 — waiting for your approval".
When the manager approves or rejects it, the rep gets one, with the
manager's note. Clicking it opens that plan.

**Target vs Actuals.** The Insights Dashboard tab gets a Year view beside
the Quarter view: the year's target against what was won in the year, for
the SBU, each rep and each brand.

**What doesn't change.** Quarterly SBU targets, plans, approvals and the
quarterly Target vs Actuals work as today. The SBU target stays quarter by
quarter for the rest of this year; its yearly figure is first used from
April 2027.

**Why two new tables (D12).** Today's brand and SBU target tables hold one
figure per quarter. A yearly figure is a different thing, and keeping it
in its own table means the quarterly screens keep working untouched.

**Where it lands.** Built and tested on Dev, then to UAT with the next
full UAT move (D17).

## 2. Build order

1. **Database** (migration 0062). Two new tables for yearly brand and SBU
   targets; who may read and change them; reps can read their own SBU's
   targets (yearly and quarterly). Before writing it: a read-only Dev
   count of existing brand and SBU targets, shown first. Apply to Dev,
   regenerate `docs/Physical-Schema.sql`. Checkpoint commit.
   *Stops working on Dev until the next step:* nothing.
2. **Server.** Read and save the yearly figures; the SBU yearly target
   comes back with the brand total, whether it is the GM's own figure and
   the four quarters' total; the brand yearly figure for FY 2026-27 is the
   sum of its quarters (D12a), and the SBU yearly target for FY 2026-27
   is its quarters' total (D22a); plan notifications (D18–D19). Tests.
   Checkpoint commit. *Stops working:* nothing.
3. **Brand Target Tracking: yearly screen** (D12, D12a; SBU total, D4).
   Checkpoint commit. *Stops working:* nothing.
4. **Target & Coverage Planning** — Annual view SBU yearly target and its
   quarters (D4–D6, D11, D13, D22a); Quarterly view box shows its year; reps'
   read-only line (D8, D14); the bell opens a plan (D21). Checkpoint
   commit. *Stops working:* nothing.
5. **Target vs Actuals: Year view** (D16, D22, D22a). Checkpoint commit.
   *Stops working:* nothing.
6. **Docs and test.** Business rules, rule matrix, ADR-019 addendum,
   Traceability 3.1 note, user manual and in-app help; pre-E2E review;
   manual E2E on Dev (test plan written after approval).

## 3. What could be affected

Found by a code search on 2026-10-16 for the two quarterly target tables,
their screens and the notification bell:
- (a) **Screens that request it directly:** Brand Target Tracking (brand
  targets and the brand "committed" totals — now summed over the year);
  Target & Coverage Planning (SBU target box, Quarterly view; the Annual
  view's rollup; approve and reject).
- (b) **Reports or links that open those screens:** none found; both are
  menu screens. New: the bell opens Target & Coverage Planning (D21).
- (c) **Other screens that reuse its data:** Insights Dashboard → Target vs
  Actuals reads the quarterly SBU target (`TargetVsActualsSection.tsx`,
  server `TargetVsActualRepository`); its Quarter view must not change.
  The notification bell's existing destinations (Opportunity, lead,
  activity) must still open as today.
- Not affected: the old SBU-target figures in `App.jsx` (the legacy
  dashboard) are kept in the browser only, never in these tables.

Each gets a check before and after, in the E2E test plan.

## 4. Not in this plan (with reasons)

- **A planning lock on future quarters** (D7): Basheer chose to keep
  detailed planning of later quarters open.
- **A quarter-review screen:** Target vs Actuals with "Previous quarter"
  already covers it (discussion section 5e).
- **Calendar-year vendor targets** (D1): the app's year is April to March.
- **Email or WhatsApp notifications** (D20): the app has neither today.

## 5. Business rules and records to update

- Business-Rules: new BR-PL-09 (a brand target is yearly only; FY 2026-27
  shows the summed quarters) and BR-PL-10 (the SBU yearly target: brand
  total by default, GM's own figure, follows until set; quarters typed by
  hand with a warning; who sees it); new BR-PL-11 (plan notifications,
  D18–D21). Matrix rows in the same commit.
- ADR-019 (Planning Calendar Model): addendum — a yearly figure per
  fiscal year beside the quarterly periods.
- Traceability row 3.1: note that the annual part is built by this plan.
- `docs/UAT-User-Manual.md` and in-app help for both screens and the
  Target vs Actuals tab.
- `docs/Discussion-Annual-Target-Planning-2026-10.md`: Status → answered,
  pointing here (Q1's quarterly brand split superseded by D12).

## 6. Technical addendum

- **Tables (migration 0062):**
  - `brand_annual_target` (`brand_id` FK, `fiscal_year` int = FY start
    year, e.g. 2027 = FY 2027-28, `target_amount_lakhs` NUMERIC(15,2) ≥ 0,
    audit columns); unique (`brand_id`, `fiscal_year`).
  - `sbu_annual_target` (`sbu_id` FK, `fiscal_year`, `target_amount_lakhs`
    ≥ 0, audit columns); unique (`sbu_id`, `fiscal_year`). A row exists
    only when the GM set a figure (D5); no row = brand total, except
    FY 2026-27, where no row = the sum of that year's `sbu_target` rows
    (D22a).
  - RLS: insert/update Admin and GM on both (as `brand_vendor_target`,
    `sbu_target`); read `brand_annual_target` everyone (as
    `brand_vendor_target_read`); read `sbu_annual_target` and widen
    `sbu_target_read` to every role for their own SBU (D8).
  - `brand_vendor_target` (quarterly) is kept: it holds FY 2026-27's
    figures, read as a sum per brand (D12a); no new rows from FY 2027-28.
- **Server** (`backend/app/domains/planning/`): new routes under
  `/planning/brand-vendor-targets/annual` and `/planning/sbu-targets/annual`
  (GET by `fiscal_year`, PUT one figure, DELETE for D13). Brand GET returns
  `brand_annual_target`, else the sum of that year's `brand_vendor_target`
  rows, with `team_committed_lakhs` summed over the year's four quarters.
  SBU response: `target_amount_lakhs`, `brand_total_lakhs`,
  `is_own_figure`, `quarters_total_lakhs`. Service checks Admin/GM
  (`_require_admin_or_gm`). Target vs Actuals: `get_target_vs_actual`
  gains a fiscal-year mode (D22, D22a); a rep's yearly figure reuses the
  Quarter view's per-quarter "Team plans" logic, summed.
- **Notifications (D18–D21):** new `NotificationService.notify_plan_submitted`
  (recipient `get_approver_id(owner)`; skipped when None) and
  `notify_plan_decided` (recipient `target_plan.user_id`), with
  `entity_type="target_plan"`. Called from `create_target_plan` /
  `update_target_plan` when the plan becomes `PENDING_APPROVAL`
  (`service.py:294`, `:344`) and from `approve_or_reject_target_plan`
  (`:362`). No migration: `notification.type` and `entity_type` are free
  varchar(50). `NotificationBell.tsx` (routes at `:61–75`) gains a
  `target_plan` route to `TargetPlanningScreen` with period and rep.
- **Frontend:** `BrandTargetTrackingScreen.tsx` (quarter arrows at
  `:94–98` become year arrows); `TargetPlanningScreen.tsx` (Annual view
  box replacing the `!isAnnual` guard at `:604`; reps' line, D14);
  `SbuTargetBox.tsx`; `TargetVsActualsSection.tsx` (Quarter / Year
  switch beside the arrows at `:267–271`); `services/targetPlanning.ts`;
  `types/targetPlanning.ts`. Fiscal year helpers: `getFiscalYearOfPeriod`,
  `getPlanningYearQuarters`, `fiscalYearLabel` (already used by the
  Annual view).
- **Tests:** repository and service tests for both tables, the FY 2026-27
  sum, D5 follow-until-set, D13 clear, RLS read for a rep, the yearly
  Target vs Actuals figures, and each notification (who gets it, none for
  a rep with no manager); frontend type check and lint.
