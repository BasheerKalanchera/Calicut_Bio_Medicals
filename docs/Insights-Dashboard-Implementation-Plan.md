# Insights Dashboard / Reporting — Implementation Plan

**Status:** Approved for build, 2026-09-11 — **Batch 1a**, a 5-widget slice of Batch 1
below, chosen as the fully-spec'd subset ready to build now. Target Planning (this
doc's original prerequisite) has **not** been built yet, checked directly against
`backend/app/domains/` — confirmed not a blocker: none of Batch 1a's 5 widgets need
fiscal-quarter resolution, only Batch 2 does. Build proceeds in three parts: **Part 1
(this document)** — plan; Part 2 — backend (`reporting` domain, tests); Part 3 —
frontend (`InsightsDashboardScreen.tsx` + nav).

**Batch 1a scope (5 widgets, 4 endpoints):** Pipeline Value, Weighted/Unweighted
Forecast (share one endpoint), Overdue Actions, Activity Levels, Stagnant Deals.
**Deferred, still part of Batch 1 conceptually but not this build pass:** Product
Performance Summary (actively being spec'd in a separate, concurrent planning
session as of 2026-09-11 — see its section below, not yet final, don't build against
it until that thread resolves), High-Priority Deals (rule proposed and data-derived
2026-09-11, but pending Cabio leadership confirmation — see its section below,
don't build against it until that confirmation lands), Opportunities On Hold (no
concrete schema/endpoint spec'd out below at all yet). Pick up all three as a
follow-on once Batch 1a ships.

**Batch 1b, built and verified 2026-09-11 (same day, once the Dashboard-vs-Reports
split above landed):** three report screens, all shipped. (1) **Stagnant Deals
extracted** out of `InsightsDashboardScreen.tsx` into `StagnantDealsReportScreen.tsx`
— backend/`StagnantDealsResponse` unchanged, frontend relocation only. (2)
**Opportunities On Hold** — spec'd below (PRD §5.13), built as `GET /reporting/
opportunities-on-hold` + `OpportunitiesOnHoldReportScreen.tsx`, no schema gaps. (3)
**Product Performance Summary** — built as `GET /reporting/product-performance` +
`ProductPerformanceReportScreen.tsx`, **except Gross Margin**, which stays blocked
on the pending Pricing/Discount-Authority feature. New **REPORTS** nav section;
shared tile/card helpers extracted to `components/ReportingUI.tsx`. 11 new backend
tests (38 in the domain), full suite 778/778, `tsc`/lint/`ruff` clean, manually
verified live on Dev. **High-Priority Deals stays excluded** — still pending Cabio
leadership confirmation, not a technical blocker. Full narrative: `docs/Progress-
Archive-2026-09.md`'s "2026-09-11 (later still) — Insights Dashboard, Batch 1b" entry.

### Dashboard vs. Reports — restructuring decided 2026-09-11

The PRD itself already draws this line — §5.3–5.5/Appendix A.2 ("Dashboards," small
per-role KPI tiles) are a different kind of screen from §5.6/Appendix A.3
("Reports," full standalone screens with filtering/grouping/drill-down). This plan
originally bundled both kinds into one `InsightsDashboardScreen.tsx`. **Decided:
split them.** Four of the eight Batch 1 items are single numbers or small
per-rep comparisons — genuine dashboard tiles. The other four are each a table of
specific records — genuine reports, and cramped as dashboard cards:

| Stays a dashboard tile | Becomes its own report screen |
|---|---|
| Pipeline Value | Stagnant Deals |
| Weighted/Unweighted Forecast | Product Performance Summary |
| Overdue Actions (per-rep count) | High-Priority Deals |
| Activity Levels (per-rep comparison) | Opportunities On Hold |

**Stagnant Deals migration, not free:** this one already shipped as a dashboard tile
in today's Batch 1a build. Moving it to its own report screen means relocating the
existing frontend rendering to a new route/screen — the backend endpoint and
`StagnantDealsResponse` shape don't need to change, only where it's rendered.
**Done as part of Batch 1b, same day** — see status header above.

**Related, found while researching this — not scoped, flagged for later:** PRD
Appendix A.3.6, "No Activity Hospital Report" (same thing §5.7 calls "Exception
Reports"), is a genuinely different report from both Daily Activity Report and
Stagnant Deals — it's **account-level** (hospitals with zero activity in 3 months,
even ones with no open deal at all), not deal-level. Spec: Customer, Last Activity
Date, Account Manager, Opportunity Count, Installed Asset Count. Also worth knowing:
PRD §5.8 "Weekly Follow-up Report" is a digest that bundles High-Priority Deals,
deals ≥70% probability, Stagnant Deals, and Overdue Actions into one weekly view —
directly overlaps with the reports being split out here. Neither is scoped or
built; noted so they aren't rediscovered from scratch later.

## Context

`implementation_plan.md`'s one-line scope ("attainment progress bar, win rates, stagnant
warnings, rep comparisons") undersells the actual spec — the PRD (§5, Appendix A.2) has
a much larger Reporting & Review Module: per-role dashboards (Salesperson/Manager/GM),
Forecasting, Pipeline Coverage Monitoring, Exception Reports, Weekly Follow-up Report,
Installed Base/Warranty reports, Customer Portfolio Report. All of it is out of scope
for one week — this plan picks the highest-value, lowest-dependency slice.

### Split: what needs Target Planning, what doesn't

Checked every metric in PRD §5.3/5.4/5.5 and A.2.1–A.2.3 against whether it needs
`target_plan` data:

| Target-independent (**Batch 1, this plan**) | Target-dependent (**Batch 2, later**) |
|---|---|
| Pipeline Value (by stage/rep/SBU/zone) | Revenue Target vs. Achieved |
| Weighted & Unweighted Forecast | Achievement Percentage |
| ~~Pipeline Aging~~ — dropped, see Open questions §1 (resolved 2026-08-25) | Pipeline Coverage Ratio (`§5.2`: active pipeline < 3× target) |
| Overdue Actions — **team-rollup only**, see Open questions §3 (resolved 2026-08-25) | Beat Plan Compliance (also needs Coverage Planning) |
| High-Priority Deals | Team Revenue Target rollup |
| Team/Rep Activity Levels | |
| Opportunities On Hold | |
| Stagnant/Exception deals (§5.7 — no activity in 3 months) | |
| Product Performance Summary | |

Batch 2 is a fast follow once Target Planning (this week's batch) has real data — same
domain, additive work, not a rebuild.

### BR-OP-06 (Stalled Opportunity Detection) — deliberately narrowed for this pass

`BR-OP-06` calls for an actual `Stalled` **status transition** (opportunity flips status
after 180 days of no activity, reverts on new activity, notifies the rep + manager) via
a scheduled background job (`OpportunityMonitoringJob`). **No job scheduler exists in
this codebase today** (checked — no APScheduler/Celery/cron infra in `backend/`), so
building the real BR-OP-06 automation is a separate, bigger piece of work (needs a
scheduling decision: Render Cron Job add-on vs. in-process scheduler vs. an
admin-triggered endpoint as an interim step).

**This plan ships the read-only reporting half only:** a "Stagnant Deals" report/widget
computed at query time (`MAX(activity.activity_date)` per opportunity, or
`opportunity.created_at` if it has none, compared against a threshold — **exposed as a
report parameter, default 180 days (BR-OP-06), with 3 months/~90 days (PRD §5.7)
selectable as an alternate — resolved 2026-08-25, see Open questions §2: ship both as
parameter options rather than picking one.** **No status mutation, no notification job.**
The actual BR-OP-06 automation stays a separate backlog item — flagged here, not
silently absorbed into this batch.

### Overdue Actions tile — distinct from the Reminders-on-Login bell, resolved 2026-08-25

`Reminders-on-Login`'s bell/dialog (shipped) already shows every user a count of their
own overdue Next Actions, once, at login. A dashboard tile computing the exact same
"my own overdue count" for a Sales Staff rep would be pure duplication. **Decided: the
Overdue Actions tile is team-rollup only** — it does not render for Sales Staff at all
(they already have the bell), and for SBU Manager/Area Manager/Admin/GM it shows their
team's overdue-action count broken out per rep via `TEAM_SCOPE_BUILDERS` — a view the
bell never provides anyone. See Open questions §3.

## Backend

### Reuse, don't reinvent — the RBAC scoping pattern already exists

`backend/app/domains/organization/repository.py` already has `UNRESTRICTED_ROLES` (Admin,
General Manager) and `TEAM_SCOPE_BUILDERS` (`SBU Manager` → own SBU; `Area Manager` →
own SBU + zone-closure + direct reports) — proven twice already (User Directory,
Daily Activity Report). Reporting queries reuse this unchanged, joining
`Opportunity` → `UserProfile` on `Opportunity.owner_id` (same shape as Daily Activity
Report's `Activity.user_id` join). **No new RLS policies needed** — these queries read
through `opportunity`/`opportunity_item`/`activity`, all already RLS-protected;
`TEAM_SCOPE_BUILDERS` is an *additional* app-layer narrowing on top of RLS for
aggregate/rollup queries where RLS alone can't express "give me a SUM grouped by rep,"
same reasoning as Daily Activity Report's design.

**One inherited gap to be aware of, not fix here:** `Daily-Activity-Report-Technical-Design.md`
flagged that `activity_tier_visibility`'s RLS policy leaves account/project-only
activities (`opportunity_id IS NULL`) visible to every authenticated user. This plan's
queries go through `opportunity`/`opportunity_item`, not raw `activity` rollups, so it
isn't directly exposed here — noted so it isn't forgotten, not re-litigated.

### Value calculation — no denormalized total exists

`Opportunity` has no `total_value_lakhs` column — value lives on
`OpportunityItem.extended_value_lakhs`, one row per line item. Every aggregation in this
plan needs `SUM(opportunity_item.extended_value_lakhs) GROUP BY opportunity_id` first,
then rolls further up (by rep/stage/SBU/zone) from there — not a single-table `SUM`.

**Forecast weighting** (BR-OP-07/BR-OP-08): weighted forecast =
`SUM(item_total * win_probability / 100)` for opportunities in `Active` status only
(`On-Hold`, `Stalled`, `Lost` excluded per BR-OP-07 — `Won` counted separately as
closed-won revenue, not forecast).

### Domain: `backend/app/domains/reporting/` (new)

- `schemas.py` — `PipelineSummaryResponse` (total value, weighted forecast, unweighted
  forecast, count — by stage/rep/SBU/zone grouping param), `StagnantDealsResponse`
  (opportunity + last-activity-date + days-stagnant; takes a `threshold_days` query
  param, default 180 per BR-OP-06, with 90/~3-months as the documented alternate per
  PRD §5.7), `RepActivityLevelResponse` (activity count per rep over a period —
  **includes Sales Development Activities in the count, decided with Haroon
  2026-08-27**, `docs/Discussion-Sales-Development-Activities-2026-08.md`; a separate
  annual target/attainment view for just that subset is a later addition, tracked in
  `docs/Backlog.md`'s "Annual Development-Activity KPI" entry, not part of this
  batch),
  `OverdueActionsResponse` (reuses the existing `Reminder` overdue query already built
  for Reminders-on-Login — don't rebuild it, **but grouped by rep via
  `TEAM_SCOPE_BUILDERS`, not per-user like the login bell — see the Overdue Actions
  scope note below**). **No `PipelineAgingResponse` this
  batch** — dropped 2026-08-25 (Open questions §1): no stage-transition history table
  exists, and the `updated_at` approximation was rejected rather than shipped. Revisit
  once a real stage-history table exists.
- `repository.py` — raw aggregation queries (`func.sum`, `func.count`, `group_by`) via
  SQLAlchemy Core-style queries on the ORM models, each taking `current_user` and
  applying `TEAM_SCOPE_BUILDERS` the same way Daily Activity Report's
  `list_by_date` does.
- `service.py` — `ReportingService`: one method per dashboard widget, thin — the real
  logic is in the aggregation queries; the service's job is period-range resolution
  (`YYYY-Qn` → date bounds, reusing `BR-PL-01`'s existing fiscal-quarter logic if it's
  already implemented somewhere in the planning domain — check before writing a second
  implementation of "quarter to date range") and stitching the query results into the
  response shape.
- `router.py` — `GET /reporting/pipeline-summary`, `GET /reporting/stagnant-deals`,
  `GET /reporting/activity-levels`, `GET /reporting/overdue-actions`,
  `GET /reporting/product-performance`, `GET /reporting/opportunities-on-hold`.
  All take optional
  `sbu_id`/`zone_id`/`user_id` filters (further narrowing on top of what
  `TEAM_SCOPE_BUILDERS` already scopes the caller to — same pattern as the Daily
  Activity Report's team-member dropdown); `stagnant-deals` additionally takes
  `threshold_days` (default 180); `overdue-actions` returns an empty result (or a
  clean 403 — decide at build time, consistent with how the rest of this domain
  handles a role with nothing to see) for Sales Staff, since it's team-rollup only.

### Product Performance Summary — spec'd 2026-09-11, added as this plan's 6th tile

Per PRD A.3.4 ("Product Performance Report"). Two of the PRD's metrics/groupings can't be
built as specified — flagged rather than silently dropped:

- `ProductPerformanceResponse` (per `product_id`, grouped by Product or SBU): **Quantity
  Sold** and **Revenue** (`SUM(opportunity_item.quantity)` / `SUM(extended_value_lakhs)`,
  WON opportunities only), **Average Selling Price** (Revenue ÷ Quantity Sold),
  **Opportunity Count** (distinct opportunities with a line item for this product, any
  status), **Won Opportunities** / **Lost Opportunities** (same, filtered by status).
  Same `TEAM_SCOPE_BUILDERS` scoping as every other tile — a rep sees only products tied
  to their own deals, a manager sees their team's.
- **Gross Margin — renamed from "Margin," blocked on the pending Pricing/Discount-
  Authority feature, not this build pass.** The PRD lists "Margin" as a metric, but no
  cost field exists on `product` or `opportunity_item` anywhere in `Physical-Schema.sql`
  today — there's no data to compute it from. **Deliberately renamed to Gross Margin**
  (Basheer, 2026-09-11): this can only ever be Revenue minus the machine's acquisition
  cost from the OEM — it excludes marketing, operations, and every other overhead cost,
  which live only in Tally and aren't allocated per-product even there (Tally's Cost
  Centres are SBU/Territory-level, per `docs/Discussion-Tally-SBU-Territory-
  Accounting-2026-09.md`). Labeling it plainly as Gross Margin avoids leadership reading
  it as full profitability. **Unblocks once `docs/Discussion-Pricing-Discount-
  Authority-2026-09.md` ships** — that paper bundles in the same `unit_cost_lakhs`
  field this metric needs (Admin/GM-visible only), so this tile is a fast-follow once
  that feature lands, not a separate migration.
- **Brand grouping — resolved 2026-09-11, ready to build.** PRD groups by
  Product/Brand/OEM/SBU; the schema has no dedicated Brand field, but `product.oem_name`
  already functions as brand in practice (confirmed against real UAT data — "SonoScape,"
  "Edan," "Magnamed" are exactly what reps and customers call the brand). Group by
  `oem_name`, case-insensitively (`UPPER(TRIM(oem_name))`) — UAT data has the same
  brand spelled two ways in places (e.g. "Edan" vs "EDAN"), which a raw-text `GROUP BY`
  would incorrectly split into two rows. A short list of stray `oem_name` values (a city
  name, a value with "Refurbished" wrongly appended) was handed to Basheer for Cabio
  leadership to correct in UAT directly — not this build's problem to work around.
- **Relationship to the "quarterly reorder recommendation" Backlog item (Latheef Bhai's
  idea):** this tile shows *historical* sell-through per product — a useful demand-trend
  reference, but it is not the same calculation as that item's forward-looking
  `MOQ_threshold - (current_stock - expected_units_from_pipeline)` formula, which still
  needs stock-on-hand data and an MOQ field that don't exist yet (see `docs/Backlog.md`).
  This tile can inform that future work but doesn't replace it.
- Tests: aggregation correctness (known fixture data → known SUM/COUNT), and the same
  role-by-role scoping test shape used for Target Planning — a rep sees only their own
  numbers, an Area Manager sees their zone, etc.

### High-Priority Deals — analysis done 2026-09-11, rule proposed, pending leadership confirmation

PRD §3.9 just says "provide a High Priority flag" with no definition of how it's set —
see `docs/Backlog.md`'s "Auto-computed High Priority flag" entry for the full framing
(manual checkbox vs. automatic, feasibility check confirming no schema change is
needed). Rather than asking Basheer to pick threshold numbers cold, pulled the real
spread from UAT's 87 ACTIVE opportunities:

- **Deal size, checked per-SBU because a flat cutoff would be unfair:** Critical Care's
  typical open deal (₹2.5L median) is far smaller than Imaging's (₹18L median) — mixing
  many small individual-item deals (monitors, pumps) in with occasional large hospital
  packages. Top-quarter cutoffs: Imaging ₹28L, Critical Care ₹14L.
  **Proposed, rounded: Imaging ≥₹30L, Critical Care ≥₹15L.**
  **12 opportunities were excluded from this analysis as data outliers** — see
  `docs/Backlog.md`'s new "Lakhs/Rupees unit-entry bug" entry; their values are
  inflated ~100,000x by an apparent Rupees-typed-into-a-Lakhs-field mistake, not real.
- **Urgency:** `expected_closure_date` is only gate-required from Negotiation stage
  onward (BR-OP-01) — of the 87 ACTIVE deals, only 13 have reached Negotiation or
  later, and 11 of those 13 have the date filled in as expected (the other 74 not
  having it isn't a data gap, it's the gate working correctly). A 30-day window
  barely discriminates within that group (catches 10 of 11 — almost everything that
  far along the pipeline is already inside 30 days by nature). **Proposed: within 14
  days, or already overdue** — catches 6 of 11, leaving the 18-50-day-out deals
  correctly read as "in negotiation, not yet urgent."
- **Proposed final rule:** flag an ACTIVE Opportunity as High Priority when it clears
  its SBU's size cutoff (Imaging ≥₹30L, Critical Care ≥₹15L), OR its Expected Closure
  Date is within 14 days or has passed — either condition alone qualifies, computed at
  query time (no new column, no migration), same shape as the existing
  `threshold_days` pattern (Stagnant Deals).
- **Status: not approved.** Basheer is taking these numbers to Cabio leadership to
  confirm before this gets scoped as a real `schemas.py`/`router.py` entry. Do not
  build against this section until that confirmation lands — same caution the
  Product Performance Summary section above already carries for its own open
  questions.

### Opportunities On Hold — spec'd 2026-09-11, ready to build

Per PRD §5.13 ("Opportunity Hold Report"). Fully buildable, no schema gaps:

- `OpportunitiesOnHoldResponse` rows: **Customer** (`Account.name`), **Opportunity**
  (`Opportunity.name`), **Current Stage** (`OpportunityStage.stage_name`), **Hold
  Reason** (`HoldReason.reason_name`, via `Opportunity.hold_reason_id`),
  **Reactivation Date** (`Opportunity.reactivation_date`, already a real column),
  **Days On Hold**.
- **Days On Hold — computed from the Audit Trail, not a new column.** Unlike
  Pipeline Aging (dropped, no stage-history table exists at all), `trg_audit_
  opportunity` (migration `0030`) already fires on every `opportunity` UPDATE and
  snapshots `old_data`/`new_data` with a `changed_at` timestamp. Days On Hold =
  `now() - changed_at` of the most recent `audit_log` row for this opportunity
  where `new_data->>'status_id'` matches the On-Hold status and differs from
  `old_data->>'status_id'` (a genuine transition into Hold, not just any edit while
  already on hold). Falls back to `opportunity.updated_at` only if no such audit
  row exists (shouldn't happen for anything held after audit trail went live,
  2026-09-02) -- same fallback shape as Stagnant Deals' `created_at` fallback.
- Scoping: same `TEAM_SCOPE_BUILDERS`/`UNRESTRICTED_ROLES` pattern via
  `Opportunity.owner_id`, filtered to `status_code = 'ON_HOLD'`.
- New endpoint: `GET /reporting/opportunities-on-hold`, same optional
  `sbu_id`/`zone_id`/`user_id` filters as the others.
- Tests: same shape as the other reporting queries (role-scoping +
  aggregation/join correctness via mocked-SQL-compilation assertions).

## Frontend

- `sales-os-app/src/screens/InsightsDashboardScreen.tsx` (new) — role-adaptive: Sales
  Staff sees their own pipeline/forecast tiles, **no Overdue Actions tile** (redundant
  with their own Reminders-on-Login bell — resolved 2026-08-25, see "Overdue Actions
  tile" note above); SBU Manager/Area Manager/Admin/GM additionally see the team-level
  widgets (rep comparison, activity levels, stagnant deals list, and the team-rollup
  Overdue Actions tile). Reuses the tile/stat-card visual language already
  established (check `dataviz` skill guidance before building any chart — this project
  hasn't shipped a chart yet, so this is the first one and worth getting the palette
  and mark choices right from the start).
- Nav: add to **SALES EXECUTION** (not Administration — Sales Staff has a real,
  scoped-down view of this screen too, unlike Target Planning which is manager-only).
  `{ id: "insights", label: "Insights", icon: "📊" }`, no role gate on visibility —
  the backend/RLS scoping already produces the right content per role.
- `services/reporting.ts`, `types/reporting.ts` — typed, following the same pattern
  called out in Target Planning's plan (no `Promise<unknown>`).

## Out of scope for this pass

- **Pipeline Aging** — dropped 2026-08-25 (Open questions §1, below): no
  stage-transition history table exists, and the only available fallback
  (`opportunity.updated_at`, which resets on any field edit, not just a stage change)
  was judged too imprecise to ship rather than accepted as a known-gap approximation.
  Revisit once a real stage-history table exists — separate, bigger schema work than
  this batch should absorb.
- Batch 2 (attainment %, pipeline coverage ratio, Team Revenue Target rollup) — follows
  once Target Planning has real data.
- BR-OP-06's actual status-transition automation (scheduled job + notifications) —
  separate backlog item; this pass ships the read-only "stagnant deals" report only.
- GM Dashboard's Zone/Product/Competitive-Loss summaries, Weekly Follow-up Report,
  Installed Base/Warranty reports, Customer Portfolio Report — later Reporting
  batches, PRD §5.5–§5.12.
- Excel/PDF export (PRD Appendix A.1) — not this pass.
- Beat Plan Compliance/Progress — depends on Coverage Planning, not built yet.

## Verification

- Backend: `pytest` (aggregation correctness + role-scoping tests), `ruff check
  app/domains/reporting/`.
- Frontend: `tsc --noEmit`, `npm run lint`.
- Manual, role-by-role on Dev (same RLS/role smoke-test discipline as Target Planning):
  Sales Staff sees only their own numbers; each manager tier sees the correct
  team slice; verify the weighted-forecast math against a known fixture opportunity by
  hand; verify Stalled/On-Hold/Lost opportunities are excluded from forecast totals
  per BR-OP-07.

## Open questions for Basheer — all three resolved 2026-08-25

1. **Pipeline Aging** needed a per-opportunity "time in current stage" — there's no
   stage-transition history table today (confirmed no such model exists), and the only
   fallback (`opportunity.updated_at`, imprecise — any field edit resets it, not just a
   stage change) was too imprecise to ship. **Decided: drop the widget from Batch 1
   entirely** — see "Out of scope for this pass," above. Revisit once a real
   stage-history table exists.
2. **Stagnant-deals threshold** — BR-OP-06 says 180 days, PRD §5.7 says "3 months" for
   the Exception Report, two conflicting numbers for the same concept. **Decided: ship
   both, as a `threshold_days` report parameter defaulting to 180** (BR-OP-06), with
   90/~3-months selectable as the alternate — avoids picking one over the other
   outright. Reflected in the `schemas.py`/`router.py` bullets above.
3. **Overdue Actions tile vs. the Reminders-on-Login bell** — for a Sales Staff rep,
   a dashboard tile of "my own overdue Next Actions" would just repeat the number
   their login bell already shows. **Decided: team-rollup only.** Sales Staff don't
   get this tile; SBU Manager/Area Manager/Admin/GM see their team's overdue-action
   count, broken out per rep — real value the bell doesn't provide anyone. Reflected
   in the "Overdue Actions tile" note, the `router.py` bullet, and the Frontend
   section above.
