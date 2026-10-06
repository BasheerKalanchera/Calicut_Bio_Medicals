# Plan vs Actuals Tracking (Insights Dashboard) — Implementation Plan

_Renamed 2026-10-02 (Basheer) from "Hospital-Wise Target Planning, Part 2".
Hospital-wise Target Planning is finished; this feature tracks actuals
against those plans on the Insights Dashboard._

**Status:** Approved 2026-09-29 (Basheer; every line in Decisions answered
the same day). First build on Dev: backend `0f7d75a`, frontend `231fbd0`, review fixes `903ad41`; E2E stopped 2026-10-04 by Basheer (not Done). Redesigned 2026-10-05 — see section 3 "Revised build order"; step 1 done (`1821c30`), step 2 next. Split-credit question sent to Haroon
2026-09-29 — doesn't block this build (see Decisions).
**Traceability rows:** 3.2 actual-vs-target dashboards (finishes the
2026-09-24 demo addition); completes 6.1 Beat Planning with Hospital-wise Target Planning.
**Design / discussion:** `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`
(decisions 3, 5.4); Hospital-wise Target Planning: `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`
(section 5 outlines this part).
**Rollout:** Dev only while building. Goes to UAT together with Hospital-wise Target Planning, in
one move, once this part is finished and tested (Basheer, 2026-09-29).

## Decisions

- Actuals are shown on the Insights Dashboard — Basheer, 2026-09-27
- "Won so far" = value of Opportunities won at that hospital during the quarter, credited to the Opportunity owner, as the Sales Report counts — Basheer, 2026-09-27
- Expected is shown beside Won, never added into it: Won + Expected = Likely finish — Basheer, 2026-09-27
- Opportunities won at hospitals outside the plan count toward the person's actuals, on their own "Unplanned" line — Basheer, 2026-09-27
- Split-shared Opportunities: owner gets full credit, as every report does today; if Haroon (asked 2026-09-29) wants credit shared by split %, that changes all reports together, scorecard included — Basheer, 2026-09-27
- Everyone sees plan-versus-actual for exactly the plans they can already see in Target & Coverage Planning — Basheer, 2026-09-29
- Zone totals group by the hospital's zone, not the planner's — Basheer, 2026-09-29
- "Expected this quarter" = Active Opportunities only, weighted by win probability, by expected closure date; Opportunities with no closing date left out and shown as a count note — Basheer, 2026-09-29
- Late Opportunities (closing date passed, still open) count in the current quarter's Expected, flagged; a finished quarter shows Expected as "—"; a future quarter counts only Opportunities dated in it — Basheer, 2026-09-29
- "Closing date passed" flag (BR-OP-16): shown in the scorecard (total note + Opportunities listed in the person's row); flag only, never blocks — Basheer, 2026-09-29
- Plans counted: submitted ones (awaiting approval or approved); awaiting-approval ones tagged "pending"; drafts and rejected plans don't count — Basheer, 2026-09-29
- People with no plan for the quarter still appear: Planned ₹0, their wins in Won so far, "% of plan" shown as "—" — Basheer, 2026-09-29
- Brand-wise planned vs won, per person, inside their expanded row, for both SBUs — Basheer, 2026-09-29
- Lighter build (no company→SBU→zone ladder, no Customer 360 view, no monthly chart, no automatic overdue reminder) — Basheer, 2026-09-29

### Redesign decisions — Basheer, 2026-10-05 (approved in chat; replace any older line they conflict with)

The screen is renamed **Target vs Actuals** (file and code renames happen with the build; this
file keeps its old name until then so links elsewhere don't break).

- **Roster:** every active SBU member except Admin gets a row every quarter, on both Target Planning and Target vs Actuals, within the viewer's scope. Statuses: Not started / Draft / Waiting / Approved / Rejected. A "N of M haven't submitted" line. Managers see only "Draft" on others' plans. Haroon is on both SBU rosters and counts as not submitted when planless. (Replaces "people with no plan still appear: Planned ₹0".)
- **Revised plans:** show the revised figure with a "was ₹X approved" note. If the revision is rejected, the last approved total still counts (BR-PL-05), shown as "last approved" with no hospital or brand breakdown, and the person counts as submitted (Basheer, 2026-10-06, code review).
- **Won:** counts at full payment (BR-OP-17); "% of target" uses Won only.
- **Manager's own row:** own plan and own wins only, not the team's.
- **Visibility:** staff see their own row; Area Manager sees self + team; SBU Manager sees their people + the SBU row against the SBU target; GM sees all SBUs + the company row; Admin gets the GM view with no row of their own.
- **PO columns:** separate "PO received" and "Won (paid)" columns, each counted in its own quarter. New "PO date" box next to PO number, required at Order → Delivery and at Won, never in the future. Revised 2026-10-06 (Basheer, "keep it simple"): no audit-log fallback; older records without a PO date are left alone, left out of "PO received", and counted in a "N Opportunities past Order have no PO date" note (Won ones by the quarter they were won in; still-open ones in the current quarter only — code review 2026-10-06).
- **SBU target:** one figure per SBU per quarter, entered by the GM in SBU Target Rollup, kept in its own register table, visible to SBU Manager and above. Company target = sum of the active SBUs' targets, shown only once every active SBU has one. The SBU row's figures are SBU-wide, not the viewer's team, so the SBU Manager and the GM see the same numbers (Basheer, 2026-10-06, code review).
- **Wording:** "no expected closure date".
- **Split credit:** owner gets full credit, as every report does today. Question put to Haroon (2026-09-29, re-sent 2026-10-05); answer pending; doesn't block the build. UAT today: 5 shared Opportunities, Haroon on 4.
- **Scope:** all in Part 1, one migration (PO date + SBU target), one UAT move.

## 1. In plain terms

Hospital-wise Target Planning lets each salesperson build their quarter's target hospital by
hospital. Plan vs Actuals Tracking shows how they are doing against it while the quarter
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
  - any open Opportunities whose **closing date has passed**, listed by name so
    the manager can raise them.
- A **By Zone** table (moved here from Hospital-wise Target Planning) with the same columns per
  zone, and a company total. Zone = where the hospital is.
- A salesperson sees only their own row; a manager their team; Admin and
  GM everyone.

**Won so far** is money already won. **Expected this quarter** is the
fair share of open Opportunities due to close this quarter (a ₹10 L Opportunity at 60 %
counts ₹6 L). It is never mixed into Won. Opportunities with no closing date yet
are left out, with a note ("5 open Opportunities have no closing date"). An Opportunity
whose closing date has passed but is still open counts in the current
quarter and is flagged "Closing date passed" (BR-OP-16), so it never
silently drops out. A finished quarter shows only what was won.

## 2. Build size

Lighter build, chosen 2026-09-29: about 3 days, plus review and testing.
**Revised 2026-10-05:** one migration (PO date column + SBU target table)
under the redesign decisions above; estimate to be redone in the gap analysis.

## 3. Revised build order (2026-10-05, approved by Basheer)

Light first: the roster is built on Target vs Actuals now; the Target &
Coverage Planning screen (`TargetPlanningScreen`, same screen under two
names) follows as a separate pass. The old build order below is superseded.

1. **Done `1821c30` (2026-10-05).** **Database, one migration (0060):** PO date on Opportunities + SBU target
   table. Shown for approval, applied to Dev only, `Physical-Schema.sql`
   regenerated, `alembic current` recorded.
2. **Backend, Opportunity side:** PO date field; required at Order →
   Delivery and at Won; never in the future; no fallback for older records
   (revised 2026-10-06); tests.
3. **Backend, Target vs Actuals:** roster (every active SBU member except
   Admin) with statuses and the "N of M haven't submitted" line; managers
   see only "Draft" on others' plans; "was ₹X approved" note; PO received
   and Won (paid) columns, with the "no PO date" note; SBU row and company row; GM entry of the SBU
   target; role visibility; endpoint rename. **Checkpoint commit** (tests
   pass), proposed for approval.
4. **Frontend:** Target vs Actuals screen (rows, columns, status labels),
   GM box for the SBU target, PO date box on the Opportunity screen, rename;
   `api.ts` types hand-edited.
5. **Checks:** pytest, ruff, tsc, lint; `/code-review` at **high**
   (migration + visibility); fresh E2E plan checked against live Dev data,
   with a hide-check case and Simple/Complex tags; Dev backend restarted;
   manual E2E; commit, push, post-commit checklist.
6. **Second pass: Target & Coverage Planning screen.** Roster and statuses
   on that screen, reusing the step 3 backend. Own short plan, own test
   (the screen last passed E2E 38/38, so it is re-tested), own commit.
7. **UAT move, only after step 6 is built and tested** (Basheer,
   2026-10-05): one combined move (Hospital-wise Target Planning + Target
   vs Actuals + Audit Trail redesign + Target & Coverage roster). Needs a
   UAT backup first and its own approval; the hospital re-filing (step 5
   of the old order below) and close-date items still apply.

### Old build order (superseded)

1. **Backend:** one new read-only endpoint returning, for a quarter and
   SBU, every visible plan's hospitals with planned / won / expected, the
   Unplanned lines, No-plan people, brand planned vs won, closing-date-passed
   Opportunities and the no-closing-date count; zone totals from the same data.
   Service tests for each Decisions line: owner credit, unplanned, no plan,
   Active-only expected, current / past / future quarter rules, late Opportunities
   in the current quarter, midnight-IST quarter edges, brand totals, and
   visibility per role.
2. **Checkpoint commit** (backend tests pass), proposed for approval.
3. **Frontend:** the Plan vs Actual section on the Insights Dashboard
   (person table, expandable rows with hospitals, brands and late Opportunities,
   By Zone table, SBU filter, quarter picker).
4. pytest, ruff, tsc, lint; `/code-review` (medium: read-only, no migration,
   but visibility-sensitive); written E2E plan checked against live Dev
   data; manual E2E; commit; post-commit checklist.
5. Then the combined move to UAT (Hospital-wise Target Planning + this) (its own plan, per
   `docs/Deployment-Topology.md`). **That plan's first step (Basheer,
   2026-09-30):** a read-only check, run only with Basheer's go-ahead on
   the day, of how UAT hospitals are filed: how many sit at region level
   (e.g. "South Kerala") rather than inside a district. A rep's hospital
   picker only offers hospitals filed inside their own districts, so
   region-level hospitals would be invisible to district-level reps
   (found on Dev while preparing Hospital-wise Target Planning's E2E, where Vivek's area held 0
   hospitals). **Run early, 2026-09-30:** 85 of 432 UAT hospitals are
   filed at region level (North Kerala 43, South Kerala 24, Bangalore
   18); Irfan (Sales Staff, Imaging) has no area assigned (Progress-Archive
   2026-09-30). **Basheer's choice: Option A, re-file each into its real
   district** (not a rule change, which would show reps colleagues'
   hospitals) — held until he has discussed it with Haroon; then pick
   the manual (team edits on the customer page) or spreadsheet (Claude
   applies, UAT read + write each approved) route. Irfan's area to be
   assigned by then. Re-run the check on the move day.
   **Also in this move (Basheer, 2026-10-01):** bring the user manual and
   in-app `?` help up to date — see `docs/Backlog.md` "Bring the user
   manual and in-app `?` help up to date".

## 4. Not in this plan (with reasons)

- **Roster on the Target & Coverage Planning screen** — not in this pass;
  it is the separate second pass (step 6 above), before the UAT move.

- **Split-shared credit** — waiting on Haroon; see Decisions and Backlog
  "Reports never implement split-weighted attribution".
- **The Fuller items** (click-down ladder, Customer 360 view, monthly chart,
  automatic overdue reminder) — Lighter chosen; each can be added later
  without rework. The reminder needs the nightly job planned for stale-Opportunity
  alerts (Traceability 4.5).
- **"Closing date pushed back N times"** — Backlog idea (2026-09-29).
- **Visit compliance** (did the rep visit as often as planned) — not in the
  Traceability matrix; out of Phase 1 scope (Basheer, 2026-09-28).

## 5. Business rules and records to update

- `docs/Business-Rules.md` BR-OP-16 (Closing Date Passed) — added
  2026-09-29 with this plan. With the build: a BR-PL rule for how Won /
  Expected this quarter / Likely finish are counted; the Implementation
  Matrix rows for both.
- Traceability 3.2 (and 6.1 with Hospital-wise Target Planning) to Done only after E2E passes;
  regenerate the scorecard.
- UI-Inventory: the new dashboard section.

## 6. Technical addendum

- **Endpoint:** `GET /planning/targets/plan-vs-actual?sbu_id&planning_period`
  in the planning router. The older `/zone-rollup` endpoint was retired at
  code review (2026-10-04): nothing called it and it counted rejected plans.
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
  finish = Won). Active Opportunities with NULL `expected_closure_date` returned as
  a count only.
- **Closing date passed (BR-OP-16):** `status = ACTIVE AND
  expected_closure_date < today (IST)`; returned per person with Opportunity id,
  name, account, date, value.
- **Visibility (fixed at code review 2026-10-04):** `target_plan` RLS lets any
  role see plans in its zone subtree, wider than the owner scope used for
  Opportunities. So `PlanVsActualRepository.list_plans` joins the plan owner
  to `UserProfile` and applies the same `_apply_owner_scope` rule
  (TEAM_SCOPE_BUILDERS; Admin/GM unrestricted). Colleagues outside the
  viewer's scope are hidden entirely, plan and actuals alike. Totals label:
  "Company total" for Admin/GM, "Total (your view)" for others.
- **Zones:** ZONE-level ancestor grouping on `account.zone_id` for both
  planned and actual (own implementation in `PlanVsActualService`).
- **Quarter → dates:** "YYYY-Qn" with YYYY = FY start year (Q3 = Oct–Dec);
  a backend helper mirroring `getFiscalQuarterBounds` in
  `sales-os-app/src/utils/formatter.ts`.
- **Frontend:** new section in `InsightsDashboardScreen.tsx` (existing
  `SectionCard`, `StatTile`); expandable rows as in `TargetPlanningScreen.tsx`
  (Hospital-wise Target Planning plan, step 3, part (c)); regenerate `types/api.ts`.
