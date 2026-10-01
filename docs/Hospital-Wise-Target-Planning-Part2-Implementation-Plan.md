# Hospital-Wise Target Planning, Part 2 (Plan versus Actual) — Implementation Plan

**Status:** Approved 2026-09-29 (Basheer; every line in Decisions answered
the same day). Not started. Split-credit question sent to Haroon
2026-09-29 — doesn't block this build (see Decisions).
**Traceability rows:** 3.2 actual-vs-target dashboards (finishes the
2026-09-24 demo addition); completes 6.1 Beat Planning with Part 1.
**Design / discussion:** `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`
(decisions 3, 5.4); Part 1: `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`
(section 5 outlines this part).
**Rollout:** Dev only while building. Goes to UAT together with Part 1, in
one move, once this part is finished and tested (Basheer, 2026-09-29).

## Decisions

- Actuals are shown on the Insights Dashboard — Basheer, 2026-09-27
- "Won so far" = value of deals won at that hospital during the quarter, credited to the deal owner, as the Sales Report counts — Basheer, 2026-09-27
- Expected is shown beside Won, never added into it: Won + Expected = Likely finish — Basheer, 2026-09-27
- Deals won at hospitals outside the plan count toward the person's actuals, on their own "Unplanned" line — Basheer, 2026-09-27
- Split-shared deals: owner gets full credit, as every report does today; if Haroon (asked 2026-09-29) wants credit shared by split %, that changes all reports together, scorecard included — Basheer, 2026-09-27
- Everyone sees plan-versus-actual for exactly the plans they can already see in Target & Coverage Planning — Basheer, 2026-09-29
- Zone totals group by the hospital's zone, not the planner's — Basheer, 2026-09-29
- "Expected this quarter" = Active deals only, weighted by win probability, by expected closure date; deals with no closing date left out and shown as a count note — Basheer, 2026-09-29
- Late deals (closing date passed, still open) count in the current quarter's Expected, flagged; a finished quarter shows Expected as "—"; a future quarter counts only deals dated in it — Basheer, 2026-09-29
- "Closing date passed" flag (BR-OP-16): shown in the scorecard (total note + deals listed in the person's row); flag only, never blocks — Basheer, 2026-09-29
- Plans counted: submitted ones (awaiting approval or approved); awaiting-approval ones tagged "pending"; drafts and rejected plans don't count — Basheer, 2026-09-29
- People with no plan for the quarter still appear: Planned ₹0, their wins in Won so far, "% of plan" shown as "—" — Basheer, 2026-09-29
- Brand-wise planned vs won, per person, inside their expanded row, for both SBUs — Basheer, 2026-09-29
- Lighter build (no company→SBU→zone ladder, no Customer 360 view, no monthly chart, no automatic overdue reminder) — Basheer, 2026-09-29

## 1. In plain terms

Part 1 lets each salesperson build their quarter's target hospital by
hospital. Part 2 shows how they are doing against it while the quarter
runs, like a scorecard beside the plan.

On the Insights Dashboard, a new **Plan vs Actual** section, for a chosen
quarter (current one by default) and SBU:

| Person | Planned | Won so far | Expected this quarter | Likely finish | % of plan |
|---|---|---|---|---|---|
| Fahad | ₹40 L | ₹18 L | ₹15 L | ₹33 L | 45 % |
| Anu (no plan) | ₹0 | ₹5 L | ₹2 L | ₹7 L | — |

- **Open a person's row** to see:
  - their hospitals, each with planned, won, expected and likely finish,
    plus one **Unplanned** line for wins at hospitals outside the plan;
  - a small **brand table**: planned per brand (from the plan's brand
    split) against won per brand, e.g. EDAN ₹25 L planned / ₹12 L won,
    Magnamed ₹15 L / ₹6 L. Imaging shows SonoScape only, for now;
  - any open deals whose **closing date has passed**, listed by name so
    the manager can raise them.
- A **By Zone** table (moved here from Part 1) with the same columns per
  zone, and a company total. Zone = where the hospital is.
- A salesperson sees only their own row; a manager their team; Admin and
  GM everyone.

**Won so far** is money already won. **Expected this quarter** is the
fair share of open deals due to close this quarter (a ₹10 L deal at 60 %
counts ₹6 L). It is never mixed into Won. Deals with no closing date yet
are left out, with a note ("5 open deals have no closing date"). A deal
whose closing date has passed but is still open counts in the current
quarter and is flagged "Closing date passed" (BR-OP-16), so it never
silently drops out. A finished quarter shows only what was won.

## 2. Build size

Lighter build, chosen 2026-09-29: about 3 days, plus review and testing.
No database change.

## 3. Build order

1. **Backend:** one new read-only endpoint returning, for a quarter and
   SBU, every visible plan's hospitals with planned / won / expected, the
   Unplanned lines, No-plan people, brand planned vs won, closing-date-passed
   deals and the no-closing-date count; zone totals from the same data.
   Service tests for each Decisions line: owner credit, unplanned, no plan,
   Active-only expected, current / past / future quarter rules, late deals
   in the current quarter, midnight-IST quarter edges, brand totals, and
   visibility per role.
2. **Checkpoint commit** (backend tests pass), proposed for approval.
3. **Frontend:** the Plan vs Actual section on the Insights Dashboard
   (person table, expandable rows with hospitals, brands and late deals,
   By Zone table, SBU filter, quarter picker).
4. pytest, ruff, tsc, lint; `/code-review` (medium: read-only, no migration,
   but visibility-sensitive); written E2E plan checked against live Dev
   data; manual E2E; commit; post-commit checklist.
5. Then the combined Part 1 + Part 2 move to UAT (its own plan, per
   `docs/Deployment-Topology.md`). **That plan's first step (Basheer,
   2026-09-30):** a read-only check, run only with Basheer's go-ahead on
   the day, of how UAT hospitals are filed: how many sit at region level
   (e.g. "South Kerala") rather than inside a district. A rep's hospital
   picker only offers hospitals filed inside their own districts, so
   region-level hospitals would be invisible to district-level reps
   (found on Dev while preparing Part 1's E2E, where Vivek's area held 0
   hospitals). **Run early, 2026-09-30:** 85 of 432 UAT hospitals are
   filed at region level (North Kerala 43, South Kerala 24, Bangalore
   18); Irfan (Sales Staff, Imaging) has no area assigned (Progress-Archive
   2026-09-30). **Basheer's choice: Option A, re-file each into its real
   district** (not a rule change, which would show reps colleagues'
   hospitals) — held until he has discussed it with Haroon; then pick
   the manual (team edits on the customer page) or spreadsheet (Claude
   applies, UAT read + write each approved) route. Irfan's area to be
   assigned by then. Re-run the check on the move day.
   **After the migrations apply on UAT (Basheer, 2026-10-01):** repeat
   Part 1 E2E step 34 once on UAT, read-only and with Basheer's go-ahead:
   who can read a plan's hospital lines (rep and manager yes, peer and
   other-SBU user 0), all three RLS settings verified. Dev passed
   2026-10-01; this confirms UAT's `rls_auto_enable()` trigger didn't
   leave `target_plan_account` without its policies.

## 4. Not in this plan (with reasons)

- **Split-shared credit** — waiting on Haroon; see Decisions and Backlog
  "Reports never implement split-weighted attribution".
- **The Fuller items** (click-down ladder, Customer 360 view, monthly chart,
  automatic overdue reminder) — Lighter chosen; each can be added later
  without rework. The reminder needs the nightly job planned for stale-deal
  alerts (Traceability 4.5).
- **"Closing date pushed back N times"** — Backlog idea (2026-09-29).
- **Visit compliance** (did the rep visit as often as planned) — not in the
  Traceability matrix; out of Phase 1 scope (Basheer, 2026-09-28).

## 5. Business rules and records to update

- `docs/Business-Rules.md` BR-OP-16 (Closing Date Passed) — added
  2026-09-29 with this plan. With the build: a BR-PL rule for how Won /
  Expected this quarter / Likely finish are counted; the Implementation
  Matrix rows for both.
- Traceability 3.2 (and 6.1 with Part 1) to Done only after E2E passes;
  regenerate the scorecard.
- UI-Inventory: the new dashboard section.

## 6. Technical addendum

- **Endpoint:** `GET /planning/targets/plan-vs-actual?sbu_id&planning_period`
  in the planning router (it already owns `/zone-rollup`, which this
  replaces for the screen; keep or retire `/zone-rollup` at code review).
- **Plans:** `target_plan` with status `PENDING_APPROVAL`/`APPROVED`, joined to
  `target_plan_account` (`planned_amount_lakhs`) and `target_plan_brand_split`,
  under the caller's RLS (same as `/team`).
- **Won:** `opportunity` status `WON`, `closed_at` in the quarter via
  `reporting.router._period_bounds` (move it to a shared util so planning
  can import it without importing a router), `sbu_id` = the plan's SBU,
  credited to `owner_id`, value = the reporting `_NET_VALUE` expression, as
  the Sales Report. Grouped by (owner, account); accounts not in the owner's
  plan → Unplanned. Brand won = won `opportunity_item` lines grouped by
  `product.brand_id`, as the Sales Report's brand grouping.
- **Expected:** status `ACTIVE`, `_NET_VALUE * win_probability / 100`.
  Current quarter (contains today's IST date): `expected_closure_date <=
  quarter_end`; future quarter: `BETWEEN quarter_start AND quarter_end`;
  past quarter: not queried, returned null (screen shows "—", Likely
  finish = Won). Active deals with NULL `expected_closure_date` returned as
  a count only.
- **Closing date passed (BR-OP-16):** `status = ACTIVE AND
  expected_closure_date < today (IST)`; returned per person with deal id,
  name, account, date, value.
- **Visibility:** deals scoped with `ReportingRepository._apply_owner_scope`
  (TEAM_SCOPE_BUILDERS). Review item: confirm this matches `target_plan` RLS
  for each role, so no one sees a plan without its actuals or the reverse.
- **Zones:** reuse the `get_zone_rollup` ZONE-level ancestor grouping on
  `account.zone_id` for both planned and actual.
- **Quarter → dates:** "YYYY-Qn" with YYYY = FY start year (Q3 = Oct–Dec);
  a backend helper mirroring `getFiscalQuarterBounds` in
  `sales-os-app/src/utils/formatter.ts`.
- **Frontend:** new section in `InsightsDashboardScreen.tsx` (existing
  `SectionCard`, `StatTile`); expandable rows as in `TargetPlanningScreen.tsx`
  (Part 1 (c)); regenerate `types/api.ts`.
