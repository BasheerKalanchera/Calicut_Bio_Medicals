# Sales Report + Pipeline Report — Manual E2E Test Plan

**Feature:** 11.1, Module 5 → PRD 5.6 Core Reports. Also closes Feature
2.2's Pipeline product filter row. Full design/build reasoning is in
`docs/Sales-And-Pipeline-Report-Implementation-Plan.md`.

**Scope built:**
- Two new standalone Report screens under the REPORTS nav section:
  **Pipeline Report** (open deals, Stage/Rep/SBU/Zone/Product breakdown,
  no period picker — "what's in progress right now") and **Sales Report**
  (Won deals only, This Month/This Quarter/All Time period picker, 4
  headline stats + Rep/Zone/SBU/Product breakdown, no leaderboard/ranking
  by design).
- New `Opportunity.closed_at` column, stamped automatically the moment a
  deal's status first becomes terminal (Won or Lost) — this is what makes
  the Sales Report's period filter accurate. Existing pre-feature Won/Lost
  deals in Dev have `closed_at = NULL`, so they correctly show up under
  "All Time" but correctly disappear from "This Month"/"This Quarter" —
  that is expected, not a bug.
- Both reports reuse the existing role-scoping (`TEAM_SCOPE_BUILDERS`) — no
  new permission logic, so a rep should only ever see their own deals, a
  manager their team's, Admin/GM everything, same as every other report.

**Not in scope for this pass:** the Insights Dashboard's own "Pipeline by
X" tile (unchanged, still duplicates part of the Pipeline Report on
purpose — Basheer's call, keeping both since Pipeline Report will grow a
drill-down feature the dashboard tile won't have).

**Test users needed:**
- Admin/GM login (Haroon) — full visibility, for headline-number
  cross-checks against the database.
- At least one Sales Person / rep-level login — to confirm scoping (they
  should see only their own deals, no cross-rep leaderboard of any kind).
- Ideally one SBU Manager or Area Manager login too, for the mid-tier
  scoping case.

**Setup:** Ideally have, across the test data:
- A mix of Open, Won, and Lost deals across at least two reps, two SBUs,
  two zones, and multiple products (including at least one deal with a
  Buyback/Trade-In line item, to check the "Trade-Ins / Returns" bucket).
- At least one Won deal closed within the current fiscal quarter (recent
  `closed_at`), and the pre-existing Won deal(s) with `closed_at = NULL`
  left as-is (don't backfill them) — that null-vs-populated contrast is
  itself part of what needs verifying.

---

## A — Pipeline Report screen

1. Open Pipeline Report from the REPORTS nav section.
   **Expected:** loads without error, shows the breakdown dropdown
   defaulted to Stage.
2. Switch the breakdown dropdown through Stage → Rep → SBU → Zone →
   Product, one at a time.
   **Expected:** the bar list re-fetches each time and rows change to
   match the selected dimension; **the headline numbers above the
   breakdown never change** while doing this (they're fixed to Stage
   internally, independent of the dropdown — a deliberate decoupling).
3. On Product breakdown specifically, check for a "Trade-Ins / Returns"
   bucket if any open deal has a Buyback line item.
   **Expected:** it appears as its own row, and the product breakdown's
   revenue rows plus this bucket sum to the same headline total shown at
   the top.
4. Cross-check the headline numbers (Open Pipeline Value, deal count) as
   Admin/GM against a direct read of the current open pipeline (e.g. the
   Kanban/List total, or ask for a DB count).
   **Expected:** numbers match exactly.

## B — Sales Report screen — period picker

5. Open Sales Report from the REPORTS nav section. Default period should
   be sensible (check what it opens to — This Month or All Time).
6. Switch to **This Month**.
   **Expected:** headline stats (Revenue Won, Deals Won, Win Rate, Avg
   Deal Size) reflect only deals whose `closed_at` falls in the current
   calendar month. A pre-existing Won deal with no `closed_at` should
   **not** be counted here.
7. Switch to **This Quarter**.
   **Expected:** uses Cabio's fiscal quarter (April–March), not a
   calendar quarter — e.g. in September this should be Q2 (Jul–Sep), not
   a Jan–Mar/Apr–Jun boundary. Verify the numbers change appropriately
   from the This Month figures (should be equal or larger).
8. Switch to **All Time**.
   **Expected:** every historical Won/Lost deal is included, including
   the ones with `closed_at = NULL`. This should be the largest of the
   three revenue figures.
9. Cross-check the "All Time" numbers as Admin/GM against a direct DB
   count of Won deals' total value, count, and Won/(Won+Lost) win rate.
   **Expected:** exact match.

## C — Sales Report screen — breakdown

10. Switch the breakdown dropdown through Rep → Zone → SBU → Product.
    **Expected:** no "Stage" option present (every row here is already
    Won — stage is irrelevant). Bars show revenue only, no secondary
    "weighted forecast" value (that's a pipeline concept, doesn't apply to
    closed deals).
11. On Rep breakdown, confirm there is **no ranking, ordering-by-rank
    styling, medal/leaderboard treatment, or "vs top performer" framing**
    — it should read as a plain, neutral bar list, same visual treatment
    as Zone/SBU/Product.
12. On Product breakdown, same Trade-Ins/Returns bucket check as Pipeline
    Report step 3, but restricted to Won deals only.

## D — Role scoping

13. Log in as a Sales Person / rep-level user. Open Sales Report.
    **Expected:** headline stats reflect only their own Won/Lost deals.
    Rep breakdown shows only their own single bar (or is otherwise
    consistent with seeing only their own data) — not every rep's figures.
14. Same rep-level login, open Pipeline Report.
    **Expected:** same scoping — only their own open deals contribute to
    the headline and breakdown.
15. If available, log in as an SBU Manager or Area Manager.
    **Expected:** sees their team's/zone's deals only, not the full
    company — consistent with how other reports scope for this role tier.
16. Log back in as Admin/GM.
    **Expected:** sees everything, unscoped.

## E — Regression / nav

17. Confirm both new nav items ("Pipeline Report", "Sales Report") appear
    under REPORTS for every role tier tested above (no unexpected role
    gate — none was built, by design).
18. Confirm navigating away and back to each screen doesn't error or show
    stale data from a different breakdown/period combination.
19. Confirm the Insights Dashboard's own "Pipeline by X" tile still works
    unchanged (this feature didn't touch it).

**Note (2026-09-15):** an earlier draft of this plan had a "Filters"
section here, expecting a separate SBU/Zone/Rep narrowing control beyond
the breakdown dropdown. That was a mistake in writing the plan, not a gap
in the build — the backend endpoints accept `sbu_id`/`zone_id`/`user_id`
query parameters because every reporting endpoint shares the same
underlying helper, but **no report screen in this app** (including the
pre-existing Product Performance report) exposes those as a user-facing
filter control. The breakdown dropdown (Stage/Rep/SBU/Zone/Product) is the
only slicing control by design, and it was fully covered in Sections A–C.

---

## Sign-off

**Full pass, live, 2026-09-15.** Tested against the real Dev dataset as
Haroon (GM) and Nishad K V (Sales Person).

- **Group A (Pipeline Report):** headline (₹514.6L / 37 open deals) stayed
  fixed across every breakdown switch (Stage/Rep/SBU/Product tested
  directly). Product breakdown, including the Trade-Ins/Returns bucket
  (-₹11.5L), summed to exactly ₹514.6L. Rep breakdown (₹196.0+106.0+136.0+
  25.0+37.6+14.0L) also summed to exactly ₹514.6L. Cross-checked against
  the Insights Dashboard's own headline tiles — exact match.
- **Group B (Sales Report period picker):** "This Month" and "This
  Quarter" both correctly showed 0 (the one existing Won deal predates
  `closed_at`, so it's correctly excluded from any period filter). Fiscal
  quarter bounds confirmed correct via the network request itself
  (`period_start=2026-07-01&period_end=2026-09-30` for September, i.e.
  fiscal Q2). "All Time" showed exactly ₹4.0L revenue, 1 deal, 25.0% win
  rate, ₹4.0L avg deal size — matches prior direct-DB verification. One
  transient 500 was seen in the browser's accumulated network log from
  earlier in the session; re-tested fresh with the log cleared and got a
  clean 200 both times — not a live/reproducible issue.
- **Group C (Sales Report breakdown):** dropdown correctly omits "Stage"
  (only Rep/Zone/SBU/Product). Rep breakdown renders as a plain neutral bar
  list — no ranking, ordering-by-rank, or leaderboard styling, matching
  the explicit no-leaderboard design decision.
- **Group D (Role scoping):** as Nishad (Sales Person), Pipeline Report
  showed ₹37.6L/6 deals — exactly his own slice from the GM's Rep
  breakdown, nothing else. Sales Report showed 0 Won deals across all
  periods (Basheer's Won deal correctly excluded) — confirms no cross-rep
  data leakage and no leaderboard is visible even indirectly. SBU
  Manager/Area Manager tier was **not tested** (no such login available
  this pass) — same `TEAM_SCOPE_BUILDERS` scoping as every other report,
  low risk, but worth a spot-check whenever that login is available.
- **Group E (Regression/nav):** both nav items visible for both role
  tiers tested. Navigating Insights → Sales Report → back showed no stale
  data or errors (period picker correctly reset to its own default rather
  than carrying over any prior state). Insights Dashboard's "Pipeline by
  X" tile confirmed unchanged and still working.

**One process note, not a product bug:** an earlier draft of this plan's
"Filters" section incorrectly assumed a separate SBU/Zone/Rep narrowing
control existed beyond the breakdown dropdown. Verified against the code
that no report screen in this app (new or pre-existing) has ever exposed
that — removed from this plan (see note in Section E above).

No bugs found. Traceability/scorecard/sprint-plan docs still need to be
flipped to Done and this pass logged in `docs/Progress-Archive-2026-09.md`.
