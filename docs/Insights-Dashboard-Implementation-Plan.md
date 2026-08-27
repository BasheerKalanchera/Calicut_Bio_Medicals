# Insights Dashboard / Reporting — Implementation Plan

**Status:** Draft — planned, not yet built. Second Milestone 2 batch, proposed for next
week's incremental deploy (after Target Planning), per `docs/Deployment-Topology.md`'s
weekly-batch model.

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
  `GET /reporting/activity-levels`, `GET /reporting/overdue-actions`. All take optional
  `sbu_id`/`zone_id`/`user_id` filters (further narrowing on top of what
  `TEAM_SCOPE_BUILDERS` already scopes the caller to — same pattern as the Daily
  Activity Report's team-member dropdown); `stagnant-deals` additionally takes
  `threshold_days` (default 180); `overdue-actions` returns an empty result (or a
  clean 403 — decide at build time, consistent with how the rest of this domain
  handles a role with nothing to see) for Sales Staff, since it's team-rollup only.
- Tests: aggregation correctness (known fixture data → known SUM/COUNT), and the same
  role-by-role scoping test shape used for Target Planning — a rep sees only their own
  numbers, an Area Manager sees their zone, etc.

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
