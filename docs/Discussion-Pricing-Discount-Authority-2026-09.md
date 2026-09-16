# Discussion Paper: Tiered Pricing, Discount Authority & Product Cost

**Prepared for:** Discussion with Haroon Sidheeq (General Manager & Sales Head), Latheef
Bhai, and the Cabio leadership team.
**Prepared:** 2026-09-11. **Updated:** 2026-09-14 — Latheef Bhai's voice message added
a second problem (time-bound special pricing, §5.1), a new open question.
**Status:** Basheer's open questions resolved 2026-09-11 (§6) — awaiting Haroon/
Latheef Bhai's review and final sign-off. Not yet scoped, not yet built.

---

## 1. Where this came from

Two threads converged into this paper on 2026-09-11:

1. An Area Manager suggested adding standard quoting prices to the Product Catalogue
   (specifically for USG models — a quoting price for the standard probe set, plus
   per-model probe compatibility and pricing) so new staff can self-serve pricing
   instead of calling their manager every time.
2. Raising that with Latheef Bhai surfaced the real underlying process: Cabio currently
   controls pricing via a physical **"Controlled Copy"** rate sheet — stamped
   non-photocopiable, held by Safeena, the old copy physically returned before a revised
   one is issued. Latheef Bhai's own framing (paraphrased from his voice messages):
   tedious to administer, and leak risk exists regardless of the stamp — asked for a
   best-practice recommendation rather than leadership just dictating an approach.

Latheef Bhai then described the actual pricing policy in detail — four tiers:

1. **Quoting Price** — the price to open with, per product.
2. **Staff floor** — the lowest a Sales Staff can discount to on their own authority.
3. **Manager floor** — a lower price only a Manager can authorize.
4. **CEO floor** — reserved for Harun (Haroon), either as CEO or as overall Sales Head.
5. **Beyond the CEO floor** — fully discretionary "beat the competition" pricing, decided
   case by case through discussion — explicitly *not* a fixed number.

His ask: replicate this policy in the system, or improve on it, with individual
per-item visibility (not the whole sheet at once) as part of the fix for the leak risk.

3. **A second, separate problem, raised by Latheef Bhai via voice message, 2026-09-14:**
   a discount authority ladder alone doesn't solve everything — some discounts are only
   ever meant to be valid for a limited window, and today nothing tracks that. His
   example: a ₹10L machine special-priced at ₹8-9L for a December year-end push. The
   deal doesn't close in December. Months later the hospital still expects that same
   special price, and the only record of what was actually offered is Haroon's memory
   of a phone call ("yes, I had offered that"). He wants every special/promotional rate
   to go through a formal mechanism with a defined validity window, so it can be looked
   up later — who authorized it, at what price, for how long — instead of being disputed
   from memory. See §5.1.

## 2. Why "no browsable price list" is the actual leak fix, not tighter paper controls

The paper process's core weakness isn't the stamp — it's that **one document contains
every price**. Whoever has it, even briefly, has all of it. Digitizing that as a
downloadable or browsable price list would keep the same weakness in a new format.

**The fix is structural, not procedural:** a rep should only ever see the price of the
one product they are actively adding to a real customer's deal, in the flow of quoting
it — never a standalone catalogue of every price. This project already has the pattern
for this everywhere else (Account/Opportunity visibility, Activity tier visibility) —
disclose what's operationally needed, in context, logged — this is the same principle
applied to pricing.

Layered on top: **role-based field visibility.** A Sales Staff should see the Quoting
Price and their own floor — never the Manager or CEO floors, which don't concern them
and are exactly the numbers most damaging to leak. This is stronger than "one item at a
time" alone; it's "one item, and only the number that's yours to know."

## 3. How Salesforce / Zoho / Dynamics 365 handle the same problem

Checked because this is a well-trodden problem in CRM/CPQ software, not a novel one —
useful to confirm Cabio's own policy already matches the industry-standard shape rather
than needing to invent something new:

| Concept | Salesforce (CPQ) | Zoho CRM | Dynamics 365 Sales |
|---|---|---|---|
| Master price per product | Price Books | Price Books | Price Lists |
| Tiered discount floors | Discount Schedules | Discount rules + Approval Process | Discount Lists |
| Who can approve going lower | Approval Processes (role-hierarchy-based, can require sign-off before the deal proceeds) | Approval Process (routes to manager automatically past a threshold) | Business Process Flow + Power Automate approval |
| Hiding sensitive numbers from juniors | Field-Level Security / Permission Sets | Field-level permissions | Field Security Profiles |

All three converge on the same four pieces: a master price, tiered floors, an approval
step past each floor, and field-level hiding of anything above a role's own tier. The
one place they go further than what's proposed below: their approval step can **block**
the deal until a manager actively approves it in-system, not just record a named
approver after the fact. Whether Cabio wants that stronger (blocking) version or the
lighter (attest-after-the-fact) version already used elsewhere in this app is one of
the open questions in §6.

## 4. Proposed data model

**Five new fields, directly on `product`** (not a new child table — unlike the separate
probe-compatibility catalogue idea, which genuinely needs a many-to-many table since one
USG model pairs with several probes; pricing here is one set of numbers per product):

- `quoting_price_lakhs` — the opening price.
- `staff_floor_lakhs` — lowest a Sales Staff can go, no approval needed.
- `manager_floor_lakhs` — lowest a Manager can go.
- `ceo_floor_lakhs` — Haroon's own floor.
- `unit_cost_lakhs` — **bundled in per Basheer's request 2026-09-11.** This is the
  missing piece blocking the Margin metric on the Product Performance Summary report
  (`docs/Insights-Dashboard-Implementation-Plan.md`) and the reorder-recommendation
  Backlog item — both currently can't compute margin/profitability because no cost
  field exists anywhere in the schema. Since a new pricing table is being built anyway,
  adding cost alongside it is a small addition rather than a separate future project.
  **Needs its own, stricter visibility** — see §4.1.

### 4.1 A real technical wrinkle: this can't be enforced with RLS alone

Every other access rule in this app is Row-Level Security — a user either sees a whole
row or doesn't. This is different: a Sales Staff and their Manager both need to see the
*same* `product` row, just different *columns* of it (Staff sees `quoting_price_lakhs`
and `staff_floor_lakhs` only; Manager additionally sees `manager_floor_lakhs`; only
Admin/GM/Finance-equivalent roles see `unit_cost_lakhs`). Postgres RLS can't do
column-level hiding within a shared row.

**Practical fix:** handle this at the API response layer instead — separate Pydantic
response schemas per role (a `ProductPricingStaffView` that simply omits the fields a
Staff role shouldn't receive, vs. a fuller `ProductPricingManagerView`), so unauthorized
fields are never sent over the wire at all, not just hidden in the UI. Worth flagging
explicitly since this is one of the few places in the app that can't follow the usual
"RLS handles it" pattern — `docs/Backend-Implementation-Standards.md` should probably
note this as the sanctioned exception if it's approved, so it isn't treated as a
one-off inconsistency later.

## 5. Proposed authority ladder — derived directly from Latheef Bhai's own description

Rather than a generic approval workflow, the ladder maps directly onto what he
described, tier by tier:

- **Quoting Price down to Staff floor:** Sales Staff prices freely, no approval of any
  kind — this *is* what "authority to give a discount" already means for that tier.
- **Staff floor down to Manager floor:** needs the Manager's involvement — the rep
  self-attests naming the approving Manager, the same shape already used for the
  Fast-Track gate override (`BR-OP-14`). **Decided (Basheer, 2026-09-11): attest, not
  block** — matches this app's existing trust posture (Fast-Track uses the same
  mechanism) and needs no new approval-workflow engine. Still subject to Haroon/Latheef
  Bhai's final sign-off along with the rest of this paper.
- **Manager floor down to CEO floor:** not attestable by proxy — only Haroon (or another
  user holding equivalent authority) can be the one to actually enter a price this low,
  matching "reserved for Harun" directly.
- **Below the CEO floor:** fully discretionary special pricing, no stored number at all
  — Haroon/GM/Admin enters it directly on the deal, same as the existing pattern where
  Admin/GM already act as an unrestricted overlay tier elsewhere in the system
  (`BR-OP-12`). **Confirmed by Latheef Bhai's own restatement of this ladder (voice
  message, 2026-09-14)** — Base Rate → First-Level (Staff) → Manager-Level → CEO-Level
  → beyond, which matches §5 as already proposed, not a change to it. He gave concrete
  examples of when this discretionary tier gets used: countering a competitor in a
  high-stakes deal, retaining a customer Cabio can't afford to lose, or launch pricing
  for one or two Key Opinion Leaders when introducing a new product.

### 5.1 A second, separate problem: discounts that were only ever meant to be temporary

Latheef Bhai's own example (paraphrased from his voice message, 2026-09-14): a ₹10L
machine offered at ₹8-9L for a December year-end push. The deal doesn't close in
December — but the hospital keeps expecting that same price when the deal resurfaces
six months or a year later, and today there's no record of what was actually offered
or for how long, only Haroon's memory of a phone call. **This is a different problem
from §5's authority ladder** — the ladder answers "how low can this role go," not "how
long is this specific number still good for." Every price in §4's data model
(`quoting_price_lakhs`, the three floors) is a standing number with no expiry — none of
them can represent a one-time promotional rate that should stop being valid on a
specific date.

**A concrete precedent already exists in this app for exactly this shape** — BR-OP-02
(On-Hold Status Discipline): a `reactivation_date` that must be in the future, and the
system automatically flags the record as "Reactivation Overdue" once that date passes.
A `special_price_offer`-type record (special price, validity end date, who authorized
it, and why — e.g. "Dec 2026 year-end promo") could reuse the same shape: valid while
`today <= valid_until`, automatically shown as expired once it isn't, so a rep or
manager reopening the deal sees plainly that the old number no longer applies rather
than having to ask around. **Not designed further here** — this needs Haroon/Latheef
Bhai's decision on shape before it's scoped (see §6, item 6): a new table linked to
account/opportunity, or something simpler.

**Where this plugs into the existing schema:** `opportunity_item.unit_price_lakhs` is
already the field a rep fills in per line item today, with no floor check of any kind
currently applied. The new Quoting Price would pre-fill this field as a default (kept
editable, same as today), and a new validation step at save time checks the entered
price against the caller's tier for that product.

**Repeat Orders:** `BR-OP-13` (`REPEAT_ORDER`) already means the price is pre-negotiated
off a prior PO — **decided (Basheer, 2026-09-11): the ladder does not apply to these**,
since there's no fresh quoting happening.

## 6. Open questions — Haroon/Latheef Bhai's call, not scoped or decided

1. ~~**Attest-after-the-fact (like `BR-OP-14`) or block-until-approved (like Salesforce/
   Zoho/Dynamics) for the Staff→Manager step?**~~ — **DECIDED (Basheer, 2026-09-11):
   attest, matching the Fast-Track gate override.** See §5. Still subject to Haroon/
   Latheef Bhai's final sign-off along with the rest of this paper.
2. ~~**Does `REPEAT_ORDER` skip the ladder entirely?**~~ — **DECIDED (Basheer,
   2026-09-11): yes.** See §5.
3. **Per-product only, or does pricing need to vary by zone/region too?** Proposed:
   per-product only for v1 — SBU segmentation already exists structurally (every
   product belongs to one SBU), and nothing in what's been raised so far calls for
   zone-level variation. Don't build that dimension until a real need for it shows up.
4. ~~**Who exactly counts as "Finance/Admin-equivalent" for seeing
   `unit_cost_lakhs`?**~~ — **DECIDED (Basheer, 2026-09-11): Admin/GM only** — SBU
   Manager/Area Manager do not see product cost.
5. ~~**Does this get built together with the still-open WON/LOST immutability gap**~~
   — **DECIDED (Basheer, 2026-09-11): no, keep separate.** Won-deal price locking
   stays parked in `docs/Backlog.md`'s BR-OP-09 entry, revisited only if Cabio
   leadership specifically asks for it — not bundled into this build.
6. **Time-bound special pricing (§5.1), raised 2026-09-14 — not decided, not scoped.**
   Does this ship in the same build as the four-tier ladder, or as a fast-follow once
   that's live? What's the record actually linked to — a specific Opportunity, an
   Account generally, or both? Who can authorize one — anyone at Manager tier and
   above, or CEO-tier only, matching how deep these discounts tend to run? What
   happens automatically once a special price expires — just a visual "expired" flag
   (matching BR-OP-02's Reactivation Overdue pattern), or does the deal's price need
   to actively revert to a real number? Needs Haroon/Latheef Bhai's call before this
   is scoped.

**All questions from the original 2026-09-11 paper resolved; item 6 above (added
2026-09-14) is new and still open — awaiting Haroon/Latheef Bhai's review of the paper
as a whole before this moves to a real implementation plan.**

## 7. Recommendation (proposed, not yet decided)

- Build the five pricing/cost fields directly on `product` (§4), not a new table.
- Enforce visibility at the API response layer with role-scoped schemas, not RLS (§4.1)
  — flag this as the sanctioned exception in `Backend-Implementation-Standards.md` once
  approved.
- Ladder per §5: free authority within one's own tier, `BR-OP-14`-style attestation to
  borrow the next tier up (decided, §6.1), direct-entry-only below the Manager floor.
- Bundle `unit_cost_lakhs` into the same build (Basheer's call, already made) rather
  than a separate future migration.
- Record as a new Business Rule (e.g. `BR-PRC-01`) once decided, alongside amending
  `docs/Physical-Schema.sql`.
- Time-bound special pricing (§5.1) is a separate, still-open piece — recommend
  deciding it alongside this paper rather than as a later fast-follow, since Latheef
  Bhai raised it as part of the same underlying pain point (pricing discipline and
  traceability), even though the data model is genuinely distinct from the four-tier
  ladder.

## 8. Reference

- `docs/Backlog.md` — "Standard quoting prices in the Product Catalogue" (the original
  Area Manager suggestion this paper grew out of), "Auto-computed High Priority deal
  flag" (the SBU-relative-threshold reasoning this paper's per-product-only
  recommendation echoes).
- `docs/Insights-Dashboard-Implementation-Plan.md` — Product Performance Summary
  section, where the missing Margin metric is currently flagged as blocked on exactly
  the cost field this paper proposes adding.
- `docs/Business-Rules.md` — `BR-OP-13` (REPEAT_ORDER, §5's interaction question),
  `BR-OP-14` (Manager-Attested Gate Override, the attestation pattern §5/§6 proposes
  reusing), `BR-OP-12` (Admin/GM unrestricted-overlay precedent for the CEO-floor tier),
  `BR-OP-02` (On-Hold Status Discipline — the `reactivation_date`/"Reactivation Overdue"
  precedent §5.1 proposes reusing for expiring special prices).
- `docs/Physical-Schema.sql` — `product`, `opportunity_item.unit_price_lakhs`.
