# Customer Tiering & Size Classification — Implementation Plan

**Status:** DRAFT, 2026-09-24; updated 2026-09-25 after the demo (see
"Decided at the 2026-09-24 demo"). Not approved to build. Four structural
questions (see "Open questions") are still with Latheef Bhai and Haroon.
The build shape depends on their answers.
**Scorecard rows:** Feature 5.1 "Tier 1 / Tier 2 dropdown" (1.3 Customer
Tiering, Not started) and Feature 5.1 "Account types … A/B/C/D class"
(1.1 Account Structure & Hierarchy, Partial; A/B/C/D parked for Phase 2 by
Haroon 2026-09-14). See `docs/Signed-Requirements-to-PRD-Traceability.md`,
Module 1 table.
**Origin:** two voice messages from Latheef Bhai to Basheer, 2026-09-24.
They answer open question (2) in `docs/Backlog.md` ("Two open questions for
Haroon/Latheef Bhai").

## Decided at the 2026-09-24 demo (Haroon, Latheef Bhai; confirmed by Basheer 2026-09-25)

- **"Tier" is renamed "Business Potential"**, with three values: **High,
  Medium, Low** (plus Not Classified until someone rates the customer). The
  name says what the field is for: how much business the customer can
  bring us. Everywhere below that says "Tier 1/2/3", read "Business
  Potential High/Medium/Low".
- **A Business Potential Notes field** records why the customer was given
  that rating. It replaces the "why this tier" reason in the draft.
- **Payment reliability is not part of this rating.** The existing payer
  behaviour field (Good / Average / Problematic / Unknown) already records
  it, so Olympus-style "payment trouble" cases stay on that field.
- **New use:** Business Potential will guide how each salesperson divides
  their quarterly target among their hospitals (hospital-wise target
  planning, `docs/Backlog.md`). That design is still open. This plan covers
  only the rating itself.

Still open: questions 1–4 below (size vs A/B/C/D, one rating per customer or
per SBU, hospital groups, who can see and set it). Question 2 matters more
now: a hospital's potential for Imaging and for Critical Care can differ,
and targets are set per SBU. Also to confirm: whether the draft's separate
"what to do next" field is still wanted alongside the notes.

## The idea, in plain terms

Every customer gets two separate labels:

- **Size** is how big the hospital is: large, medium, small or clinic. It's
  a plain fact about the hospital.
- **Tier** is how valuable the customer is *to us*: Tier 1, Tier 2, Tier 3,
  or Not Classified. It's a management judgement, not a fact, and it
  doesn't follow from size.

Latheef Bhai's examples of why size and tier differ:

- *Medium hospital, Tier 1:* an expanding hospital chain that is open to
  new vendors and has a strong relationship with our sales team.
- *Large hospital, not Tier 1 (no way in):* Manipal Hospital. It is tied up
  with a competitor and only buys from direct companies, not dealers.
- *Large hospital, not Tier 1 (payment trouble):* Olympus Hospital,
  Bangalore. We won't supply again without 100% upfront payment.
- *Tiers change:* KMCT Hospital (a medical college) paid badly at first and
  then improved. Tiers are reviewed about once a year and can move up or
  down.

**Why it matters (his second message):** it keeps knowledge from being lost
when staff change.

- When Basith left Mangalore at short notice, the handover was verbal
  (Basith → Fazal → Fahad) and continuity was lost. The AJ Hospital Medical
  College deal only closed after Fahad arrived.
- When Ravi opened a new area near Bangalore, it took months, and a visit
  from Haroon, before anyone saw how much potential it had.

If the system records *who the Tier 1 customers in a zone are, why they are
Tier 1, and what to do with them*, a new joiner can read it on day one. So a
tier needs a written **reason** and a **next step** stored alongside it, not
just the label.

**Who does the work:** Latheef Bhai classifies customers himself; there are
only about 100–300 of them. He'll review new accounts each week with the
salesperson who entered them, and re-review every tier once a year. Accounts
without enough information stay **Not Classified** until there is.

## Where AI fits, and where it doesn't

**AI does not decide the tier.** The things that make a customer Tier 1
are mostly in people's heads ("open to new vendors", "strong
relationship", "only buys direct"). The system can't see those. Latheef Bhai
stays the decision-maker.

AI can assist him:

1. **Suggest a tier with reasons.** It reads what the system already holds
   (deals won and lost, open pipeline, payment behaviour, how often we
   visit, visit notes that mention competitors) and proposes, for example,
   "Tier 1: 3 deals won in 18 months, good payer, active expansion
   project." Latheef Bhai accepts or changes it.
2. **Write a handover brief.** When someone joins or leaves a zone, it
   summarises that zone's Tier 1 customers: why each one matters, what's
   in progress and who the contacts are. This directly fixes the Basith →
   Fahad problem.
3. **Nudge the yearly review.** It flags customers whose recent history no
   longer matches their tier, such as a Tier 2 that has started winning
   deals or a Tier 1 whose payments have turned bad.
4. **Answer questions later.** For example, "Which zones have the most Tier
   1 hospitals?" This is the regional heat-map he describes.

**Caveat:** AI suggestions are only as good as the history behind them.
With a few hundred customers and a few months of data, they will be weak at
first. Latheef Bhai's scored-questions idea (5–6 questions per customer,
where the total score gives the tier) needs no AI at all, and is the strongest
early step.

**Environment and system boundary:** the AI features would send customer
data out of the Cabio Sales OS database, in whichever environment is
running (Dev for testing, UAT and later Prod for real use), to an outside AI
service (Anthropic's Claude API). Leadership needs to approve that before
Option C is built. The cost per suggestion is small (a few rupees).

## Options

| Option | What it includes | Size of work | When |
|---|---|---|---|
| **A. Light** | Size and Tier on each customer, plus "why this tier", "what to do", and who set it and when. Only management can set Tier. Customer lists can be filtered by tier and size. A "Not Classified" list serves as Latheef Bhai's weekly review queue. | Small: one database change and a few screen changes | **Recommended now (Phase 1)** |
| **B. Scored** | A, plus Latheef Bhai's 5–6 scored questions per customer. The score suggests a tier and he confirms it. | Medium | As soon as he drafts the questions |
| **C. AI-assisted** | B, plus AI tier suggestions, zone handover briefs, yearly re-tier nudges and the zone heat-map. | Larger | Phase 2, after data has built up and the data-sharing approval is given |

## Open questions (with Latheef Bhai and Haroon, 2026-09-24)

These affect each other, so they should be answered together:

1. **Size vs A/B/C/D.** Haroon parked the A/B/C/D class for Phase 2 on
   2026-09-14. Should Latheef Bhai's Large / Medium / Small / Clinic
   *replace* A/B/C/D, and be un-parked for Phase 1? If they're different
   things, what does A/B/C/D mean?
2. **One tier per customer, or one per business line?** A hospital could be
   Tier 1 for Imaging and Tier 3 for Critical Care.
3. **Hospital groups.** For a chain with several branches, is the tier set
   once for the group or separately for each branch?
4. **Who can see it?** Can salespeople see the tier and the written reason?
   A note like "Problematic payer, 100% upfront only" is sensitive. Who
   besides Latheef Bhai can *set* a tier (GM, Admin, SBU Manager, Area
   Manager)?

Also pending, but not blocking Option A: Latheef Bhai drafts the 5–6
scoring questions and their weights (needed for Option B).

## What changes (Option A, provisional until the questions are answered)

- **Customer record:** new Size and Tier fields, plus the tier reason,
  suggested next step, who set it and when. Existing customers start as
  Not Classified with no size.
- **Customer screen:** shows Size and Tier with the reason and next step.
  Only permitted roles see an edit control (question 4).
- **Account Directory:** filters for Tier and Size. A "Not Classified"
  view serves as the weekly review queue.
- **Tier history:** every tier change is recorded, since the yearly review
  is the core of the process. The existing audit trail may already cover
  this; to be confirmed at build time.
- **No changes** to deals, targets, forecasts or reports in Option A.
  Tier-based reporting and the heat-map are Option C.

## Technical addendum

- **Today:** `public.account` (`docs/Physical-Schema.sql`) has
  `customer_type` (MULTISPECIALITY_HOSPITAL … DEALER, OTHER),
  `payer_behavior` (GOOD / AVERAGE / PROBLEMATIC / UNKNOWN) and
  `parent_account_id` (corporate grouping). It has no size or tier
  columns. The Olympus "payment trouble" case is already capturable via
  `payer_behavior`.
- **Naming, per the 2026-09-24 demo decision:** the `tier*` columns below
  become `business_potential` (HIGH / MEDIUM / LOW / NOT_CLASSIFIED) and
  `business_potential_notes` (text, replaces `tier_reason`), with
  `business_potential_set_by` / `_set_at`. `tier_action` pending
  confirmation. Same for the per-SBU table variant. The column sketches
  below keep the draft's names until the plan is rewritten for build.
- **Option A, if Q2 = one tier per account:** add nullable columns to
  `account`:
  `size_class` (LARGE / MEDIUM / SMALL / CLINIC),
  `tier` (TIER_1 / TIER_2 / TIER_3 / NOT_CLASSIFIED, NOT NULL, default
  NOT_CLASSIFIED), `tier_reason` text, `tier_action` text,
  `tier_set_by` uuid FK `app_user`, `tier_set_at` timestamptz. Backfill
  existing rows to NOT_CLASSIFIED. Enforce with CHECK constraints, following
  the existing `ck_account_customer_type` pattern.
- **Option A, if Q2 = one tier per SBU:** move the tier fields to a new
  `account_sbu_tier` table (`account_id`, `sbu_id`, tier fields,
  UNIQUE(`account_id`, `sbu_id`)), protected by an RLS policy scoped by SBU.
  `size_class` stays on `account`, since size doesn't vary by SBU.
- **Q3 (groups):** if the tier is set at group level, branches read it from
  `parent_account_id`. This needs a rule for when a branch and its group
  disagree. The default recommendation is per-branch, which needs no extra
  logic.
- **Permissions (Q4):** a service-layer role check on tier writes (a
  separate endpoint, or a guarded field on the account PATCH). Field-level
  hiding of `tier_reason` from Sales Staff, if required, happens in the
  response schema, not RLS.
- **Audit:** confirm whether `account` is already covered by the audit
  trail (`docs/Audit-Trail-Implementation-Plan.md`). If it isn't, tier
  changes need an explicit history row.
- **Frontend:** MUI only (ADR-031). Account detail header chip plus an edit
  dialog, and Account Directory filters.
- **Option C:** backend calls the Claude API. Input is RLS-scoped
  Opportunity, Activity and `payer_behavior` data for one account or zone.
  Output is a suggestion stored separately from the confirmed `tier`, never
  auto-applied. The model choice and cost estimate will be written into
  this plan before that phase starts.
- **Process:** once approved, this goes through a migration (applied to Dev,
  `alembic current` recorded, Physical-Schema regenerated), then
  `/code-review`, a manual E2E plan, and the Traceability/scorecard update
  for both 5.1 rows.
