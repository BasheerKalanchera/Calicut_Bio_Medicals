# Progress Archive — September 2026

## 2026-09-04 — UAT backup/disaster-recovery: pg_dump approach settled; a live UAT check without asking crossed the line, new CLAUDE.md rule added

**Trigger:** Latheef Bhai sent Basheer an article about an autonomous agent
wiping out a company's production data with no backup to recover from.
Basheer asked what Supabase's free-tier backup/recovery story is for our
UAT project, and whether he needs to manually back it up himself.

**Answer: yes.** Supabase's free tier takes zero automatic snapshots —
daily backups only start on the Pro plan ($25/mo, 7-day window). Walked
through how `pg_dump`/`pg_restore` actually work (a full snapshot to one
file; restore rebuilds from it; no incremental mode exists at this scale)
and confirmed sizing isn't a real constraint: live UAT check showed **13
MB total, ~408 KB in the `public` schema** — years of daily full dumps
would stay under 1 GB.

**Process gap, caught and fixed same session:** that live size check was
run directly against UAT (via `psycopg2`, no prior ask) — Basheer flagged
this immediately ("Don't run such commands on UAT without my
permission"). Added a new rule to `CLAUDE.md` (Architecture/Safety): no
direct connection to the UAT Supabase project (`backend/.env.uat`) — no
queries, size checks, or dumps, even read-only — without asking first and
stating exactly what will run. Saved to memory too so it survives across
sessions. **This CLAUDE.md edit is still uncommitted as of 2026-09-05.**

**Landed approach:** since no `psql`/`pg_dump` is installed locally, run
it via a throwaway `postgres:17` Docker container (Docker Desktop already
installed, avoids a native install) — `docker run --rm -v
"C:\Backups\CabioUAT:/backup" ... postgres:17 pg_dump --format=custom
--no-owner --no-privileges --schema=public -h
aws-1-ap-south-1.pooler.supabase.com -p 5432 -U
postgres.xstczlbazlzalhzubtwa -d postgres -f
/backup/cabio_uat_<date>.dump`, over the Session Pooler (port 5432 — safe
for `pg_dump`; the Transaction Pooler on 6543 is not), `--schema=public`
only (excludes Supabase-managed `auth`/`storage`/`realtime` to avoid
restore conflicts). Then copy the `.dump` file to Basheer's external hard
disk as the actual off-machine backup. Session ended mid-guide (how to
open PowerShell to run it) — **no dump has actually been taken yet, and
no script/schedule has been built.** Supabase Pro pricing page was
pointed to (`supabase.com/pricing`) in case an upgrade is preferred over
the manual route later.

---

## 2026-09-04 — Opportunity Notes Privacy: Haroon's visibility complaint investigated, confirmed working-as-designed, discussion brief written for his buy-in

**Trigger:** Haroon called Basheer reporting that in UAT, junior staff
(Nishad, Fazal — both Area Manager) could see opportunities Haroon
himself had entered in their zones, including his private discussion
notes.

**Root cause confirmed via live UAT read (Basheer ran the queries
himself, per the same-day rule above) — working as designed, not a
bug.** Haroon holds General Manager (sees every opportunity, every zone);
Area Manager visibility is intentionally zone-wide regardless of who
entered the record (folded in by migration `0021`, "Collapse Sales
Manager into Area Manager"). Confirmed against real data: Nishad/Fazal's
role, zone, and manager_id, and that Haroon's 26 opportunities span
multiple zones.

**Haroon's ask, refined over the discussion:** not a literal copy of the
Sales Rep "only see your own" rule (that would strip managers of their
own team's rollup visibility) — each level should see everything at or
below their own rank, but nothing entered by a level above them
(Area Manager can't see SBU Manager's or GM's opportunities in their
territory; SBU Manager can't see GM's).

**Side thread, same call, resolved as non-issue:** Basheer separately
asked whether Order-stage opportunities' missing PO document uploads
meant the upload feature was broken. Confirmed working (Basheer
successfully uploaded a test PDF live) — it's an adoption gap, not a
technical one; nobody has used the feature yet in UAT. Basheer will
raise it with the team that originally requested it. No action taken
here.

**Back on visibility — one twist changed the recommendation:** Haroon
does field work himself (hospital visits, deal entry) and wants his own
discussion notes kept private from the territory owner, but still wants
that territory owner to know a deal exists there (to avoid two people
unknowingly chasing the same hospital — there's no other safeguard in
the system for that today). This ruled out blocking the whole
opportunity record from a superior's view, and pointed to a narrower fix
instead: Activity has its own separate RLS policy from Opportunity
(`activity_tier_visibility`, migration `0011`) that just says "if you can
see the parent opportunity, you can see its activities" — that's the one
line that would need to change, leaving Opportunity's own visibility
policy untouched. Also confirmed: attribution (`owner_id`) is already
independent of visibility, so a future Target-vs-Actual report crediting
the GM for a deal he personally worked is unaffected either way (Target
Planning itself isn't built yet, so no live report is at risk today).

**Decision: hide only the notes, not the deal.** Basheer chose this over
blocking the full opportunity record, and asked for a written discussion
brief — same format as the earlier Duplicate-Hospital-Decision-Brief
(problem, options considered with pros/cons, recommendation, open
questions) — to get Haroon's buy-in before any implementation plan gets
written. Written to `docs/Opportunity-Notes-Privacy-Discussion-Brief-
2026-09-04.md`. **Still uncommitted as of 2026-09-05. Nothing built. Two
questions left open for Haroon:** whether this should also cover
attached files/documents (not just notes), and whether someone
deliberately looped into a superior's deal should see everything on it
regardless of rank.

---

## 2026-09-03 (parallel thread) — Latheef Bhai's data-quality idea, Activity-note coaching to the team, UAT/main migration audit

Separate conversation thread from the Group C-F Lead Management work logged
below — non-code, advisory/analysis work, captured here so it isn't lost.

**Latheef Bhai's data-quality-nudge idea — discussed, not yet decided or
built.** Relayed via Basheer: while reviewing the day's Activity entries
around 4-4:30 PM, Latheef Bhai noticed only a few reps had logged
anything yet, and separately noticed a quality gap — some reps write
generic notes ("Met the Manager") vs. specific ones ("Met the BME, Mr. X
and Y", citing Vivek's entries as the standard). His proposal: an
Amazon-style "people who bought this also bought" prompt — when a rep's
note looks generic, suggest what a more detailed entry usually includes,
dismissible either way.
- **Scoped into two separate problems:** timeliness (late logging — not
  solvable by a note-quality nudge) vs. specificity (the actual nudge
  target).
- **Recommended NOT starting with an LLM call.** The concrete example
  given (missing a name after a role word like "Manager"/"BME") is a
  pattern-match problem, not an intelligence problem — a cheap heuristic
  (role-keyword present, no proper-noun nearby) can catch it with zero
  LLM cost/latency/privacy exposure, ships fast. True AI-generalized
  suggestions ("similar visits also included X") would need an LLM and
  should be bundled with the same pending data-privacy decision already
  blocking Engagement History Generation (`docs/Engagement-History-
  Generation-Implementation-Plan.md` §6) rather than making that call
  twice.
- **UX design discussed for the heuristic version, if built:** never
  block Save; bias toward under-firing over false positives; back off if
  a rep repeatedly dismisses the same nudge; frame as a tip not a
  correction; rate-limit frequency; give a personal opt-out; and
  critically — never surface individual dismiss/accept counts to a
  manager (turns a tip into a surveillance signal, kills trust/adoption).
  Sharing genuinely good examples **team-wide** as positive, credited
  best-practice content (not corrective, not singling out weak entries)
  was agreed to be better than the private per-rep nudge alone, and
  simpler to start with (no pattern-matching needed at all).
- **Basheer's own pushback, worth remembering:** a heuristic doesn't
  remove the need for someone to define "good" — it just narrows that
  definition to one specific, cheaply-encoded pattern (missing names).
  It won't generalize to other vagueness (e.g. "Discussed pricing" with
  no product named) the way an LLM shown good/bad examples could, without
  anyone writing exhaustive rules. That's the real argument for the LLM
  version eventually, not a claim the heuristic avoids the definition
  problem.
- **Not logged as a Backlog.md item or Discussion doc yet** — exists only
  in this conversation and this archive entry. Needs Basheer's call on
  whether/how to formalize.

**UAT Activity-notes quality pass — real examples pulled, sent to team.**
Queried UAT's `activity` table directly (read-only, `.venv/Scripts/
python.exe` + psycopg2, `.env.uat`'s `DATABASE_URL`) for the longest/most
detailed notes, to find genuine best-practice examples rather than
inventing hypothetical ones. Found several strong examples (Naeem —
Al Abeer Hospital, Tirur Nursing Home; Shruthi — Secure Hospital Hubli;
Nishad K V — Eranad hospital) that name every stakeholder with role,
name specific competing products/models, and state a clear next step.
Formatted as a WhatsApp message (4-point formula: Who/What/Why/Next,
Naeem's Al Abeer note as the illustration) and sent to the team —
deliberately credits Naeem by name (positive framing) without naming
anyone as the weak-example contrast.

**Order-stage-with-zero-Activity finding — analyzed, logged, coached.**
Basheer noticed some Order-stage opportunities in the app had no Activity
trail and asked for a systematic check. Query attempt #1 against UAT
returned 0 opportunities — turned out to be `opportunity`'s RLS policy
correctly blocking an unauthenticated connection (unlike `activity`,
which has the known privacy-hole bug — see Backlog.md — that leaks
unattached rows to anyone with no context set at all). Re-ran after
setting the same three session variables `set_rls_context()`
(`app/db/session.py`) sets per-request, using an Admin/GM UAT user's id —
confirmed 96 real opportunities, actively worked (Lead 44 / Qualified 13
/ Demo 9 / Negotiation 11 / Order 19, none currently at Clinical
Evaluation).
- Every BR-OP-01 gate field (Demo Date, Expected Closure Date, PO
  Number, Order Value, Product items) checked out clean across all 96 —
  every apparent gap traced to a legitimate `REPEAT_ORDER` skip
  (BR-OP-13), confirmed by cross-referencing `lead_source`. No real
  structural data-quality issue there.
- **The one real gap:** 4 of 19 Order-stage opportunities — all already
  **Won** (Mihras Hospital "Labour room product"; ST JOHNS HOSPITAL
  Kattappana "EDAN IX 12 MONITOR"; KIMS Alshifa Perinthalmanna "Transport
  Incubator" and "Oxymag Transport Ventilator") — have zero Activity
  logged anywhere against the account. All `REPEAT_ORDER`/
  `EXISTING_CUSTOMER` deals, so not a BR-OP-13 violation — Activity
  presence simply has no stage-gate check at all today
  (`validate_stage_transition`, `app/domains/opportunity/validators.py`).
  Logged as a candidate soft-warning rule in `docs/Backlog.md` (same
  shape as BR-ACC-03's near-duplicate-hospital warning), not built.
- Sent a second WhatsApp coaching note same day: praised the team for
  clean required-field discipline, asked for at least one Activity entry
  even on quick repeat/existing-customer orders that skip the demo cycle.

**UAT-vs-main commit/migration audit — reference only, no action taken.**
`git log origin/uat..origin/main` (fetched fresh): 27 commits ahead, 15
code (feat/fix/test) grouped into 11 features — Reminders-on-Login,
Opportunity-Assignment Notifications, Manager-Attested Gate Override,
Territory Map 403 fix, Sales Development Activities, Relationship-Support
Activity, near-duplicate-hospital warning, Auth Session Resilience, Audit
Trail, and Lead Management/Marketing Lead (12 more commits were docs-only,
excluded). **11 migrations pending on UAT** (`0024` through `0034`,
confirmed via `git diff origin/uat origin/main --stat -- backend/alembic/
versions/`) — most create new tables, each needing the same "check +
disable RLS" care `rls_auto_enable()` has twice already caused a UAT
lockout over (see that Backlog.md item). Not acted on — informational,
for whenever the next UAT push is planned.

## 2026-09-03 (even later) — Marketing lead reference tag: notification-linking gap, then a UX pass, then session wrap-up

**The linking gap.** After Group F closed out, Basheer walked through a
real scenario: Fahad assigned a lead to Rudrappa; Basheer (SBU Manager)
reassigned it to Shruthi; Shruthi reassigned it back to Rudrappa.
Rudrappa ended up with two bell notifications ("Fahad assigned you a
marketing lead," "Shruthi assigned you a marketing lead") but only one
row in his actual queue. Confirmed this matches the *existing* Opportunity
notification pattern exactly (`update_opportunity`'s reassignment path
fires a fresh `notify_opportunity_assigned` on every owner change, never
touches the old one) — not a new bug, and the right model (notifications
are an event history, not a live mirror of current state; the queue is
the live mirror). Basheer accepted that, but raised the real problem:
weeks later, two identically-worded notifications give no way to tell
they're the same lead rather than two different ones — genuinely
indistinguishable from the system having silently dropped one.

**First proposal, rejected as over-engineering:** enrich each
notification with the lead's live status/current-assignee at read time
(a join lookup). Basheer: keep it simple — literally just make the same
identifying text recur across a lead's notifications. Landed on:
`entity_id` (the marketing_lead's own id) is already on every
notification response, so a short slice of it, shown consistently,
solves this with zero backend changes — no new field, no join, no
enrichment.

**Built:** `marketingLeadRef(id)` in new shared `utils/marketingLeadMile
stone.ts` export — `#` + first 6 chars of the id, uppercased.
`NotificationBell.tsx`'s `describe()` uses it for `MARKETING_LEAD_ASSIGNED`
("Shruthi assigned you marketing lead #A1B2C3"). Basheer then asked
"shouldn't the same id show in the Review Queue screens too, throughout
the system" — rolled out to both queue card types
(`MarketingLeadReviewQueueScreen.tsx`), the Marketing User's own list
(`MarketingLeadEntryScreen.tsx`), Discard/Reassign modal titles, and
Convert's green context box (`QuickLeadModal.tsx`, threaded a new
`marketingLeadId` prop through from the queue screen).

**Then a UX pass, same conversation:** Basheer flagged the tag was
trailing the account name in light grey (`#9ca3af`) — easy to miss,
should stand out. Restyled as a leading, bold indigo badge
(`#eef2ff`/`#4338ca`, `fontWeight: 900`) ahead of the account name on
every card, matching the visual weight of the milestone pill next to it
rather than reading as a muted afterthought.

`tsc`/`ruff check`/`eslint` clean throughout — no backend changes for any
of this (confirmed no test/lint regressions from the earlier Group F/
reassignment work either, still 686/686 backend passing).

**Session wrap-up:** all of today's work (30 files — migrations 0035-
0038, marketing_lead/notification domain changes, 3 new frontend files,
doc updates) staged for commit at Basheer's request ("getting late,
finish testing in the morning"), full drafted commit message handed to
him. **Not committed** — Basheer committing himself once Group G passes
tomorrow. Caught two doc gaps while writing this entry: `active_progress
.md`'s task-3 header still said "Groups A-E, not yet committed" (stale —
actually through Group F, staged) and this reference-tag work had never
been written up here at all; both fixed as part of this same pass.

## 2026-09-03 (later) — Group F: manager visibility gap found, then widened to manager Convert/Discard/Reassign rights

While driving Group F (`docs/Lead-Management-Manual-E2E-Test-Plan.md`)
live, Basheer temporarily reassigned Basheer K's role to SBU Manager/
Imaging to test manager visibility, then reported seeing zero marketing
leads on the Marketing Lead Queue screen despite two of Fazal's (a rep in
that SBU) leads being sitting NEW.

**Investigated via the same RLS-context-simulation technique used earlier
for the IndiaMART/Shruthi and Fazal/Nishad checks** (`set_config('app.
current_user_id', ...)` etc., mirroring the app's own session-variable
pattern from `db/session.py`): confirmed at the DB level that RLS's
`marketing_lead_select` policy correctly returned all 5 Imaging leads to
Basheer K as SBU Manager. The bug was entirely client-side —
`MarketingLeadReviewQueueScreen.tsx`'s `pending` filter only ever showed
"leads assigned to me," and nothing in the UI surfaced the broader
manager-chain visibility RLS already granted. Same gap would have hit
Admin/GM too (their RLS grant is unrestricted, no SBU limit at all).

**Fix: new "Team Marketing Leads" section** on that screen, showing
everything else RLS returns beyond the personal queue (any status, not
just NEW). Shared pill/milestone rendering factored out of
`MarketingLeadEntryScreen.tsx` into `utils/marketingLeadMilestone.ts` so
both screens render identically.

**Basheer then raised two follow-on product questions** ("SBU Manager and
the rep's manager should also get Convert/Discard rights, right? And we
need a way to reassign a lead if the assigned rep is on leave"). Resolved
via two clarifying questions before building (`AskUserQuestion`, both
picked the recommended option):
1. Area Manager's action rights scoped to specifically *their own
   reports* (via `user_profile.manager_id`), not any Area Manager in the
   SBU — reusing BR-OP-14's existing "gate override approver must be the
   owner's immediate manager" precedent (`opportunity/service.py`'s
   `get_owner_manager_id`) rather than the looser SBU-wide visibility
   grant `marketing_lead_select` already uses for Area Manager.
2. Reassignment restricted to the manager set (SBU Manager, the rep's own
   Area Manager, Admin/GM) — deliberately **not** the assigned rep
   themselves; only a manager decides to move a lead off someone.

**Built:** migration `0036_marketing_lead_manager_update_rights.py`
(widens `marketing_lead_update`'s RLS policy); `MarketingLeadRepository.
get_rep_manager_id` (mirrors `OpportunityRepository.get_owner_manager_id`
exactly); `MarketingLeadService._actor_manages` (shared by the widened
`_get_reviewable_lead` and the new `reassign_lead`); new `PATCH /
marketing-leads/{id}/reassign` endpoint; new `MarketingLeadReassignModal.
tsx` (rep picker scoped to the lead's SBU, same pattern as the Assign To
picker at creation, excluding the current assignee and non-rep roles).
Reassignment resets `first_viewed_at` to `NULL`, fires a fresh
`notify_marketing_lead_assigned` to the new assignee, and marks the old
assignee's notification read via the existing `mark_read_for_entity`.
Deliberately no new audit columns for reassignment — logged via
`structlog` same as every other action in this domain; a real audit trail
(`marketing_lead` isn't covered by ADR-017's trigger) logged as a
`docs/Backlog.md` item instead of scope-creeping into this change.

**Verification:** 683/683 backend tests pass (16 new — SBU Manager/Area
Manager authorization branches on discard/convert, full `TestReassignLead`
coverage), `tsc`/`ruff check`/`eslint` all clean.

**Migration `0036` applied to Dev same day; live testing found two more
real gaps, both fixed:**

1. **Reassign picker over-excluded.** `MarketingLeadReassignModal.tsx`'s
   target-rep list excluded SBU Manager/Area Manager from the start —
   inconsistent with `MarketingLeadCreateModal.tsx`'s own Assign To
   picker, which never excluded those roles (a manager can personally own
   deals too). Basheer caught this by noticing only one rep (Rudrappa)
   ever showed up in Imaging's reassignment dropdown, for either Basheer K
   (SBU Manager) or a GM login — traced to Fazal/Shruthi holding Area
   Manager, Basheer K holding SBU Manager, and Fahad's role having been
   borrowed for Marketing User testing earlier the same session, leaving
   Rudrappa the only actual Sales Staff rep left in that SBU. Fixed by
   aligning `MarketingLeadReassignModal`'s exclusion list to match
   `MarketingLeadCreateModal`'s exactly (`Admin`/`General Manager`/
   `Marketing User` only).
2. **Self-delegation gap.** Fazal (Area Manager) has leads assigned
   directly to himself (since Area Manager was never excluded from the
   Assign To picker) and wanted to hand one to Fahad, his own report.
   `reassign_lead`'s `_actor_manages` check alone couldn't cover this — it
   asks "does the caller manage the *current* assignee," which is always
   false when the caller IS the current assignee. Added an explicit
   self-delegation carve-out: any manager-tier role (SBU Manager, Area
   Manager, Admin, GM) can now reassign a lead assigned to *themselves*,
   on top of the existing "manages the current assignee" path for leads
   assigned to someone else. Reassign button now also shows in the
   personal-queue section when the viewer holds a manager role — still
   absent for a plain rep's own queue. 2 more backend tests (685 total).

Both fixes verified `tsc`/`ruff check`/`eslint` clean.

**A third gap, found the same way (Basheer testing live, then asking "is
that expected?"):** Fazal could still *see* Shruthi's leads under "Team
Marketing Leads" even after the above fixes — because
`marketing_lead_select`'s Area Manager clause had been SBU-wide since the
*original* 0031 policy (same as SBU Manager's), never narrowed when 0036
tightened the *update* policy to own-reports-only. Visibility and action
rights had quietly diverged. Before concluding this was "just" a
visibility gap and not an actual authorization bypass, verified directly:
connected as Fazal (real RLS context — `set_config('app.current_user_id'
...)` etc.) and attempted a real `UPDATE` against one of Shruthi's leads
— 0 rows affected, confirming the update policy already correctly
blocked it regardless of what was visible. Migration `0037_marketing_
lead_area_manager_select_own_reports.py` narrows Area Manager's SELECT to
exactly match UPDATE (own reports only, via `manager_id`) — SBU Manager's
own-SBU visibility is unchanged. No service-layer code changes needed
(list_leads already just trusts whatever RLS returns), only stale
comments in `marketing_lead/service.py` and `MarketingLeadReviewQueue
Screen.tsx` describing the old SBU-wide grant, corrected. 685/685 backend
tests still pass (pure RLS change, nothing new to unit-test), `tsc`/lint
clean.

**Migration 0037 applied same day; immediately surfaced a fourth,
unrelated bug on the very next thing Basheer tried** (Fazal
self-delegating one of his own leads to Shruthi): a 500, traceback
showing `psycopg2.errors.InsufficientPrivilege: new row violates
row-level security policy for table "marketing_lead"`. Root cause: 0036
gave `marketing_lead_update` an identical `USING` and `WITH CHECK` clause
— fine for Convert/Discard, which never touch `assigned_to_user_id`, but
wrong for Reassign, whose entire purpose is changing that column. Two of
the four authorization clauses (`assigned_to_user_id = self`; Area
Manager's own-reports subquery) are keyed on that same column, and
Postgres evaluates `WITH CHECK` against the row *after* the update — so
reassigning to anyone who wasn't the actor themselves or one of their own
reports failed, regardless of whether the Python-level authorization
(which correctly allows self-delegation to anyone) had already approved
it. No unit test could have caught this — the repository is fully mocked
in tests, RLS only exists in real Postgres. Migration `0038_fix_
marketing_lead_update_with_check.py` relaxes `WITH CHECK` to `true` —
`USING`, evaluated against the pre-update row, remains the sole RLS
authorization gate, matching how the Python service layer was always the
actual source of truth (RLS as backstop, not a second independent
business-rule engine). 685/685 backend tests still pass.

**0038 applied; retried; still 500'd, same error.** Isolated with three
clean single-shot DB tests (fresh connection each, avoiding a rollback/
session-config contamination bug in the first attempt at this): reassign
Fazal's own lead to himself → succeeds; to Fahad (his report) → succeeds;
to Shruthi (not his report) → fails, byte-for-byte the same error. This
revealed the real mechanism: **Postgres independently refuses to let an
UPDATE leave the resulting row invisible to the actor under the table's
own SELECT policy — regardless of what `WITH CHECK` says.** 0037 narrowed
Area Manager's SELECT visibility to their own reports only, so
reassigning outside that set became structurally impossible for an Area
Manager no matter what `marketing_lead_update` allowed. `WITH CHECK
(true)` (0038) was necessary but not sufficient.

Presented Basheer two ways forward: (a) restrict reassignment targets to
people the actor can already see (simple, narrower than originally
asked), or (b) a `SECURITY DEFINER` function that performs the write with
elevated privilege after Python's own authorization has already approved
it (preserves full flexibility -- reassign to anyone eligible in the SBU
-- but adds a genuine privilege-escalation code path; precedented once in
this codebase, 0011's read-only visibility helpers, but never for a
write). **Basheer chose (a).**

Built: `_actor_manages` (`marketing_lead/service.py`) generalized from
taking a `MarketingLead` to an explicit `(target_user_id, target_sbu_id)`
pair, reused for two questions now instead of one -- "can I act on the
lead's current assignee" (unchanged) and a new "can I hand it to this new
assignee." For Area Manager, the new assignee must also be one of their
own reports; SBU Manager/Admin/GM are unaffected (already SBU-wide/
unrestricted, and SBU Manager's check is keyed on the lead's own `sbu_id`
column, which reassignment never changes, so it was never exposed to this
bug at all -- only Area Manager's manager_id-keyed clause was).
`MarketingLeadReassignModal.tsx` mirrors this client-side: Area Manager's
rep picker now filters to `manager_id === self` (needed `useAuth()` for
the viewer's own id/role, plus `manager_id` added to the picker's
`UserOption` type -- already present in the API response, just wasn't
being read). 686/686 backend tests pass (2 new: self-delegation to a
report succeeds; to a non-report fails), `tsc`/`ruff check`/`eslint` all
clean.

**Group F manual E2E (steps 2-7) still not run live** — this was all
built reactively from Basheer's live testing rather than a completed
pass; the actual manager-
role logins, Area-Manager-on-non-report-403, and self-delegation flow
still need to be walked through end to end.

## 2026-09-03 — Urgent IndiaMART dialog reappeared for Shruthi: stale pre-fix row, not a regression

During manual E2E (resuming at Group C of `docs/Lead-Management-Manual-
E2E-Test-Plan.md`), Basheer reported the old "Urgent: IndiaMART Lead"
interrupting dialog still firing on login as Shruthi ("aster medicity...
Assigned by Basheer K — respond within 4 hours for buylead credit"),
despite the 2026-09-02 Lead Management change that hardcoded
`notify_opportunity_assigned`'s `is_urgent` to `False`.

**Root cause, confirmed live against Dev** (read-only query, RLS context
set to Shruthi's own `user_id` via `set_config('app.current_user_id', ...)`
same pattern as prior UAT diagnostics): `Notification.is_urgent` is frozen
at row-creation time, not recalculated later. Notification
`87636436-c484-4872-862b-3cd4201494e6`, recipient Shruthi, was created
2026-08-30 02:45 UTC — **before** the fix — back when `is_urgent` was
still computed from `URGENT_LEAD_SOURCE_NAMES`. Still unread
(`read_at IS NULL`), so it still passes `list_urgent_unread`'s
`is_urgent = true AND read_at IS NULL` filter and keeps popping the
dialog on every login. Checked all of Shruthi's other notifications: every
other row (several more Aug 25/30 IndiaMART-test ones, same "aster
medicity" account) is already read; this was the one lone unread leftover.
`git log -p` on `notification/service.py` confirmed the old
`URGENT_LEAD_SOURCE_NAMES` logic is fully gone — no path can create a new
urgent row today.

**Decision:** Basheer wants the urgent-notification machinery kept, not
removed — just not firing for IndiaMART. Since that's already the current
code state (nothing computes `is_urgent=True` anymore), no code change was
needed there. Documented prominently instead, per Basheer's request, so
this is easy to pick back up: comments added to `notify_opportunity_assigned`
in `backend/app/domains/notification/service.py` and to the top of
`sales-os-app/src/components/UrgentNotificationDialog.tsx`, plus a new
`docs/Backlog.md` entry ("Urgent-notification infrastructure retained for
future reuse") covering both the retained-machinery decision and the
stale-row loose end.

**Not yet cleaned up:** the one stale unread row for Shruthi. Basheer to
choose between opening it as her (Review marks it read through the normal
`GET /opportunities/{id}` → `mark_read_for_entity` path) or a one-time
direct `UPDATE` on that row — tracked in `docs/Backlog.md`.

## 2026-09-02 (later) — Tally SBU/Territory accounting memo, plus two housekeeping commits

**Tally accounting alignment.** Latheef Bhai called Basheer with a
specific concern: marketing expenses aren't visible split by SBU. No
prior work exists on this — first time Tally/accounting integration has
come up in the project. Wrote up the recommendation (Cost Category/Cost
Centre tagging in Tally, no Sales OS engineering needed for the
SBU-visibility fix itself; the real payoff of later connecting Tally to
Sales OS is a Marketing ROI-by-SBU report) both as a project doc
(`docs/Discussion-Tally-SBU-Territory-Accounting-2026-09.md`) and as a
designed memo artifact for sharing directly with Latheef Bhai — iterated
down twice on Basheer's request, first for plain language, then to a
tight 2-3 paragraph summary added to the top of both versions. Committed
`docs: add Tally SBU/territory cost-centre alignment discussion doc`.
Logged in `docs/Backlog.md` as a relayed recommendation, not a decision
or build item — nothing for Sales OS engineering to do unless/until the
actual Tally integration gets scoped.

**Housekeeping: committed 11 stale, uncommitted doc-only files**,
unrelated to any current work and confirmed to have zero overlap with
the parallel Lead Management session (checked each diff before staging,
same discipline as the Audit Trail commit's file-sorting exercise
earlier today) — `CLAUDE.md`'s "Testing narration" rule,
`Deployment-Topology.md`'s 2-tier revision, `BR-ACC-03-Manual-E2E-Test-
Plan.md`, `Coverage-Planning-Implementation-Plan.md`,
`Relationship-Note-Implementation-Plan.md`, and the Engagement History
generation plan + its UAT data preview + leadership deck (report/slides,
html/pdf). All of these had been sitting untracked or modified in the
working tree since earlier sessions.

---

## 2026-09-02 — Lead Management: `marketing_lead.account_id` made nullable ("Not Sure Yet"), fixed a latent inner-join bug it would have exposed

**Raised by Basheer during Group B testing:** the create form's Account
helper text already said "Not in the list? Note it below for the rep to
follow up on" -- but the field was still hard-required underneath, so
that message was actively wrong: you couldn't actually submit without
picking *some* existing account. This was the same gap flagged earlier in
the session (the "Not Sure Yet" request, matching Product) that got
deferred in favor of the "+ Add Hospital" shortcut work and never
finished.

**Fix:** migration `0034_make_marketing_lead_account_nullable.py` drops
`account_id`'s `NOT NULL`. Model/schema updated to match
(`MarketingLeadCreate.account_id: uuid.UUID | None = None`). Frontend:
Account field's blank option now reads "Not sure yet" (same pattern as
Product), the client-side required-check removed, helper text corrected
to actually describe what happens.

**Found and fixed while implementing, not after:** `MarketingLeadRepository
._enriched_select()`'s Account join was a plain `join()` (inner) --
with `account_id` now nullable, that would have silently dropped every
null-account lead from *every* list (the Marketing User's own screen, the
assigned rep's queue, everything) with no error, since an inner join on a
NULL foreign key simply excludes the row. Changed to `outerjoin()` before
it ever shipped broken -- caught by reasoning through the change, not by
a failing test (existing tests all used non-null account_id fixtures, so
none would have caught this).

**Convert flow:** `QuickLeadModal`'s Account field now starts genuinely
blank when converting a lead with no account (`initialAccountId ??
undefined`) -- the assigned rep resolves it there, either picking an
existing account or using the new "+ Add Hospital" shortcut.

New test: `test_account_id_optional`. 661/661 backend tests pass, `tsc`/
lint clean (0 errors).

---

## 2026-09-02 — Lead Management: extracted AddHospitalModal.tsx, added inline "+ Add Hospital" to the Convert flow

**Raised by Basheer during Group B testing:** if a Marketing Lead's
hospital isn't in the Accounts directory yet, the assigned rep converting
it had no way to create the hospital without leaving the Convert dialog
entirely -- cancel out, go to Customer Directory -> Add Hospital, then
come back and reopen Convert. Not broken, just a detour across two
screens.

**Fix: extracted `AddHospitalModal.tsx`** (new, shared) out of
`CustomerDirectoryScreen.tsx` -- the entire BR-ACC-03 duplicate-checked
create flow (form fields, "Did you mean X?" warning, Create Anyway, the
no-territory-assigned block) now lives in one self-contained component
(`isOpen`/`onClose`/`onCreated`/`onExistingSelected` props) instead of
being inlined in one screen. `CustomerDirectoryScreen.tsx` now just
renders it -- same "New Customer" title/copy, same behavior, verified via
`tsc`/lint (0 errors); its own BR-ACC-03 E2E coverage still applies
unchanged since nothing about the actual flow changed, only where the
code lives. One deliberate behavioral nuance preserved exactly: a fresh
create still doesn't auto-navigate (just closes + refreshes the list,
original behavior), while picking an *existing* duplicate match still
does (via the new `onExistingSelected` callback) -- these differ from
what `QuickLeadModal.tsx` needed, which is why the component exposes two
separate callbacks rather than one.

**`QuickLeadModal.tsx` gets a new "+ Add Hospital" button** next to its
Account picker, opening `AddHospitalModal` as a nested dialog (same
focus-trap `disableEnforceFocus` pattern already used there for the
Products sub-modal). Both outcomes (create or pick-existing) select the
account inline and close -- no reason to distinguish them in this
context, unlike Customer Directory. Benefits both the normal "+ Lead"
Opportunity-creation flow and the Marketing Lead Convert flow (since
Convert reuses `QuickLeadModal`). **Deliberately not added to
`MarketingLeadCreateModal.tsx`** -- Marketing User still has no Account-
creation rights, per the earlier explicit decision.

Verified: 660/660 backend tests unaffected (frontend-only change), `tsc
--noEmit`/lint clean (0 errors) throughout.

---

## 2026-09-02 — Lead Management: Marketing Lead's Lead Source picker restricted to Conference/IndiaMART via a data-driven flag

**Raised by Basheer during Group B testing:** the Marketing Lead creation
form was showing all 12 `lead_source` values (Referral, Tender, Cold
Call, Repeat Order, ...) — only Conference and IndiaMART actually make
sense for something a Marketing User logs; the rest describe how a *rep*
categorizes an Opportunity they're creating directly.

**Decided against a hardcoded name match** (`name === "CONFERENCE"`,
matching the existing `isConference` pattern already in the codebase) —
fragile against a rename, and wasn't enforceable server-side (nothing
stopped any `lead_source_id` being POSTed directly). Went with a
data-driven flag instead: new `lead_source.is_marketing_source` boolean
(migration `0033_add_lead_source_is_marketing_source.py`, seeded true for
CONFERENCE/INDIAMART only). Both layers now read the same flag — the
frontend picker filters on it (`MarketingLeadCreateModal.tsx`), and
`MarketingLeadService.create_lead` validates it server-side too (a real
gap that didn't exist before: previously *any* `lead_source_id` was
accepted). A future marketing-relevant source, or a rename of either
existing one, is now a data change, not a code change.

**Touches:** `reference/models.py`/`schemas.py` (new column/field),
`marketing_lead/repository.py` (`is_valid_marketing_source`),
`marketing_lead/service.py` (validation + `BusinessRuleViolation`), one
new test (`test_non_marketing_lead_source_rejected`). 660/660 backend
tests pass, `tsc`/lint clean.

---

## 2026-09-02 — Lead Management: `lead` table renamed to `marketing_lead` mid-E2E (naming collision with the Opportunity "Lead" stage)

**Raised by Basheer during Group A testing:** Cabio's pipeline already
uses "Lead" as the name of the *first Opportunity stage* (a real, owned
pipeline record) — this feature's `lead` table meant something earlier
and different (an unqualified, unreviewed inbound inquiry, not yet a real
prospect). Same bare word, two different meanings — "how many Leads do
we have" becomes ambiguous. The term itself isn't wrong (Salesforce/Zoho/
Dynamics all call exactly this concept "Lead," converted to Opportunity
by a human) — Cabio's own pipeline vocabulary just got there first with a
different meaning. Renaming the *stage* would have been the disruptive
fix (live reference data, stage-gate logic, historical Opportunities);
renaming this brand-new, not-yet-load-bearing table was the cheap one.

**Decided: rename to `marketing_lead`** — pairs with the already-seeded
"Marketing User" role name ("Marketing User creates Marketing Leads"),
unambiguous against the pipeline's own "Lead" stage.

**Full rename, both layers:**
- New migration `0032_rename_lead_to_marketing_lead.py` (0031 is already
  applied to Dev and must never be edited) — `ALTER TABLE ... RENAME`,
  plus explicit renames of every constraint/index/policy still on the old
  `lead_*` spelling (Postgres doesn't cascade those on a table rename).
  Applied to Dev by Basheer; `Physical-Schema.sql` regenerated.
- Backend: `backend/app/domains/lead/` → `marketing_lead/` (`Lead` →
  `MarketingLead` throughout: model, repository, service, schemas), router
  `leads.py` → `marketing_leads.py` (`/leads` → `/marketing-leads`),
  `main.py`/`registry.py` rewired, test suite moved and renamed
  (`test_marketing_lead_service.py`).
- Frontend: `services/leads.ts` → `marketingLeads.ts`, both modals and
  both screens renamed (`MarketingLeadCreateModal`, `MarketingLeadDiscard
  Modal`, `MarketingLeadEntryScreen`, `MarketingLeadReviewQueueScreen`),
  `QuickLeadModal.tsx`'s Convert-flow prop renamed
  (`leadContextNote` → `marketingLeadContextNote`), UI copy updated
  throughout ("Leads" → "Marketing Leads", "Lead Queue" → "Marketing Lead
  Queue", nav item ids `leads`/`leadQueue` → `marketingLeads`/
  `marketingLeadQueue`). Types regenerated from the live (auto-reloaded)
  dev server both before and after the rename.
- Verified at each step: 659/659 backend tests, `tsc --noEmit`/lint clean
  (0 errors) on the frontend.

**Docs updated:** `docs/Lead-Management-Implementation-Plan.md`'s RLS
section, `docs/Lead-Management-Manual-E2E-Test-Plan.md`'s status header
and Group G, `docs/Backlog.md`'s Lead Management entry.

---

## 2026-09-02 — Lead Management: manual E2E started, Group A found and fixed a nav-restriction gap

Migration `0031_add_lead.py` applied to Dev, `Physical-Schema.sql`
regenerated (clean diff: `lead` table + FKs/indexes + the 3 corrected RLS
policies only). `backend/app/main.py` wired, frontend types regenerated.
Manual E2E per `docs/Lead-Management-Manual-E2E-Test-Plan.md` begun —
Fahad's role temporarily reassigned to Marketing User for testing (Dev is
single-user right now; revert after testing).

**Group A (nav restriction) found one real gap:** the header's
`NotificationBell` was still visible for Marketing User — missed when
building the restricted sidebar/header, since the `+ Lead`/`+ Log` buttons
were gated but the bell wasn't. Low practical risk (this role never owns
Opportunities or approves gate overrides, so nothing would ever populate
it) but a real escape hatch in principle: clicking through a notification
navigates via `onSelectOpportunity` straight into `OpportunityDetailScreen`,
bypassing the restricted nav entirely. Fixed same pattern as the other two
buttons (`!isMarketingUser &&`). Confirmed gone live after the fix.
Group A now fully passing (sidebar, header buttons, and bell all
correctly restricted).

---

## 2026-09-02 — Audit Trail: migration built and applied, Admin/GM Audit Log screen added same-day, all 5 verification checks pass

**Built per `docs/Audit-Trail-Implementation-Plan.md`** (ADR-017 Phase 1,
brief from 2026-08-31). Migration `0030_add_audit_log.py`: `audit_log`
table, generic `audit_log_row_change()` trigger function (`SECURITY
DEFINER` + `SET search_path = public` — the plan's own flagged highest-
risk detail, since without it the trigger's own insert into the RLS-
protected `audit_log` table would fail RLS and roll back every write to
all 4 audited tables), one `AFTER UPDATE OR DELETE` trigger per table
(account/user_profile/product/opportunity), RLS enabled with an
Admin/GM-only `SELECT` policy in the same migration (not a follow-up —
UAT's `rls_auto_enable()` risk item). CREATE is deliberately not logged
(plan's resolved question 1); UPDATE logs only the fields that actually
changed via a generic `jsonb_each` diff, not a per-table column list.
Basheer applied `alembic upgrade head` to Dev himself; `Physical-
Schema.sql` regenerated via `docker run postgres:17 pg_dump` (Docker
Desktop needed a manual start first) — clean diff, only the 8 new objects
added, nothing else drifted.

**Scope grew same-day: built the Admin/GM "Audit Log" review screen too.**
Originally logged as a deferred follow-up (Phase 1 was meant to be DB-only,
reachable only via direct SQL) — picked up in the same session once
Basheer, verifying live, saw `changed_by` as a raw UUID and asked "how
difficult is it to build that screen now itself." New `backend/app/domains/
audit/` domain (model mapping the existing table, read-only
repository/service/router, `AuditLogService._require_admin` mirroring
`ZoneAdminService`'s same-shaped gate), `GET /admin/audit-log` (paginated,
filterable by table/date range). Frontend: `AuditLogScreen.tsx`, nav-gated
identically to Territory Map/User Directory (`adminOnly: true`, same
`ADMIN_ROLES` set). New `tests/domains/audit/test_audit_log_service.py`
(role-gate + filter-passthrough coverage, mirrors `test_zone_service.py`'s
shape); full backend suite 659/659 passing as of the final combined state
(the parallel Lead Management session's own table/relationship-count
additions to `test_persistence.py` landed in the same window — the exact
in-between counts seen mid-session aren't meaningful, only this final
figure is); `tsc --noEmit`/`npm run lint` clean throughout.

**Two rounds of live-testing-driven refinement, found and fixed same
session (not deferred):**
1. **Raw UUIDs everywhere, not just `changed_by`.** Basheer's first live
   check (an Account's zone changed North Kerala → Malappuram) showed the
   record's own id and the `zone_id`/`updated_by` field *values* as raw
   UUIDs too — `changed_by`'s name resolution didn't cover a diff's
   individual field values. Fixed by adding `record_label` (the row's own
   resolved name, per `table_name`) and `old_data_display`/
   `new_data_display` (parallel dicts, only for fields recognized as a
   known foreign key). Deliberately scoped as a **field-name→target-table
   map** (`zone_id`→Zone, `owner_id`/`created_by`/`updated_by`→
   UserProfile, `stage_id`→OpportunityStage, ~18 entries total across the
   4 tables), not a full per-(table,column) matrix — a real, bounded
   exception to the trigger's own "no hand-maintained list" design
   (plan's resolved question 5), scoped to the display layer only; the
   trigger itself is untouched and stays fully generic. One batched
   `SELECT` per referenced model per page, not per row.
2. **DELETE snapshot too cluttered.** A direct-SQL delete of a test
   Opportunity (Step 3 of the verification plan) correctly captured the
   full 29-column row, but rendering all 29 — most empty (`—`) — was
   unreadable. First fix: hide empty fields by default, keep a "Show all
   N fields" expand. Basheer's follow-up call: go further and collapse
   *all* fields by default (not just the empty ones), single toggle
   reveals everything. UPDATE cards untouched throughout — already lean,
   since they only ever list changed fields.

**Verification plan — all 5 checks passed live against Dev:**
1. Update-diff: Al Shifa Hospital's zone edit produced exactly one
   `audit_log` row (`changed_by` = Basheer K, diff containing only
   `zone_id` + `updated_by`, the two fields that actually changed); an
   immediate no-op re-save produced zero additional rows.
2. CREATE produces zero audit rows: confirmed directly against 3 of the 4
   tables (Account, Opportunity, Product — created live by Basheer,
   `created_by`/`created_at` correct, zero `audit_log` rows each); User
   accepted as covered by the identical, table-agnostic trigger definition
   rather than tested live (creating a test user needs a Supabase Auth
   UUID, a known standing friction point).
3. Direct-SQL DELETE: all 3 test records (Account, Opportunity, Product)
   deleted via the Supabase table editor — each produced exactly one
   `audit_log` row, `action = 'DELETE'`, `changed_by IS NULL` (no app
   session, correct), `new_data IS NULL`, `old_data` containing the full
   final row.
4. Critical regression check (a missing `SECURITY DEFINER` would have
   broken every write to all 4 tables, not just failed to log them):
   covered implicitly — every create/update/delete above went through
   cleanly end to end.
5. RLS enforcement: tested directly at the DB level using the app's own
   `cabio_app` role (not the admin/service connection, which bypasses RLS
   as table owner) with `SET LOCAL app.current_role_id` set per role —
   Area Manager (non-Admin/GM) got 0 rows, Admin and General Manager both
   got all 4 rows. Confirmed again live in the app itself: Shruthi's
   (non-admin) login correctly shows no "Audit Log" entry in the sidebar
   at all.

**Not yet committed** as of this writing — migration file, `Physical-
Schema.sql`, the new `audit` backend domain, and the frontend screen are
all staged but uncommitted, per standing practice (Basheer commits
manually). Conflict-checked against the parallel Lead Management session
throughout: only overlapping files were `backend/app/main.py` and
`Physical-Schema.sql`, both of which the Lead Management session
deliberately left untouched pending this session's commit (see
`active_progress.md`'s Current task 3).

---

## 2026-09-02 — Auth Session Resilience: root cause confirmed via targeted logging, Part A tested, connectivity-banner gap found and fixed, staged for commit

**Context:** picked up from 2026-08-31's mid-debug stop point (`docs/
Progress-Archive-2026-08.md`'s 2026-08-31 (later) entry) — Part B's idle
timeout had one clean success, then an unexplained silent sign-out at
~13-15s with no trace of either `useIdleLogout` or `signOut()` running.
Leading unverified hypothesis: `applySession`'s definitive-401/403-rejection
branch, the one code path with zero logging, firing for an unrelated reason
and bypassing the traced `signOut()` wrapper entirely.

**Diagnostic approach:** rather than guess further, added temporary trace
logging to the two previously-silent spots — the `onAuthStateChange`
listener's event name, and the retry loop's per-attempt failures plus the
definitive-rejection branch itself — then re-tested live.

**Result: hypothesis never fired, bug did not recur.** Four consecutive
manual test runs, deliberately varying the condition that produced the
original failure:
1. Tab watched the whole time.
2. Walked away without watching (tab left focused).
3. Switched to another tab/window and back.
4. A realistic ~1-minute background gap.

All four produced the identical correct sequence (idle timer fires →
`signOut("idle")` → correct "signed out due to inactivity" message), and
the suspect diagnostic logs never appeared once. Conclusion: the two real
fixes already made 2026-08-31 (reordering `signOutReason` before
`supabase.auth.signOut()`, and the `visibilitychange` re-check for
throttled background-tab timers) were the actual fix — the one earlier
silent failure is treated as a non-reproducing one-off, not a standing
bug.

**Part A explicitly tested (previously untested):** stopped the backend
mid-session, reloaded — confirmed no premature sign-out, saw the retry-
then-warn path fire (`auth: /auth/me check failed after retries, keeping
existing session`), landed on a blank login screen (expected, since
on-screen state resets on any reload). Restarted the backend, reloaded
again with no credentials re-entered — confirmed automatic re-entry,
proving the underlying Supabase token was never actually revoked by the
transient failure.

**Real UX gap found from that Part A test, fixed:** the blank-login-screen-
after-reload-during-outage state is indistinguishable on screen from an
actual logout, even though no sign-out occurred. Added a `sessionCheckFailed`
boolean to `AuthContext` (set in `applySession`'s non-definitive-failure
branch, cleared on the next successful check or any explicit `signOut()`)
and a `LoginScreen` banner: "We were unable to verify your session due to
a connectivity issue. Please refresh the page before signing in again."
Confirmed this does *not* fire for the normal in-app case (backend blip
while a tab is already open and focused — Supabase's own `visibilitychange`
-triggered `_recoverAndRefresh` calling `/auth/me`, got a 502, correctly
kept the existing session with no visible disruption at all) — the banner
only matters for the reload-during-outage case specifically.

**Cleanup:** `useIdleLogout.ts` timeout constants restored to real values
(60min/30s/30s); all `// TEMPORARY` debug logging removed from
`AuthContext.tsx`, `useIdleLogout.ts`, `LoginScreen.tsx`. `tsc --noEmit`
and `npm run lint` both clean (0 errors).

**Staged, not committed** (Basheer commits manually per standing
practice) — 6 files: `AuthContext.tsx`, `LoginScreen.tsx`,
`useIdleLogout.ts` (new), `DemoApp.tsx`, `main.tsx`, and
`docs/Auth-Session-Resilience-Implementation-Plan.md` (updated with this
session's verification summary and the two post-design fixes). Conflict-
checked against a parallel session's in-progress Audit Trail work
(`docs/Physical-Schema.sql`, `backend/alembic/versions/0030_add_audit_log.py`,
both uncommitted) — zero file overlap, left untouched.

---

## 2026-09-01 — Engagement History: architecture review, hand-built prototype against real UAT data, leadership deck, and implementation plan

**Context:** picked up from `docs/Relationship-Note-Implementation-Plan.md`
(queued item 4 in the 2026-08-31 four-item list). What shipped is a
materially different design from that plan, arrived at through several
rounds of external architecture feedback plus direct discussion with
Basheer.

**How the design changed, in order:**
1. First external feedback round argued for moving durable context onto
   the *Stakeholder* entity with a plain overwritable field. Rejected —
   conflated "who the note is about" with "how it's stored," and
   contradicted its own cited precedent (Salesforce Enhanced Notes is
   versioned, not a flat column). Recommended keeping the Activity-based
   design plus a dedicated read-side "Engagement History" tab.
2. Second round agreed on keeping the existing +Log button (no new write
   surface) but proposed anchoring notes to Stakeholder via an optional
   `stakeholder_id` FK on Activity. Checked against the schema: the
   `activity_tier_visibility` RLS policy only keys off `opportunity_id`,
   so this would have been cheaper than the original Relationship-Note
   plan estimated — but Basheer declined it directly ("reps can just log
   the name in the note itself... revisit later if required"), so it was
   dropped in favor of a free-text convention.
3. Basheer then reframed the actual goal directly: *"I don't want to give
   reps more things to enter... give something back for what they
   enter."* This is the pivot that killed the manual-entry approach
   entirely — replaced with auto-summarizing existing Activity + Next
   Action data via LLM, on a weekly batch cadence (chosen specifically to
   bound cost/latency, per Basheer's own suggestion) plus an on-demand
   refresh.

**Prototype, built by hand against real UAT data (not synthetic) to
validate the idea before committing to build it:**
- Checked Dev first — activity notes there were too sparse (avg 10-30
  chars) to judge quality. Basheer redirected to UAT, which had
  substantive rep-written notes (56-179 char average, real narrative).
- Manually summarized the top 4 accounts by activity count, in the exact
  5-part format later locked in (`where it stands / key people / what
  they care about / what's blocking / what's next`), then all 58 UAT
  accounts with any logged activity, sorted by activity count. Caught
  UAT being a *live* environment mid-pull — 7 accounts picked up a
  brand-new activity dated the same day, all logged by Haroon in real
  time; refreshed those before finalizing.
- Cross-referenced the `reminder` table (Next Actions) per account,
  surfacing a genuinely new finding: **59% of all open Next Actions
  system-wide are overdue** (38 of 64), and **21 of 79 accounts (27%)
  have never had a single Activity logged**. Neither number was visible
  anywhere in the app before this exercise — found by cross-referencing
  two tables, not by asking a known question.
- Full detail: `docs/Engagement-History-UAT-Preview-2026-09-01.md`.

**Leadership deliverables**, iterated through several rounds of direct
feedback (heading was too clever the first time — "already knows" — final
heading "Turning Activity Logs Into Account Intelligence"; requested
trimmed to two sections only; requested PDF; PDF page-breaks were splitting
cards mid-content — root cause was a CSS rule marking the whole 5-card grid
unsplittable instead of each card individually, causing the browser to push
the entire grid to a fresh page; fixed, then converted to a proper 5-slide
16:9 deck instead of a flowing document once report-style pagination proved
fundamentally fragile for this content):
- `docs/Engagement-History-Leadership-Report-2026-09-01.html` / `.pdf` —
  superseded by the slide version below, kept for reference.
- `docs/Engagement-History-Leadership-Slides-2026-09-01.html` / `.pdf` —
  the one built for actually presenting; 5 fixed-size slides sidestep the
  flow-pagination problem entirely.
- Kept local (not published as a web Artifact) both times it came up —
  real hospital/doctor names, a named competitor loss (lost to Biolight),
  and pricing are in the content.

**Implementation plan written up**, covering both generation triggers
(on-demand sync call, no queue needed at this scale; weekly Render Cron
Job — the first scheduled job this codebase will have, per the standing
gap already noted in `docs/Backlog.md`), storage (one upserted row per
account, not an appended log, with a watermark for cheap staleness
checks), and a data-privacy section raised directly by Basheer ("Aren't
there Python libraries that can do this without data leaving the
server?"). Answered honestly: local NLP (`spaCy`/`sumy`/rule-based) can
extract entities but can't reproduce the reasoning-level insights the
prototype actually demonstrated (contradiction-catching, cross-table
gap-detection) — laid out four options ranked by fit, recommended an
enterprise/zero-retention API arrangement over self-hosting given Cabio's
scale, and left the actual choice as an open decision for leadership, not
something resolved unilaterally.

**Docs touched:**
- New: `docs/Engagement-History-Generation-Implementation-Plan.md` (the
  live plan).
- `docs/Relationship-Note-Implementation-Plan.md` — status header marked
  superseded, pointing to the new plan; kept, not deleted, for the record
  of what was considered and rejected.
- `docs/Backlog.md` — item 4 in the four-item queue updated to describe
  the new plan instead of the abandoned one.

**Open, not resolved:** the data-privacy/LLM-provider decision (§6 of the
new plan) needs Basheer or Cabio leadership to actually decide before any
build work starts. Nothing else in the plan is blocked.

---

## 2026-09-01 — Vijayapura Medical College tender deal: dependency check for Shruthi's delete request

Checked UAT `opportunity` table for "Vijayapura Medical College tender
deal" (id `9bf8ab44-99b1-492b-b900-490052844ae7`) at Basheer's request —
Shruthi asked him to delete it. Zero dependent rows anywhere (Activity,
Document, Opportunity Item, Stakeholder link, Split, Reminder all checked
via `ADMIN_DATABASE_URL`) — record is brand new (created 2026-08-31),
stage "Lead," status "Active," no value set.

Two things flagged back to Basheer, not resolved here:
1. **No `DELETE /opportunities/{id}` endpoint exists in the app** — only
   opportunity-item and stakeholder-link deletes are exposed. Removing
   this record would need a direct DB delete, left to Basheer rather than
   run from this session.
2. **The account link looks possibly mistaken** — it's tied to account
   "New Centre - Dr.Sudhir Pai," which has no obvious connection to
   Vijayapura. Suggested confirming with Shruthi whether this was
   mis-tagged (fix: re-point it) versus a genuine duplicate/mistaken entry
   (fix: delete, safe to do given zero dependencies).

---

## 2026-09-01 — Handover doc found stale on BR-ACC-03; new "Testing narration" rule added to prevent recurrence

**What happened:** session opened with `active_progress.md` still describing
BR-ACC-03 as "staged, awaiting Basheer's commit" — it had actually been
committed the previous day (`e86d49a`, 2026-08-31, 11:35). The doc was
written before the commit and never updated after, then got fed back as
current fact at this session's startup. Basheer flagged it directly:
relying on unreviewed handover docs isn't working.

**Compounding gap:** Basheer separately reported having since completed
the full BR-ACC-03 manual E2E pass (Groups A-G,
`docs/BR-ACC-03-Manual-E2E-Test-Plan.md`), with several bugs found and
fixed along the way — but nothing was logged anywhere at the time
(`active_progress.md`, `Backlog.md`, this archive all silent), and by this
session the specifics weren't recoverable from memory. That detail is
gone for good.

**Fixes applied:**
1. Corrected `active_progress.md` and `Backlog.md` to show BR-ACC-03 as
   committed, with the E2E-pass-completed-but-undocumented gap noted
   explicitly rather than silently marked "done."
2. Added a **"Testing narration"** rule to `CLAUDE.md`'s Session handoff
   section: when a bug is found and fixed during manual/E2E testing, or a
   notable decision/finding comes up in discussion, log it to the current
   Progress-Archive file promptly (brief note, not a full write-up) —
   without waiting to be told to write it down, but without logging every
   turn either (explicitly scoped down after an initial overcorrection).
3. Saved two feedback memories: always check `git log`/`git status`
   before writing or trusting a commit-status claim in a handover doc; and
   the testing-narration trigger itself, so both survive across sessions
   independent of `CLAUDE.md`.

---

## 2026-09-05 — UAT backup: first manual pg_dump taken and verified, copied to external disk

Basheer ran the throwaway-Docker `pg_dump` command settled on 2026-09-04
himself (per the UAT-access safety rule — asked first each time, command
form corrected from the original draft to match: discrete `-h/-p/-U/-d`
flags plus `--no-owner --no-privileges`, not a connection URI). Output:
`cabio_uat_2026-09-05.dump`, 204 KB (custom/gzip format, so smaller than
the raw ~408 KB `public` schema size — expected, not a red flag).

**Verified via `pg_restore --list`** (same throwaway-container pattern,
no restore actually run): 28 tables with matched `TABLE`/`TABLE DATA`
pairs, full FK/index/trigger/RLS-policy set. Cross-checked table count
against `docs/Physical-Schema.sql` (32 tables) — the 4 missing
(`audit_log`, `gate_override_reason`, `lead`, `notification`) are exactly
the tables added by migrations UAT hasn't run yet, consistent with the
known UAT-behind-`main` migration lag (not a dump defect).

Copied to Basheer's external disk — first completed off-machine backup.
**Still no recurring schedule/script** — this was one manual run, not
automation.

---

## 2026-09-05 — Opportunity Notes Privacy: Haroon agreed, implementation plan written

Haroon signed off on the 2026-09-04 brief's recommendation ("hide the notes, not the
deal"), extended to cover both Area Manager and SBU Manager as restricted viewers (SBU
Manager also can't see a GM's notes, mirroring the Area-Manager-vs-SBU-Manager case).
Two scope questions the brief had left open got resolved directly: (1) documents/
attachments stay out of scope — notes only; (2) a viewer looped into a deal via an
existing Split or assigned Reminder sees all notes on it regardless of rank, a
deliberate carve-out rather than a strict hierarchy rule with no exceptions.

**Design:** a role-hierarchy check added to `activity_tier_visibility` (new migration
`0039`, `ALTER POLICY` — same mechanism as `0021`/`0029`), plus a new small helper
`cabio_app_user_role_name(p_user_id)` (mirrors the existing `cabio_app_role_name()` but
resolves an arbitrary user's role, needed to compare the *note owner's* tier against the
viewer's). Confirmed no Python-side duplicate of Activity's visibility logic exists to
also update (unlike `organization/repository.py`'s deliberate mirror of
`opportunity_tier_visibility`) — Activity relies solely on RLS. Confirmed
`reminder_via_activity` needs no separate change (already derives from Activity
visibility). `document_tier_visibility` explicitly untouched per the notes-only scope
call.

Full plan, including the exact SQL, migration shape, and an 8-step manual verification
plan: `docs/Opportunity-Notes-Privacy-Implementation-Plan.md`. **Not yet built** —
migration 0039 doesn't exist yet.

---

## 2026-09-05 (later) — Opportunity Notes Privacy: built, migrated, all 8 steps verified live

Migration `0039_hide_senior_activity_notes.py` applied to Dev by Basheer (direct
DB-touching commands are blocked for this session by the auto-mode classifier).
`docs/Physical-Schema.sql` regenerated same day — also caught up migrations
0032-0038, which had accumulated since the file's last regen on 2026-09-02 (`lead`→
`marketing_lead` rename, `is_marketing_source`, nullable `marketing_lead.account_id`,
`first_viewed_at`, manager update/select rights). Diff reviewed line by line — nothing
unexpected, all of it traces to already-committed migrations plus the new
`cabio_app_user_role_name` function and the tightened `activity_tier_visibility` policy.

**All 8 verification steps passed live**, run by Basheer against Dev:
1. Own notes unaffected.
2. Area Manager (Nishad) blocked from Haroon's (GM) note; opportunity itself stays
   visible.
3. SBU Manager also blocked from the same note; opportunity stays visible.
4. Admin/GM unaffected — see everything.
5. Looped-in carve-out — confirmed with Shruthi (Area Manager) given a split on Basheer
   K's (SBU Manager) opportunity: all of Basheer K's notes became visible to her. (A
   first attempt using Vivek, a Sales Staff rep with a pre-existing split on the same
   opportunity, didn't actually exercise this — Sales Staff was never subject to the
   hierarchy-hide in the first place, split or not, so that case couldn't distinguish
   the carve-out from "never blocked to begin with.")
6. Reverse direction — Shruthi's own notes stayed visible to Basheer K (senior viewing
   junior's notes never blocked).
7. Regression — an ordinary Sales Staff rep's own notes, viewed by themselves,
   unaffected.
8. Documents — Haroon's uploaded document stayed visible to Basheer K throughout,
   confirming `document_tier_visibility` (deliberately untouched) still works.

**Two incidental findings during testing, both confirmed as correct/pre-existing
behavior, not bugs, no action taken:**
- Admin/General Manager can never appear in the Split-participant picker
  (`GET /users?scope=sbu`) — `UserRepository.list_active`'s `scope="sbu"` branch
  (`backend/app/domains/organization/repository.py:83-104`) explicitly filters out
  `UNRESTRICTED_ROLES = {"Admin", "General Manager"}` per BR-FIN-06/ADR-037, since
  their `sbu_id` is only a NOT-NULL placeholder, not real SBU membership. Means Haroon
  can't be added to a split anywhere in the app, discovered when he tried a 50/50 split
  with Shruthi for himself. Same underlying pattern as the whole Notes Privacy feature —
  Haroon personally working deals breaks assumptions built for an overlay-only role —
  flagged as a possible future product question for Haroon/Basheer, not fixed here.
- Removing Shruthi's split from an opportunity outside her own zone made it disappear
  from her pipeline entirely — correct, unrelated `opportunity_tier_visibility`
  behavior (the split was her only path to that opportunity; once gone, none of her
  other visibility branches applied).

**Not yet committed** — migration `0039`, `Physical-Schema.sql`, and both the plan and
discussion-brief docs are staged/uncommitted pending Basheer's manual commit.
