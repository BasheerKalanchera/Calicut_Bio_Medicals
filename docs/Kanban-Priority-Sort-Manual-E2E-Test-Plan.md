# Kanban/List Sorted by Priority — Manual E2E Test Plan

**Feature:** Sprint Plan's "Kanban sorted by priority" item (Feature 2.2,
Module 3 → PRD 3.8), unblocked by the High Priority Deal Flag
(`docs/High-Priority-Deal-Flag-Implementation-Plan.md`).

**Scope built:** `GET /opportunities/pipeline` (serves both Kanban and List)
now orders results by High Priority first, then win probability descending
— High Priority is the **primary** sort key, win probability only breaks
ties *within* the same priority standing, so a low-probability High
Priority deal still ranks above a high-probability non-High-Priority deal.
No tiebreaker beyond that (Basheer's explicit call — ties render in
whatever order the database happens to return, not pinned to recency).
Backend-only change: neither Kanban nor List does its own client-side
sorting, so the new order should show up automatically with no separate
frontend logic to verify. Alongside this, the pipeline fetch cap was raised
from 100 to 500 (Won/Lost deals never drop out of this query, so the cap
needed headroom beyond just today's active pipeline size).

**Not in scope for this pass:** re-verifying the High Priority badges
themselves (already fully E2E-tested, `docs/High-Priority-Deal-Flag-Manual-
E2E-Test-Plan.md`) — this pass only checks *ordering*, not whether the
badge renders correctly.

**Test user needed:** one login that can see a reasonably large slice of
the pipeline (Admin/GM, or an SBU Manager/Area Manager with several deals
in their scope) — you need enough deals in a few stages to compare orderings
meaningfully.

**Setup:** Ideally have, in at least one stage column:
- Two or more deals with **no** High Priority status, at different win
  probabilities.
- At least one deal that **is** High Priority (automatic past-Demo, or
  manually flagged at Lead/Qualified/Demo) with a **lower** win probability
  than one of the non-High-Priority deals above — this is the case that
  actually proves priority is the primary sort key, not just a blended
  score with probability.

---

## A — Kanban: High Priority deals float to the top of their column

1. Open Pipeline (Kanban view). Pick a stage column with a mix of deals per
   Setup above.
   **Expected:** the High Priority deal(s) appear above every non-High-
   Priority deal in that column, even if their win probability is lower.
2. Within just the High Priority deals in that column (if there are 2+),
   check their relative order.
   **Expected:** sorted by win probability descending among themselves.
3. Within just the non-High-Priority deals in that column, check their
   relative order.
   **Expected:** also sorted by win probability descending.
4. Check a stage past Demo (Clinical Evaluation/Negotiation/Order/Delivery
   & Installation) — every deal there is automatically High Priority.
   **Expected:** the whole column is effectively just sorted by win
   probability descending (everyone's tied on priority, so probability
   fully decides order) — no deal looks obviously "out of place."

## B — List view: ordering holds globally across stages

5. Switch to List view (flat list, no stage grouping).
   **Expected:** every High Priority deal (regardless of which stage it's
   in) appears above every non-High-Priority deal.
6. Specifically find one High Priority deal with a low win probability and
   one non-High-Priority deal with a high win probability.
   **Expected:** the High Priority one still ranks higher in the list —
   confirms priority beats probability, not the other way around.

## C — Filters still compose correctly with the new sort

7. Apply the Owner filter (pick a specific rep) on Kanban.
   **Expected:** the filtered subset still follows the same High-Priority-
   first, then-probability ordering within it.
8. Apply the Zone filter instead (or together with Owner).
   **Expected:** same — ordering holds within whatever subset the filters
   leave.

## D — Regression: the raised fetch cap, and nothing else broke

9. Compare the total deal count you can see across all Kanban columns (or
   scroll List view to the end) against a known total from elsewhere (e.g.
   an Insights Dashboard tile, or ask Basheer for the current live count).
   **Expected:** nothing is missing — previously the fetch stopped at 100
   deals total; this should now cover up to 500.
10. Confirm the High Priority and Reactivation Overdue badges still render
    correctly on a few cards (not a full re-test, just a sanity check that
    this change didn't disturb them).
11. Confirm the search box and existing filters (Owner/Zone) still work
    normally — type a search term, clear it, toggle a filter on and off.

---

## Sign-off

**Full pass, live, 2026-09-15.** Tested as Haroon (GM) against the real Dev
dataset (53 opportunities total across all stages). Steps A1-D11 verified
both visually and by pulling `GET /opportunities/pipeline` directly (via
the browser's own session token) and checking the ordering invariant —
`is_high_priority DESC, win_probability DESC` — programmatically across
every item, not just spot-checked.

- **Group A (Kanban):** confirmed by inspecting stage columns — automatic
  High Priority deals (Order/Negotiation, all past Demo) sort purely by win
  probability among themselves since they're all tied on priority; Lead/
  Qualified/Demo columns had no flagged deals at rest, so this alone didn't
  exercise the manual-flag-beats-probability case — covered directly below.
- **Group B (List, the real test):** live-flagged "New USG msg" (Lead
  stage, 5% win probability, ₹20L) as manually High Priority via the
  Overview tab's Edit modal, then re-pulled the pipeline data. It ranked
  13th of 53 — above 11 non-High-Priority deals with materially higher win
  probability (75%, 60%, 35%, ...) — proving priority is genuinely the
  primary sort key, not blended with probability. A full programmatic scan
  of all 53 items found **zero ordering violations**, before and after this
  change. Confirmed visually on both Kanban (card jumped to the top of
  Lead) and List (badge + position). **Flag reverted immediately after** —
  "New USG msg" back to its original unflagged state, confirmed via a
  final screenshot.
- **Group C (filters):** applied the Owner filter (Fazal) — both of his
  High Priority deals (one automatic, one the live-flagged test case) still
  sorted above his other deals within that filtered subset.
- **Group D (regression):** stage-column chip counts (33+3+4+1+7+5+0) summed
  to exactly 53, matching the API's own `total` — confirms the raised
  500-deal cap isn't truncating anything (the whole Dev dataset previously
  fit under the old 100 cap too, so this mainly proves the new cap doesn't
  break anything, not that it rescues a previously-truncated view). Existing
  High Priority badge (automatic, "Test demo lead") rendered correctly
  throughout, untouched by this change. Search ("MRI") and the Owner filter
  both worked normally.

No bugs found. Re-run live on-screen for Basheer afterward (he hadn't
watched the first pass) — same core case (Group B/C), same result.

Traceability/scorecard/sprint-plan docs flipped to Done, pass logged in
`docs/Progress-Archive-2026-09.md`. **Committed `90a752a`.**
