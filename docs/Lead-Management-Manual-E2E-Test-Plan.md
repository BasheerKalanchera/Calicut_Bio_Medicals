# Lead Management for Marketing-Sourced Leads — Manual E2E Test Plan

**Status as of 2026-09-02:** Backend (`marketing_lead` domain, migrations
`0031`+`0032`, notification IndiaMART-urgency removal) and frontend
(Marketing Lead Entry screen, Marketing Lead Review Queue, Convert/Discard
flows, restricted Marketing User nav) are built, unit-tested, wired into
`main.py`, and applied to Dev. **Renamed from `lead`/`leads` to
`marketing_lead`/`marketing-leads` mid-E2E (2026-09-02, Group A)** — the
bare word "Lead" collided with the existing Opportunity Stage "Lead";
see `docs/Lead-Management-Implementation-Plan.md`'s RLS section and
migration `0032_rename_lead_to_marketing_lead.py` for the full reasoning.
**Manual E2E in progress** — Group A passed (see `docs/Progress-Archive-
2026-09.md`'s 2026-09-02 entries), Group B onward next.

## Setup

This is the live shared dev DB, not disposable — any marketing lead/
Opportunity created during testing needs cleanup afterward via Supabase
SQL Editor.

1. Confirm migrations `0031_add_lead.py` and
   `0032_rename_lead_to_marketing_lead.py` have both been applied (creates
   the `marketing_lead` table, seeds the "Marketing User" role, then
   renames the table and its constraints/indexes/policies).
2. Confirm `backend/app/main.py` registers the `marketing_leads` router and
   `docs/Physical-Schema.sql` has been regenerated. (Both done as of this
   writing.)
3. **Assign at least one test user to the Marketing User role.** No
   dedicated admin UI exists for this (by design — see the plan doc); the
   "Marketing User" role should appear as a normal option in User
   Directory's existing role picker once seeded by the migration. Pick a
   throwaway/test account, not a real rep, to avoid disrupting anyone's
   actual pipeline access.
4. Note down: the Marketing User test account, one SBU with at least two
   active reps in it (for the assignment picker and the "wrong SBU sees
   nothing" check in Group E), and one of those reps' login.

**Test users available** (role → zone), from `docs/BR-ACC-03-Manual-E2E-
Test-Plan.md` — none of these currently hold the Marketing User role; pick
one to temporarily reassign per Setup step 3, or create a throwaway user:
- Admin/GM (unrestricted): Basheer K, Abdul Latheef P, Haroon Sidheeq
- Reps: Nishad K V (North Kerala), Arun Adarsh (South Kerala), Fazal
  (Kasaragod), Shruthi (Bangalore), Fahad (Mangalore), Vivek (Alappuzha)

## Group A — Marketing User: nav is fully restricted

1. Log in as the Marketing User test account.
2. Expect: sidebar shows only a single "MARKETING" section with one item,
   "Marketing Leads." No Account Management, Pipeline, Marketing Lead
   Queue, Next Actions, Daily Activity, Product Catalog, User Directory,
   Territory Map, or Audit Log entries.
3. Expect: the top header's global **+ Lead** and **+ Log** buttons are
   both absent (they'd otherwise let this role create a real Opportunity
   or Activity directly, bypassing the review workflow this feature
   exists to enforce).
4. Try navigating directly to another view by other means available in the
   UI (there shouldn't be any) — confirm there's no way to reach the
   Pipeline/Customer/Catalog/Admin screens from this role's nav.

## Group B — Marketing User: create a lead

1. On the Marketing Leads screen, click **+ New Marketing Lead**.
2. Account picker: confirm it only lists existing accounts (no create-new
   option) — this role deliberately has no Account-creation rights (BR-
   ACC-03's Option A/B decision sidestepped for this role, per the plan's
   2026-09-02 decision). Confirm the blank option reads "Not sure yet"
   and submitting with it left blank succeeds (`account_id` is nullable,
   0034_make_marketing_lead_account_nullable.py) — the row should show
   "Unknown account" in the list afterward.
3. Select an SBU. Confirm the Product and Assign To pickers were disabled
   before an SBU was chosen, and populate once one is selected.
4. Lead Source picker: confirm it shows only **CONFERENCE** and
   **INDIAMART** — not the other 10 reference values (Referral, Tender,
   Cold Call, etc.), which only apply to a rep creating an Opportunity
   directly. Select CONFERENCE. Expect: an "Event Name" field appears.
   Select INDIAMART instead. Expect: it disappears.
5. Assign To picker: confirm only active reps in the selected SBU appear
   — not Admin/GM, not other Marketing Users, not reps from a different
   SBU.
6. Fill in a note, leave Product blank (usually unknown at entry per the
   plan), submit.
7. Expect: lead created successfully, appears in the screen's own list
   below with status **NEW**.
8. Repeat once with Product selected, to confirm that path also works.

## Group C — Rep: review queue shows assigned leads

1. Log in as the rep the lead from Group B was assigned to.
2. Navigate to **Marketing Lead Queue**.
3. Expect: the lead from Group B appears, with account name (or "Unknown
   account" if left as "Not sure yet"), lead source (+ event name if
   Conference), product (if set), and the note visible.
4. Log in as a *different* rep in the same SBU who was not assigned this
   lead. Expect: it does **not** appear in their queue.

## Group D — Rep: Convert flow

1. From the Marketing Lead Queue, click **Convert** on the test lead.
2. Expect: the normal "New Opportunity" form opens, pre-filled with the
   lead's Account (if one was set) and Lead Source. Expect: a green "From
   the marketing lead" box shows the original note as read-only reference
   context.
3. **If the lead was left "Not sure yet" on Account:** confirm the Account
   field starts blank, and confirm the new **+ Add Hospital** button next
   to it opens the duplicate-checked create-hospital flow inline (same as
   Customer Directory's Add Hospital) — creating or picking an existing
   match there should populate the Account field without closing the
   Convert dialog.
4. Fill in the remaining required Opportunity fields (Name, Stage, Owner,
   Win Probability) and submit.
5. Expect: a real Opportunity is created (visible in Pipeline).
6. Return to Marketing Lead Queue. Expect: the converted lead is gone from
   the queue (no longer NEW).
7. Check the lead's own record (e.g. via direct SQL, since there's no
   review-history UI yet) — expect `status = CONVERTED`,
   `converted_opportunity_id` set to the new Opportunity's id,
   `reviewed_by`/`reviewed_at` set.

## Group E — Rep: Discard flow

1. Create a second test lead (Group B), assigned to the same rep.
2. From Marketing Lead Queue, click **Discard**.
3. Expect: a small dialog with a required Reason dropdown (Duplicate / Not
   Interested / Unable to Contact / Junk) and an optional note.
4. Submit without selecting a reason. Expect: client-side validation
   blocks it ("Reason is required").
5. Select "Duplicate," add a note, submit.
6. Expect: lead disappears from the queue. No Opportunity is created.
7. Check the record: `status = DISCARDED`, `discard_reason = DUPLICATE`,
   `discard_note` set, `reviewed_by`/`reviewed_at` set.

## Group F — Visibility and authorization (RLS + service-layer checks)

1. **Cross-SBU rep:** as a rep in a *different* SBU than a pending lead,
   confirm it's invisible everywhere (queue, direct lookup) — matches
   Group C.4, restated here for the RLS angle specifically.
2. **SBU/Area Manager:** log in as a manager whose SBU matches a pending
   lead's SBU. Expect: the lead is visible (manager-chain visibility, "how
   many leads are sitting unreviewed"), but **no Convert/Discard buttons**
   — or, if the UI doesn't hide them for a manager role, attempting the
   action should be rejected server-side (403). This is the case the plan
   explicitly designed for: visibility via the select policy's manager-
   chain clause is not the same as being allowed to act (the update
   policy is scoped to the assigned rep or Admin/GM only).
3. **Admin/GM:** confirm both full visibility across all SBUs and the
   ability to Convert/Discard any lead, including one assigned to someone
   else.
4. **Already-reviewed lead:** attempt to Discard a lead that was already
   Converted (or vice versa) via direct API call (e.g. browser devtools or
   a REST client) — expect a 422 (`BusinessRuleViolation`, "already been
   reviewed"), not a silent overwrite.

## Group G — Regression: existing flows unaffected

1. As a normal rep (not Marketing User), confirm the top header's **+
   Lead** and **+ Log** buttons still work exactly as before — this
   feature must not touch that direct-creation path for non-Marketing-User
   roles.
2. Create an Opportunity with Lead Source = IndiaMART directly (the old
   way, not via a `marketing_lead` row), assigned to a different owner than the
   creator. Expect: the assignment notification fires as before, but is
   **never** flagged urgent — confirms `notify_opportunity_assigned`'s
   `is_urgent=False` change (the IndiaMART SLA is now the Marketing User's
   responsibility on IndiaMART's own platform, before anything reaches
   Sales OS).
3. Spot-check a non-IndiaMART, non-Conference Opportunity assignment still
   creates a normal (non-urgent) notification, unchanged from before.
