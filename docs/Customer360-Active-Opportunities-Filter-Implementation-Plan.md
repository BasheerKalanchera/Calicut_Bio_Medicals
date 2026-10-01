# Customer 360 Active-Only Opportunities Filter — Implementation Plan

**Status:** Approved 2026-09-30 (Basheer). Built and Dev-tested
2026-10-01 with the Opportunity Edit quick fix; committed `a430152` on
`hotfix/opportunity-edit-via-deal-page`; push to UAT held for a quiet
morning (Basheer). Decisions 4 and 5 reworded during the Dev run.
**Traceability rows:** "Requested by Cabio leadership — to be built", item 2
(`docs/Signed-Requirements-to-PRD-Traceability.md`).
**Design / discussion:** `docs/Discussion-Customer360-Open-Deals-Filter-2026-09.md`
(section 3 holds decisions 1–6 below).

## Decisions

1. The tab opens showing only **Active** Opportunities — the same set the
   pipeline counts (BR-OP-07); On Hold, Won and Lost are hidden until the
   button is clicked — Basheer, 2026-09-30
2. Customer 360 Opportunities tab only; the main Opportunities screen is
   unchanged — Basheer, 2026-09-30
3. After **Show All**, opening an Opportunity and pressing Back returns to
   the full list; leaving the customer and coming back resets to Active
   only — Basheer, 2026-09-30
4. Heading: "Showing Active Opportunities (3 Active of 15)"; after Show All,
   "Showing All Opportunities (15)" — Basheer, 2026-09-30, reworded
   2026-10-01
5. No Active Opportunities: the list shows "No Active Opportunities";
   **Show All (15)** stays in the heading row like every other state —
   Basheer, 2026-09-30; button moved up from the empty box 2026-10-01
6. Button: "Show All (15)", changing to "Show Active Only" — Basheer,
   2026-09-30
7. Switching to another tab of the same customer (e.g. Opportunities →
   Activity → Opportunities) also keeps the Show All choice — it's still
   "on the customer", so this follows decision 3 — Basheer, 2026-09-30
8. A customer with no Opportunities at all keeps today's message
   "No opportunities found for this account.", with no button, and the
   heading "Opportunities (0)" — Basheer, 2026-09-30
9. Build after hospital-wise planning Part 1's E2E run is finished — that
   session is testing on Dev now and has unsaved changes in the file that
   remembers where Back returns to, which this change also touches —
   Basheer, 2026-09-30
10. Ships to UAT together with the Opportunity Edit quick fix
    (`docs/Opportunity-Edit-Via-Deal-Page-Hotfix-Plan.md`), by that fix's
    emergency route: built from the UAT code line, pushed to UAT, then UAT
    merged back into main — Basheer, 2026-09-30
11. Built on the same branch as the Opportunity Edit quick fix, in one
    round. Both change the same Opportunities list on the customer page:
    the quick fix changes what its EDIT button does, and this changes which
    Opportunities it shows. One build and one test run cover both —
    Basheer, 2026-09-30
12. That branch is built in a separate working folder (a git worktree),
    so the other session's unsaved work in the main folder is never
    disturbed — Basheer, 2026-09-30
13. The Show All button appears only when something is hidden: a customer
    whose Opportunities are all Active shows "Opportunities (4 Active of
    4)" with no button, since Show All would list the same 4 — Basheer,
    2026-10-01

## 1. In plain terms

On a customer's page, the Opportunities tab will open showing only the
Active ones — the same ones counted in the pipeline figures. Above the
list, the heading shows how many are Active out of the total, for example
"Opportunities (3 Active of 15)". A **Show All (15)** button brings the On
Hold, Won and Lost ones into the list; it then reads **Show Active Only**
to hide them again.

If you've clicked Show All and then open one Opportunity, pressing Back
brings you to the same full list. When you leave that customer and come
back later, the tab starts again on Active only.

Nothing changes in the database, in the pipeline figures, or on the main
Opportunities screen. Only this one tab changes how it displays the
list it already has.

**Environment:** built from the UAT code line and checked on Dev; it
reaches UAT, where the sales team works, together with the Opportunity
Edit quick fix (decision 10), then comes back into main. Its timing
therefore follows that quick fix, which is parked until its 4 open
decisions are answered.

## 2. Build order

On `hotfix/opportunity-edit-via-deal-page`, taken from `origin/uat`,
alongside the Opportunity Edit quick fix (decisions 10–11). Steps 2–5
below run once for both changes; the merge-back and checklist follow that
plan's step 6.

1. **Build (frontend only).** Split the tab's list into Active and the
   rest; add the heading count, the button and the empty message; keep
   the Show All choice in the same place that already remembers which
   tab to return to, and clear it when a customer is opened fresh.
   Run tsc and lint.
2. **Review.** `/code-review` (medium) on the change; fix findings.
3. **E2E plan.** Write `docs/Customer360-Active-Opportunities-Filter-Manual-E2E-Test-Plan.md`,
   with steps tagged Simple/Complex, checked read-only against a real Dev
   customer that has a mix of Active, On Hold, Won and Lost Opportunities.
4. **E2E run** on Dev, with the Dev backend restarted first. Pass/Fail
   recorded as each step completes.
5. **Commit** (`feat:`), push to `uat`, Basheer checks on UAT, then merge
   `uat` into `main`, re-test, and push. Each step gets its own approval.
   Expect conflicts in the customer page on the merge: main has newer
   changes there (hospital-wise Part 1).
6. **Post-commit checklist** (section 4).

The whole change is one small step, so there's no checkpoint commit before
step 5.

## 3. Not in this plan (with reasons)

- **Main Opportunities screen:** decision 2. Reports open that screen
  pre-filtered, and those lists must keep matching what the report
  counted.
- **Separate filters for On Hold, Won and Lost:** not asked for. Show All
  covers the need to see them. Add them later if the team finds the full
  list too long.
- **Remembering Show All across logins or devices:** decision 3 resets it
  on leaving the customer, so there's nothing to store.
- **Stalled status:** it isn't built yet. When it is, it falls under "the
  rest", because the pipeline counts only Active.

## 4. Business rules and records to update

- **Business rules:** none new. This is a display choice that reuses
  BR-OP-07's meaning of "counts in the pipeline".
- **`docs/UAT-User-Manual.md` section 4:** change the Opportunities line
  from "All active and closed deals" to the new behaviour.
- **`docs/UI-Inventory.md` 1.3, item 4:** same change.
- **Traceability:** the leadership item 2 moves from "Requested" into
  "What we built" once E2E passes. Regenerate the scorecard,
  `--check`, and republish both client pages. The page counts change:
  Requested 3 → 2, Commitment beyond contract 16 → 17.
- **Backlog:** remove the entry "Customer 360 Opportunities tab: show
  only Active Opportunities by default".
- **Discussion doc:** Status line points to this plan's shipped commit.

## 5. Technical addendum

- **`sales-os-app/src/screens/Customer360Screen.tsx`**
  - `OpportunitiesTab` (≈L491): take new props `showAll` /
    `onToggleShowAll`. Split `opportunities` on
    `o.status?.status_code === "ACTIVE"` (same filter as
    `backend/app/domains/reporting/repository.py`'s pipeline query).
    Heading `Showing Active Opportunities ({active} Active of {total})`
    (`Showing All Opportunities ({total})` when Show All is on), or
    `Opportunities (0)` when total is 0. Toggle button styled like the
    existing `+ Add` button. Empty states: total 0 → the existing message;
    Active 0 but total > 0 and Show All off → "No Active Opportunities"
    (the button stays in the heading row).
  - The screen passes `showAll` through from a new prop, because the tab
    content unmounts on tab switch (decision 7) and the whole screen
    unmounts on drill-in (decision 3).
- **`sales-os-app/src/DemoApp.tsx`**
  - New state `customer360ShowAllOpps` (boolean) beside
    `customer360InitialTab`. `handleSelectAccount` resets it to `false`.
    This covers every fresh open, including parent/child links to a
    different account. `handleSelectOpportunity` /
    `handleBackToOpportunities` leave it alone, so Back restores it.
    `handleBack360` resets it.
  - Passed to `<Customer360Screen>` (≈L704) as `showAllOpportunities` /
    `onShowAllOpportunitiesChange`.
  - Line numbers above are from `main`. On `origin/uat`, `OpportunitiesTab`
    is at ≈L476 with the same heading and empty-state text. Before
    building, confirm that `origin/uat`'s `DemoApp.tsx` restores the
    customer page's tab on Back the same way (`customer360InitialTab` set
    in `handleSelectOpportunity`, view restored by
    `handleBackToOpportunities`). This couldn't be checked when the plan
    was written.
  - The quick fix removes the tab's `onEdit` form (EDIT opens the deal
    page). Build this filter on top of that change, not beside it.
- **Edge case to cover in E2E:** editing an Active Opportunity to
  Won/Lost/On Hold from this tab's Edit dialog while Show All is off. It
  should drop out of the list, and both counts should update.
- **No backend, API, migration or type-regeneration change.** There is no
  frontend unit-test runner in `sales-os-app`, so verification is tsc,
  lint and the manual E2E.
