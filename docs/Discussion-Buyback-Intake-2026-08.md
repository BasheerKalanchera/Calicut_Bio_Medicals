# Trade-In / Buyback Intake & Outcome Tracking — Discussion Summary

**Status:** Draft — for review with Fazal and Haroon before any build work
starts. Nothing described here is built yet.
**Date:** 2026-08-10
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Plain-language summary of the follow-on trade-in/buyback intake
problem, written to be reviewed by non-technical stakeholders, not just
engineers. Split out from a combined discussion doc — the prerequisite
free-text Buyback field this depends on has since shipped; see
`Discussion-Buyback-Freetext-2026-08.md`.

---

## The follow-on problem — and why a new table is needed

Once the trade-in machine is just free text sitting inside a deal record, there's
no way to track what happens to it *after* the deal closes. Confirmed in
discussion: a traded-in machine can end up in three different places —

1. **Refurbished and resold** as a Refurbished catalog product (the original plan).
2. **Stripped for spare parts**, feeding the Service team's servicing/repair work
   for other customers' machines — a new outcome, not previously considered.
3. **Discarded** — not worth refurbishing or salvaging.

Because there are now three possible outcomes, and because outcome #2 involves the
Service side of the business (not just Sales), this needs its own tracking
table — a "trade-in intake" list — rather than living only as a text note buried
inside a closed deal. Without it, there's no queue anyone can work from, and no
way to tell later which refurbished product (or which spare part) came from which
trade-in.

## Open Decisions Needed Before Any Build Work Starts — to confirm with Fazal and Haroon

1. **Who owns this queue day to day?** Sales handles the trade-in coming in; does
   Service or Ops decide what happens to it next?
2. **What does "done" look like for each outcome?** Turning into a catalog
   product is clear. What does "done" mean for "stripped for parts" — does it
   need a real interface into whatever system Service uses to track spare parts
   and repairs, or is a manual handoff enough?
3. **Resolved with Fazal (2026-08-10), pending Haroon.** Queue entry gets
   created only when the deal is actually Won — not at the moment the trade-in
   line is added — since a lot of proposed trade-ins never close, and the
   machine only physically changes hands once the deal closes. Still needs
   Haroon's confirmation before this is fully settled.
4. **GST/invoicing treatment** — separate from this design, needs input from
   whoever handles Cabio's invoicing.

**Not yet scoped as build work.** This document exists so the above can be
reviewed and decided first — once confirmed, a technical design (schema, screens,
Service System interface) will follow the same pattern as
`Product-Lifecycle-TradeIns-Accessories-Technical-Design.md`.
