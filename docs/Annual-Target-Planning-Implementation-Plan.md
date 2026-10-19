# Annual Target Planning — Implementation Plan

**Status:** Being replanned, 2026-10-17 — do not build (calendar-year
brand targets, Haroon and Latheef Bhai via Basheer; D23 onwards;
incentive year settled 2026-10-19, D29). Was
approved 2026-10-16; build sections below are not yet rewritten. E2E test plan:
`docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md` (on hold too).
Build order: on hold until this replan is finished and approved (was
"next, once the Next-Action Rules build and its E2E are done", Basheer,
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
- D8. ~~Reps see their SBU's yearly and quarterly targets, read-only
  (discussion Q5) — Basheer, 2026-10-15~~ — withdrawn 2026-10-17 (D26).
- D9. The rest of FY 2026-27 (2026-Q3, 2026-Q4) stays quarter by quarter
  for the SBU target; the yearly layer is first used for FY 2027-28
  (discussion Q6) — Basheer, 2026-10-16. For brands, see D12a; for the
  FY 2026-27 yearly SBU figure, D22a.
- D10. This finishes the "annual" part of signed row 3.1 (Phase 1), not
  new work (discussion Q7) — Basheer, 2026-10-16.
- D11. No automatic split anywhere: the GM types each quarter's portion of
  the SBU's yearly target by hand (D6). Applies to the SBU target only —
  Basheer, 2026-10-16.
- D12. ~~Brand targets are **yearly only**, because vendors give annual
  figures: Brand Target Tracking shows and takes one yearly figure per
  brand, with no quarters. The yearly figures (brand and SBU) go in two new
  tables, not as a "yearly" row inside today's quarterly tables —
  Basheer, 2026-10-16~~ — withdrawn 2026-10-17 (D23–D25).
- D12a. ~~FY 2026-27: Brand Target Tracking shows each brand's existing four
  quarterly figures added up into one yearly figure. From FY 2027-28
  (April 2027) Haroon types the yearly figure directly — Basheer,
  2026-10-16~~ — withdrawn 2026-10-17 (D23–D25).
- D13. The GM can clear the SBU's own yearly figure, which makes it follow
  the brand total again — Basheer, 2026-10-16.
- D14. ~~Where reps see the SBU targets (D8): a read-only line above "My
  Plan" on Target & Coverage Planning, e.g. "Imaging target FY 2027-28:
  ₹1,300 L · this quarter: ₹325 L" — Basheer, 2026-10-16~~ — withdrawn
  2026-10-17 (D26, D27).
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

**Replan, 2026-10-17** (Haroon and Latheef Bhai, via Basheer). Brands set
targets January–December and bill Cabio a quarter of it each quarter;
Jan–Mar is lean, Jul–Sep (monsoon) and Oct–Dec (year-end) are strong.
Calendar quarters and the app's quarters share the same months, so each
brand calendar quarter is exactly one app quarter (Jan–Mar 2027 = 2026-Q4,
Apr–Jun 2027 = 2027-Q1 — `scripts/quarter.py`, 2026-10-17). Withdrawn by
this replan: D8, D12, D12a, D14.

- D23. The GM enters each brand's own January–December figure as the
  brand sends it; only Admin and GM see it — Basheer, 2026-10-17.
- D24. Haroon sets a stretch per brand as a percentage (up to about
  100 %); the stretched figure is worked out and shown beside the brand's
  own figure — Basheer, 2026-10-17.
- D25. The stretched year is spread across the four calendar quarters by
  one seasonal pattern per SBU per year (e.g. 15/20/30/30 %, made-up),
  which the GM may change for a single brand — Basheer, 2026-10-17.
- D26. Only the SBU Manager (besides Admin and GM) sees the SBU target,
  and only the stretched figures. Reps do not see the SBU target
  (withdraws D8, D14) — Basheer, 2026-10-17.
- D27. The stretched SBU target is broken up into Area Manager targets.
  Reps see only their own Area Manager's target — Basheer, 2026-10-17.
  How it is broken up: open (who splits, per quarter or per year).
- D28. The GM enters a calendar year's brand figures when the brands send
  them (January). Until then, next Jan–Mar has no target; its detailed
  planning waits, as planning is quarter by quarter anyway — Basheer,
  2026-10-17.
- D29. Team targets and incentives follow Option 3 of "Target and
  Incentive Year Options": each rep has a target for each quarter; each
  quarter's result is checked against the running total for the
  April–March year so far, so a shortfall can be made up later; part of
  the incentive is paid each quarter and the rest settled at year-end.
  Managers see April–March totals. How much is held back is HR's
  decision, beside today's half at order, half at full payment. The app
  does not calculate incentive amounts (PRD: outside Phase 1; Finance's
  incentive file parked for Phase 2), but Option 3 needs two things it
  lacks today: a target per rep per quarter (D30) and a year-so-far
  view (D31) — Haroon and Latheef Bhai, via
  Basheer, 2026-10-19. The options doc (revised 2026-10-19 after an
  outside review; PDF of it made the same day):
  https://claude.ai/code/artifact/c6122999-2af4-4fbc-b113-049959648e25.
  Rejected: yearly April–March (full-year target known only in January)
  and yearly January–December (bridging period, managers would see
  January–December). A provisional Jan–Mar target set in April was left
  out, as it would reverse D28.
- D30. Each rep gets a target for each quarter, set by their Area Manager
  by dividing up the Area Manager's own target (D27). The rep sees it;
  their plan is how they mean to reach it. Not the approved plan used as
  the target, because a rep would then set the target their own
  incentive is paid on. Today the app holds only brand and SBU targets
  (`docs/Physical-Schema.sql`). Answered together with the Area Manager
  split (D27, A1–A3) — Basheer, 2026-10-19.
- D31. Target vs Actuals' Year view shows the running total at each
  quarter: won from April up to that quarter against the targets added
  up from April (e.g. by September, Apr–Sep won against the Apr–Jun and
  Jul–Sep targets), so each quarterly payout and the year-end settlement
  can be read from it. Changes D22, which showed the whole year only —
  Basheer, 2026-10-19.
- D32. The SBU Manager divides the SBU's stretched target among its Area
  Managers; the GM can see and change it (D27's "who splits") —
  Basheer, 2026-10-19.
- D33. One total per Area Manager per quarter, not per brand, typed by
  hand, with a warning while they don't add up to the SBU's quarter. The
  same for reps under D30: one total per rep per quarter, with a warning
  while they don't add up to the Area Manager's target — Basheer,
  2026-10-19.
- D34. Area Managers no longer see the SBU target, only their own (D26);
  they have seen it since 16 Oct (migration 0061) — Basheer, 2026-10-19.
- D35. Reps see their own quarterly target (D30) only, not their Area
  Manager's; changes D27's last sentence — Basheer, 2026-10-19.
- D36. The GM may set an SBU quarter different from its brands' total;
  the brand total is the default, always shown beside it, and clearing
  the GM's figure returns to it (as D4, D13 for the year) — Basheer,
  2026-10-19.
- D37. Brand Target Tracking shows each brand's even quarterly billing
  (a quarter of its own yearly figure) beside Cabio's seasonal split,
  Admin and GM only; the app does not record purchases from brands, so
  nothing checks it — Basheer, 2026-10-19.
- D38. The new targets start from Oct–Dec 2026 (2026-Q3): Haroon enters
  the brands' 2026 figures, stretched and spread, and the Oct–Dec share
  is divided down to Area Managers and reps. Target setting for that
  quarter is in progress outside the app, done by next week; the team
  enters those figures once this build is live. Reps see them after the
  quarter has begun; FY 2026-27's running total (D31) starts at Oct–Dec.
  Changes D9 and D22a, which kept the rest of FY 2026-27 quarterly as
  entered — Basheer, 2026-10-19 ("as soon this build goes live next
  week").
- D39. Screens show quarters as months and year (e.g. "Oct–Dec 2026"),
  not codes like "2026-Q3", which reads as July–September in calendar
  terms; the stored period stays `YYYY-Qn`. Year labels like "FY 2026-27"
  stay. Done in Part 1, as it rebuilds the same screens — Basheer
  (raised it), 2026-10-19.
- D40. Not every brand's year runs January–December. Each brand has a
  "year starts in" setting: January, April, July or October only, so
  each brand quarter is still exactly one Cabio quarter. Changes D23's
  "January–December figure" to the brand's own year — Basheer,
  2026-10-19.
- D41. The seasonal pattern (D25) is tied to the months (Jan–Mar lean,
  Jul–Sep and Oct–Dec strong), not to a brand's first quarter; an
  April–March brand uses the same pattern starting from Apr–Jun —
  Basheer, 2026-10-19.
- D42. The GM enters a brand's yearly figure whenever that brand sends
  it, ahead of the brand's year; until then that brand's coming quarters
  have no target. Changes D28's "January" — Basheer, 2026-10-19.
- D43. Brand Target Tracking moves by calendar year (e.g. "2027"); each
  brand shows its year that starts in it, with its months beside its
  name (e.g. "SonoScape · Jan–Dec 2027", "Brand X · Apr 2027–Mar 2028",
  made-up), and its four quarters by month (D39) — Basheer, 2026-10-19.
- D44. Built in two parts. Part 1: entering targets — brand yearly
  figures, stretch and seasonal split, SBU Manager's split to Area
  Managers, Area Managers' split to reps, each person seeing only their
  own target, and the month labels (D39). Part 2: the rest (Year view
  running totals, plan notifications, brand billing line, etc.). Changes
  D17: each part goes to UAT when it is finished; if Part 2 is finished
  by Wednesday 21 Oct 2026, both go with the full UAT move and the other
  items set for it — Basheer, 2026-10-19.

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
