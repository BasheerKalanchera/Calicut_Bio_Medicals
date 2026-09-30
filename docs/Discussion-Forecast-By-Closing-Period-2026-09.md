# Discussion: Forecast by Closing Period (cash flow and purchase-order planning) — 2026-09-30

**Status:** Discussion only — nothing built or changed. We talk through
section 4's questions first; an implementation plan follows only once
they are answered.
**Participants:** Basheer (decisions), Haroon / Cabio leadership (business
sign-off where marked), Claude (options and analysis).
**Origin:** client feedback on the Insights Dashboard, 2026-09-30 (pasted
by Basheer). **Signed requirement:** Traceability row 2.5, "Weighted /
unweighted forecasting by month / quarter / product" — the product half
is done (2026-09-15); the month / quarter half has not been started. This
request is that missing half.

## 1. What the client asked for, in their words, summarised

"The insights look good. But we need to choose a time period for the
projections, both weighted and unweighted: expected this month, next
quarter, next 6 months, until the next financial year, and a total."

They gave two real uses:

1. **Cash flow (finance).** "Up to a certain date, which deals are
   expected, and what is their weighted value? Then open that up to see
   which ones are solid and definitely coming, so we can plan cash flow."
2. **Purchase orders (stock).** "Before placing the next quarterly order,
   which machines are likely to sell over the next six months, so we know
   what to include in this order."

## 2. How the app works today

**Every open deal carries three things this request depends on:**

- a **value** (from its product lines: quantity × price, less discount);
- a **win probability** (%) — starts at the stage's default, and the rep
  can change it (BR-OP-08). A ₹10 L deal at 60 % has a *weighted* value
  of ₹6 L;
- an **expected closing date** — *but only from the Negotiation stage
  onward is it compulsory* (BR-OP-01). Earlier deals often have none, and
  repeat orders can skip it (BR-OP-13).

**Where forecasts appear today:**

| Screen | Shows | Breakdown by | Time filter | Can open the deals behind a number? |
|---|---|---|---|---|
| Insights Dashboard — Pipeline box | Total and weighted value of all Active deals | Stage, Rep, SBU, Zone, Product | **None** — every open deal, whatever its date | No |
| Pipeline Report screen | Same numbers, own screen | Same, plus Brand | **None** | **Yes** — click a row to see its deals |
| Plan vs Actual (Part 2, not built yet) | Per salesperson: planned, won, weighted "expected this quarter" | Person → hospital, brand | One chosen quarter | Late deals listed |

On Hold, Stalled and Lost deals are never counted in the forecast
(BR-OP-07); that doesn't change here.

**So the gap is simply:** nowhere in the app can you say "only the deals
expected to close by 31 December", and see their total, weighted total,
and the deals themselves.

**Part 2 doesn't fill it:** Part 2 answers "is each salesperson on track
against the hospitals they planned this quarter?" Its weighted Expected
column is fixed to one quarter and grouped by person — it won't give
"all SonoScape machines likely in the next 6 months", or a company total
up to March.

## 3. The idea in one line

Let the user pick "deals expected to close by ___" on the existing
pipeline numbers, so every total, weighted total and breakdown (including
by product) shrinks to just those deals — and they can click through to
the list.

Everything below is the detail of *how*, to discuss.

## 4. Questions to discuss

Each has a real example and a recommendation. None is decided.

**Q1. Where should the time selector live?**
- (a) The **Pipeline Report screen** only — it already lets you click a
  row and see its deals, which the cash-flow use needs ("see which ones
  are solid").
- (b) The **Insights Dashboard** box only — what the client was looking at.
- (c) Both.
- *Recommendation:* **(c), in that order** — Pipeline Report first (it has
  the click-through), then the same selector on the Dashboard box, with a
  link across to the report for the deal list.

**Q2. "By a date" or "between two dates"?**
Example: it's October. The client's "until the next financial year" means
*everything from now up to 31 March* — a running total. But "next quarter"
could mean either "everything up to 31 March" or "only January–March".
- *For cash flow*, a running total ("by 31 March") is what you plan with.
- *For the next purchase order*, a slice may matter more ("what sells in
  January–March, after the current order's stock arrives").
- *Recommendation:* ready-made choices that are **running totals** — This
  month · This quarter · Next 6 months · Until FY end (31 Mar) · All — plus
  a **Custom from / to** for slices. To confirm with the client which one
  they meant by "next quarter".

**Q3. One period at a time, or all periods side by side?**
- (a) A **selector**: pick one period, everything on screen follows it.
- (b) A **side-by-side table**: columns This month | This quarter | 6
  months | FY end | Total, for each product or rep, like the client listed.
  Example row: "EDAN monitors — ₹4 L | ₹12 L | ₹20 L | ₹26 L | ₹31 L".
- *Recommendation:* **(a) first** — about half the work, and it gives the
  deal list for any period. (b) can be added later without redoing (a).
  Worth asking the client whether the side-by-side view is what they
  pictured.

**Q4. What about deals with no closing date?**
Example: a ₹25 L CT deal at Demo stage has no date yet. In a "next 6
months" view it can't be placed — so it would silently disappear, and the
6-month number looks smaller than reality.
- *Recommendation:* never drop them silently. Show a separate line:
  "No closing date — 14 deals, ₹90 L (weighted ₹18 L)", clickable. In
  "All" they count as normal. Before deciding, Claude can count how many
  such deals exist today (read-only check; UAT only with your go-ahead)
  — if it's a large share, the real fix may be reps entering dates
  earlier, which is a business question for Haroon.

**Q5. What about deals whose closing date has already passed?**
Example: a deal was due 15 September, it's now 30 September and it's still
open. Part 2 already decided (BR-OP-16): count it as due now, and flag it
"Closing date passed".
- *Recommendation:* same rule here, so the two screens agree — it counts
  in every period, flagged, and appears in the deal list with the flag.

**Q6. For purchase orders — value, or number of machines?**
Today the product breakdown shows **money** (₹ L). To place an order you
need **units**: "4 SonoScape P20s likely by March". Every product line has
a quantity, so units can be added. Weighting units is awkward, though: 3
deals of 1 machine each at 60 % = "1.8 machines".
- *Recommendation:* in the Product breakdown, add **units** beside value:
  total units, and weighted units shown as a guide ("≈ 1.8"). To confirm
  with the client that product-level is enough, or whether they need it
  per model/variant.

**Q7. "Which ones are solid" — how should the app show that?**
The client wants to separate the near-certain deals from the hopeful ones.
Today "how solid" = the win probability, which follows the stage unless
the rep changes it.
- *Recommendation:* in the deal list, show stage, probability and closing
  date, sorted with the most likely first. A "only deals at 70 % or above"
  filter could come later if needed. Worth asking: do they trust the
  probabilities reps set, or would they rather go by stage?

**Q8. "Cash flow" — orders or money received?**
A deal's closing date is when the order is **won**, not when the payment
**arrives** (that can be weeks or months later, in instalments). This
screen can only show expected orders.
- *Recommendation:* label it plainly ("expected orders by closing date")
  and tell the client so; payment timing belongs with the payment
  discussion (`docs/Discussion-Payment-Confirmation-Gate-2026-09.md`),
  not here.

## 5. Not in this discussion

- Split-shared credit between reps — separate open question with Haroon.
- The "less than 3× target" low-pipeline alert — the other half of row
  2.5's wording; can be raised separately.
- Counting how often a deal's closing date is pushed back — Backlog idea
  (2026-09-29).

## 6. Technical addendum (for the record)

- `GET /reporting/pipeline-summary` (`backend/app/domains/reporting/router.py:56`)
  takes `group_by`, `sbu_id`, `zone_id`, `user_id` only — no date
  parameters. Aggregation in `reporting/repository.py` (Active only via
  `status_code == "ACTIVE"`; weighted = `_NET_VALUE * win_probability / 100`).
- Pipeline Report drill-down: `PipelineReportScreen.tsx` `DrillFilter` →
  Opportunities list; would need a closing-date filter carried through.
  Insights Dashboard box (`InsightsDashboardScreen.tsx`) has no drill.
- Likely shape: `closure_from` / `closure_to` query params using
  `_period_bounds` (Part 2 plans to move it to a shared util), a
  null-date bucket, and a past-date flag per BR-OP-16.
- Units: `opportunity_item.quantity` (integer, NOT NULL).
- Closing-date gates: BR-OP-01 (Clinical Evaluation → Negotiation),
  BR-OP-13 (REPEAT_ORDER exemption), BR-OP-14 (manager-attested gate
  override).
