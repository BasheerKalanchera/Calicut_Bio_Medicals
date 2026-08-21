# Strategic Growth Topics — Discussion Paper

**Prepared:** 2026-08-06, from the 2026-08-05 leadership meeting notes (buyback,
Cardiology/Thoracic line, Account Manager incentives, JV geography expansion). This
is a thinking-through document to bring to Haroon/Latheef Bhai and the wider team —
none of the four topics below are decided, and none should be treated as a spec.
Written to evolve naturally out of the current system, not replace it.

---

## 1. Should Cardiology/Thoracic be a new SBU?

**Resolved (2026-08-06, confirmed with Haroon): not for now.** Haroon sells
Cardiology/Thoracic himself — there's no dedicated team yet, because he isn't
confident the existing Imaging/Critical Care teams can handle it on their own. No
team means no organizational structure to justify SBU-level infrastructure (own
targets, own RLS tier, own management chain). **Cardiology equipment gets sold under
whichever existing SBU each product's technology naturally fits (Imaging or Critical
Care) — not a new SBU, and not tracked by a dedicated system field either (see below).**

**Confirmed 2026-08-13: current Cardiology inventory is entirely refurbished
stock.** Every Cardiology machine Cabio sells today is a refurbished unit —
`product_type = REFURBISHED` in the Product Catalog, filed under whichever SBU
(Imaging or Critical Care) its technology fits, same slotting rule as above.
This connects directly to Section 4's still-open field-discovery problem below:
a refurbished Cardiology machine needs the same "reserve this unit," find-it-
in-the-field handling as any other refurbished asset — nothing Cardiology-
specific about that gap, just a concrete case of it.

**Also resolved (2026-08-06): no new field for this, and `category_name` stays as-is
— it isn't being repurposed.** Considered two ways to formally tag Cardiology
products/deals for tracking purposes — reusing the existing `category_name` field, or
adding a new `clinical_specialty` field alongside it. **Basheer's call: neither.**
`category_name` as currently designed is redundant — confirmed against the codebase
(zero references anywhere in `product/repository.py`, no report or filter consumes it
today) and against the documentation (referenced by name only 3 times total across
the PRD, `Business-Rules.md`, `ADR.md`, and `Enterprise-Data-Model.md` combined, and
zero times in `Business-Rules.md` specifically — no business rule governs it,
unlike `sbu_id`, which appears in 8 enforced rules there). Its documented purpose —
feeding `Product Performance` reporting (PRD Appendix A.3.4) and `Product Category
Targets` (PRD §6.5) — was never built. **Targets for Cardiology, same as everything
else, are set at the SBU level only** (`BR-PL-01`: User + SBU + Quarter, already
built and in use) — not at a product-category level, which is a different PRD concept
(§6.5) that was never implemented and isn't being picked up now. Tracking "how is
Cardiology doing" for now is a manual/ad-hoc lookup (by OEM/product name), not a
system-level report — revisit only if/when Cardiology's own volume makes that
worth building deliberately, not as a side effect of the SBU-vs-category question.

SBU is a heavily load-bearing concept in the current system, not just a label. Every
user belongs to exactly one SBU (`user_profile.sbu_id`, mandatory). RLS visibility,
target planning (`Quarterly Target` is keyed by User + SBU + Quarter), the Product
Catalog, and every reporting dimension all key off `sbu_id`. Adding a third SBU would
be *cheap* — one new row in the `sbu` table, no schema change — but that cheapness
only pays off once Cardiology has its own dedicated reps, own targets, own management
chain, matching how Imaging/Critical Care are actually structured today. Building
that now, for one person's pipeline, would be premature.

**The synergy with Imaging/Critical Care is genuinely strong, not incidental:**
- Cath labs and cardiac imaging (angiography, fluoroscopy) overlap directly with
  Imaging's product/technology base.
- Cardiac ICU/CCU equipment (monitors, defibrillators) overlaps directly with
  Critical Care's catalog.
- Most importantly: hospitals that already buy Imaging or Critical Care equipment
  from Cabio are largely the *same accounts* likely to want a cardiology department
  outfitted too — not a new customer base to go find.

**Industry pattern:** a new line commonly gets *incubated* by a single person or
leadership, tracked as a product category inside the existing sales organization, and
only "graduates" into its own team/SBU once it proves enough volume to justify
dedicated headcount. Building SBU-level infrastructure ahead of that is a common
overinvestment mistake — better to let the org structure follow the actual pipeline.

**Two things already built that make this work today, no new engineering needed:**
1. `BR-OP-12` (shipped) already lets Admin/GM create Opportunities outside their own
   home SBU — Haroon can log Cardiology deals right now under whichever SBU fits.
2. The decided-but-not-yet-built referral credit (Issue 2) is the right shape for the
   cross-sell: an Imaging or Critical Care rep who spots a cardiology need while
   already in a hospital logs a referral and gets credit, while Haroon closes it.

### When Cardiology later graduates to its own SBU

The transition itself needs a plan, even though it's not needed yet:

- **Cutover date, no retroactive reclassification.** Everything logged before the
  cutover stays under whichever SBU it was created in — don't retroactively move
  historical Cardiology deals (identifiable only by product/OEM name today, since
  there's no dedicated tag — see above) to the new SBU. `Quarterly Target` is keyed by
  SBU+Quarter; reassigning old deals after the fact would corrupt whatever quarter's
  target-vs-actual numbers they were already counted under. Only opportunities
  created *after* the cutover go under the new Cardiology SBU.
- **Splitting/crediting across the transition uses Referral, not Splits.** Once
  Cardiology has its own team and, say, an Imaging rep helps bring in a deal at an
  account they already relate to, that's cross-SBU collaboration — `BR-FIN-06`/
  ADR-037 deliberately restrict Splits to same-SBU (a considered, recent decision,
  not an oversight), so Splits won't cover it. The referral credit mechanism from
  Issue 2 does — cross-SBU by design. No new mechanism needed for the transition
  itself.
- **If a one-time referral turns out to be insufficient** — leadership decides legacy
  reps should get an *ongoing* share of Cardiology revenue at accounts they built, not
  just a one-time credit — that's the trigger to either revisit ADR-037's same-SBU
  restriction specifically for this case, or lean on the Account Manager mechanism
  (below) instead, since that's designed for exactly this: ongoing credit across
  product lines at an account, regardless of who closes what. Not something to build
  preemptively — cross this bridge once the transition is actually happening and the
  referral mechanism proves insufficient in practice.

---

## 2. Account Manager concept, tied to incentives

**Worth knowing before conceptualizing this from scratch: it's already in the PRD.**
§6.3 "Account Manager Assignment" — "Optional assignment of Account Manager for
strategic customers. This role shall coexist with product-category ownership." §6.3A
"Customer Ownership Management" goes further: "The system shall support assignment
of a Primary Account Manager to each customer account," responsible for "overall
customer relationship management." This predates the recent leadership meeting —
worth bringing to Haroon/Latheef as a starting point rather than a blank page. (The
"product-category ownership" it says should coexist with is a related but separate
PRD concept — a different kind of ownership over a category rather than an account —
not something this system tracks today either.)

Useful that this came up during an incentives discussion — that reframes it. It's not
really a CRM "who owns this record" question, it's a **compensation design**
question: how do you keep paying someone for a relationship they built, even on
revenue a different person (or a product specialist) closes later.

Today `Account` has no owner field at all — only `Opportunity.owner_id` exists, and
ownership resets with every new deal. Two lighter-weight mechanisms already exist
nearby, worth knowing before designing a third:
- **Splits** — per-deal, decided at deal time, same-SBU-any-zone (BR-FIN-06).
- **Referral credit** (`referred_by_user_id`, from the recently-decided Issue 2 work)
  — one-time, any SBU/zone, no ongoing revenue share.

Account Manager would be a third, *standing* concept — closer to Salesforce's
`Account.OwnerId` pattern: one person (or role) responsible for an account
indefinitely, with an incentive plan that pays them something on **all** revenue at
that account in a period, on top of whatever the closing rep earns. The data-model
side of this is genuinely the easy part — an `account_manager_id` field plus a
reassignment governance rule, similar difficulty to the Opportunity Owner
reassignment work already built. **The hard part is the compensation formula itself**
— what percentage, capped how, does it come out of the closer's split or is it
additive, does it apply across every SBU an account touches or just the AM's own —
and that's a Finance/leadership decision, not an engineering one. I'd suggest getting
that formula roughed out before any schema work starts, since the data model should
follow the incentive design, not the other way around.

One coupling worth flagging explicitly: if an Account Manager is meant to own the
*whole* relationship across product lines — including a future Cardiology line — then
making Cardiology a hard-walled new SBU (see above) cuts against that, since the AM
would need cross-SBU visibility into an account they don't otherwise have a role in.
These two decisions should be made together, not separately.

---

## 3. Joint venture geography expansion

**Confirmed (2026-08-06): the JV is a genuinely separate entity that should not see
Cabio's other data.** That rules out the "just treat it as a new Zone" shortcut —
the current system has no concept of an isolation boundary above SBU/Zone at all;
those are internal subdivisions of one company, not walls between two. The real
question left is *which* legal structure this is, because that decides which system
pattern actually fits — and it's a genuine fork, not a detail.

The arrangement as described: Cabio licenses its brand and products; the partner
invests capital and sweat equity and runs the operation with their own sales staff;
Cabio earns a commission on every machine sold. That's not a single, obvious
structure — it could reasonably be characterized a few different ways, and the
characterization needs to come from a lawyer/CA, not from me. What I can do is lay
out the common structures and what each one implies for the system, since that part
*is* my lane.

### Option A — Franchise

Licenses an entire *business format* (branding, operating procedures, standards),
usually for an upfront fee plus an ongoing royalty on gross revenue. The franchisee
runs a fully independent business; the franchisor typically doesn't need deal-level
visibility into the franchisee's sales, only periodic royalty reporting/audits.

**System solution:** little to no shared CRM needed. The franchisee runs their own
sales operation entirely; Cabio only needs periodic revenue figures for royalty
calculation, which is a reporting/audit relationship, not a shared Sales OS one.
Simplest option from a systems standpoint, but "franchise" as a legal label doesn't
naturally match "commission per unit sold" language — that phrasing points elsewhere.

### Option B — Distributor (buys wholesale, resells independently)

The partner purchases machines from Cabio at a wholesale price and resells them at
their own price; Cabio's "commission" would really just be its wholesale margin, not
a literal per-sale commission. The partner is a fully independent business from a
sales-process standpoint.

**System solution:** Cabio only needs visibility into wholesale purchase orders and
shipments — an ERP/inventory concern, not a CRM one. The partner's retail-level sales
activity, their customers, their pipeline: none of that needs to touch this Sales OS
at all. No partner access to this system needed; track the wholesale relationship
separately.

### Option C — Sales agency (commission on Cabio's own sales)

Cabio remains the legal seller of record; the partner's staff act as commissioned
sales agents selling on Cabio's behalf, earning a fee per unit. This is the reading
that best matches "commission on each machine sold" as literal language, rather than
margin dressed up as commission.

**System solution:** Cabio *needs* deal-level visibility here — it's the legal seller,
so this data feeds its own invoicing and revenue recognition, not optional. This is
where a **Partner Portal** pattern fits — a well-established category (Partner
Relationship Management / PRM, e.g. Salesforce's Partner Community) built for exactly
this shape of relationship. The partner's sales staff get their own scoped logins
into a walled-off slice of Cabio's system — able to see only their own
territory/deals — while Cabio gets rolled-up, commission-relevant visibility into
what they sell, without the partner ever seeing Cabio's other regions or (if there
are ever multiple partners) each other's data. Lighter than full multi-tenancy —
same shared system, an added partner-scoping boundary — but with real enforcement,
not just an internal reporting dimension the way Zone is today.

### Option D — Equity joint venture (new jointly-owned entity)

A genuinely new legal entity, jointly owned, with its own governance. Day-to-day
operation could look like any of the above depending on how it's staffed and run —
equity ownership by itself says nothing about whether Cabio needs operational data
access.

**System solution:** if governance and operations are genuinely separate from Cabio
(own staff, own decisions, Cabio holds equity but doesn't run it day-to-day), this
points to a fully separate instance (own database/deployment, same codebase) rather
than shared access of any kind — equity stake doesn't imply data integration.
If revenue-sharing still needs to flow back to Cabio (dividends, commission-like
payments), that's a periodic reporting/data-export bridge between the two systems,
not a shared login model — closer to Option A/B's relationship than Option C's.

### Where this points

Given "commission on each machine sold" as the literal description, **Option C
(sales agency) reads as the closest match**, which would make the **Partner Portal**
pattern the right system fit — not the fully separate instance I suggested before
getting this detail, and not a plain new Zone either. But this genuinely needs
confirming with legal/tax counsel first, since it changes both compensation/GST
treatment and which of the four system solutions above actually applies. Worth
getting that answer before any system design work starts here.

One general point that holds regardless of which option this turns out to be: real
multi-tenancy (a proper tenant layer built into the core system, not a portal bolted
on top) is usually only worth building once this kind of arrangement is expected to
repeat — i.e., once this is partner/JV #1 of several, not a one-off. Worth asking
whether more of these are expected; that answer affects how much to invest in the
system side versus handling this one relationship more manually.

---

## 4. Surfacing buyback/refurbished inventory to reps in the field

This is a different question from the trade-in *data model* already drafted in
`docs/Product-Lifecycle-TradeIns-Accessories-Technical-Design.md` (which covers
recording a buyback against an Opportunity). The new question: once Cabio has a
refurbished machine sitting in inventory, how does a rep standing in front of a
budget-constrained customer discover it and pitch it?

A few things make this meaningfully different from the existing Product Catalog:

- **It's unit-level, not SKU-level.** The regular Product Catalog describes a model
  ("this ultrasound machine"), and you can always order more. A refurbished
  machine is one specific physical unit with its own condition, history, and price —
  closer to a serialized asset than a catalog entry. It maps naturally onto the
  `InstalledAsset` record that was traded in and is now awaiting resale (the
  Product-Lifecycle doc's `is_active`/trade-in status idea), not a new product row.
- **It needs a "reserve this unit" mechanism.** Without one, two reps could pitch the
  same physical machine to two different customers — a real risk once this is
  actually usable in the field, not a theoretical one.
- **It needs to be findable on mobile, in the field** — this app already has PWA
  support, so a filterable "available refurbished units" view (by modality, price,
  location/readiness) is a natural extension of the existing Product Catalog screen
  rather than a separate app, but it's a genuinely new screen/query, not something
  the current catalog model gives you for free.
- **It ties back to the open GST/invoicing question from Section 1 of the
  trade-in design** — selling a refurbished unit is its own transaction with its own
  tax treatment, same open question, not a new one.

I'd treat this as a natural Phase 2 of the trade-in work already drafted, once the
GST question is answered — the "record a trade-in" side and the "resell a traded-in
unit" side are two ends of the same lifecycle and probably shouldn't be designed
separately.

---

## Where this leaves things

**Resolved:**
1. Cardiology equipment sells under the existing Imaging/Critical Care SBUs, not a
   new one, for now — confirmed with Haroon (single-person pipeline, no dedicated
   team). Cutover plan for whenever it does graduate to its own SBU is in Section 1.
2. No new tracking field for Cardiology, and `category_name` isn't being repurposed
   either — it's redundant as currently designed (zero consuming logic anywhere,
   never built out per the PRD/data-model docs). Targets stay at the SBU level only
   (`BR-PL-01`), not the PRD's separate, never-implemented product-category-target
   concept (§6.5). Basheer's call, 2026-08-06 — see Section 1.
3. The JV is a genuinely separate entity needing real data isolation — confirmed.

**Still open, and the next thing to resolve:** which legal structure the JV actually
is (franchise / distributor / sales agency / equity JV — Section 3) — that answer
decides which of the four system solutions applies, and "commission per machine sold"
points toward sales agency + Partner Portal, but needs legal/tax confirmation before
committing to that.

**Not yet touched in this paper, still fully open:** the Account Manager compensation
formula (Section 2) and the buyback/refurbished-inventory field-discovery design
(Section 4) — both still need Finance/leadership input before any design work starts.
