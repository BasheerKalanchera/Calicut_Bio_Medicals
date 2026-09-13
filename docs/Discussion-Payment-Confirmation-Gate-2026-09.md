# Discussion Paper: Payment Confirmation Gate Before Won

**Prepared for:** Discussion with Haroon Sidheeq (General Manager & Sales Head), Latheef
Bhai, and the Cabio leadership team.
**Prepared:** 2026-09-11.
**Status:** DRAFT — core shape decided by Basheer (visibility + an actual gate, new
stage after Delivery & Installation, exact rule wording, applies with no exceptions to
REPEAT_ORDER or Fast-Track deals); still needs Haroon/Latheef Bhai's review and the
remaining open questions (§4) settled before this is scoped for build.

---

## 1. Where this came from

Raised by Basheer while discussing the new Pricing/Discount-Authority paper (`docs/
Discussion-Pricing-Discount-Authority-2026-09.md`): Cabio has situations where a deal is
won and equipment is delivered, but full payment is not yet in hand. Sales reps
shouldn't be able to mark a deal Closed-Won until payment is actually received.

## 2. The current gap

Checked directly against `Business-Rules.md` and `Physical-Schema.sql`:

- **Won is settable from any stage today**, by design (`BR-OP-01`: "Status is
  independent of Stage. An Opportunity can transition to Won, Lost, or On-Hold from any
  stage.") — only `PO Number` and confirmed `Product Details` are required.
- **No payment concept exists anywhere in the schema.** `opportunity` has no payment
  field of any kind.
- **This isn't an oversight — it's a deliberate original boundary call.** The PRD's
  System of Record table (Appendix B.5) puts Invoice, Payment, and Collections under a
  separate Finance system, not Sales OS. Same category of boundary already applied to
  stock/inventory (kept out of Sales OS for the reorder-recommendation idea).

So this genuinely doesn't exist today, and building it means deciding how far into
Finance's territory Sales OS should reach — not just adding a field.

## 3. Proposed design — decided by Basheer, 2026-09-11

**Visibility + an actual gate**, not a cosmetic stage:

- **New stage: "Payment Pending"** (working name — see Open Questions), positioned
  **after Delivery & Installation** in `opportunity_stage` (`display_order`, proposed
  `80` — Delivery & Installation is currently `70`). Pure master-data addition, no
  schema change for the stage itself, consistent with `ADR-028`'s reasoning for making
  stages configurable data rather than a hardcoded enum.
- **New gate rule, exact wording decided by Basheer, 2026-09-11: "Won cannot be set if
  full payment is not collected."** Deliberately says *full* payment, not just "payment
  started" — a partial/advance payment does not satisfy this gate. This is a different
  *shape* of rule than `BR-OP-01`'s existing gate table — those gates control moving
  *between stages* (e.g. Negotiation → Order); this one controls moving *to a status*
  (→ Won), conditioned on full payment having been collected. Proposed to document as
  its own rule (`BR-OP-15`) rather than folding into the `BR-OP-01` table, since it's
  checking something different.
- **Applies to every Opportunity, no exceptions — decided by Basheer, 2026-09-11.**
  Neither `REPEAT_ORDER` (`BR-OP-13`) nor a Manager-Attested Fast-Track override
  (`BR-OP-14`) skips this gate. Resolves what were Open Questions 2 and 3 in the prior
  draft of this paper.
- **Confirmation is self-attested, not connected to Finance/Tally.** Someone (rep or
  their manager) marks full payment as collected directly in Sales OS — the same trust
  model every other confirmation step in this app already uses (PO Number, Order Value,
  Demo Outcome are all self-entered too, not independently verified). This deliberately
  does **not** require a Tally integration — that would be a much larger, separate
  project, and isn't necessary to get real enforcement value from this gate.
- **New fields on `Opportunity`, mirroring the existing gate-override pattern**
  (`gate_override_set_at`/`gate_override_set_by` from `BR-OP-14`):
  `full_payment_confirmed_at`, `full_payment_confirmed_by` — named explicitly around
  "full" to match the rule's own wording, not a generic "payment" field that could be
  misread as allowing partial payment to qualify. Captures who attested it and when,
  automatically — same audit-friendly shape already proven elsewhere in this codebase.

## 4. Open questions — not yet decided

1. **Stage name.** "Payment Pending" avoids implying Sales OS tracks actual invoices
   (that's Finance's system of record) — just states the fact Sales OS itself needs to
   know. Alternatives: "Awaiting Payment," "Collection Pending." Haroon/Latheef Bhai's
   call.
2. ~~**Does this gate apply uniformly to REPEAT_ORDER deals (`BR-OP-13`) too?**~~ —
   **DECIDED (Basheer, 2026-09-11): yes, no exceptions.** See §3.
3. ~~**Does the Manager-Attested Fast-Track override (`BR-OP-14`) get to skip this
   gate?**~~ — **DECIDED (Basheer, 2026-09-11): no, no exceptions.** See §3.
4. **Timing against the Insights Dashboard build already underway.** Today, "Won" is
   what the new Pipeline Value/Weighted Forecast tiles (being built right now, same
   day, in a separate session) count as closed revenue. Once Won requires payment
   confirmation, "closed-won revenue" quietly starts meaning something later and
   stricter than it does today — a real, positive accuracy improvement, but a
   definition change. **Recommended: don't change Won's semantics until that concurrent
   build ships**, so there's no ambiguity about what "Won" meant when those numbers
   were first validated. This paper should sit in review, not implementation, until
   that's clear.
5. **Relationship to the still-parked WON/LOST immutability gap** (`docs/Backlog.md`'s
   BR-OP-09 entry, deliberately kept separate from the Pricing paper). Not proposed to
   bundle here either — flagged only because both are "what does it take to reach Won"
   questions, worth Haroon/Latheef Bhai knowing both exist when reviewing this.

## 5. What this does not do

- Does not connect to Tally, verify a real bank transaction, or reconcile against an
  actual invoice — Finance/Collections stay Finance's system of record, unchanged from
  the original PRD boundary (Appendix B.5).
- Does not retroactively affect any already-Won UAT/Dev opportunity — this only gates
  the transition going forward.
- Does not touch the Pricing/Discount-Authority paper's own scope — separate feature,
  separate build, cross-referenced only where relevant (§4.4, §4.5).

## 6. Reference

- `docs/Business-Rules.md` — `BR-OP-01` (existing gate table, the pattern this extends
  in a new shape), `BR-OP-13` (REPEAT_ORDER — this gate applies to it too, §3),
  `BR-OP-14` (Manager-Attested Gate Override — both the field-naming precedent and,
  per §3, a rule this gate is *not* exempted by), `BR-OP-09` (WON/LOST immutability,
  §4.4).
- `docs/ADR.md` — `ADR-028` (Stage/Status decoupling — why Won being settable from any
  stage is deliberate, and why adding a stage needs a real gate, not just a Kanban
  entry, to actually change behavior), `ADR-013` (Target→Coverage→Opportunity→Revenue
  hierarchy).
- `docs/Cabio Sales OS – Phase 1 - PRD.md` — Appendix B.5 (System of Record table:
  Payment/Invoice/Collections under Finance, not Sales OS).
- `docs/Insights-Dashboard-Implementation-Plan.md` — Pipeline Value/Weighted Forecast
  tiles, whose "closed-won" definition this paper would eventually change (§4.4).
- `docs/Discussion-Pricing-Discount-Authority-2026-09.md` — the sibling paper this was
  raised alongside; no scope overlap, cross-referenced for context only.
