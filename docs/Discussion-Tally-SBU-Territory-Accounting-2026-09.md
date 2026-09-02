# Discussion: Aligning Tally to SBU & Territory — 2026-09-02

## Summary

Marketing expenses aren't showing up by SBU today because Tally isn't
being told which SBU each expense belongs to — it's a labelling gap, not
something the system can't do. The fix: set up "Imaging" and "Critical
Care" as two labels in Tally, and make that label mandatory on
marketing-related expense entries (ads, conferences, digital marketing,
etc.) so nothing can be booked without saying which SBU it's for. This is
a Tally setup change only — no Sales OS work needed, can be done this
week.

The same idea can extend to territory (North Kerala, South Kerala,
Bangalore, Mangalore) once the SBU habit is in place — every expense can
carry both labels at once. One thing to avoid: don't create separate
accounts per SBU (like "Marketing – Imaging"). Keep one account and just
label each entry — territory names change occasionally, and a label is a
quick edit, a pile of separate accounts isn't.

The bigger payoff comes once Tally and Sales OS are actually connected:
then we can compare spend against results — how many leads and how much
revenue each SBU's marketing spend actually produced — not just how much
was spent.

## Detail

**Raised by:** Latheef Bhai, via phone call to Basheer, 2026-09-02.
**Immediate concern:** marketing expenses aren't visible by SBU today — no
way to see how much Imaging vs. Critical Care is spending on marketing.
**Framed as relevant to:** the eventual Tally ↔ Cabio Sales OS integration
project (not yet started, not yet scoped).

No prior work exists on this — first time Tally/accounting integration has
come up in this project. No ADR, no existing doc.

## The core finding: the SBU-visibility gap doesn't need the integration project at all

Tally has no native "SBU" or "Territory" concept, but it has the right
building block already: **Cost Categories** (independent tagging
dimensions) containing **Cost Centres**. This maps directly onto Cabio's
own SBU/Zone model, which are already independent dimensions in the data
(`Opportunity.sbu_id`, `Account.zone_id` — neither nests inside the
other).

The reason marketing spend isn't visible by SBU today is very likely a
**data-entry discipline gap, not a structural one** — Marketing ledgers
(Advertising, Conference/Exhibition, Digital Marketing, Promotional
Material, etc.) aren't being tagged with a Cost Centre at voucher entry
time. This is fixable in Tally alone, this week, independent of any
integration work:

1. Create a **"SBU" Cost Category** with Cost Centres: Imaging, Critical
   Care.
2. On each Marketing-related ledger's master, set **"Cost Centres are
   applicable" → mandatory**. Tally then refuses to post a voucher against
   that ledger without an SBU tag. Recommend starting narrow (Marketing
   ledgers only) rather than making it mandatory system-wide immediately.

That alone produces an "SBU-wise Marketing Expense" report in Tally,
with zero Sales OS involvement.

## Recommended structure, once this extends beyond Marketing

- Two independent Cost Categories: **"SBU"** (Imaging, Critical Care) and
  **"Territory"** (North Kerala, South Kerala, Bangalore, Mangalore —
  Central Kerala deprecated 2026-08-21, do not set that one up).
- Every voucher gets tagged with one Cost Centre from each category,
  enabling P&L slicing by SBU alone, Territory alone, or both together.
- **Do not** create SBU/Territory-specific ledger accounts (e.g. "Sales
  Revenue - Imaging - North Kerala") — this explodes the Chart of
  Accounts and doesn't survive change well. Cabio's own Zone table has
  already been restructured once (Central Kerala deprecation, zones
  split like North Kerala → Malappuram); Cost Centre tagging keeps zone
  changes a master-data edit, not a ledger restructuring.
- Tally Cost Centres can nest under a parent Cost Centre, matching
  Cabio's own `zone` tree (`zone_level`: STATE → ZONE → DISTRICT → TALUK
  → CLUSTER, `zone_closure` computing rollups). If Territory Cost Centres
  mirror the actual zone hierarchy, a district's numbers roll up to its
  zone automatically in Tally too.

## Governance question, worth deciding now, before it drifts

Cabio Sales OS should be the source of truth for the SBU/Territory
*list* (it already owns this data, with RLS boundaries around it —
`docs/Physical-Schema.sql`'s `sbu`/`zone` tables). Tally's Cost Centre
master needs to stay in sync with it. Today that's a manual step —
someone updates Tally's Cost Centres whenever Sales OS's Zone Hierarchy
changes. Worth naming this as an explicit responsibility now rather than
letting it silently drift, given how often the zone list has already
changed this project (Central Kerala deprecation, Malappuram split,
Bangalore zone-tree reshaping).

## The actual payoff of a future Tally ↔ Sales OS integration

Not spend visibility (Tally alone gives Latheef Bhai that). The real
value is pairing **spend** against **results**: once Tally has SBU-tagged
marketing spend and Sales OS has SBU-tagged leads/opportunities/revenue
(already true today — Opportunity carries `sbu_id`; the new `lead` table
from Lead Management tags every lead with an SBU), a **Marketing ROI by
SBU** report becomes possible — "Imaging spent ₹X this quarter, generated
Y leads, converted to ₹Z in won revenue." That's a reporting/BI-layer
join, not a transactional push of data into Tally.

One integration wrinkle to plan for when that project starts: Splits (a
deal split across SBUs/zones, BR-FIN-06/07) — Tally vouchers support
multiple Cost Centre allocations within a single voucher (percentage or
amount split), so this is representable, but voucher-generation logic
would need to translate a Split row into that allocation.

## Suggested sequencing

1. **Now, Tally-only:** SBU Cost Category + mandatory tagging on
   Marketing ledgers. No Sales OS dependency, no code change.
2. **After a quarter:** review tagging compliance; extend the mandatory
   rule and the Territory Cost Category to other ledgers if it's working.
3. **Once Tally ↔ Sales OS integration is scoped:** build the Marketing
   ROI-by-SBU report, pairing Tally spend against Sales OS lead/
   opportunity outcomes.

## Status

Not decided, not scoped as a build item. This is a recommendation to
relay to Latheef Bhai — Step 1 needs no Sales OS engineering work at all,
just a Tally configuration change on the accounts side.
