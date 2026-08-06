# Discussion Paper: Should Reps Be Able to Skip Demo Date / Expected Closure Date for Fast-Tracked Deals?

**Prepared for:** Discussion with Haroon Sidheeq (General Manager & Sales Head) and the
Cabio leadership team.
**Prepared:** 2026-08-04. **Updated:** 2026-08-05 (v2 — added the REPEAT_ORDER fast-track
option; v3 — renamed the trigger to a new, distinct "REPEAT_ORDER" lead source; v6 — decided.
All open questions resolved with Basheer; opportunity cloning (Section 6) confirmed as a
deferred, separate follow-on, not bundled into this build; v7 — implemented).
**Status:** IMPLEMENTED — 2026-08-05.

**Implemented 2026-08-05:** Option A (missing gate fields) and Option D (`REPEAT_ORDER`
fast-track) both shipped in the same pass. Backend: `Opportunity.lead_source` gate
logic in `app/domains/opportunity/validators.py`/`service.py`/`repository.py`; new
`REPEAT_ORDER` row added to `docs/Seed-Data.sql` (not yet applied to the live DB — Basheer
to run when ready); `BR-OP-01`/`BR-OP-13` recorded in `docs/Business-Rules.md`.
Frontend: all 4 opportunity create/edit entry points
(`OpportunityDetailScreen.tsx`, `Customer360Screen.tsx`, `QuickLeadModal.tsx`,
`ProjectDirectoryScreen.jsx`) now collect Demo Start/End Date, Expected Closure Date,
and PO Number, and hide the demo/closure fields when `REPEAT_ORDER` is selected.
`ProjectDirectoryScreen.jsx`'s Add Opportunity modal fields were converted to MUI as
part of this change (file overall remains pending full migration — see
`Frontend-Implementation-Standards.md` §9). Backend suite (405 tests), `tsc --noEmit`,
and lint (incl. the Tailwind guard) all green. `REPEAT_ORDER` seed row applied to the Dev
database 2026-08-05 (Basheer) — UAT still pending, once this code ships there. Manual
E2E verification — Dev unblocked and ready, UAT to follow.

---

## Final decision, in plain terms

**The problem:** a rep tried to enter a deal straight at "Order" stage (skipping the
walk-through) and got an error about a missing Demo Date — a field the form didn't even
show. Digging into it turned into two separate fixes.

**Fix 1 — just fixing a broken form (happening regardless of anything else):** three of
the four places where you can create or edit a deal are missing fields that the fourth
one already has (Demo Date, Expected Closure Date, PO Number). Add those fields to the
missing three so nothing throws a confusing error. This isn't really a "decision" — it's
just closing a gap.

**Fix 2 — the actual new thing being decided:** for a customer repeat-ordering the *exact
same equipment* they already bought from us — price already agreed, no fresh demo, no
negotiation — reps were still being forced to fill in Demo Date and Expected Closure
Date, fields that genuinely don't apply to that kind of sale.

**What's changing:** when a rep creates that kind of deal, they can now mark it as a
"REPEAT_ORDER." Once marked:
- They **don't** have to fill in Demo Date, Expected Closure Date, or clinical
  evaluation details.
- They **still** have to fill in the price and what's being sold — that part doesn't go
  away, it's just coming from the earlier order instead of a fresh negotiation.
- Any rep can use it themselves — no manager sign-off needed.
- It's a simple single tag — no sub-categories to pick from.
- There's no separate "manager can manually skip fields for a weird one-off case"
  feature — that idea was floated and dropped.

**Opportunity cloning** (auto-filling the new deal from the customer's last order) was
considered for the same release and deliberately kept separate — it doesn't change
anything about the decision above, it would only save re-typing. Ship REPEAT_ORDER first,
build cloning later once there's real usage to learn from. See Section 6.

Everything below this point is the reasoning and options analysis that led here —
kept for reference, not still open.

---

## 1. Where this came from

During UAT smoke testing, a rep tried to create an Opportunity directly at the **Order**
stage and was rejected with an error about a missing Demo Date — a field the create form
doesn't even show. Investigating this surfaced two separate questions, one already
settled and one genuinely open:

1. **Should a rep be able to create an Opportunity directly at Order stage, instead of
   walking it through Lead → Qualified → Demo → Negotiation → Order one stage at a
   time?** — **Yes, already decided.** This has been the system's design since an
   earlier architecture decision (ADR-015): medical equipment deals often enter the
   pipeline mid-flight (a tender, a referral, a direct customer approach), so the system
   was always meant to support creating an Opportunity at any stage. The rejection the
   rep hit wasn't the system refusing this — it was a smaller bug (the create screen
   simply never asks for the Demo Date field it needs). That bug has its own fix
   already scoped and doesn't need this discussion.

2. **When creating (or fast-tracking) an Opportunity straight to Order, should the Demo
   Date and Expected Closure Date still be required, or should they be skippable for
   "fast-tracked" deals?** — **This is the open question**, raised by Haroon.

**Update 2026-08-05:** in discussion, Haroon quantified this: **roughly 40% of
opportunities come from repeat customers repeat-ordering equipment**, where the price is
pre-negotiated off the customer's previous Purchase Order, and there is no fresh demo or
negotiation — those stages of the pipeline genuinely don't happen for this deal type.
This isn't the rare, occasional exception the original question anticipated; it's a
large, predictable, recurring share of the pipeline.

## 2. What Demo Date and Expected Closure Date are actually for

Every Opportunity moves through a series of stages (Lead → Qualified → Demo →
Clinical Evaluation → Negotiation → Order → Delivery). At each stage boundary, the
system currently requires a small amount of information before letting the deal move
further — for example, an Opportunity can't be marked "Order" unless it has already
recorded when the Demo happened and when the deal is expected to close (see
`Business-Rules.md`, `BR-OP-01`, for the full gate table).

This isn't paperwork for its own sake. Two things depend on this data existing:

- **Trustworthy pipeline and forecast reporting.** "How long does a typical deal take
  from Demo to Order?", "Which deals are closing this quarter?", "Are we spending too
  long in Negotiation?" — every one of these questions needs Demo Date and Expected
  Closure Date to actually exist on the records being analyzed. This is a committed
  future capability (leadership dashboards and forecasting are an explicit part of the
  system's design), not a hypothetical.
- **A trustworthy pipeline, period.** The whole point of Cabio Sales OS (as opposed to a
  simple contact list) is that the stages mean something consistent across every rep
  and every deal, so leadership can trust what the pipeline says without having to
  independently verify each deal.

Both of these are about *fresh-sale* deals, where a demo and negotiation genuinely
happen. For the repeat order share of the pipeline, these fields aren't being skipped despite
being relevant — they're not relevant to begin with, because the stage they describe
doesn't occur for that deal type.

## 3. Why "just make it optional for everyone" is riskier than it sounds

Making Demo Date / Expected Closure Date optional across the board — rather than tied to
a specific, recognized deal type — carries real risk:

- **There's no "come back and fill it in later."** Once a deal is created at Order stage
  without a Demo Date, there is currently no point in its lifecycle where the system
  asks for it again — even if the deal later moves further to Delivery. Whatever's
  missing at creation stays missing permanently, with no natural prompt to fix it.
- **"Fast-tracked" is easy to over-use if it's a free-form judgment call.** If any rep
  can self-decide a deal counts as fast-tracked and skip the fields, there's a natural
  incentive for *every* deal to become fast-tracked whenever filling in a date is
  inconvenient — not because reps are acting in bad faith, but because it's simply the
  path of least resistance. Once that happens, the fields stop being reliable for
  anyone, not just the genuinely fast-tracked deals.
- **No way to tell "genuinely skipped" from "rep forgot"** — unless the skip is tied to
  something structured and already recorded, like lead source, rather than a free
  judgment call with no record of why.

REPEAT_ORDER (Option D below) avoids all three: it isn't a judgment call, it's driven by a
mandatory, already-reported field (`lead_source`), so it can't quietly expand to cover
deals it wasn't meant for, and it's auditable for free through existing lead-source
rollups.

## 4. Options

### Option A — Fix the forms, keep both fields required — HAPPENING REGARDLESS
The 3 opportunity-create screens that don't currently show Demo Date / Expected
Closure Date get the fields added, matching the one screen that already has them. A
rep creating directly at Order stage can fill in everything in a single sitting instead
of hitting a confusing rejection. No rule changes — this is a bug fix, not a policy
decision.

### Option B — Make both fields fully optional for any Opportunity created at Order stage or beyond — NOT CHOSEN
Any rep can create/advance an Opportunity to Order without ever recording a Demo Date
or Expected Closure Date, no questions asked. All three risks in Section 3 apply in
full — no audit trail, no way to distinguish legitimate exceptions from shortcuts.
Superseded by Option D.

### Option C — Scoped, explicit, recorded individual exception — DROPPED, 2026-08-05
Would have added a deliberate, visible "skip this requirement" action restricted to a
role like Admin/GM, requiring a typed reason. **Decided not needed** — the repeat order
volume (~40%) is fully covered by Option D, and the remaining true one-off case (a deal
closed entirely outside the system and logged after the fact) wasn't judged common
enough to justify building a separate override mechanism for. Revisit only if that case
actually starts recurring in practice.

### Option D — REPEAT_ORDER fast-track — DECIDED, 2026-08-05

`Opportunity.lead_source` gains a new value, **`REPEAT_ORDER`**, distinct from the existing
`Existing Customer` value (which answers *how the lead reached us*, not whether *this
deal* is a repeat order — see the correction below). `REPEAT_ORDER` specifically means: **the
customer is buying the exact same equipment they already have from us** — not just any
repeat purchase from an existing customer.

When an Opportunity's `lead_source` is `REPEAT_ORDER`: Demo Date, Expected Closure Date, and
Clinical Evaluation fields are **not required** to create or advance to Order. **Order
Value and Product Details stay required** — sourced from the prior order rather than a
fresh negotiation, but still entered.

**Correction kept for the record:** an earlier draft of this option proposed reusing the
existing `Existing Customer` lead source as the trigger. That's wrong — a hospital that's
an existing Imaging customer could still be a brand-new pitch for a Critical Care
product line, correctly tagged `Existing Customer`, that still needs a full demo. Gating
the skip on that value would have misfired on exactly that case, and risked silently
changing gate behavior for Opportunities already tagged `Existing Customer` in the live
database. `REPEAT_ORDER` is a new, separate value specifically for this narrower case.

**Decided, 2026-08-05:**
- Single flag, no sub-classification (e.g. same-product vs. different-product repeat order)
  — one `REPEAT_ORDER` value is enough.
- Any rep can use it directly — no manager approval required.
- `BR-OP-01`'s gate table gets amended directly to make this exception, rather than
  carried as a separate documented exception alongside an unchanged rule.

## 5. Comparison at a glance

| | A: Fix forms only | B: Fully optional | C: Individual exception | D: REPEAT_ORDER fast-track |
|---|---|---|---|---|
| Solves "rejected with no warning" bug | Yes | Yes | Yes | Yes |
| Lets reps enter an Order-stage deal in one sitting | Yes | Yes | Yes | Yes, for repeat order deals |
| Skips Demo Date / Closure Date entirely | No | Yes, always | Yes, when explicitly invoked | Yes, when `lead_source` = REPEAT_ORDER |
| Fits the ~40% repeat order volume | No | Yes, but uncontrolled | No — doesn't scale | Yes — purpose-built for it |
| Status | Happening regardless | Not chosen | Dropped | **Decided — build this** |

## 6. Opportunity cloning — deferred, separate follow-on

An idea raised alongside this: once a rep marks a deal as `REPEAT_ORDER`, could the system
auto-fill Product Details and Order Value from the customer's last order, instead of the
rep re-typing them? **Considered for this same release and deliberately kept
separate:**

- It doesn't change anything about the REPEAT_ORDER decision above — Order Value and Product
  Details stay required either way; cloning would only change *how* they get filled in
  (copied vs. typed), not *whether* they're needed.
- It's real additional scope — a "pick a past order to copy from" flow, logic to copy
  the equipment list and price across, and a decision about whether a copied price gets
  flagged for review if it's since changed.
- REPEAT_ORDER alone already fixes the actual problem (reps no longer get blocked). Shipping
  it first, before designing cloning, means cloning gets designed around how reps
  actually use REPEAT_ORDER rather than a guess.
- Not blocked on "not enough REPEAT_ORDER history yet," as originally assumed — every repeat
  customer already has *some* past order in the system to clone from, tagged `REPEAT_ORDER`
  or not. It's deferred by choice, not by a data dependency.

Log to `docs/Backlog.md` as a forward-looking item once this paper's decisions land.

## 7. Decided — resolved 2026-08-05

All open questions from the original discussion are now settled:

1. **`BR-OP-01` amended directly** (not carried as a separate documented exception).
2. **No sub-classification** — a single `REPEAT_ORDER` value is enough.
3. **Option C dropped** — no individual manager-override path; not needed.
4. **Opportunity cloning deferred** — see Section 6; logged to `docs/Backlog.md`
   separately, not part of this build.
5. **Naming** — `REPEAT_ORDER` confirmed as the value name.

## 8. Reference

- `docs/ADR.md` — ADR-015 (Opportunity Creation at Any Sales Stage), ADR-001 (Sales
  Operating System positioning), ADR-013 (Target → Coverage → Opportunity → Revenue
  hierarchy, and its reporting/forecasting commitment).
- `docs/Business-Rules.md` — BR-OP-00 (Opportunity Creation Flexibility), BR-OP-01
  (Stage Transition Exit Criteria — the gate table this decision amends).
- `backend/app/domains/reference/models.py`, `docs/Seed-Data.sql` — `LeadSource` master
  data; this decision adds a new `REPEAT_ORDER` value alongside the existing `Referral`,
  `Existing Customer`, `Tender`, `OEM Referral`, `Cold Call`, etc.
- `docs/Backlog.md` — the related form-completion bug (Option A), and where Opportunity
  cloning (Section 6) is tracked as a separate future item.

---

*Decided 2026-08-05. Next step: record as a formal rule change in
`docs/Business-Rules.md` (amending `BR-OP-01`), with a short ADR note since it changes a
previously universal stage-gate rule, then implement.*
