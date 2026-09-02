# Lead Management for Marketing-Sourced Leads — Implementation Plan

**Status:** Planned, not built.
**Raised:** 2026-08-31, triggered by a real incident — a duplicate
Opportunity ("CTG Machine @ Mount Zion Medical College," created by Abdul
Latheef P, assigned to Vivek) turned out to duplicate a deal Vivek had
already entered himself, already at Demo stage. Full incident narrative:
`docs/Progress-Archive-2026-08.md`'s 2026-08-31 (later) entry.

## Problem

Cabio needs a narrow "Marketing User" role — someone whose entire job is
entering leads from marketing events (conferences) and IndiaMART, and
assigning each to the right rep. That role, by design, should have **no
visibility into the real pipeline** (no deal values, no other reps'
Opportunities) — but that narrow visibility is exactly what let the Mount
Zion duplicate happen: the person entering it had no way to know Vivek
already had an open deal there.

**The fix is not a duplicate-detection algorithm — it's structural.** A
same-account-same-product match check would not even have caught this
specific incident (no product had been identified yet — it was a vague
"interest recorded" entry from a conference survey, not a scoped deal).
The real fix: nothing this role creates becomes a real Opportunity until a
rep has deliberately reviewed it. If that review would have surfaced "wait,
I already have this," the rep simply discards the lead — no live duplicate
ever enters the pipeline, no assignment notification fires, nothing to
clean up.

## Industry pattern, and where Cabio deliberately deviates

Salesforce, Zoho, and Dynamics 365 all model this the same way: a Lead is
a separate, loosely-structured object from Opportunity/Deal, converted
into a real one only after a human reviews it. Two things carry over
directly:

- **Conversion is the one deliberate reconciliation point** — this is
  exactly the structural insight above, not something these platforms
  bolted on separately.
- **Discarding is a named, reason-coded outcome, not a deletion** —
  Dynamics' disqualify reasons include an explicit "Duplicate" option, not
  just a generic "no."

Where Cabio deviates: these platforms store the Lead's company as free
text, reconciling it against real Accounts only at conversion, because
their Leads could name literally any business on Earth. Cabio's leads are
overwhelmingly going to be one of the ~70 hospitals already in the
directory, so the Marketing User picks a real `account_id` up front
(reusing BR-ACC-03's duplicate-checked creation flow if the hospital is
genuinely new) rather than reconciling free text later. Also deviating:
none of the three platforms' generic, configurable duplicate-matching-rule
engines are worth building here — disproportionate for one narrow role: the
mandatory human review before conversion already provides the value that
engine exists to give.

## Decisions made

1. **New role: "Marketing User."** Two permissions only — create a `lead`
   row, assign it to a rep. No read access to `opportunity`, `product`
   values, or anything pipeline-related. A new `role` table row (data
   insert, same as any other reference value — no admin UI exists for
   roles and none is needed for a change this infrequent).

2. **New table: `lead`, not reusing `opportunity`.** A conference-sourced
   or IndiaMART-sourced entry may not even be a real prospect yet ("may
   not actually be a lead even at the stage when the marketing user enters
   it," per the discussion that shaped this) — putting that directly into
   `opportunity` would pollute forecast/dashboard numbers before anyone's
   judged whether it's real, and force an awkward "this was never real"
   status onto a table that only has Won/Lost.

3. **Multi-source, without new reference-table rows per event.** `lead`
   carries `lead_source_id` (reusing the existing table — IndiaMART is
   already there; add one new value, "Conference") plus a free-text
   `event_name` field for the specific event ("Cochin Trade Fair 2026").
   This means adding a new conference to track requires **no admin
   feature at all** — the Marketing User just types the name. Checked: no
   reference-data table in this codebase has a management UI except
   Zones (`TerritoryAdminScreen.tsx`), which earned one because territory
   changes are frequent and structurally significant; conferences
   happening a handful of times a year don't carry that weight. Tradeoff
   accepted: free text risks inconsistent naming for later per-event
   reporting — fine to fix later (a lightweight `marketing_event` lookup
   table) only if that actually becomes a real problem, not before.

4. **Review workflow: Convert or Discard, by the assigned rep.**
   - **Convert** — opens a normal Opportunity-create form, pre-filled
     with whatever's known (`account_id`, `lead_source_id`, the note),
     rep fills in the rest as usual. Only at this point does a real
     Opportunity exist. Sets `lead.status = CONVERTED`,
     `lead.converted_opportunity_id = <new opportunity id>`.
   - **Discard** — one click, pick a reason (`DUPLICATE`, `NOT_INTERESTED`,
     `UNABLE_TO_CONTACT`, `JUNK`), optional note. Sets
     `lead.status = DISCARDED`. Given the volume of junk expected, this
     needs to be the *fast* path in the UI, not an afterthought next to a
     heavier Convert flow.
   - The `lead` row is never deleted either way — it's the permanent
     record of "this came in, and here's what became of it."

5. **IndiaMART's 4-hour SLA moves outside Cabio entirely — see dedicated
   section below.**

## Open questions — resolved 2026-09-02

- **Does the Marketing User also need Account-creation rights? No.**
  Decided 2026-09-02 (Basheer). Marketing User cannot create Accounts —
  if a conference attendee's hospital isn't in the directory yet, the
  Marketing User either picks the closest existing account or flags it in
  `raw_interest_note` for the assigned rep to sort out at conversion.
  Sidesteps BR-ACC-03's still-undecided Option A/B call
  (`docs/Duplicate-Hospital-Decision-Brief-2026-08-29.md`, pending
  Haroon) entirely for this role — revisit only if real conference volume
  shows this is actually a frequent blocker.
- **Assignment-list scope — filter by `sbu_id`.** Decided 2026-09-02
  (Basheer), matching the plan's own recommendation: the rep-assignment
  picker uses the same scoped-user-list pattern already established
  elsewhere in the app (`/users?scope=scoped`, `masterData.ts`), filtered
  to the lead's `sbu_id`. A lead tagged Imaging only shows Imaging reps.

## Schema

**Renamed to `marketing_lead` 2026-09-02, during Group A manual E2E** —
the bare word "Lead" collided with the existing Opportunity Stage "Lead"
(a real, owned pipeline record; this table's rows are unqualified,
unreviewed inbound inquiries — a different concept). Migration
`0032_rename_lead_to_marketing_lead.py` (0031 below is already applied to
Dev and was never edited). Full reasoning: `docs/Progress-Archive-
2026-09.md`'s 2026-09-02 entry. The SQL below is left as originally
written (what `0031` actually created, historically accurate) — read
`lead` as `marketing_lead` throughout this doc from here on; the RLS
section below has been updated to the current, post-rename names.

```sql
CREATE TABLE lead (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id            uuid NOT NULL REFERENCES account(id),
    sbu_id                uuid NOT NULL REFERENCES sbu(id),
    lead_source_id        uuid NOT NULL REFERENCES lead_source(id),
    event_name            text,
    raw_interest_note     text,
    product_id            uuid REFERENCES product(id),  -- nullable; usually unknown at entry
    assigned_to_user_id   uuid NOT NULL REFERENCES user_profile(id),
    status                text NOT NULL DEFAULT 'NEW'
                          CHECK (status IN ('NEW', 'CONVERTED', 'DISCARDED')),
    discard_reason        text CHECK (discard_reason IN
                          ('DUPLICATE', 'NOT_INTERESTED', 'UNABLE_TO_CONTACT', 'JUNK')),
    discard_note          text,
    converted_opportunity_id uuid REFERENCES opportunity(id),
    created_by            uuid REFERENCES user_profile(id),
    created_at            timestamptz NOT NULL DEFAULT now(),
    reviewed_by           uuid REFERENCES user_profile(id),
    reviewed_at           timestamptz
);

CREATE INDEX idx_lead_assigned_to_user_id ON lead (assigned_to_user_id);
CREATE INDEX idx_lead_assigned_pending ON lead (assigned_to_user_id) WHERE status = 'NEW';
```

The partial "pending" index mirrors the existing
`idx_notification_recipient_unread` pattern (`0024_add_notification_table.py`)
— the review queue's "how many are waiting on me" check hits this
constantly, same reasoning as that table's own unread-count index.

## RLS

**Corrected 2026-09-02, during build** — the original two-policy sketch had
a real gap. `lead_visibility` below was written with no `FOR` clause
(applies to ALL commands). Under Postgres RLS, multiple permissive
policies for the same command are OR'd together; since `lead_visibility`
had no explicit `WITH CHECK`, Postgres reuses its `USING` clause as an
implicit `WITH CHECK` for INSERT too — and that clause is satisfied by
`created_by = cabio_app_uid()`, which is true for literally every INSERT
the app performs (the service always sets `created_by` to the acting
user). OR'd with `lead_insert`'s role check, this would have made the role
gate meaningless — **any** authenticated role could insert a lead, not
just Marketing User/Admin/GM. Fixed by scoping visibility to `FOR SELECT`
explicitly and adding a dedicated `FOR UPDATE` policy for the Convert/
Discard review action. No DELETE policy — the app never deletes a lead row
(Discard is a status, not a delete), so default-deny is correct there.

**Current (post-rename, 0032) policy names below** — `marketing_lead`,
`marketing_lead_select`/`_insert`/`_update`:

```sql
ALTER TABLE marketing_lead ENABLE ROW LEVEL SECURITY;

CREATE POLICY marketing_lead_select ON marketing_lead FOR SELECT USING (
    cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
    OR (cabio_app_role_name() = ANY (ARRAY['SBU Manager', 'Area Manager']) AND sbu_id = cabio_app_sbu_id())
    OR assigned_to_user_id = cabio_app_uid()
    OR created_by = cabio_app_uid()
);

CREATE POLICY marketing_lead_insert ON marketing_lead FOR INSERT WITH CHECK (
    cabio_app_role_name() = ANY (ARRAY['Marketing User', 'Admin', 'General Manager'])
);

CREATE POLICY marketing_lead_update ON marketing_lead FOR UPDATE USING (
    cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
    OR assigned_to_user_id = cabio_app_uid()
) WITH CHECK (
    cabio_app_role_name() = ANY (ARRAY['Admin', 'General Manager'])
    OR assigned_to_user_id = cabio_app_uid()
);
```

`created_by = cabio_app_uid()` in the select policy is what lets the
Marketing User see their own just-created rows for reference, without
opening up visibility into anyone else's leads. Manager-chain visibility
(SBU Manager/Area Manager by `sbu_id`) matches `opportunity_tier_visibility`'s
existing shape — useful for a manager to see how many leads are sitting
unreviewed, by rep. The update policy restricts Convert/Discard to the
assigned rep (or Admin/GM) — a manager who can merely *see* a lead via the
select policy's manager-chain clause is not automatically allowed to act
on it, matching the plan's "reviewed by the assigned rep" design intent.

## The IndiaMART SLA change

**Current behavior (Dev only, confirmed never promoted to UAT/Prod):**
`notification/service.py`'s `notify_opportunity_assigned` flags a
notification `is_urgent=True` when the Opportunity's `lead_source_name` is
IndiaMART:

```python
URGENT_LEAD_SOURCE_NAMES = {"indiamart"}
...
is_urgent = bool(lead_source_name) and lead_source_name.strip().lower() in URGENT_LEAD_SOURCE_NAMES
```

This exists because IndiaMART enforces a 4-hour response window for
buylead credit, and it fires when a rep is assigned an IndiaMART-sourced
**Opportunity**.

**Why it needs to change:** under the new flow, an IndiaMART inquiry
becomes a `lead` first, not a real Opportunity — the person entering it
(the Marketing User) is now the one responsible for responding within
IndiaMART's own 4-hour window, directly on IndiaMART's platform, *before*
anything reaches Cabio. By the time a `lead` row exists in Cabio, that
deadline has already been met. If this urgent-flagging logic were left as
is, it simply wouldn't fire anymore for the case it exists to protect
(IndiaMART leads no longer arrive as Opportunity assignments at all) — but
leaving dead, misleading logic in place is worse than removing it.

**The change:** remove `URGENT_LEAD_SOURCE_NAMES` and its check; hardcode
`is_urgent=False` for `notify_opportunity_assigned`, matching how
`notify_gate_override_named` already hardcodes `is_urgent=False` a few
lines below it (with a comment explaining why nothing should wait on it —
the same reasoning now applies here). The `is_urgent`/urgent-dialog
mechanism itself stays — still valid infrastructure for anything genuinely
time-critical in the future — only this one trigger for it goes away.

**Touches:**
- `backend/app/domains/notification/service.py` — remove the constant and
  the lookup, hardcode `False`.
- Possibly simplify `notify_opportunity_assigned`'s signature (the
  `lead_source_name` parameter may no longer be needed at all) — confirm
  during implementation, don't leave an unused parameter.
- `backend/tests/domains/notification/test_notification_service.py` — has
  tests asserting `is_urgent` is set for IndiaMART-sourced assignments;
  these need rewriting to assert it's always `False` now.
- `backend/tests/domains/opportunity/test_opportunity_service.py` — has
  call-site assertions on `notify_opportunity_assigned`'s arguments; check
  these still hold if the signature changes.

No migration needed for this part — `is_urgent` is already a plain
boolean column on `notification`, nothing about the schema changes.

## Sequencing / scope note

Touches: new `lead` domain (schema/router/service/repository — this one
**does** get a full domain, unlike `audit_log`, since it's a real business
entity with a workflow, not an infrastructure artifact), a new `role` row,
a small change to `notification/service.py` and its tests, and new
frontend screens (lead-entry form for the Marketing User, a review queue
for reps). No overlap with the concurrent BR-ACC-03 session, Auth Session
Resilience, or Audit Trail — all touch entirely different files.
