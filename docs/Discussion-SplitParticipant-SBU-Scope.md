# Discussion Paper: Cross-SBU Contribution — Split Scope, Referral Credit, and Relationship-Support Activity

**Prepared for:** Discussion with Cabio leadership and the Cabio Star Sales team.
**Prepared:** 2026-08-05. **Updated:** 2026-08-05 (v2 — added referral credit; v3 —
Haroon confirmed split scope and referral credit, raised the relationship/attendance
case; v4 — dropped the any-SBU-any-zone alternative; v5 — replaced the per-meeting
attendance design with self-reported Activity logging; v6 — decided. All three parts
resolved with Basheer, including the remaining technical gaps on relationship-support
activity, confirmed directly against the RLS policy source).
**Status:** DECIDED — 2026-08-05. Ready to build.

---

## Final decision, in plain terms

**The problem:** the team wanted to split a deal, or otherwise recognize help, with
anyone in the company — but the Split picker only offered people in their own SBU
*and* zone. "Give credit for helping" turned out to mean three different things, not
one, and each needed its own answer.

**1. Splitting a deal — same SBU, any zone.** Adding someone as a split participant
now shows anyone in your own SBU, any zone — not just your own zone like today.
Splitting with someone from a **different SBU** is still not allowed — that's a
deliberate rule (a joint Imaging + Critical Care deal is modeled as two linked deals,
one per SBU, not one deal split across SBUs), unchanged by this fix.

**2. Someone brought you the lead — Referral credit.** If a colleague — any SBU,
anywhere in the company — is the reason a deal exists, they can be tagged as
**"Referred By"** on the Opportunity. Pure credit record: no share of the deal's
value, no visibility into the deal, no effect on how it's worked. Exists so the future
incentive system can recognize it.

**3. Someone owns the relationship and keeps helping — logged support.** If a
colleague from another SBU owns the customer relationship and keeps helping —
attending meetings, supporting the deal as it progresses — they log their own activity
note against that customer, describing what they did, optionally pointing it at the
specific deal they helped with. Ongoing, dated credit for their help, without making
them a co-owner of the deal or granting them broad visibility into it.

**Net effect:** three separate, clean ways to recognize contribution — revenue split
(same-SBU only), referral (one-time, any SBU), support (ongoing, any SBU) — without
ever needing to let people split revenue across SBUs.

---

## 1. Where this came from

During the 2026-08-04 UAT orientation session, the sales team reported that the Split
Participant picker (Opportunity 360 → Splits tab) felt too narrow — they expected to be
able to split a deal with any colleague, and instead the picker only offers people in
their own SBU **and** zone. Investigating this surfaced two separate restrictions
stacked on top of each other, not one:

1. **Cross-SBU splits are blocked** — enforced server-side (`BR-FIN-06`), decided
   deliberately five days earlier as ADR-037.
2. **Same-zone is also required, on top of the SBU restriction** — this one is UI-only.
   The backend rule (`BR-FIN-06`) only checks SBU; it never checks zone. The zone filter
   exists only in the picker's query and was already flagged in the code as an interim
   choice pending exactly this kind of review.

The zone restriction is a straightforward fix. Cross-SBU turned out to need more care:
the team's underlying ask wasn't really "let me split with anyone" — it was "how does
someone outside the owning SBU get credit for helping the deal happen?" That question
has two different real answers depending on *how* they helped, not one:

- **They brought the lead in** — a one-time fact. → **Referral credit.**
- **They own the customer relationship and keep helping as the deal progresses** — an
  ongoing, evolving pattern, not a single fact. → **Relationship-support activity.**

Once both of those are handled on their own terms, there's no remaining case that
needs cross-SBU *split* — so reopening ADR-037 to allow any-SBU-any-zone splits turned
out not to be necessary. **Confirmed with Haroon, 2026-08-05:** splits stay same-SBU,
any-zone; referral and relationship-support carry the cross-SBU cases instead.

## 2. Why splits stay SBU-scoped

This isn't an arbitrary rule. ADR-037 was adopted on 2026-07-30 after a real regression
was found during Phase 2E testing: a cross-SBU split caused a broken "Assign Next Action
To" flow for the opportunity's other contributor, because cross-SBU visibility and
tier-scoped RLS policies don't compose cleanly once a deal has contributors from two
different security domains. Cross-SBU collaboration wasn't removed as a capability —
it was redirected: the system already supports **Project-linked, per-SBU
Opportunities**, so a genuinely cross-SBU deal (e.g. a joint Imaging + Critical Care
hospital setup) is modeled as linked Opportunities under one Project, each with its own
SBU-scoped splits, rather than one Opportunity split across two SBUs.

SBU is also called out as an RLS security boundary in this project's own standards, not
just a reporting label — which is why loosening split eligibility across SBUs is a
different category of change from loosening it across zones within the same SBU.

Split itself also carries more weight than "who gets credit." A split isn't a one-time
tag — it's ongoing co-ownership of the deal for as long as the Opportunity exists: it
must sum to exactly 100% across all participants (`BR-FIN-01`), it persists and gets
grandfathered through every future edit, and it grants full contributor status — RLS
visibility into the deal, eligibility as a Next Action assignee, and inclusion in every
SBU/zone revenue rollup (ADR-013's Target → Coverage → Opportunity → Revenue chain).
That's exactly the weight a referral or relationship support shouldn't carry — neither
is co-ownership, so neither should be forced through the split mechanism.

## 3. The model — three ways contribution is recognized

### 3.1 Split — same-SBU, any-zone — DECIDED, SHIPPED 2026-08-07

Drop only the zone filter. A user can be suggested as a split participant if they're in
the same SBU as the opportunity, regardless of which zone they're in. Cross-SBU stays
blocked, unchanged.

Matches the backend rule (`BR-FIN-06`) exactly — the picker stops being narrower than
what the server will actually accept. No schema or RLS change. Doesn't reopen ADR-037.
**Implementation, as actually built:** no existing scope did "same SBU, any zone"
regardless of caller role, so `organization/repository.py`'s `scope="sbu_zone"` branch
(same SBU + same zone) was renamed to `scope="sbu"` and had its zone condition dropped
— a small backend change, not zero as originally scoped here, since the exemption
turned out to need a distinct scope value rather than reusing one. `master_data.py`'s
query-param pattern and the frontend (`masterData.ts`, `OpportunityDetailScreen.tsx`'s
Splits tab) updated to match.

### 3.2 Referral credit — a one-time fact, decoupled from split — DECIDED

Today the system already records lead **source** as a category
(`Opportunity.lead_source_id` → `LeadSource`, e.g. "Referral," "Tender," "Cold Call") but
has no field recording *which person* gets credit for it.

**Shape:** a lightweight `referred_by_user_id` (naming TBD) on the Opportunity, set
once at creation and independent of the split table — no `BR-FIN-01` impact, no RLS
visibility grant, no Next-Action eligibility, no SBU rollup distortion. The future
incentive engine computes a referral bonus off this field, separately from how the
deal's revenue is split among the people who actually worked it. Picker: any active
user, any SBU/zone — reuses the existing `scope="all"` (`master_data.py`'s `/users`
endpoint), the same eligibility rule already used for Next Action assignment
(`BR-ACT-06`).

Implementation-level detail, not a policy question: single referrer (not multiple),
set at Opportunity creation and editable later by whoever can already edit the
Opportunity, with edits logged as an Activity note automatically for audit.

### 3.3 Relationship-support activity — self-reported, logged against the Account — DECIDED

Someone from another SBU who owns the customer relationship and keeps helping — e.g.
attending critical meetings alongside the rep who owns the Opportunity — doesn't fit
split (no ownership intended) or referral (not a single fact; it's ongoing).

**Shape:** the relationship-support person logs their own `Activity`
(`backend/app/domains/activity/models.py`) against the **Account** — already open,
no RLS restriction — with a structured `opportunity_id` link to the specific deal they
helped with, in their own words, when it happens. `activity_type` = `RELATIONSHIP_SUPPORT`,
a new value alongside this field's existing free-text categories, so it can be
filtered and reported on distinctly from ordinary call/meeting logs.

**Two real technical gaps, both confirmed and resolved (checked directly against
`docs/Physical-Schema.sql`, not assumed):**

1. **The write would fail today.** `activity/repository.py`'s `opportunity_exists()`
   check runs through the same RLS-scoped session as every other read — a cross-SBU
   user referencing an Opportunity outside their tier gets a 404, even though the
   Account itself is already open to them.
   **Fix:** a new Postgres function, `cabio_app_opportunity_in_account(p_opportunity_id,
   p_account_id)` — `SECURITY DEFINER`, same pattern already used by
   `cabio_app_has_split()` (`Physical-Schema.sql:89-98`) — answers only "does this
   opportunity belong to this account," bypassing tier-visibility for that one narrow
   yes/no fact, without exposing anything else about the Opportunity. The Activity
   create path accepts `opportunity_id` if *either* the normal tier-visibility check
   passes (the existing same-SBU case) *or* this new function returns true (the
   cross-SBU relationship-support case).
2. **The read-back gap was real.** `activity_tier_visibility`'s actual policy
   (`Physical-Schema.sql:1908-1909`) is `(opportunity_id IS NULL) OR (opportunity_id IN
   (SELECT id FROM opportunity))` — the subquery is itself filtered by
   `opportunity_tier_visibility`, so a cross-SBU user's own logged Activity would be
   invisible to them afterward. **Fix:** add `OR (user_id = cabio_app_uid())` to the
   policy — you can always see what you yourself logged, regardless of the referenced
   Opportunity's tier visibility. `cabio_app_uid()` already exists
   (`Physical-Schema.sql:132-140`) and is used by other policies in this exact way.

**Also needed:** a lightweight, account-scoped Opportunity lookup (id + name only, not
the full tier-scoped Opportunity list) so the relationship-support person has
something to pick from when logging against an Account whose other Opportunities they
can't otherwise see — same `SECURITY DEFINER`, narrow-fact approach as above.

**Decided:** structured `opportunity_id` link (not free-text only) — the technical
gaps above are contained and match an existing, proven pattern in this codebase, so
there's no reason to settle for the weaker free-text version. `activity_type` =
`RELATIONSHIP_SUPPORT`. Logged by the relationship-support person themselves (not the
deal owner), self-reported at the time it happens. Forward-only — no attempt to
backfill historical support that was never logged.

## 4. Comparison at a glance

| | Split | Referral credit | Relationship-support activity |
|---|---|---|---|
| What it represents | Ongoing co-ownership of the deal's value | A one-time fact: who sourced the lead | An ongoing, self-reported pattern of involvement |
| Set/recorded | At split edit, persists through the deal | Once, at creation | Per instance, by the contributor themselves |
| New schema required | No (existing table) | Yes — one new column | No new table — one new Postgres function + a small RLS policy amendment |
| Requires `BR-FIN-01` 100% math | Yes | No | No |
| Grants RLS visibility | Yes, full | No | No — narrow, per-fact checks only (own logged rows, and account-scoped lookup), never a blanket Opportunity grant |
| Feeds SBU/zone revenue rollups | Yes | No | No |
| Cross-SBU allowed | No (`BR-FIN-06`) | Yes | Yes — via `cabio_app_opportunity_in_account()` |
| Status | Decided | Decided | Decided |

## 5. Reference

- `docs/ADR.md` — ADR-037 (Split Participant SBU Restriction), ADR-003 (original
  Multi-SBU Contributor Splits model, superseded by ADR-037's SBU scope), ADR-013
  (Target → Coverage → Opportunity → Revenue hierarchy, whose rollups splits feed into).
- `docs/Business-Rules.md` — BR-FIN-01 (100% split rule), BR-FIN-06 (Split Participant
  Eligibility).
- `docs/Progress-Archive-2026-07.md` — the cross-SBU Next Action regression that led to
  ADR-037.
- `backend/app/domains/reference/models.py` / `opportunity/models.py` — existing
  `LeadSource` category table and `Opportunity.lead_source_id`, referenced in Section
  3.2.
- `backend/app/domains/activity/models.py`, `activity/repository.py` — `Activity`
  model and its `opportunity_exists()` existence check, amended in Section 3.3.
- `docs/Physical-Schema.sql` — `activity_tier_visibility` policy (line 1908) amended in
  Section 3.3; `cabio_app_has_split()` (line 89) and `cabio_app_uid()` (line 132), the
  existing functions Section 3.3's fix is modeled on and reuses.
- `docs/Backlog.md` — the related "Split participant picker" entry.

---

*Decided 2026-08-05. Next step: record BR-FIN-06 and a new referral-credit Business
Rule, plus a Business-Rules entry for relationship-support activity (referencing the
new `cabio_app_opportunity_in_account()` function and the `activity_tier_visibility`
amendment), then implement.*
