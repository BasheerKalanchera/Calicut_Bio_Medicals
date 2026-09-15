# Sales Report + Pipeline Report — Implementation Plan

**Status:** Approved, ready to build. **Feature:** 11.1, Module 5 → PRD 5.6
Core Reports (2 of its 4 report types — Product Performance already exists,
Margin is next week per `docs/Phase1-Completion-Sprint-Plan.md`). Also
closes Feature 2.2's Pipeline product filter row — Basheer's 2026-09-14
decision was that a product breakdown belongs on this standalone Pipeline
Report, not bolted onto the Kanban filter bar; this plan is that report.

**No file overlap with the in-flight Kanban Priority Sort work** — checked
via `git status` before scoping this: that work has `opportunity/
repository.py`, `router.py`, and `OpportunityPipelineScreen.tsx` staged
(finished, awaiting commit). This plan deliberately stays out of all three —
Pipeline Report reuses the existing `reporting`-domain `pipeline_summary`
endpoint as-is, and Sales Report's one opportunity-domain touch is
`service.py`/`models.py`/`schemas.py` (a new column + one stamping hook),
none of which the Kanban-sort work modifies.

## What each report is (plain terms)

**Pipeline Report** answers "what's in progress right now" — it's the
standalone-screen version of the breakdown already on the Insights
Dashboard (Stage/Rep/SBU/Zone/Product), just given its own Report screen
so a product-focused view doesn't need a filter bolted onto the Kanban
board itself.

**Sales Report** answers a different question — "what did we actually
sell, and how well." Headline numbers for a period (revenue won, deals
won, win rate, average deal size), then the same kind of breakdown
(Rep/Zone/SBU/Product) but for Won deals instead of open ones. No
peer-ranking/leaderboard — see the "Design decision" section below for why.

## Design decision: closed_at is a real gap, being fixed properly

Revenue "for a period" needs the date a deal actually closed. Today
`Opportunity` has no such field — only `updated_at`, a generic audit
timestamp that changes on *any* edit (fixing a typo months later would
misdate a sale). **Basheer's call, 2026-09-15: fix this properly** — add a
real `closed_at` column, stamped automatically and exactly once, the
moment a deal's status first becomes terminal (Won or Lost), rather than
approximating with `updated_at` or shipping without period filtering.

## Design decision: no rep leaderboard/ranking

Raw revenue comparison across reps doesn't mean much at Cabio — each rep's
territory, product mix, and realistic target differ by factors this system
doesn't model. **Basheer's call, 2026-09-15:** "Rep" is just a fourth
option in the same neutral breakdown dropdown as Zone/SBU/Product (a plain
bar list, like today's "Pipeline by Rep"), not a ranked leaderboard. A
Sales Person's own screen shows their own single bar for free, via the
same role-scoping used everywhere else — no special-casing needed. A real
"how am I doing" comparison belongs to a separate, later feature
(actual-vs-target dashboards, Feature 3.2) once Target Management exists —
peer-ranking would have been the wrong substitute for that.

## Backend

1. **`backend/alembic/versions/0043_add_opportunity_closed_at.py`** (new,
   head is currently `0042`) — `ALTER TABLE opportunity ADD COLUMN closed_at
   TIMESTAMPTZ NULL`. Nullable, no backfill — existing Won/Lost deals in
   Dev have no real historical close date to backfill honestly; they'll
   correctly appear in "All Time" views and correctly be excluded from any
   period-filtered view, which is the accurate behavior, not a bug.
2. **`backend/app/domains/opportunity/models.py`** — `Opportunity` gains
   `closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True),
   nullable=True)`.
3. **`backend/app/domains/opportunity/service.py`**, `update_opportunity`
   (~line 368, right after the existing `validate_status_transition(...)`
   call inside the `if "status_id" in updates:` block) — add:
   `if effective_status.is_terminal and opportunity.closed_at is None:
   opportunity.closed_at = func.now()`. Idempotent by construction —
   `validate_status_transition`'s own BR-OP-09 check already forbids
   leaving a terminal status, so this can never re-fire once set.
4. **`backend/app/domains/reporting/schemas.py`**:
   - `SalesGroupBy = Literal["rep", "sbu", "zone", "product"]` (no
     `"stage"` — every row here is already Won, stage is frozen/irrelevant).
   - `SalesHeadline` (`revenue_lakhs`, `won_count`, `lost_count`,
     `win_rate`, `avg_deal_size_lakhs`) and `SalesSummaryRow`/
     `SalesSummaryResponse` (same `group_id`/`group_name` shape as
     `PipelineSummaryRow`).
5. **`backend/app/domains/reporting/repository.py`**:
   - `sales_headline(current_user, *, sbu_id=None, zone_id=None,
     user_id=None, period_start=None, period_end=None)` — one row, no
     grouping: `is_won`/`is_lost` case sums (same pattern as
     `product_performance`), filtered to `Opportunity.closed_at` within
     the period when given. `win_rate`/`avg_deal_size` computed in the
     service layer from the raw counts/revenue, not in SQL.
   - `sales_summary(current_user, group_by: SalesGroupBy, *, ...)` — same
     shape as `pipeline_summary` (same joins to `Account`/`Zone`/`SBU`/
     `UserProfile`, same `_NET_VALUE`), but filtered to Won only, and
     reuses the exact `product` coalesce/outer-join/Trade-Ins-bucket
     handling already built for `pipeline_summary` — same reasoning
     applies identically (a Buyback line on a Won deal still needs
     somewhere to go).
6. **`backend/app/domains/reporting/router.py`**: `GET
   /reporting/sales-headline`, `GET /reporting/sales-summary?group_by=...`.
   Both take `period_start`/`period_end` (plain dates, no fiscal-quarter
   logic on the backend — see Frontend below) plus the usual
   `sbu_id`/`zone_id`/`user_id` filters.
7. **Tests**: `closed_at` stamps on WON, stamps on LOST, does not stamp on
   a non-terminal status change, does not re-stamp on a later no-op save;
   `sales_summary`'s product grouping reconciles to `sales_headline`'s
   revenue the same way verified for `pipeline_summary` today; a Lost deal
   contributes to `lost_count`/`win_rate` but not revenue.

**Pipeline Report needs zero new backend work** — `GET
/reporting/pipeline-summary` already supports every dimension
(Stage/Rep/SBU/Zone/Product) after today's Forecast-by-Product build.

## Frontend

1. **`sales-os-app/src/utils/reporting.ts`** — a small
   `getFiscalQuarterBounds(date)` helper (Cabio's FY is April–March, so
   "This Quarter" is not a calendar quarter) — computed client-side, sent
   to the backend as plain `period_start`/`period_end` dates. "This Month"
   uses plain calendar-month bounds (dayjs, same pattern already used for
   Activity Levels' `periodStart`/`periodEnd`); "All Time" sends neither.
2. **`sales-os-app/src/screens/PipelineReportScreen.tsx`** (new) — same
   shape as `ProductPerformanceReportScreen.tsx`: a breakdown dropdown
   (Stage/Rep/SBU/Zone/Product) calling `getPipelineSummary`, each row via
   `MiniBar` with the `secondaryValue` (weighted forecast) already added
   today. No period picker — pipeline is "right now," not historical.
3. **`sales-os-app/src/screens/SalesReportScreen.tsx`** (new) — period
   picker (This Month / This Quarter / All Time) driving four `StatTile`s
   (Revenue Won, Deals Won, Win Rate, Avg Deal Size) from `sales-headline`,
   then the same breakdown-dropdown-plus-`MiniBar` pattern from
   `sales-summary` (Rep/Zone/SBU/Product only).
4. **`sales-os-app/src/services/reporting.ts`** — `getSalesHeadline`/
   `getSalesSummary` client functions, same pattern as the existing ones.
5. **`sales-os-app/src/DemoApp.tsx`** — `REPORTS_SECTION.items` (~line 63)
   gains `{ id: "pipelineReport", label: "Pipeline Report", icon: "📈" }`
   and `{ id: "salesReport", label: "Sales Report", icon: "💰" }`, plus the
   two screen imports and render-switch entries near the existing report
   screens (~line 800-818). No role gate, same as every other Report —
   `TEAM_SCOPE_BUILDERS` scoping already produces the right per-role slice.

## Out of scope for this plan

- **Margin Report** — the 4th Core Report type, needs product cost data
  first (next week's item).
- **Actual-vs-target comparison for a rep's own Sales Report** — needs
  Target Management (not built). The breakdown-by-Rep option is neutral
  data, not a "how am I doing" verdict.
- **Pipeline aging / stage-history** — a separate Module 5 row, needs a
  new stage-history table, unrelated to this plan.

## Sequencing

Backend: migration → model → service hook → reporting schemas/repository/
router → tests. Frontend: fiscal-quarter helper → Pipeline Report screen
(no backend dependency, can ship first) → Sales Report screen → nav
entries. No overlap with the in-flight Kanban Priority Sort work at any
point in this sequence.
