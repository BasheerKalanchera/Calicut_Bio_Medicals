# Relationship Notes + Activity Type Filter — Implementation Plan

**Status:** Superseded 2026-09-01 — see `docs/Engagement-History-Generation-
Implementation-Plan.md`. The manual `ENGAGEMENT_NOTE`/`RELATIONSHIP_NOTE`
Activity-type approach below was rejected in favor of a design that asks
reps for zero additional input: synthesizing the same durable-context need
entirely from Activity + Next Action data reps already enter. Kept here for
the record of what was considered and why it didn't ship as-is — the
"why this is an Activity type, not a new column" reasoning below still
holds and informed the replacement design's own storage choice.
**Raised:** 2026-08-31, during the same discussion that produced
`docs/Lead-Management-Implementation-Plan.md` — surfaced by the question
"do we need a place to capture durable context about a customer, separate
from the activity log?"

## Problem

Activity is a timestamped log of discrete interactions (a call, a visit, a
demo) — deliberately immutable, one entry per event. That's not the same
thing as "what do we currently understand about this account/deal" —
durable context that gets added to over time as understanding grows
("procurement head is price-sensitive," "decision stuck on budget
approval"). Today the only place to put that is inside an Activity's
`notes` field on some interaction, which buries it — a real observation
about the relationship ends up indistinguishable from a routine call log
entry, and gets harder to find as an account's history grows.

## Why this is an Activity type, not a new column

First draft considered a plain `notes`/`description` column directly on
`account` and `opportunity` (the pattern Salesforce/Zoho/Dynamics all use
for this). Rejected: a single overwritable field has the same "silently
overwritten, no history" problem that motivated the Audit Trail work in
the first place — if one person's note gets overwritten by another's edit,
that context is just gone. The Audit Trail (once built) would technically
preserve every prior value, but it has no viewing screen in this phase
(ADR-017's own stated non-goal) — a real answer for compliance, not a
practical one for someone trying to read what a note used to say.

**The actual fix: this codebase already has almost exactly the right
mechanism.** `MANAGER_NOTE` (`docs/Business-Rules.md`, BR-ACT-02) is an
Activity type specifically built to carry a free-text entry against an
Account/Opportunity without the mandatory-next-action requirement every
other customer-facing Activity type has (BR-ACT-04). It's immutable once
written (Activity rows are never edited or deleted), timestamped,
authored, and already renders in the existing Activity Timeline UI — no
new screen needed. Extending this pattern means nothing is ever
overwritten in the first place, so there's no history to protect.

## Decisions made

1. **New Activity type: working name `RELATIONSHIP_NOTE`, needs
   confirmation — naming collision risk.** `RELATIONSHIP_SUPPORT`
   (BR-ACT-10) already exists and means something different (a cross-SBU
   contributor logging support against a specific Opportunity they don't
   normally have access to). `RELATIONSHIP_NOTE` next to
   `RELATIONSHIP_SUPPORT` invites exactly the kind of confusion this
   codebase has already been burned by elsewhere (stale checkmarks, drift
   between similarly-named things). **Alternatives to consider instead:**
   `CONTEXT_NOTE`, `ACCOUNT_NOTE` (though it needs to also apply to
   Opportunity, so may be too narrow a name), `STANDING_NOTE`. Pick one
   before implementation — not blocking the rest of this plan.

2. **Joins the existing `NOT_CUSTOMER_FACING_TYPES` exemption set**
   (`backend/app/domains/activity/schemas.py:35-37`), alongside
   `MANAGER_NOTE` and `RELATIONSHIP_SUPPORT` — exempt from BR-ACT-04's
   mandatory next-action and BR-ACT-05's Reminder-closing validity, same
   reasoning as its neighbors: not a customer-facing commitment, just
   standing context. This is a one-line addition to an already-generalized
   mechanism (three types already share it) — not new infrastructure.

3. **Not reusing the existing plain `NOTE` type.** Checked: `NOTE` already
   exists in the `ActivityType` enum but is *not* in
   `NOT_CUSTOMER_FACING_TYPES` — logging one today still requires a
   mandatory next action, same as a Call or Visit. Repurposing it to be
   exempt would silently change behavior for whatever `NOTE` is used for
   today; a new, distinct type avoids that and gives this concept its own
   clear identity.

4. **Bundled with an Activity-type filter on Customer 360's Activity tab
   — not a follow-up, shipped together.** Checked: no filtering exists
   there today (`ActivityRepository.list_by_account` takes only
   `offset`/`limit`). Without a filter, a new note type becomes exactly
   as hard to find as the problem it's meant to solve, on any hospital
   with real history. Built as a general-purpose `activity_type` filter
   (a dropdown: All / Calls / Demos / Relationship Notes / etc.), not a
   single-purpose "notes only" toggle — the backend change is identical
   either way (one query parameter, one `WHERE` clause), so there's no
   cost saved by narrowing it, and the general version is useful beyond
   this one type (e.g. "show me just the demos we've logged here").

## What this touches

**Backend:**
- `backend/app/domains/activity/schemas.py` — add the new type to
  `ActivityType` (line 9-14) and to `NOT_CUSTOMER_FACING_TYPES` (line
  35-37).
- `backend/app/domains/activity/repository.py` — `list_by_account`
  (currently `offset`/`limit` only, line 51-57) gains an optional
  `activity_type: str | None = None` parameter, adding a `WHERE
  Activity.activity_type == activity_type` clause when provided.
- `backend/app/domains/activity/service.py` and `router.py` — thread the
  new optional query parameter through, same pattern as any other list
  filter in this codebase (e.g. Pipeline's `zone_id` filter).
- `docs/Business-Rules.md` — new BR entry (or an amendment to BR-ACT-04's
  exemption list, same style as BR-ACT-09/BR-ACT-10's own amendments to
  it) documenting the new type and its exemption.

**Frontend:**
- `sales-os-app/src/components/LogActivityModal.tsx` — add the new type
  to whatever activity-type picker already lists `MANAGER_NOTE` etc.
- `sales-os-app/src/screens/Customer360Screen.tsx` — add an
  `activity_type` filter control above the Activity tab's timeline,
  wired to the new repository parameter via the existing `listOpportunities`-
  style service-call pattern already used for other filtered lists in
  this file.

No migration required — confirmed against `Physical-Schema.sql`:
`activity_type` is a plain `character varying(50)` with no `CHECK`
constraint enumerating its value set (the one `CHECK` on the table governs
whether `account_id` is required, unrelated to which type values are
valid). The `ActivityType` `Literal` is enforced only at the Pydantic
layer, so adding a new value is a pure application-code change.

## Deferred, not part of this plan

**Stakeholder-level notes.** Raised in the same discussion as a candidate
third location (alongside Account and Opportunity), but Activity has no
`stakeholder_id` column today — extending this same mechanism to
Stakeholder would mean adding that column and touching
`activity_tier_visibility`'s RLS policy, real schema work. Given
stakeholder-level context (someone's communication style, role
sensitivity) changes far less often than account/deal context, a plain
overwritable field on `stakeholder` is a reasonable lower-cost compromise
if this is ever picked up — but it's not part of this plan; revisit only
if a real need surfaces.

## Sequencing / scope note

Small, self-contained change — one new enum value, one exemption-set
addition, one new query parameter, one new frontend filter control. No
overlap with BR-ACC-03, Auth Session Resilience, Audit Trail, or Lead
Management. Doesn't depend on Lead Management shipping first or vice
versa — can be sequenced independently.
