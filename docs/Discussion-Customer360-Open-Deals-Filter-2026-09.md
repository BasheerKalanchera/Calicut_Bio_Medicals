# Discussion: Open-Deals Filter on the Customer 360 Opportunities Tab — 2026-09-28

**Status:** Discussion only — nothing built or changed. Section 3's questions
go to Haroon for sign-off; after that, an implementation plan follows.
**Participants:** Basheer (decisions), Haroon (business sign-off), Claude
(options and analysis).
**Origin:** the 2026-09-24 demo to Latheef Bhai and Haroon — item 2 under
"Requested by Cabio leadership — to be built" in
`docs/Signed-Requirements-to-PRD-Traceability.md`. Backlog entry:
"Opportunities screen: show only open deals by default" in
`docs/Backlog.md`.

## 1. Summary

When you open a hospital's 360 page and go to its Opportunities tab, today you
see every deal it has ever had — Won, Lost and open, all mixed together. For
a long-standing hospital, the handful of live deals get buried under years of
closed ones. The change: show the open deals by default, with a button that
brings the closed ones into view when you need them.

No database change is needed.

## 2. How it works today, and what would change

- A deal is always in one of these statuses: **Active** (moving through the
  stages), **On Hold** (paused, with a reason and a date to pick it up
  again), **Won** or **Lost** (both final — a closed deal can never be
  reopened). The rules also define **Stalled** (no activity for too long),
  but the automatic switch to Stalled isn't built yet.
- A customer's Opportunities tab lists all of that customer's deals, in every
  status, in one list.

**What would change:** the tab opens showing only the open deals. A button
such as "Show closed deals (12)" adds the Won and Lost ones back into the
list; clicking it again hides them.

## 3. Questions for Haroon

Each question has a recommendation. A simple "agreed" to all of them is
enough to start the plan.

**Q1. Should On Hold deals count as "open" and show by default?**
They aren't closed, but they aren't moving either.
- *Recommendation:* **Yes.** Every On Hold deal has a date to pick it up
  again. Hiding it by default is how a paused deal gets forgotten past that
  date. (Stalled deals, once that exists, likewise show by default.)

**Q2. Where should the "open deals only" default apply?**
- **(a) Only the Opportunities tab on a customer's 360 page** — what was
  discussed after the demo.
- **(b) Also the main Opportunities screen** (the Kanban board / list of all
  deals). The Backlog entry originally named this screen.
- *Recommendation:* **(a)**. The main screen is more complicated: reports
  open it pre-filtered — e.g. clicking "Won deals, North Kerala" on a report
  — and those must keep showing exactly what the report counted. Do (a) now;
  treat (b) as its own later request if Haroon wants it.

**Q3. When someone clicks "Show closed deals" and later comes back to the
same customer, should the tab remember it?**
- *Recommendation:* **No** — always open on open deals only. Predictable,
  and the closed deals are one click away.

## 4. Build notes (for Basheer, not for Haroon)

- **Timing:** the change sits in the customer 360 page, which another session
  is changing right now for hospital-wise target planning (the Business
  Potential rating chip). Plan now; build after that session has committed.
  Target planning keeps priority (its UAT move now waits for its Part 2,
  changed 2026-09-29).
- **Size:** frontend-only — no migration, no API change.
- **Environment:** built and tested on Dev first; reaches UAT with the next
  main → UAT move.
- **Backlog wording:** the Backlog entry names the main Opportunities screen,
  not the customer 360 tab. Correct it once Haroon answers Q2.

### Technical addendum

- `Customer360Screen.tsx`'s `OpportunitiesTab` receives the full
  `listOpportunities(accountId)` result and renders `o.status.status_name`
  per row.
- The filter is a client-side split on `status.status_code` (`WON`/`LOST` =
  closed; everything else open) plus a toggle showing the closed count. No
  API change.
- Status rules: BR-OP-02, BR-OP-05, BR-OP-09 in `docs/Business-Rules.md`.
