# Trade-In / Buyback Free-Text Field — Discussion Summary

**Status:** Shipped, `8ab0c4e` (2026-08-11). See
`Buyback-Freetext-Implementation-Plan.md` for execution detail.
**Date:** 2026-08-10
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Plain-language summary of the free-text Buyback change, written
to be reviewed by non-technical stakeholders, not just engineers. Split out
from a combined discussion doc — the follow-on "trade-in intake tracking"
topic raised the same day is a separate, still-undecided piece; see
`Discussion-Buyback-Intake-2026-08.md`.

---

## What's changing

Today, when a sales rep takes in a customer's old machine as part of a trade-in
deal, that machine has to already exist in the Product Catalog, tagged as
"Refurbished," before the rep can even record it. In practice this is backwards —
nobody knows the exact make/model/condition of a customer's used machine in
advance, so cataloguing it *before* the deal happens doesn't fit how trade-ins
actually occur.

**Change agreed in principle:** replace the catalog dropdown with a plain free-text
box. The rep just types a description of the machine being traded in — no
catalog entry required at deal time.
