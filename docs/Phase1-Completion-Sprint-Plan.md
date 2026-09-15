# Phase 1 Completion Sprint Plan

**Created:** 14 Sep 2026, out of the Phase 1 Delivery Scorecard review with Basheer.
**Source:** every item below is one row (or half a row) of the 15 "partly done" lines
in `docs/Signed-Requirements-to-PRD-Traceability.md`, plus one related "not started"
row Basheer wants pulled into this week alongside them. Statuses/counts there and in
`docs/Phase1-Delivery-Scorecard.md` are the source of truth — this doc is the build
order, not a duplicate scorecard. Update both when an item here actually ships.

## This week

1. **Product category/brand pick-list** (Feature 4.1, Module 2 → PRD 2.1 Product
   Structure). Category and Brand are free text today — replace with a controlled
   list so "GE" and "GE Healthcare" can't both exist.
2. **Restrict Product Catalog to Admin/GM only** (Feature 4.1, Module 6b → PRD 7
   Collateral Security — a *different* row that happens to share the same signed
   Feature ID; currently "Not started," pulled into this week on Basheer's call,
   2026-09-14). Any logged-in user of any role can currently view/edit the
   catalog; add the role gate. **Built and manually E2E-verified live
   2026-09-14** (Haroon as GM, Vivek as Sales Staff) — done. Only
   adding/removing a Collateral Link (brochure/video on a product) is
   Admin/GM-gated; viewing/opening an existing link, catalog browsing, and
   product record add/edit (already Admin/GM-only since 2026-08-07) are all
   unaffected, preserving the 2026-08-01 cross-SBU visibility decision. Scope
   was corrected live mid-test — the first build over-restricted viewing too,
   Basheer caught it testing as Vivek. Full pass:
   `docs/Product-Catalog-Collateral-Security-Manual-E2E-Test-Plan.md`.
3. **Lost deal intelligence — competitor-product field + a rolled-up loss report**
   (Feature 1.4, Module 3 → PRD 3.10, and Feature 1.4's own new "Competitive Loss
   Report" row in Module 5 → PRD Appendix A.3.5, added 2026-09-14). Same build
   closes both rows — the competitor-product field on the deal record, plus a new
   summary report across all lost deals ("we lose most to Siemens," "price is our
   #1 loss reason").
4. **Automated stagnant-deal alerts** (Feature 13.2, Module 4 → PRD 4.5 — also
   closes Feature 1.3's per-stage threshold question, Module 3). Needs the app's
   first background scheduler — biggest lift of this week's list. Rule now fully
   specified as `Business-Rules.md`'s BR-OP-06: per-stage thresholds (Lead 14d,
   Qualified 7d, Demo 7d, Negotiation 5d, Order 2d, Delivery & Installation 30d),
   configurable per SBU (Admin/GM editable — needs its own small admin screen or
   an extension of the Reference Data Management Screen, not yet decided which),
   seeded identically for both SBUs today. Auto-flip to Stalled, notify the rep
   and their immediate manager, exclude from forecast.
5. **GM-specific dashboard widgets** (Feature 3.2, Module 5 → PRD 5.3/5.4/5.5).
6. **Report drill-down UI** (Feature 11.2, Module 5 → PRD 5.9). Click a summary row
   to see the underlying record list, instead of filter-only.
7. **Forecast broken down by product** (Feature 2.5, Module 5 → PRD 5.1 — product
   half only). The month/quarter half is next week, see below. **Done,
   2026-09-15** — built, unit-tested, and manually E2E-verified across three
   roles; see `docs/Forecast-By-Product-Implementation-Plan.md` and
   `docs/Forecast-By-Product-Manual-E2E-Test-Plan.md`.
8. **High Priority flag** (Feature 2.2, Module 3 → PRD 3.9 Deal Prioritization —
   currently "Not started," pulled into this week on Basheer's call, 2026-09-14,
   so next week's Kanban-priority-sort item has something to build on). **Rule
   confirmed by Haroon, 2026-09-14** (`Business-Rules.md`'s BR-OP-15), replacing
   the earlier proposed value/closure-date threshold: any deal past Demo stage
   (Clinical Evaluation, Negotiation, Order, Delivery & Installation) is
   automatically High Priority, computed at query time, no stored field needed.
   A deal still in Lead, Qualified, or Demo doesn't qualify automatically, but
   needs a manual flag a person can set by hand — that half does need a new
   field on `opportunity`. **Done, 2026-09-15** — built and manually
   E2E-verified live; see `docs/High-Priority-Deal-Flag-Implementation-Plan.md`
   and `docs/High-Priority-Deal-Flag-Manual-E2E-Test-Plan.md`.

## Next week — each needs a "Not started" prerequisite finished first

1. **Kanban sorted by priority** (Feature 2.2, Module 3 → PRD 3.8). **Done,
   2026-09-15** — built and manually E2E-verified live, ahead of schedule
   (picked up early once the High Priority Deal Flag prerequisite landed);
   see `docs/Kanban-Priority-Sort-Manual-E2E-Test-Plan.md`.
2. **Forecast by month/quarter + the <3x-target pipeline alert** (Feature 2.5,
   Module 5 → PRD 5.1/5.2 — month/quarter half). Needs Target Management
   (Feature 3.1 → PRD 6.4, Not started) built first.
3. **Sales Report + Pipeline Report** (Feature 11.1, Module 5 → PRD 5.6 Core
   Reports — 2 of the 4 report types). No hard blocker, just sizable — scheduled
   for next week on effort, not a dependency. **Now also closes Feature 2.2's
   Pipeline product filter** (was in the blocked bucket) — Basheer's call,
   2026-09-14: a product breakdown belongs on this standalone Pipeline Report,
   not as a filter bolted onto the Kanban board itself, so it's built here
   rather than tracked as a separate ask.
4. **Pipeline aging analysis** (Feature 11.1, Module 5 → PRD Appendix A.1 — the
   other half of "Phase 1 analytics"). Needs a new stage-history table (schema +
   migration) built first.
5. **Product cost + Margin** (Feature 4.3 → Appendix A.1, and the Margin Report
   half of Feature 11.1 → PRD 5.6 Core Reports). Unblocked 2026-09-14 — Haroon
   confirmed cost can be captured. New `product` field, Admin/GM-only at the
   field level (`Business-Rules.md`'s BR-CAT-04 — excluded from the API response
   for every other role, not just hidden in the UI), feeds Margin into the
   Product Performance report and the new Margin Report, both restricted the
   same way. No hard dependency on another row, just sizable — scheduled next
   week on effort and because it needs the same access-control care as the
   Opportunity Notes Privacy work did.

## Deferred to go-live (not this week, not next week)

- **Live production database backup** (Feature 16.1-16.4, Module 7 → PRD 10).
  **Basheer's call, 2026-09-14: only relevant once there's an actual production
  environment to back up — that's at least 2 weeks out.** No code work needed
  now; revisit when go-live is scheduled. The pattern to reuse
  (`scripts/backup_uat.ps1`) is already built and tested, so this is a fast
  follow once Prod exists, not new engineering.

## Blocked on someone else's decision — not schedulable by engineering time alone

*(empty — the last item here, A/B/C/D hospital class, was resolved 2026-09-14; see "Parked for Phase 2" below)*

## Parked for Phase 2

- **A/B/C/D hospital class** (Feature 5.1 → PRD 1.1). **Haroon confirmed,
  2026-09-14: not required for Phase 1.** Hospital type and corporate
  grouping already exist and cover the rest of this row; only the A/B/C/D
  grading itself is deferred.

## Left as-is, no build planned

- **Demo outcome tracking** (Feature 6.1 → PRD 4.2). Basheer confirmed the
  free-text-Activity-note approach is fine for Phase 1; no mandatory field/gate
  planned.

## Not actually a separate gap (naming collision, clarified 2026-09-14)

- **Beat Planning** (Module 6, PRD 6.1 — "Not started" in the scorecard, not
  one of the 15 Partial rows so never in scope for this sprint anyway) is the
  same underlying capability as **Coverage Planning**, confirmed field-for-
  field: PRD 6.1 asks for "hospitals to cover / planned visits / strategic
  objective / expected revenue," which is exactly `strategic_objective` +
  `target_revenue_lakhs` + account selection + `coverage_frequency` in
  `docs/Coverage-Planning-Implementation-Plan.md`. Not a second thing to
  build — it's already fully scoped and decision-resolved as part of
  Milestone 2 (`docs/Backlog.md`), just queued behind Target Planning in that
  rollout order.
