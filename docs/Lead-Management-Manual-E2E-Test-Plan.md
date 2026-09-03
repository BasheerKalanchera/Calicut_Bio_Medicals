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

**Added 2026-09-03, E2E-confirmed working:** the assigned rep now gets a
bell notification ("MARKETING_LEAD_ASSIGNED") the moment a Marketing User
creates a lead assigned to them — clicking it opens Marketing Lead Queue
(there's no per-lead detail screen), and viewing the queue marks it read.
Non-urgent, same as every other assignment notification. Folded into Group
C below. Two live bugs found and fixed during this same round of testing,
both the same root cause: `MarketingLeadReviewQueueScreen` and
`MarketingLeadEntryScreen` both stay mounted in the background for *every*
logged-in user (not just their intended role), and their queries had no
`enabled` gate — so `GET /marketing-leads` (which also marks read/first-
viewed server-side) fired the instant any user's session loaded, silently
marking a rep's own notification read before they ever saw the bell. Both
screens now take an `active` prop gating their query. **If you're testing
against a browser tab open from before 2026-09-03, hard-refresh first** —
otherwise you may still be running the old bundle. See
`docs/Progress-Archive-2026-09.md`'s 2026-09-03 entry and `docs/Backlog.md`'s
"Urgent-notification infrastructure retained for future reuse" for the
related IndiaMART-urgent-dialog investigation that prompted this.

**Also added 2026-09-03, E2E-confirmed working:**
1. Convert's green "From the marketing lead" context box now shows
   **"Source: \<lead source\>"** (e.g. "Source: INDIAMART") always, plus
   **"Conference: \<event name\>"** below it when the source was
   Conference — the event name previously entered at lead creation
   silently disappeared at Convert time; now both show, above the note.
2. Converting a lead now correctly refreshes the Pipeline screen without a
   manual browser refresh (`["pipeline"]` query invalidation was missing
   from the Convert flow's own `QuickLeadModal` instance — the header's
   "+ Lead" button already did this, this one didn't).
3. **New: `first_viewed_at` milestone on the Marketing User's own
   "Marketing Leads" screen** (migration `0035_add_marketing_lead_first_
   viewed_at.py` — apply before testing this part). Each lead card now
   shows one rotating timestamp next to the status pill: **Created** (until
   the assigned rep first opens Marketing Lead Queue) → **Seen** (once they
   do, while still NEW) → **Converted**/**Discarded** (once reviewed).
   Deliberately a single field, not a history line — `created_at`,
   `first_viewed_at`, and `reviewed_at` all still live on the row for later
   reporting (e.g. time-to-follow-up analysis), just not all shown at once.
   Folded into Groups C/D/E below at the point each transition happens.

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

## Group C — Rep: review queue shows assigned leads, and gets notified

1. Log in as the rep the lead from Group B was assigned to. **Before**
   navigating anywhere, check the notification bell (🔔, top header).
   Expect: an unread dot, and opening it shows "\<Marketing User's name\>
   assigned you a marketing lead" with the lead's account name (or nothing,
   if it was left "Not sure yet") on the line below.
2. Click that notification. Expect: it navigates straight to **Marketing
   Lead Queue** (not an Opportunity screen — there isn't one yet).
3. Expect: the lead from Group B appears, with account name (or "Unknown
   account" if left as "Not sure yet"), lead source (+ event name if
   Conference), product (if set), and the note visible.
4. Re-open the bell. Expect: that notification is now read (no unread dot,
   normal weight in the dropdown) — viewing the queue is what clears it,
   same idea as opening an Opportunity clears its own assignment
   notification.
5. If you did Group B step 8 (a second lead, also assigned to this rep):
   confirm both cards render, and that step 1's bell notification either
   listed both or a second one appeared for the second lead — whichever the
   UI does, it shouldn't silently drop one.
6. Log in as a *different* rep in the same SBU who was not assigned this
   lead. Expect: the Group B lead does **not** appear in their queue, and
   their bell has no notification for it either.
7. Log back in as the Marketing User and open the **Marketing Leads**
   screen. Expect: the lead's card now shows the **SEEN** pill (amber) with
   **"Seen \<timestamp\>"** next to it — was the **NEW** pill (blue) with
   "Created \<timestamp\>" before step 2 above. Confirms `first_viewed_at`
   got set the moment the rep opened their queue, not before, and that the
   pill reflects the milestone rather than the raw `status` column
   (migration `0035` must be applied first; pill-not-raw-status was a
   2026-09-03 refinement — Basheer flagged "NEW" next to "Seen" as
   contradictory).

## Group D — Rep: Convert flow

1. From the Marketing Lead Queue, click **Convert** on the test lead.
2. Expect: the normal "New Opportunity" form opens, pre-filled with the
   lead's Account (if one was set) and Lead Source. Expect: a green "From
   the marketing lead" box shows **"Source: \<lead source\>"**, plus
   **"Conference: \<event name\>"** below it if the source was Conference,
   plus the original note below that if one was entered.
3. **If the lead was left "Not sure yet" on Account:** confirm the Account
   field starts blank, and confirm the new **+ Add Hospital** button next
   to it opens the duplicate-checked create-hospital flow inline (same as
   Customer Directory's Add Hospital) — creating or picking an existing
   match there should populate the Account field without closing the
   Convert dialog.
4. Fill in the remaining required Opportunity fields (Name, Stage, Owner,
   Win Probability) and submit.
5. Expect: a real Opportunity is created and **appears in Pipeline without
   a manual browser refresh** — Convert now invalidates the same
   `["pipeline"]` query the header's "+ Lead" button does.
6. Return to Marketing Lead Queue. Expect: the converted lead is gone from
   the queue (no longer NEW).
7. Check the lead's own record (e.g. via direct SQL, since there's no
   review-history UI yet) — expect `status = CONVERTED`,
   `converted_opportunity_id` set to the new Opportunity's id,
   `reviewed_by`/`reviewed_at` set.
8. Log in as the Marketing User and check the **Marketing Leads** screen.
   Expect: the card now shows the **CONVERTED** pill and **"Converted
   \<timestamp\>"** (was "Seen \<timestamp\>" before this step).

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
8. Log in as the Marketing User and check the **Marketing Leads** screen.
   Expect: the card now shows the **DISCARDED** pill (red — matches
   Opportunity Pipeline's LOST color) and **"Discarded \<timestamp\>"**.

## Group F — Visibility and authorization (RLS + service-layer checks)

**Added 2026-09-03: "Team Marketing Leads" section, `MarketingLeadReview
QueueScreen.tsx`.** Found live during this group's own testing: RLS's
`marketing_lead_select` policy already grants SBU/Area Manager (own SBU)
and Admin/GM (every SBU) broader visibility than a rep's personal queue,
but no screen ever surfaced it — the queue only ever showed "leads
assigned to me," so a manager saw an empty screen despite RLS returning
rows. New section below the personal queue shows everything else RLS
returns (any status, not just NEW — matches the plan's own "how many
leads are sitting unreviewed" framing, extended to full history since the
policy doesn't gate on status either). Naturally empty and invisible for a
plain rep, since their own RLS grant never includes anyone else's rows —
existing rep-facing behavior is unchanged. Shared pill/milestone rendering
factored into `utils/marketingLeadMilestone.ts` so it matches the
Marketing User's own screen exactly.

**Also added 2026-09-03, expanding on Basheer's own live testing of the
above:** Convert/Discard was originally Admin/GM-or-assigned-rep only —
widened via migration `0036_marketing_lead_manager_update_rights.py` to
also let **SBU Manager** (any lead in their own SBU) and **Area Manager**
(only leads assigned to reps who are actually *their own reports*, via
`user_profile.manager_id` — narrower than SBU Manager, mirrors BR-OP-14's
existing "gate override approver must be the owner's immediate manager"
precedent) act directly. Buttons show for SBU Manager/Area Manager the
same as Admin/GM — the client can't tell whether *this* Area Manager
manages *this* rep, so an unauthorized attempt just 403s server-side
(matches the plan's own long-standing fallback wording below). **New
Reassign action** alongside Convert/Discard, same manager set — but
deliberately **not** a plain rep reassigning their own lead; only a
manager decides that, e.g. covering for someone on leave. Reassigning
resets the lead to "not yet seen" for the new assignee, notifies them the
same way a fresh assignment does, and clears the previous assignee's
now-stale notification. Migration `0036` needs your usual manual apply
before testing this.

**Self-delegation, found live 2026-09-03 (Fazal, Area Manager, has leads
assigned directly to himself and wanted to hand one to Fahad, his
report):** a manager CAN be personally assigned leads too — Area Manager
isn't excluded from the Assign To picker at creation — so Reassign now
also shows in the *personal* queue section when the viewer holds a manager
role (SBU Manager/Area Manager/Admin/GM), letting them delegate their own
assigned lead downward. A plain rep still never sees Reassign on their own
queue.

**Also found live 2026-09-03, migration `0037`:** Area Manager's
*visibility* into marketing leads (`marketing_lead_select`) was SBU-wide
since the original 0031 policy — same as SBU Manager's — which predates
0036's narrower Area-Manager-own-reports-only *action* rights. Fazal
could therefore see Shruthi's leads under "Team Marketing Leads" despite
her not reporting to him (button would 403 if clicked). Narrowed
visibility to match action rights exactly, same boundary now for both.
SBU Manager's own-SBU visibility is unchanged.

**Also found live 2026-09-03, migrations `0038`/reassignment-target
restriction:** reassigning still 500'd after 0037/0038 whenever the new
assignee wasn't the actor themselves or (for Area Manager) one of their
own reports — Postgres refuses to let a write leave the row invisible to
the actor afterward, independent of `WITH CHECK`. Fix (Basheer's choice
over a more flexible-but-riskier alternative): **an Area Manager can now
only reassign to their own reports**, not "anyone in the SBU" — SBU
Manager/Admin/GM unaffected, already unrestricted or SBU-wide.
`MarketingLeadReassignModal.tsx`'s rep picker filters accordingly.

1. **Cross-SBU rep:** as a rep in a *different* SBU than a pending lead,
   confirm it's invisible everywhere (queue, direct lookup) — matches
   Group C.6, restated here for the RLS angle specifically. (DB-level
   check already done live for Fazal (Imaging/Kasaragod) vs. Nishad
   (Critical Care/North Kerala) — no leak. A live UI pass with an actual
   cross-SBU rep login is still worth doing if you want the full UI
   confirmation, not just the RLS query.)
2. **SBU Manager:** log in as a manager whose SBU matches a pending lead's
   SBU (no dedicated test account exists for this role yet — either
   temporarily reassign an existing user's role, same as Setup step 3 for
   Marketing User, or use whichever account you already reassigned — e.g.
   Basheer K as SBU Manager/Imaging from this session). Expect: pending
   leads in that SBU appear under **"Team Marketing Leads,"** **with**
   Convert/Discard/Reassign buttons, and all three actually work on a lead
   assigned to any rep in that SBU.
3. **Area Manager, own report vs. someone else's (Imaging already has a
   ready-made pair — Fazal manages Fahad, Shruthi manages Rudrappa, no
   role reassignment needed):** log in as Fazal (Area Manager). With a
   pending lead assigned to Fahad and another assigned to Shruthi/
   Rudrappa: expect **only Fahad's lead** appears under "Team Marketing
   Leads" — Shruthi's/Rudrappa's should be invisible entirely, not just
   button-less. (Narrowed 2026-09-03, migration `0037_marketing_lead_
   area_manager_select_own_reports.py` — previously Area Manager
   visibility was SBU-wide like SBU Manager's, so Fazal could see
   Shruthi's leads despite her not reporting to him; found live when
   Basheer noticed exactly that.) Convert/Discard/Reassign on Fahad's
   lead should succeed. As a belt-and-suspenders check, confirm via
   devtools that a direct `PATCH` on Shruthi's/Rudrappa's lead still
   403s even though it's no longer visible at all.
4. **Admin/GM:** confirm leads from every SBU appear under "Team Marketing
   Leads" (not just the manager's own), **and** that Convert/Discard/
   Reassign all work on a lead assigned to someone else, in any SBU.
5. **Already-reviewed lead:** attempt to Discard a lead that was already
   Converted (or vice versa) via direct API call (e.g. browser devtools or
   a REST client) — expect a 422 (`BusinessRuleViolation`, "already been
   reviewed"), not a silent overwrite. Also try Reassign on an already-
   reviewed lead — same expected rejection.
6. **Plain rep cannot reassign their own lead:** as the assigned rep (a
   Sales Staff role, not a manager), confirm there's no Reassign option in
   the *personal* queue section — and, for belt-and-suspenders, a direct
   API call to `PATCH /marketing-leads/{id}/reassign` as that rep should
   403.
7. **Manager CAN reassign their own lead (self-delegation), target
   restricted to who they manage:** log in as Fazal (Area Manager, has
   leads assigned directly to himself in Imaging). Expect: Reassign shows
   on his own personal-queue cards, and the target dropdown lists **only
   Fahad** (his direct report) — not Shruthi, Rudrappa, or Basheer K.
   Reassigning to Fahad should succeed. Repeat as Basheer K (SBU Manager)
   with a personally-assigned lead — his target dropdown should list
   **every** eligible rep in Imaging (Fazal, Shruthi, Rudrappa, Fahad if
   not otherwise excluded), not just his own reports, and the reassignment
   should succeed regardless of which one he picks.

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
