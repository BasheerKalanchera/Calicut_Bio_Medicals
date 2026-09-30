# Discussion: Active-Only Filter on the Customer 360 Opportunities Tab — 2026-09-28

**Status:** Decided by Basheer, 2026-09-30 (section 3) — not taken to Haroon.
Nothing built yet; a short build plan follows.
**Participants:** Basheer (decisions), Claude (options and analysis).
**Origin:** the 2026-09-24 demo to Latheef Bhai and Haroon — item 2 under
"Requested by Cabio leadership — to be built" in
`docs/Signed-Requirements-to-PRD-Traceability.md`. Backlog entry:
"Customer 360 Opportunities tab: show only Active Opportunities by default"
in `docs/Backlog.md`.

## 1. Summary

When you open a customer's 360 page and go to its Opportunities tab, today
you see every Opportunity it has ever had — Active, On Hold, Won and Lost,
all mixed together. For a long-standing customer, the few Active ones get
buried under years of Won and Lost ones. The change: show only the Active
Opportunities by default, with a button that brings the rest into view
when you need them.

No database change is needed.

## 2. How it works today, and what would change

- An Opportunity is always in one of these statuses: **Active** (moving
  through the stages), **On Hold** (paused, with a Hold Reason and a
  Reactivation Date), **Won** or **Lost** (both final — can never be
  reopened). The rules also define **Stalled** (no activity for too long),
  but the automatic switch to Stalled isn't built yet.
- A customer's Opportunities tab lists all of that customer's Opportunities,
  in every status, in one list.
- The pipeline figures (weighted and unweighted) count **only Active**
  Opportunities — BR-OP-07.

**What would change:** the tab opens showing only the Active Opportunities
— the same set the pipeline counts. A button brings the On Hold, Won and
Lost ones into view; clicking it again hides them.

## 3. Decisions (Basheer, 2026-09-30)

1. **Active only by default.** The tab opens showing only **Active**
   Opportunities — the same set the pipeline counts (BR-OP-07). On Hold,
   Won and Lost are hidden until the button is clicked. (On Hold
   Opportunities remain listed in the On Hold report.)
2. **Customer 360 page only.** The default applies only to the
   Opportunities tab on a customer's 360 page. The main Opportunities
   screen is unchanged — reports open it pre-filtered, and those lists
   must keep showing exactly what the report counted.
3. **Remembering the button.** After clicking **Show All**, opening an
   Opportunity and pressing Back returns to the full list. Leaving the
   customer and coming back later resets the tab to Active only.
4. **Heading:** "Opportunities (3 Active of 15)".
5. **Empty message:** when there are no Active Opportunities, the tab
   shows **"No Active Opportunities"**, with the **Show All (15)** button
   still shown below it.
6. **Button label:** **"Show All (15)"**, which changes to
   **"Show Active Only"** once clicked.

## 4. Build notes

- **Timing:** the change sits in the customer 360 page, which another session
  is changing right now for hospital-wise target planning (the Business
  Potential rating chip). Build after that session has committed.
  Target planning keeps priority (its UAT move now waits for its Part 2,
  changed 2026-09-29).
- **Size:** frontend-only — no migration, no API change.
- **Environment:** built and tested on Dev first; reaches UAT with the next
  main → UAT move.

### Technical addendum

- `Customer360Screen.tsx`'s `OpportunitiesTab` receives the full
  `listOpportunities(accountId)` result and renders `o.status.status_name`
  per row; heading today is `Opportunities ({opportunities.length})`, empty
  state "No opportunities found for this account."
- The filter is a client-side split on `status.status_code` (`ACTIVE` =
  shown by default; everything else behind the toggle), matching the
  pipeline's `status_code == "ACTIVE"` filter in
  `backend/app/domains/reporting/repository.py`. No API change.
- Decision 3: the toggle state must survive the drill into an Opportunity
  and Back (e.g. held with the customer 360 screen's navigation state, like
  the tab it returns to), and reset when a different customer is opened.
- Status rules: BR-OP-02, BR-OP-05, BR-OP-07, BR-OP-09 in
  `docs/Business-Rules.md`.
