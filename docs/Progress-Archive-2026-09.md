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

---

## 2026-09-05 (later still) — UAT data-quality pass, WON-opportunity immutability gap found

**Account coverage gaps in UAT**, checked via read-only queries (asked/confirmed before
each run per the UAT-access rule):
- 12 accounts with zero Opportunities and zero Activity logged at all — two were
  literal test junk ("Duplicate", "Duplicate."), which Basheer deleted live via the
  app; re-ran the same query afterward and confirmed 10 genuine accounts remain (AJ
  Hospital & Research Centre, al shifa, Archish Fertility Centre & IVF Centre
  Kundalahalli, Aster DM, Forever Women's Clinic, Ganga hospital, Iqraa Hospital
  Vazhakkad, Ramaiah Medical College Hospital, Rangaswamy, Unity Pediatric Centre).
- Broadened to "missing either one": 114 accounts total — 22 have an Opportunity but
  zero Activity logged against it (the more concerning gap, overlaps the existing
  Backlog item on Order-stage/Won deals closing with no Activity), 80 have Activity
  but never became an Opportunity (visited/contacted, not converted), plus the 12
  above missing both.

**Activity-quality spot check, 2026-09-04/05 (52 entries):** mostly solid — named
contacts, products, next steps. Flagged: Dr.Moopen's Medical College (Haroon) logged
"Done" twice, one minute apart, identical text — looks like an accidental double-
submit, not two real interactions. A few other generic entries (Santhi Hospital
Omesseey "Po collected", KIMS Hospital Koduvally's 09-05 call, Medical Trust
Hospital's typo-heavy note) lack any name or clear outcome. Om Hiremath's 6
back-to-back Vijaynagar visits (16:26-16:34) are a good example of consistent,
specific logging — same standard as Vivek's entries, already cited in the
data-quality Backlog item. No action taken beyond noting it.

**Real bug found: WON/LOST opportunities aren't actually immutable (BR-OP-09 gap).**
While investigating a report from Nishad (Area Manager) that he couldn't edit an
item's price on an opportunity he owns that's marked WON, Basheer (Admin) tried the
same edit himself and it went through with no error. Traced the discrepancy: BR-OP-09
says WON/LOST records "remain immutable" and require audit capture for any
administrative edit, but only the `status_id` field is actually protected —
`OpportunityService.update_opportunity`'s field-update loop
(`backend/app/domains/opportunity/service.py:246-247`) runs unconditionally before any
terminal-status check, and `add_item`/`replace_items` (lines 389-438) have no
terminal-status check at all. Confirmed at every layer: router, service, the
`opportunity_item_via_opportunity` RLS policy (visibility-only, no status check), and
the frontend's `ProductsTab` (no status or role prop passed in at all). Also confirmed
there's no role-based edit gate anywhere for opportunity items — Admin/GM's only real
structural advantage is the `opportunity_tier_visibility` overlay-tier clause
(unconditional access to every opportunity, any zone/SBU/owner), which doesn't apply
here since Nishad owns the opportunity in question and should have passed RLS on
ownership alone.

**Nishad's specific block is still unexplained** — no code path found that would stop
an owner from editing their own WON opportunity's items, Admin or not. Without an
exact error message or repro from him, this is logged as an open question, not
resolved. Attempted to check UAT data directly for historical evidence of post-WON
edits (`opportunity_item.updated_at > created_at` on currently-WON deals) — the query
came back empty, but that result is **not meaningful**: `OpportunityRepository.
replace_items` (`repository.py:248-262`) deletes and reinserts every line item on
every save, so an edited item always gets a fresh, identical `created_at`/`updated_at`
pair. There is no reliable way to detect a post-close item edit in UAT's existing
data — it would need either the audit trail extended to `opportunity_item` (noisier
than `opportunity`'s own trigger, since a full delete-and-reinsert has no clean diff)
or a dedicated `won_at`/`closed_at` timestamp column, ideally both. Neither exists
today. Logged to `docs/Backlog.md`, including Basheer's explicit requirement that any
fix preserve an Admin/GM correction path for genuine data-entry mistakes, not just
lock the record down.

---

## 2026-09-05 — UAT backup: recurring script built and committed, split from an unrelated parallel-session commit

Built `scripts/backup_uat.ps1`: daily `pg_dump --schema=public` via a throwaway
`postgres:17` Docker container (same version-matched approach as the prior manual
dump), reading `ADMIN_DATABASE_URL` from `backend/.env.uat` at runtime rather than
hardcoding it. Writes to `C:\Backups\CabioUAT`, prunes dumps older than 14 days,
copies to Google Drive (`G:\My Drive\CabioUATBackups`) when that path exists —
Google Drive for Desktop isn't installed on this machine yet, confirmed by checking
`Get-PSDrive` and common mount paths, so that step will silently skip (logged as a
warning) until Basheer installs it. External-disk copy stays a separate manual
weekly step, per Basheer's explicit call, rather than folding it into the script.

**Decisions, all Basheer's:** daily run at 07:30 IST; Task Scheduler trigger set to
"only when logged in" (avoids storing a Windows password, accepted the tradeoff that
the task won't fire if the machine is locked/off at that time); 14-day local
retention. The one-time `Register-ScheduledTask` command was handed to Basheer to run
himself, not run by Claude — matches the standing pattern of Basheer running
DB-touching/system-level commands directly.

**Committing this ran into an unrelated, already-uncommitted parallel-session
change:** by the time this was ready to commit, `active_progress.md` showed
Opportunity Notes Privacy (migration `0039`) had been separately built, migrated, and
verified live against Dev by Basheer directly in this same working tree — a second,
fully unrelated uncommitted feature. Split into 4 commits rather than bundling
everything: `552c0ee` (Opportunity Notes Privacy feat), `ec8b2c4` (this backup
script), `a135ae7` (docs catch-up for both threads), and a small follow-up `57b202d`
— two doc corrections (citing the actual commit hashes for the two feat commits) were
made *after* `a135ae7`'s `git add`, so they were left sitting unstaged post-commit;
staging is a snapshot, not a live link to the file. Caught by re-running `git status`
after "everything committed" was reported, per the standing rule to verify handover
claims against git rather than trust them.

---

## 2026-09-05 — Hospital "Name, City" enforcement: architecture discussion, ends in a naming-convention-only decision, nothing built

Basheer asked whether the Add/Edit Hospital screens could enforce "always add the
city after the hospital name." Investigated the current data model first:
`Account` (`backend/app/domains/account/models.py`) has no `city` field at all —
only `zone_id`, which is a *region* (North Kerala, South Kerala, Bangalore,
Mangalore), not a city; `name` is a single free-text column, and
`AddHospitalModal.tsx` has exactly one `Name *` field. No existing structured place
for "city" to live.

**Three approaches surfaced and compared:**
1. **Soft pattern rule on the existing `name` field** — cheapest, but easy to game
   and not real queryable data.
2. **Dedicated `city` reference table** (id, `zone_id` FK, name) + `account.city_id`,
   a `CityPicker` component mirroring `ZonePicker.tsx`, and a shared
   `formatAccountLabel()` helper swapped into every account-name display site.
3. **Reuse the Zone tree's `TALUK` level to mean "city"** — surfaced because
   `Zone.zone_level` (`backend/app/domains/reference/models.py:60`) already includes
   `DISTRICT`/`TALUK` as advisory levels, never actually populated, and `BR-ACC-03`'s
   own zone-branch dedup logic (`docs/Business-Rules.md:253`) already anticipates an
   Account's `zone_id` being set at a level deeper than `ZONE` — the data model was
   seemingly left open for exactly this. Checked `TerritoryAdminScreen.tsx` directly
   to confirm the real cost: it renders the *entire* zone tree at any depth as one
   flat Admin/GM rep-territory-assignment view (`ZONE_LEVELS` at line 34), so ~90+
   city-only `TALUK` leaves would sit inside the same screen used to govern rep
   assignment — a real coupling risk, not theoretical.

Basheer chose **Option 2** first, specifically to keep "city" (a hospital attribute)
separate from "zone" (the RLS/territory-assignment boundary). Two follow-on
governance questions were then raised — who can add a new city to the picklist
(Admin/GM-only vs. any rep inline), and how to backfill the ~90 existing accounts
with no city on file (CSV round-trip vs. manual per-account UI entry, Basheer chose
manual UI entry) — and at that point Basheer judged the whole thing not worth the
build cost for what it delivers.

**Final decision: no schema change, no new table, no picker.** "Hospital Name, City"
becomes a naming *convention* on the existing free-text `name` field only — reps
type the city into the name themselves (e.g. "EMS Cooperative Hospital, Kozhikode"),
with zero code enforcement. Two minimal artifacts were proposed to support the
convention (a placeholder-text hint in `AddHospitalModal.tsx`'s Name field, and a
short note in `docs/Business-Rules.md` documenting the expected format) but **neither
is built yet** — Basheer's next call whether to do even that much.

## 2026-09-06 — UAT backup: Docker Desktop auto-start/stop added to the script, verified live end-to-end

First manual run of `scripts/backup_uat.ps1` this session **failed immediately**:
Docker Desktop wasn't running (`failed to connect to the docker API at
npipe:////./pipe/dockerDesktopLinuxEngine`). Basheer flagged the real problem —
scheduling a script that assumes Docker is already up defeats the point of
scheduling it unattended.

**Fix, round 1:** added `Ensure-DockerRunning` — check `docker info`, and if it
fails, `Start-Process` the Docker Desktop exe and poll every 5s up to a 90s
timeout before giving up with a clear log line. First re-run **still failed
immediately**, before the poll loop could even run: `$ErrorActionPreference =
"Stop"` (set script-wide) turned the native `docker info` command's stderr
output into a terminating `NativeCommandError` the instant it ran — a known
PowerShell 5.1 quirk (redirecting a native command's stderr wraps each line as
an ErrorRecord and sets `$?` false even on success). **Fix, round 2:** extracted
`Test-DockerUp`, which locally scopes `$ErrorActionPreference = "SilentlyContinue"`
around the `docker info *> $null` call so only `$LASTEXITCODE` is read, not the
stream. Re-ran: Docker Desktop launched, came up after 5s, `pg_dump` produced
`cabio_uat_2026-09-06.dump` (234,055 bytes) in `C:\Backups\CabioUAT`, all logged
correctly to `backup_log.txt`.

**Design discussion, prompted by Basheer:** leaving Docker Desktop running
unattended all day (e.g. via its own "start on login" setting) just to cover a
once-daily backup wastes RAM/CPU for no reason. Basheer's counter-proposal,
adopted: tie the whole run to logon instead of a fixed clock time — the script
starts Docker itself (already built), runs the dump, and now also **stops Docker
Desktop again afterwards, but only if the script itself was the one that
started it** (tracked via `$script:DockerStartedByScript`, checked in a
`finally` block so it runs on both success and failure paths) —
`Stop-Process -Name "Docker Desktop"` plus `wsl --shutdown` to release the WSL2
VM's memory too. Google Drive mirror step commented out for now (not installed
yet) — everything else in the script unchanged. Not yet re-tested against a
cold Docker-not-running state after this change (today's verification run
happened before this edit); the shutdown path itself hasn't been observed live
yet. Scheduled-task registration also not done — trigger will be `-AtLogOn`
instead of the originally planned `Daily -At 7:30AM`, once the shutdown path is
confirmed.

**Next step, Basheer's to do:** re-run the script tomorrow to confirm Docker
Desktop actually starts and then shuts down cleanly end to end, then register
the `-AtLogOn` scheduled task.

## 2026-09-07 — Near-Duplicate Hospital Warning: Haroon decided Option B

**Trigger:** Basheer was compiling the list of unreleased-to-UAT commits to
showcase to Haroon for signoff, found BR-ACC-03 (near-duplicate hospital
warning, `e86d49a`) still marked "prototype, pending Haroon's decision" in
`docs/Business-Rules.md` and the decision brief. Confirmed the code
(`backend/app/domains/account/service.py:138-159`,
`account/duplicate_matching.py`) already implements Option B specifically —
soft-block warning with `force_create=true` override, not an Admin-only
create restriction (which would have been Option A).

**Decision:** Haroon has chosen Option B. Updated `docs/Business-Rules.md`
(BR-ACC-03 header/status) and
`docs/Duplicate-Hospital-Decision-Brief-2026-08-29.md` (status line) from
"awaiting decision" to "decided 2026-09-07, approved for rollout as-is."
No code change — the prototype built 2026-08-30 already matches what was
approved. Still not yet deployed to UAT (`e86d49a` is on `main`, not
`origin/uat`); goes in this week's UAT showcase/signoff batch alongside the
other 33 commits ahead of UAT.

## 2026-09-07 (later) — Audit trail scoping beyond the original 4 tables; opportunity_item/split root-cause found; UAT verification; Audit Trail Extension plan written

**Trigger:** while finalizing the Haroon signoff feature list, Basheer asked
which other tables should get the same audit trail as account/user_profile/
product/opportunity (`099e54c`), starting from his own observation that
`opportunity_item` price/quantity edits aren't tracked.

**Scoping discussion, ranked by risk:** recommended `opportunity_item` →
`split` → `stakeholder` → `marketing_lead` (already a known Backlog gap) →
`user_zone` → `target_plan`. Basheer correctly pushed back twice: (1)
`stakeholder` was initially waved off as low-stakes — wrong, it holds the
actual contact channel (email/phone/WhatsApp) to customer decision-makers
plus `nps_score`/`sentiment`, both plausible tampering/error targets, added
to scope. (2) `user_zone` dropped for the right reason — confirmed via code
(`organization/service.py:14,90-92`) it's already gated to Admin/General
Manager only (`_USER_WRITE_ROLES`), a small enough trusted circle that an
audit trail adds little. `target_plan` deferred, not dropped — feature
isn't built yet — logged as its own Backlog item.

**Real finding: `opportunity_item` and `split` don't do in-place UPDATE at
all.** Both are edited via delete-all-then-reinsert
(`opportunity/repository.py:249-260`, `:292-301`) — so the existing generic
audit trigger would only ever see a DELETE (old values) with no paired
"changed to" entry, not a clean before→after diff. First proposed accepting
this as a known trade-off ("look at the current row for the new value") —
**Basheer rejected this outright** ("that is ridiculous"), correctly: a
usable audit log needs one readable before→after entry, not a
delete-and-infer workaround.

**Traced the design's actual origin, since Basheer suspected a compelling
technical reason was being missed — there wasn't one.** `docs/API-
Catalog.md:105-111` (Architecture Freeze v1.0, long before ADR-017 existed)
states the entire justification: "`PUT` (bulk replace) handles deletions
inherently without needing explicit `DELETE` endpoints" — an endpoint-count
shortcut for Phase 1, not a performance or concurrency decision (confirmed:
no latency difference at this row count either way). `docs/ADR.md:45`'s
SBU-grandfathering rule was built around the same behavior, confirming it
was a known, deliberate trade-off at the time — just one nobody revisited
once the audit trail came along later. The original prototype screen
(`sales-os-app/src/App.jsx`, referenced in `docs/Traceability-Matrix.md:57-
58`) already had "edit an in-memory list, Save once" before there was a
formal backend, and the later API was built to match that existing UI
rather than reconsidering it.

**Fix identified:** thread each row's real identity through the save path
so an edit becomes a genuine UPDATE — `opportunity_item` needs its `id`
added back into the save payload (the frontend already has it in
`editItems`, `OpportunityDetailScreen.tsx:380-384` currently strips it
before sending) plus a schema/repository change to upsert instead of
replace; `split` needs no frontend change at all, since `(opportunity_id,
user_id)` is already a natural unique key the UI already enforces.

**UAT verification, asked/approved before each query per the standing
rule:** direct `DATABASE_URL` query first reported `opportunity` = 0,
`opportunity_item` = 0, `split` = 0 against real `account` (211)/
`stakeholder` (134)/`user_profile` (17) counts — correctly flagged as
suspicious rather than taken at face value. Root cause: `DATABASE_URL` is
RLS-constrained and returns 0 rows with no error on protected tables when
queried outside the app's request context — not evidence of an empty
table. The `ADMIN_DATABASE_URL` credential (bypasses RLS) would give the
real number, but invoking it tripped the Claude Code auto-mode classifier
even for a plain read-only SELECT; Basheer ran it himself and reported
back: **108 opportunities, 0 split rows** in UAT. Zero `split` rows means
zero legacy-data risk for that half of the fix — nothing to reconcile.
New finding saved to memory (`cabio_uat_rls_silent_zero_rows`) so a future
session doesn't repeat the same false-empty-table mistake.

**Output:** `docs/Audit-Trail-Extension-Implementation-Plan.md` written,
same structure as the original `docs/Audit-Trail-Implementation-Plan.md`.
**Start date set to 2026-09-10** — deliberately after the 2026-09-08 UAT
batch has a week to stabilize, per Basheer's explicit sequencing call.
`docs/Backlog.md` and `.claude/active_progress.md` both updated with
pointers (Current task 0b). No code written yet — planning only.

## 2026-09-08 — UAT deployment: 9-feature batch promoted, 16 migrations
(0023 -> 0039)

**Milestone: the biggest single UAT promotion since 2026-08-21** — 36
commits, 16 migrations, 9 user-facing features (Marketing Lead Handling,
Private Manager Notes, Audit Trail, Manager-Approved Fast-Tracking, New
Activity Types for Team Development, Relationship-Support Notes, Reminders
on Login, Deal Assignment Alerts, Duplicate Hospital Warning). Team told to
stay off UAT beforehand via WhatsApp. Full step-by-step record, including
every command run: `docs/UAT-Migration-2026-09-08.md` — this entry is the
narrative summary only.

**Pre-flight audit caught a live bug before it happened.** Reading each
pending migration ahead of running anything found that `0027`
(`gate_override_reason`) creates a new table with no RLS policy of its own
— same shape as `hold_reason`/`loss_reason` (no RLS at all on Dev), but UAT
carries the standing out-of-band `rls_auto_enable()` Supabase trigger
(`docs/Backlog.md`, first flagged 2026-08-05) that force-enables RLS with
zero policies on any new table regardless of what the migration itself
does. This would have silently emptied the Fast-Track reason dropdown —
**this is the 3rd time this exact trigger has caused a lockout** (2026-08-03
UAT-wide, 2026-08-21 on `user_zone`/`zone_closure`). Planned the fix
(`ALTER TABLE gate_override_reason DISABLE ROW LEVEL SECURITY`) ahead of
time instead of waiting for a bug report. `docs/Backlog.md`'s standing item
updated with this 3rd occurrence — still needs Basheer's call on the
permanent fix (remove the trigger vs. mandatory migration-checklist step).

**Execution, in order:** Basheer took a fresh UAT backup
(`scripts\backup_uat.ps1`) before anything else; Claude pushed `main` to
`uat` (`git push origin main:uat`, fast-forward, `81fded7..dbfaea1`),
triggering Render's auto-redeploy of both services; Basheer confirmed both
Live, then ran the migrations himself (DB-mutating commands stay outside
Claude Code's tool access on this project) via
`.venv/Scripts/python.exe -m alembic upgrade head` against
`ADMIN_DATABASE_URL` sourced from `backend/.env.uat`.

**One real snag, caught before touching the database:** the first
migration attempt failed on a `pydantic_settings` `SettingsError` for
`CORS_ORIGINS` — sourcing `.env.uat`'s values into the real shell
environment (`set -a; source ...`) makes pydantic-settings demand strict
JSON for list-typed fields, stricter than its normal `.env`-file parser,
and `.env.uat`'s `CORS_ORIGINS` isn't JSON-formatted. Alembic never reads
that setting, so `unset CORS_ORIGINS` before retrying was sufficient — no
file edited, nothing UAT-side touched by the failed attempt. Retry: clean
`0023 -> 0039`, confirmed via `alembic current` -> `0039 (head)`.

**`gate_override_reason` fix confirmed necessary, not just theoretical:** a
read-only check immediately after migrating showed `relrowsecurity = True`
with zero policies, exactly as predicted — fixed with the planned `ALTER
TABLE ... DISABLE ROW LEVEL SECURITY`.

**Smoke test — 3 logins instead of 9 separate feature checks,** per
`Deployment-Topology.md`'s promotion ritual: found `rudrappa@cabio-uat.com`
had the most open reminders via a quick read-only query (reused for the
next Reminders-related test, saved in `docs/UAT-Migration-2026-09-08.md`),
used him for Pass 1 (rep-facing checks); `shruthi@cabio-uat.com` (his Area
Manager) for Pass 2; `haroonsidheeq@cabio-uat.com` (GM) briefly plus Admin
for Pass 3, specifically to confirm a senior manager's private note is
hidden from an Area Manager below them but visible to Admin/GM. All 9
features passed, no issues found. WhatsApp sent to the team, app reopened.

**Standing items untouched by this migration, still open in
`docs/Backlog.md`:** the `rls_auto_enable()` permanent fix (now 3
occurrences); Current task 0b (Audit Trail Extension) still starts
2026-09-10 as planned, one week after this batch, to let it stabilize
first.

## 2026-09-08 (later) — UAT backup TOC-verify step added; two Haroon asks scoped

**UAT backup script hardened.** `scripts/backup_uat.ps1` now runs
`pg_restore --list` against the freshly-created dump right after `pg_dump`
succeeds, counts TOC entries, and logs `Verify: TOC has N entries` — throws
(marks the run `FAILED`) on a non-zero exit or a zero-entry result, so a
corrupt/truncated dump no longer passes silently. Verified live twice same
day: first run pre-migration (245,483 bytes, 311 TOC entries), second
post-migration after the `main` → UAT promotion earlier today (273,715
bytes, 361 entries — the jump is expected, reflecting the newly-migrated
schema/data). Also confirmed by reading the log: the second run found
Docker already up (started by something else in the ~77 min gap — the
migration work, most likely) and correctly left it running rather than
stopping it, since the script only stops what it itself started
(`$script:DockerStartedByScript`). Basheer separately confirmed Docker was
fully closed sometime after that run; the log shows the script did not do
that stop (no such log line for the second run) — whatever closed it did
so outside the script.

**Haroon called with two feature asks, both scoped, neither built:**
1. **Notify the assigned rep when a manager logs a `MANAGER_NOTE`
   against them.** Confirmed cheap: the `notification` table
   (`backend/app/domains/notification/models.py`) was deliberately built
   generic when `OPPORTUNITY_ASSIGNED` shipped, specifically to carry
   future types like this with no migration. Activity's own `user_id` is
   already defined (BR-ACT-04) as "the person the interaction is logged
   against," so it's the recipient with no new field needed. Open call
   for Basheer/Haroon: urgent vs. passive notification — recommended
   passive. Logged in `docs/Backlog.md`.
2. **Inline comments on a specific logged Activity**, so a manager can
   react to the exact entry rather than logging a separate, disconnected
   `MANAGER_NOTE`. Confirmed Activity has no update/edit endpoint at all
   today (create-only, matches its documented immutability) — a comment
   thread needs its own new table, not a field on `activity`. Full design
   drafted: `docs/Activity-Comment-Implementation-Plan.md` — new
   `activity_comment` table, RLS gated on `activity_id IN (SELECT id FROM
   activity)` so it inherits the Activity's own visibility rules
   (including the `0039` Opportunity Notes Privacy hierarchy-hide) for
   free, no new role logic. Three open product decisions before build:
   who can comment, one-way vs. two-way thread, and edit/delete. Neither
   item started — both awaiting Basheer/Haroon's decisions, tracked in
   `docs/Backlog.md`.

**Kanban bug found via Fahad's UAT review comment, fixed same day:**
Delivery & Installation stage (`DELIVERY_INSTALLATION`, `display_order`
70 in `opportunity_stage`, fully gated backend-side —
`validators.py:106-112` requires PO Number to advance into it) never
appeared as a column in the Pipeline Kanban view. Root cause:
`OpportunityPipelineScreen.tsx`'s `PIPELINE_STAGE_CODES` hardcoded array
stopped at `ORDER`, never including the later stage — any opportunity
that reached it just had no column to render in on Kanban (List view
unaffected, no such filter there). Fixed: added `"DELIVERY_INSTALLATION"`
to the array (`OpportunityPipelineScreen.tsx:36`).

## 2026-09-08 (later) — Account picker silently truncated at 100 hospitals,
found live right after the UAT promotion, fixed in 4 places

**Reported urgent, same day as the 9-feature UAT batch:** the "+Lead"
button's Account dropdown wasn't showing the full hospital list. Root
cause, not caused by the migration: `LogActivityModal.tsx` (and, once
audited, three siblings) fetched accounts via a single
`listAccounts({ page_size: 100 })` call with no search, rendered as a
plain `<TextField select>` — the backend's own `/accounts` endpoint hard-
caps `page_size` at 100 (`account/router.py:44`, `le=100`), so once real
UAT hospital count passed 100 (confirmed 211, 2026-09-07 count), anything
past the first page silently never showed up. Existed since the picker
was first added (`f14e4c3`, 2026-06-30) — just never crossed the
threshold until now, coincidentally the same day as the migration.

**Audited every account picker in the app for the same pattern** before
fixing anything — found 3 more with the identical shape, two of them
(`QuickLeadModal.tsx` and `ProjectDirectoryScreen.tsx`) even sharing one
React Query cache key (`["accounts","picker"]`, both `page_size: 100`) by
explicit design per a comment in `ProjectDirectoryScreen.tsx`. Confirmed
`Customer360Screen.tsx`, `AddHospitalModal.tsx`, and
`CustomerDirectoryScreen.tsx` already search server-side — used
`Customer360Screen.tsx`'s parent-account `Autocomplete` (debounced,
`listAccounts({ search, page_size: 20 })`) as the template. Checked Users
and Product Catalog pickers too — same pattern not found there.

**Fixed in Dev, all four with the same approach** (frontend-only, no
backend/migration change): `LogActivityModal.tsx`, `QuickLeadModal.tsx`
("+Lead" — the reported bug), `ProjectDirectoryScreen.tsx` ("Add
Project"), `MarketingLeadCreateModal.tsx`. `QuickLeadModal.tsx` was the
one real complication — its Account field stays populated from
`initialAccountId` when "+Lead" is opened with context (Customer 360,
Opportunity Detail, a Project), and the picker no longer preloads the
full list to resolve that id's name against. Solved with a
three-state `selectedAccount` (`undefined` = no manual pick yet, falls
back to a small `getAccount(initialAccountId)` lookup's name; `null` =
explicitly cleared; an object = explicitly picked) rather than a
`useEffect` + `setState`, specifically to avoid the
`react-hooks/set-state-in-effect` lint error that first draft hit.

**Verified:** `tsc --noEmit`, `eslint` (0 errors project-wide, only
pre-existing `any` warnings), `npm run build`, and the Tailwind guard all
clean. Basheer manually tested all 4 forms in Dev — context-prefilled
"+Lead", the inline "+ Add Hospital" create/use-existing paths, the
Project-dropdown dependency on the selected account, clearing a
selection, submit validation (required vs. optional account), and "+Log"
from a fixed-context screen (picker correctly stays hidden) — all passed,
no issues found.

**Committed `a4cf3d9`** ("fix: search accounts server-side in Log
Activity, New Opportunity, Add Project, and New Marketing Lead pickers" —
4 files: `LogActivityModal.tsx`, `QuickLeadModal.tsx`,
`MarketingLeadCreateModal.tsx`, `ProjectDirectoryScreen.tsx`). Not yet
promoted to `uat` — plain `main` -> `uat` push whenever next promoted,
no migration needed since nothing here touched the schema.

## 2026-09-08 (later still) — Manager Note notification built

Built per `docs/Manager-Note-Notification-Implementation-Plan.md`, all
decisions from earlier today (urgent + passive, manager ticks "Urgent"
at note-creation time). Not yet committed — awaiting Basheer's live test.

**Backend:** `ActivityCreate` gains `is_urgent` (validator rejects it on
any type but `MANAGER_NOTE`). `ActivityService` gains a
`notification_service` dependency; `log_activity` calls the new
`NotificationService.notify_manager_note_added` after creating a
`MANAGER_NOTE`, skipped when the manager logs one against their own name.
`notify_manager_note_added` is the first `notify_*` method where
`is_urgent` is a real caller-supplied value, not hardcoded `False`.

**Real gap found while wiring the notification bell's click-through, not
anticipated in the plan doc:** every existing notification type's
`entity_id` doubles as the id the frontend navigates to (`entity_id` =
opportunity id for `OPPORTUNITY_ASSIGNED`). `MANAGER_NOTE_ADDED`'s
`entity_id` is the *Activity* id, which has no detail screen of its own —
navigating needs the Activity's `account_id`/`opportunity_id` instead,
which `NotificationResponse` had no field for. Fixed: `Notification
Repository._enriched_select` gained an `entity_type == "activity"` outer
join (resolving `account_id`/`opportunity_id` straight off the `activity`
row, plus the account name via a second aliased `Account` join, same
`case()` pattern as `opportunity`/`marketing_lead`); `NotificationResponse`
gained both fields.

**Second gap found the same way:** `GET /opportunities/{id}` marks
`OPPORTUNITY_ASSIGNED` read as a side effect, but that only matches
`entity_type == "opportunity"` — a `MANAGER_NOTE_ADDED` row
(`entity_type == "activity"`) would never get marked read that way, and
there's no single-entity GET route for an Activity to piggyback on
either. Added a new `POST /notifications/mark-read` endpoint (`entity_
type`/`entity_id` body, `mark_read_for_entity` pass-through, `204`,
matching the `rebuild-closure` no-body-response convention already used
elsewhere) and a frontend `markNotificationRead()` call fired explicitly
from `NotificationBell.tsx`'s `handleSelect` before navigating.

**Frontend:** `LogActivityModal.tsx` — "Urgent" checkbox shown only when
`isManagerNote`, cleared on switching to any other type (same pattern as
the existing Relationship-Support opportunity-clear). `NotificationBell.
tsx` — new `describe()` case, new `handleSelect()` branch checking
`opportunity_id` first (opens the Opportunity's own Activity tab via
`onSelectOpportunity`'s already-existing but previously-unused `detailTab`
param) then falling back to `account_id` (new `onSelectAccount` prop,
Customer 360's Activity tab). `DemoApp.tsx` — `handleSelectAccount`
previously *always* hardcoded the Overview tab; widened to accept an
optional `initialTab` so this case can request Activity directly, with
every existing caller unaffected (defaults to `undefined`, same behavior
as before).

**Verification:** 10 new backend tests (schema validator, service
notify-and-skip-self-notify behavior, `NotificationService` row shape,
router-level `account_id`/`opportunity_id` serialization) — 695/695
backend tests pass. Regenerated `types/api.ts` against a locally-run
backend to pick up the new fields/endpoint before touching frontend code.
`tsc --noEmit`, `eslint` (0 new warnings — only pre-existing `any`
warnings elsewhere), and `npm run build` all clean.

**Files touched, none committed yet:** `activity/schemas.py`,
`activity/service.py`, `activity/router.py`, `notification/service.py`,
`notification/repository.py`, `notification/schemas.py`,
`notification/router.py`, `LogActivityModal.tsx`, `NotificationBell.tsx`,
`DemoApp.tsx`, `services/notifications.ts`, plus test files
`test_activity_service.py`, `test_notification_service.py`,
`test_notification_router.py`.

**Next: Basheer live-tests** — log a Manager Note against a rep both
urgent and passive, both Account-only and Opportunity-tied, confirm the
bell shows the right message, click-through lands on the correct tab
(Opportunity's Activity tab vs. Customer 360's), and the notification
marks read. Then commit.

## 2026-09-08 (later still) — Manager Note notification live testing: one confirmed bug, one root cause found, one unresolved DB-read mystery — session ended here

Basheer began the 15-case manual E2E plan (`docs/Manager-Note-
Notification-Manual-E2E-Test-Plan.md`) as Fazal → Fahad, then Haroon →
Shruthi/Fazal. First report: no bell notification and no urgent dialog
fired at all for either recipient, despite the Activity itself saving and
showing correctly in the Opportunity's Activity tab.

**Bug 1, confirmed and real, not yet fixed:** `UrgentNotificationDialog.tsx`
was never actually touched during the build — the implementation plan
incorrectly stated "no changes needed." It's hardcoded for its original
single use case: title is literally `"Urgent: IndiaMART Lead(s)"` and the
body always reads "...respond within 4 hours for buylead credit,"
regardless of what triggered it. Its `handleReview` also still does
`onSelectOpportunity({ id: n.entity_id, ... })` unconditionally — correct
for every existing type (where `entity_id` doubles as the opportunity id)
but wrong for `MANAGER_NOTE_ADDED`, where `entity_id` is the Activity id
and there's no `account_id`/`opportunity_id` branching like
`NotificationBell.tsx` now has. This is why Haroon's urgent note to Fazal
did show *a* popup, just with the wrong (IndiaMART) copy and broken
click-through. **Fix needed:** extract `NotificationBell.tsx`'s
`describe()` into a shared util both components import; give
`UrgentNotificationDialog` the same `opportunity_id`/`account_id`
branching + `onSelectAccount` prop + `markNotificationRead` call as
`NotificationBell`'s `handleSelect`; wire `onSelectAccount` into its
`DemoApp.tsx` call site (currently only `onSelectOpportunity` is passed).

**Root cause found for the "nothing happens at all" reports, via direct
DB reads (Dev, read-only, impersonating each user via the same
`set_config('app.current_user_id', ...)` call `session.py`'s
`set_rls_context` makes per-request — safe, mirrors what the app itself
does for that user's own session, not a privilege bypass):** both the
Fazal→Fahad row and the first Haroon→Shruthi row had `user_id` equal to
the **actor's own id**, not the intended rep — e.g. Fazal's note (text
"Hi Fahad, Please respond to customer in 2 days...") saved with
`user_id=Fazal`, `created_by=Fazal`, both identical. My code deliberately
skips notifying when a note is logged against yourself, so it did exactly
that, correctly, twice. `LogActivityModal.tsx`'s "user" field
(`:329-341`) has **no label at all** and defaults to "Me" — correct for
every other activity type (you're logging your own call/visit) but the
one type where that default is almost always wrong. The Activity
Timeline's own display (`ActivityTimeline.tsx:83`, `activity.user.
display_name`) then shows the actor's own name next to a note addressed
to someone else in the free text, which reads as a glaring mismatch once
you notice it but is easy to miss while filling the form. **Confirmed via
a direct, rolled-back reproduction through the real `ActivityService.
log_activity` code** (not a guess): a genuine cross-person case (Haroon
creates, Fazal as `user_id`) ran with no exception and would have created
the notification correctly. **Fix needed:** label that field; for
Manager Note specifically, make unmistakable that it means "who this note
is about," and don't silently default it to self for that one type.

**Unresolved as the session ends:** later live tests (opportunity "USG
M/c - Test Aug 18"; a new opportunity on the Al Shifa Hospital account;
Activity id `e9d9ef21-0494-4027-be13-49cb2937ab29` with `user_id`
confirmed by Basheer as Fazal's `14e64ec3-438e-4a68-85d9-0a0634e4f202`)
do not appear in the Dev database at all via the same read-only query
approach that successfully found the two earlier rows — not by id, not
by id prefix, not by note-text search, under Haroon's (GM, broadest
visibility) impersonation. Ruled out along the way: wrong frontend URL
(confirmed `localhost:5173/demo`); a `DATABASE_URL` shell-environment
override left over from the same day's UAT migration work (confirmed
`echo $DATABASE_URL` in the backend's terminal is empty, so it falls back
to `backend/.env`'s Dev connection, `config.py`'s `env_file=".env"` is
also relative to the backend directory, which the terminal was already
in); stale/unbuilt code (confirmed the running server, started 10:16:48Z
via `uvicorn app.main:app --reload`, serves the new `/notifications/
mark-read` route). Then a genuinely confusing signal: a row found earlier
in *this same debugging session* (the Fazal→Fahad one) later came back
empty from what should have been the same query, suggesting the read
path itself (Supabase's pooler, `aws-1-ap-south-1.pooler.supabase.com`)
may not be fully consistent for these ad-hoc read-only scripts, not
necessarily that the rows never existed. Last question asked and not yet
answered when the session ended: whether the Supabase project reference
Basheer sees in Studio's URL matches `drwtvgesygbsglzpnomi` (the project
`backend/.env`'s `DATABASE_URL` points at) — comparing that is the fastest
way to either confirm a genuine environment split or rule it out for good
and go back to the code.

**Basheer's assessment, stated directly:** frustrated with the quality of
this build — "sloppy coding for first time in many weeks." The
`UrgentNotificationDialog` miss is a legitimate gap (the plan doc said no
changes were needed there and that was wrong); the unlabeled-field
default is a real design miss too, not just a testing artifact. Session
ended here at Basheer's request, to resume fresh.

## 2026-09-08 (later still) — SBU Manager blocked from Add Hospital by two
independent zone-gate checks, both fixed

**Reported live:** an SBU Manager got "No territory assigned yet... ask
your manager to get one set up for you first" when opening Add Hospital
from Account Management's "+Add." Basheer's own instinct was right —
SBU Manager isn't supposed to have a personal territory at all (confirmed:
`organization/repository.py`'s `TEAM_SCOPE_BUILDERS["SBU Manager"]` scopes
purely by `sbu_id`, no zone dependency anywhere in that role's logic; a
`zone_id` of `NULL` is valid data for this role, not a data-entry gap).

**Root cause:** a rule written for reps ("no territory on file = can't add
a hospital, since the app wouldn't know which region to file it under")
exempted only Admin/General Manager — SBU Manager, an equally
zone-agnostic overlay role, was simply never considered when that
exemption list was written. Never surfaced before because no SBU Manager
had tried adding a hospital until today. Not written up anywhere in
`docs/Business-Rules.md` as its own numbered rule — only exists as code
comments (`account/service.py`'s `_ZONE_ASSIGNMENT_EXEMPT_ROLES`).

**Fixed, then immediately hit a second, deeper copy of the same bug.**
Added `"SBU Manager"` to `account/service.py`'s
`_ZONE_ASSIGNMENT_EXEMPT_ROLES` (+ mirrored in `AddHospitalModal.tsx`'s own
frontend copy) — unblocked the modal, but the Zone field itself then came
up empty. Second root cause: the Zone field's search endpoint
(`master_data.py`'s `/zones/search-for-hospital`) has its *own* separate
role list (`_TERRITORY_ADMIN_ROLES`) deciding "search every zone" vs.
"search only within my own zone" — a zone-less caller fell into neither
branch and got zero results. **Naming trap found along the way:**
`reference/service.py` has an unrelated `_TERRITORY_ADMIN_ROLES` of its
own (gates *editing* the territory map, correctly Admin/GM-only) —
confirmed via the module-level comment that `master_data.py`'s copy is
actually paired with `account/service.py`'s set, not
`reference/service.py`'s, despite the identical name. Left
`reference/service.py`'s untouched.

**Fixed:** `master_data.py:105` — added `"SBU Manager"` to that module's
own `_TERRITORY_ADMIN_ROLES`. Two new regression tests added
(`test_sbu_manager_exempt_even_with_no_zone_assigned` in
`test_account_service.py`; `test_sbu_manager_with_no_zone_gets_unrestricted_search`
+ `test_area_manager_with_no_zone_gets_empty_results` in
`test_master_data.py`, the latter locking in that a genuinely gated role
still correctly gets nothing). 698/698 backend tests pass, `ruff` clean,
`tsc`/`eslint` clean. Basheer confirmed working live in Dev.

**Committed `c16b45a`** ("fix: exempt SBU Manager from the zone-assignment
requirement on Add Hospital") — 5 files: `master_data.py`,
`account/service.py`, `AddHospitalModal.tsx`,
`test_account_service.py`, `test_master_data.py`. Not yet promoted to
`uat`; no migration needed, pure authorization-logic fix on both ends.

## 2026-09-08 (later still) — Manager Note notification: both open bugs fixed and committed, one new issue found live, session ended without an archive entry

Not logged at the time (handover gap found and corrected 2026-09-09 —
see that date's entry). After the SBU Manager fix above, work resumed
same evening on the two open Manager Note Notification bugs from the
earlier "one confirmed bug, one root cause found" entry: `Urgent
NotificationDialog.tsx` was updated with the same `opportunity_id`/
`account_id` branching as `NotificationBell.tsx` (extracted into a
shared `describeNotification()` util, `utils/notificationDescribe.ts`),
and `LogActivityModal.tsx`'s "who this is about" field gained the
"This Note Is For *" label for Manager Note specifically, no longer
silently defaulting to self. Also added `Activity.created_by_user` (no
migration, `created_by` already existed) so the Activity Timeline and
Daily Activity Report show who *wrote* a Manager Note, not who it's
about. 695/695 backend tests pass, `tsc`/eslint clean. **Committed
`356933d`** ("feat: add Manager Note notification, fix Activity author
display").

That commit's own message flagged a new, not-yet-debugged issue found
in the same live pass: the urgent popup and bell red-dot didn't
reliably fire on a fresh login for a genuinely unread urgent
notification, even though the backend row was confirmed correct. Left
as the next thing to chase — see 2026-09-09's entry for the resolution.

## 2026-09-09 — Manager Note notification: handover gap found and corrected, full 15-case E2E pass, "doesn't fire on login" issue confirmed resolved

`.claude/active_progress.md` still described the Manager Note feature
as blocked on 3 open items from the 2026-09-08 live-testing session,
written before that evening's follow-on work (`356933d` above) fixed 2
of them and surfaced a 3rd, different issue. Caught by checking git log
against the handover doc before touching anything, per the "verify
handover against git" habit — commit timestamps showed `356933d` landed
*after* the handover was last written, so it was never reflected there.

Ran the full `docs/Manager-Note-Notification-Manual-E2E-Test-Plan.md`
(15 cases, Groups A-F) live against Dev, Basheer as M (Basheer K/
Shruthi) and R (Shruthi/Rudrappa). All 15 passed, no new bugs found.
Notably: TC-8 and TC-12 reproduced the exact "fresh login" scenario from
`356933d`'s known issue (urgent Manager Note already sitting unread,
then a genuine sign-in as the recipient) three separate times (Shruthi
receiving from Basheer K, twice for Rudrappa receiving from Shruthi) —
the urgent dialog and bell red dot fired correctly every time, with
correct copy and click-through, so that issue is now considered
resolved (most likely fixed incidentally by the `356933d` fixes
themselves, since nothing further was changed before this pass). One
brief false alarm during TC-15: the bell still showed a red dot
immediately after a click-through; a direct DB check (impersonating
Rudrappa via `set_config`, same safe read-only pattern as before) showed
0 actual unread rows, and a re-check a few seconds later showed the
badge had cleared — a UI refresh lag, not a real bug.

Test plan's results table and status line updated in place. Feature is
now fully E2E-confirmed end to end (Groups A-F, all 15 cases).

**Follow-on same day:** right after the pass, Basheer reported an urgent
note to Rudrappa not showing the popup/red-dot immediately after a
genuine sign-out/sign-in (not mid-session, so the 60s poll explanation
didn't fit). DB showed the row created correctly but not marked read
until ~2.5 min later. Root cause: today's testing had two logins open in
the *same physical browser* at once (Basheer's own tab and the
Chrome-automation tab) -- Supabase persists its session to `localStorage`
(shared per origin, not per tab) and syncs auth state across tabs via the
`storage` event, so concurrent sign-in/out across the two could produce
exactly this kind of flaky symptom. Retested directly (single browser,
no concurrent second login) and it worked correctly -- confirms this was
a testing-methodology artifact, not a product bug.

## 2026-09-09 (later) — Activity Inline Comments: Phase 1 built, migrated, full E2E pass, no notifications yet by design

Built per `docs/Activity-Comment-Implementation-Plan.md`. Basheer split
the work into two phases mid-review after a code-review pass surfaced
two real gaps in the plan's original notification design (a reply from
the Activity's own owner would never notify the original commenter --
self-notify skip firing on the wrong person -- and a same-`entity_id`
read-receipt collision with `MANAGER_NOTE_ADDED` once a comment lands on
a Manager Note): **Phase 1 is the comment thread itself, wired up and
visible under each Activity's own card; Phase 2 (notifications) is
deferred until Phase 1 is confirmed solid.**

**Backend**, within the existing `activity` domain (mirrors how
`Reminder` was added, not a new domain folder): new `ActivityComment`
model (`id`, `activity_id`, `body`, `created_at`, `created_by` --
aliased to `author` in the ORM relationship, no separate `author_id`
column), `ActivityCommentRepository`/`ActivityCommentService` mirroring
`ReminderRepository`/`ReminderService`'s shape, `GET`/`POST
/activities/{activity_id}/comments`. Two decisions made explicitly
before writing the migration, both resolved stricter than the plan's own
precedent:
1. **RLS:** the plan cited `reminder_via_activity`'s single blanket
   policy (relies only on no PATCH/DELETE endpoint existing for
   immutability, same as `activity` itself). Basheer chose to go
   stricter instead -- separate `FOR SELECT`/`FOR INSERT` policies with
   no UPDATE/DELETE policy at all, so edit/delete is blocked at the
   database level too, plus `created_by = cabio_app_uid()` in the INSERT
   `WITH CHECK` so no one can post as someone else. Migration `0040`,
   applied to Dev; `Physical-Schema.sql` regenerated same day (only
   diff: the new table + these two policies, confirmed via `diff`
   against the previous regen).
2. **URL shape:** activity_id in the path (`POST /activities/{id}
   /comments`), not in the body the way `Reminder`'s own sibling
   endpoint (`POST /reminders`) does it -- removes a class of
   mismatched-id bug, small intentional inconsistency with `Reminder`'s
   exact shape.

**Fly-by fix, unrelated to comments, found via `tsc --noEmit`:**
`DailyActivityReportScreen.tsx` already expected `row.created_by_user`
(the Manager Note author-display fix from `356933d`), but that commit
only added the field to `ActivityResponse`/`ActivityContextNested`, not
`ActivityReportRow` -- `Activity.created_by_user` was already
eager-loading (`lazy="joined"`) so no repository change was needed, just
the missing schema field. Basheer approved fixing it in the same pass.

**Frontend:** `ActivityCommentThread.tsx`, rendered directly inside
`ActivityItem` (`ActivityTimeline.tsx`) so the thread sits under its own
Activity's card, not a separate screen -- lazy-loaded on expand (`enabled:
expanded`) so opening a timeline with many entries doesn't fire one query
per entry. `services/activities.ts` gained `listActivityComments`/
`createActivityComment` (same file `Reminder`'s functions already live
in). 710/710 backend tests pass (12 new), `tsc`/`eslint`/`npm run build`
all clean.

**Full 12-case manual E2E pass, same day, Basheer K (SBU Manager) and
Fazal live against Dev:** posting, chronological rendering, two-way
replies (Fazal replying to Basheer K's note, and vice versa on a
separate note), both entry points (Opportunity-tied and account-only via
Customer 360), no bell/urgent-dialog activity from either party after
posting (confirms Phase 2 boundary intact), no regression to the
existing timeline. One case (TC-8, RLS visibility inheritance for a
senior-private note) marked verified-by-design rather than live-tested,
per Basheer's own observation: the real use case is a manager commenting
on a *visible* activity, not commenting on one's own private note nobody
else can see in the first place, so the scenario doesn't come up in
practice -- the RLS composition through the parent Activity's own policy
is a safety net, confirmed structurally via the migration + regenerated
schema, not something a live click-through adds much to. Full results:
`docs/Activity-Comment-Phase1-Manual-E2E-Test-Plan.md`.

**Next: Phase 2 (notifications)**, once Basheer's ready -- `notify_*` on
comment creation, reusing the same `entity_type="activity"` notification-
repository join `MANAGER_NOTE_ADDED` already built, but fixing the two
gaps found in review first (notify actual thread participants, not just
the Activity's fixed `user_id`; scope `mark_read_for_entity` by `type`
too, not just `entity_type`/`entity_id`, so a Manager Note and a comment
on it don't silently mark each other read).

## 2026-09-09 (later still) — Audit Trail Extension: built, migrated, full 18-case E2E pass, two real bugs found and fixed live, then a click-through follow-on

Built same day per `docs/Audit-Trail-Extension-Implementation-Plan.md` --
Current task 0b, deliberately started after the 2026-09-08 UAT batch had
a week to stabilize. Coordinated around the other session's concurrent
Activity Comments build above: confirmed zero file overlap via `git
status` before starting (this work only ever touched `opportunity`/
`audit`, theirs entirely in `activity`), then deliberately held the new
migration and `Physical-Schema.sql` regen until their `0040` was
committed (`738ef64`), chaining mine on top as `0041` (`alembic heads`
confirmed a single linear head, no branching) rather than both branching
off `0039`.

**The real work, per the plan, wasn't the triggers** (three lines of SQL
reusing the existing generic `audit_log_row_change()` function
unchanged) **but fixing how `opportunity_item`/`split` are saved.** Both
went through delete-all-then-reinsert on every save
(`OpportunityRepository.replace_items`/`replace_splits`), which the
trigger would have seen as an unrelated DELETE+INSERT pair instead of a
clean edit. Fixed by threading each row's own `id` (items) or
`(opportunity_id, user_id)` (splits) through the save path so a real
edit becomes a real UPDATE, partitioning the resubmitted list into
UPDATE/DELETE/INSERT. `stakeholder` needed no save-path change (already
edited in place) -- just the trigger. `audit/repository.py` gained new
FK resolvers (`opportunity_id`, `product_id`, `user_id`) and a
`stakeholder` record label. `Business-Rules.md`'s BR-AUD-01 updated with
the real audited-table list.

**Full 18-case manual E2E pass run live against Dev the same day**
(Haroon Sidheeq, General Manager, on Opportunity "USG M/c - Test Aug 18"
/Fahad, plus a Stakeholder on its Account, Aster MIMS Calicut) --
`docs/Audit-Trail-Extension-Manual-E2E-Test-Plan.md`. 17 pass, 1
(Admin/GM-only gate) not independently re-tested since untouched by this
build. **Two real bugs found and fixed during the pass, both re-verified
live afterward:**
1. `replace_items`/`replace_splits` were unconditionally reassigning
   `updated_by` on every line in a save, including untouched ones --
   `service.py` sets the current actor's id on every constructed
   item/split regardless of whether it changed, so an *untouched* line
   went dirty (and fired a spurious audit row) whenever the actor
   differed from whoever last saved it. Confirmed live: editing one of
   two products produced a genuine UPDATE for the edited line, but also
   a bogus `updated_by`-only row for the untouched one. Fixed by only
   reassigning a line's fields (including `updated_by`) when its real
   content actually changed.
2. `Stakeholder` was added to `_RECORD_LABEL_RESOLVER_MAP` but not
   `_MODEL_DISPLAY_ATTR` -- threw a bare `KeyError`, 500ing the **entire**
   Audit Log endpoint (every table, not just stakeholder) the moment any
   stakeholder audit row existed. Surfaced live as a "Couldn't load the
   audit log" error right after the first stakeholder edit. Reproduced
   directly against Dev with the real traceback via a throwaway script
   (the plain app-role connection silently returns 0 rows on this
   RLS-protected table, so this needed `set_rls_context` called manually
   to actually reach the bug). Fixed by adding the missing
   `_MODEL_DISPLAY_ATTR` entry.

New regression tests for both, plus a fix for a cosmetic gap found in the
same pass: `AuditLogScreen.tsx`'s `TABLE_OPTIONS` never had the three new
tables, so they were missing from the filter dropdown (data itself was
never hidden, just the label/filter).

**Two follow-ons raised by Basheer during review, same day.** First:
`opportunity_item`/`split` rows showed only a raw record id
(`397ad3a4-...`) with nothing tying them back to their Opportunity, and
`stakeholder` rows nothing tying them back to their Account -- generalized
further on his call to also show `opportunity` rows' own Account. Added a
`_PARENT_CONTEXT_MAP` (`opportunity`->Account, `opportunity_item`/`split`
->Opportunity, `stakeholder`->Account): a live lookup against the row's
own table for UPDATE (the parent FK essentially never changes, so it's
almost never present in the diff itself), falling back to the DELETE
snapshot's own captured FK when the row itself is gone. New tests guard
the same `_MODEL_DISPLAY_ATTR` KeyError class bug 2 above hit, this time
for `_PARENT_CONTEXT_MAP`'s target models. Second: Basheer asked for the
resulting chip to be clickable, to jump straight to the parent
Opportunity/Account rather than just naming it -- reshaped the backend
response from a single formatted string to structured
`parent_type`/`parent_id`/`parent_label` fields, and `AuditLogScreen.tsx`
now takes `onSelectOpportunity`/`onSelectAccount` props, reusing the
exact click-through pattern `NotificationBell`/`UrgentNotificationDialog`
already use (`DemoApp.tsx`'s `handleSelectOpportunity`/
`handleSelectAccount`). Verified live both ways: every row type
(including a DELETEd split, via the snapshot fallback) shows its parent,
and clicking the chip opens the right Opportunity/Customer 360 screen.

738/738 backend tests pass, `ruff`/`tsc` clean throughout. **Committed
`6a580fa`.** Next: promote to UAT alongside the WON/LOST (BR-OP-09) fix,
which depends on this coverage -- `target_plan`'s own audit-trail gap
stays tracked separately in `docs/Backlog.md`, deferred until Target
Planning itself is built.

## 2026-09-09 (later) — Activity Inline Comments Phase 2: notifications built, an apparent fan-out bug root-caused to a reload race, comment-count badge polish

Started once the Audit Trail Extension session above committed (no file
overlap between the two, but both touch the shared handover docs, so
this waited to avoid a race on those). Built per `docs/Activity-Comment-
Implementation-Plan.md`'s revised Decision 4: `NotificationService.
notify_activity_comment_added` (mirrors every other `notify_*` method's
single-recipient shape); `ActivityCommentRepository` gained
`get_activity_owner_id`/`list_distinct_commenter_ids`;
`ActivityCommentService.create_comment` computes recipients as the
Activity's owner plus everyone who's already commented, minus whoever's
posting right now, and calls the notify method once per recipient.
Frontend: `notificationDescribe.ts` gained the `ACTIVITY_COMMENT_ADDED`
case; `NotificationBell.tsx`'s navigation branch was refactored from
`type === "MANAGER_NOTE_ADDED"` specifically to `entity_type ===
"activity"`, so both notification types share one code path instead of
two near-duplicates (the gap flagged during Phase 1's own review).

**TC-5 of the E2E pass initially looked like a real multi-recipient bug**
-- Basheer K's comment (third participant in a thread) only notified the
Activity's owner, not the other prior commenter, despite the code
correctly computing a 2-person recipient set. Added temporary debug
logging (`print()` tracing `owner_id`/`prior_commenter_ids`/
`recipient_ids` and each notify call's returned id) and re-tested twice
more with Haroon posting again: both times the correct recipient set was
computed AND both notifications were confirmed persisted in the database
by their exact ids, each impersonating the actual recipient's own RLS
context. Root cause: a transient dev-server hot-reload race during the
window of rapid successive file edits just before, not a defect in the
shipped logic. Debug logging removed, 738/738 tests still pass. Full
11-case results: `docs/Activity-Comment-Phase2-Notifications-Manual-E2E-
Test-Plan.md`.

**Same-day polish, Basheer's own follow-up request:** the plain
"Comments" toggle label showed identically whether an Activity had zero
comments or several, giving no visual hint either way. Iterated through
a few visual treatments live in the browser (a colored parenthetical
count read as cramped/invisible against the label at three different
colors in a row) before landing on a small rounded badge -- "Comments"
plus a red pill showing the count, or a plain "Add comment" link with no
badge when there's nothing there yet. Backend: `comment_count` added to
`ActivityResponse`, computed via one correlated scalar subquery on the
existing `list_by_account`/`list_by_opportunity`/`list_by_project`
queries (a `func.count(activity_comment.id)` subquery attached as a
plain Python attribute on each returned `Activity`, not a new endpoint
or a second per-row fetch -- new `_comment_count_column`/`_rows_with_
comment_counts` helpers on `ActivityRepository`, shared across all
three). Frontend: posting a comment now also invalidates the `activities`
query prefix (not just the comment-list query), so the badge count
updates live without a manual refresh. 740/740 backend tests pass (2
new repository tests pinning the subquery + attribute-attachment
behavior), `tsc`/`eslint`/`npm run build` all clean, verified live in
the browser across all three label states (badge, "Add comment",
expanded "Hide comments"). **Committed `80bef46`** ("feat: add Activity
Inline Comments Phase 2 (notifications) + comment-count badge") — 18
files: notification/activity service+repository+schema+router changes,
the two frontend components, the new Phase 2 test plan doc, and this
handover trio.

## 2026-09-10

**UAT backup script — real bug found in the Docker shutdown path, fixed
and verified live.** Ran `scripts/backup_uat.ps1` for the day's routine
dump (`cabio_uat_2026-09-10.dump`, 297,408 bytes, TOC 361 entries,
succeeded). Basheer noticed Docker Desktop was running again right after
the script had just reported stopping it.

Root cause, confirmed via `Get-CimInstance Win32_Process`: Docker Desktop
splits into a frontend shell (`Docker Desktop.exe`, the window/tray icon)
and separate `com.docker.backend`/`com.docker.build` processes that run
the actual engine independently. `Stop-DockerIfStartedByScript` only ever
targeted the frontend (`Get-Process -Name "Docker Desktop"`); the backend
processes were never touched and stayed alive across the "stop." Process
trace nailed it exactly: the relaunched frontend (`--reason=open-tray`)
had `ParentProcessId` pointing at `com.docker.backend`, spawned at the
same second (12:07:09) the old frontend was force-killed -- the backend
owns the systray lifecycle in current Docker Desktop builds and respawns
the frontend whenever it disappears unexpectedly, independent of any
Windows-level relaunch mechanism. Ruled out before landing on this:
Docker's own `settings-store.json` has `AutoStart: false`, no
Docker-related scheduled task exists, no Run-key fires mid-session
(only at logon), and no Windows Event Log crash entry for Docker Desktop
around the relaunch time -- this was Docker's own backend self-healing,
not an OS-level trigger.

Fix: `Stop-DockerIfStartedByScript` now also stops any `com.docker.*`
process before `wsl --shutdown`, not just `Docker Desktop` itself.
**Committed `7931491`** ("fix: stop Docker backend processes in UAT
backup script, not just the frontend").

**Verified live, full cold-start cycle, twice:** first attempt (Docker
already running from the earlier same-day dump) confirmed the negative
case -- script correctly skipped both start and stop since it hadn't
started Docker itself, so it wasn't a real test. Basheer then fully quit
Docker Desktop via the tray icon's "Quit Docker Desktop" (closing just
the window, tried first, left the backend running -- confirmed via
`Get-Process`, same split as the bug itself) and re-ran the script: start
→ dump → verify → stop, and a `Get-Process` check 5s after completion
found zero `Docker Desktop`/`com.docker.*` processes running. Fix holds.

**Next step:** register the `-AtLogOn` scheduled task (command already
in `.claude/active_progress.md`), then confirm the first logon-triggered
run appears correctly in `backup_log.txt`.

**`_TERRITORY_ADMIN_ROLES` naming clash — picked up from `docs/Backlog.md`,
fixed.** Two unrelated private constants, same name, different meaning:
`reference/service.py`'s gated *editing the territory map*
(`{"Admin", "General Manager"}`); `master_data.py`'s gated *zone search
for hospital creation* (`{"Admin", "General Manager", "SBU Manager"}`).
Flagged as a near-miss risk 2026-09-08/09 (`docs/Progress-Archive-2026-09
.md`'s 2026-09-08/09 entries), no incident yet. Renamed to
`_TERRITORY_MAP_ADMIN_ROLES` (`reference/service.py`) and
`_ZONE_SEARCH_UNRESTRICTED_ROLES` (`master_data.py`). While updating
every comment that referenced either by name, found one in
`account/service.py` that had actually been pointing at the wrong one
all along -- its role set (`{"Admin", "General Manager", "SBU Manager"}`)
matches `master_data.py`'s constant, not `reference/service.py`'s
2-role one -- corrected to point at the right one. No behavior change,
740/740 backend tests pass. Live smoke test: Sales Staff and Area
Manager both correctly zone-scoped in the Add/Edit Hospital zone
picker, Admin/GM/SBU Manager correctly unrestricted, Admin/GM Territory
Map edit unaffected. **Committed `4c1bf83`.**

**UAT's `rls_auto_enable()` event trigger — permanent fix, closed.**
Picked up from `docs/Backlog.md`'s standing item (3 lockout incidents:
2026-08-03, 2026-08-21, 2026-09-08). Identified the trigger's real name
via a read-only `pg_event_trigger` lookup (Basheer, Supabase SQL
Editor) -- `ensure_rls`, firing on `ddl_command_end`, calling function
`rls_auto_enable()`. Confirmed live (read-only query via
`.venv/Scripts/python.exe` against both `backend/.env` and
`backend/.env.uat`, plain `DATABASE_URL`, no elevated connection
needed since `pg_event_trigger` is a system catalog, not RLS-gated)
that Dev has only the six standard Supabase-managed event triggers and
never had `ensure_rls` -- matching the 2026-08-05 side-finding, now
re-verified rather than taken on faith. Basheer ran `DROP EVENT TRIGGER
ensure_rls;` live on UAT via Supabase's SQL Editor. Re-verified after:
UAT now shows the same six standard triggers as Dev, nothing else --
full parity restored. Going forward, a new table on UAT gets RLS/
policies only if its own migration adds them, exactly as authored, the
same as Dev already worked -- no more silent third-party override
locking a table with zero policies before the migration's own
`CREATE POLICY` statements run. **Still open, for whenever Prod is set
up:** decline Supabase's "enable RLS for the whole database"
project-setup prompt (a related but separate footgun, `docs/Progress-
Archive-2026-08.md`'s "Trap for Prod" note) and confirm Prod has no
event trigger of its own before assuming parity with Dev/UAT.

## 2026-09-10 (later) — Activity comment notifications: no indication of which Activity, fixed with scroll+highlight+auto-expand; a real race bug found and fixed live during testing

**Reported by Basheer via the `/demo` UI:** clicking an `ACTIVITY_COMMENT_ADDED`/
`MANAGER_NOTE_ADDED` notification (e.g. "Basheer K commented on an activity")
always lands on the deal's plain Activity tab, top of list -- with no
indication which Activity the comment was actually on. Confirmed live with
Al Shifa Hospital, which has comments on more than one Activity: two
notifications ("Basheer K commented...", "Fazal commented...") both opened
the same generic tab.

Root cause: `NotificationService.notify_activity_comment_added`
(`backend/app/domains/notification/service.py:115-137`) already stores
`entity_id = activity_id` on the notification -- the data was there.
`NotificationBell.tsx`'s click handler used that id only for the read-receipt
call (`markNotificationRead`) and discarded it before calling
`onSelectOpportunity`/`onSelectAccount`, which only ever received a tab name
("activity"), never which Activity within that tab.

Fix: threaded a new `highlightActivityId` parameter through
`NotificationBell.tsx` → `UrgentNotificationDialog.tsx` (same code path,
reached only by `MANAGER_NOTE_ADDED` since comments are never urgent) →
`DemoApp.tsx`'s `handleSelectOpportunity`/`handleSelectAccount` → down as a
prop through `OpportunityDetailScreen.tsx`/`Customer360Screen.tsx` into
`ActivityTimeline.tsx`, which now scrolls to, highlights (blue border), and
auto-expands the comment thread of the exact Activity the notification named
(`ActivityCommentThread.tsx` gained an `initiallyExpanded` prop for this).
All additive/optional-param changes -- no behavior change for callers that
don't pass the new id. `tsc --noEmit` clean throughout.

**Real bug found live during Basheer's own manual verification (not caught by
the type-checker or the first round of browser testing):** the auto-scroll
fired once, synchronously, `scrollIntoView({block:"center"})`, calculated
against the target card's height *before* its auto-expanded comment thread
had actually fetched and rendered. Once the comments arrived a moment later
and the card grew taller, the already-computed scroll position no longer
centered it -- for a card near the top of a short list, this pushed it
almost entirely off-screen above the viewport (only a sliver of its bottom
border visible under the tab bar). Basheer reproduced this by walking every
"Basheer K" notification on the Al Shifa Hospital deal from oldest to
newest; the 8-Sept-08:18pm Manager Note (3rd item in a 6-item list) showed
it clearly, the others happened to land fine by coincidence of list
position.

First fix attempt: `ActivityTimeline.tsx`'s highlight effect watched the
target card with a `ResizeObserver` and re-ran `scrollIntoView` on every
size change for up to 2 seconds. **This did not hold up** -- Basheer asked
for a live re-demo of every Basheer K notification and the 8-Sept-08:20pm
note failed again, cut off exactly as before. Instrumented with a
`console.log` in the scroll callback: it fired exactly once, meaning the
`ResizeObserver` never caught a second resize. Root cause of *that*: the
comment thread's height had already finished growing by the time
`observer.observe()` ran (the query resolved faster than expected on this
particular card), so there was no further "change" left to observe -- the
single scroll call had already run against a stale, pre-load snapshot.

Second fix attempt: replaced the `ResizeObserver` with a fixed retry
schedule (`[0, 50, 150, 300, 600, 1000]` ms). This fixed the 08:20pm case
but then failed on `08:09pm` ("Basheer K commented on an activity", the
longest thread on the deal, 6+ comments) when clicked right after two other
notifications with no page reload in between -- the auto-scroll never moved
at all. **Root cause, the real one:** the comment fetch for a thread this
size took longer than the 1000ms guess allowed for, so the schedule gave up
before the card had grown to its final height. Fixed-delay retries were
guessing at a number that depends on network/data size and can't be
guessed reliably.

**Actual fix:** removed the timing guess entirely. `ActivityCommentThread.tsx`
gained an `onInitialLoadSettled` callback that fires once its own comment
query genuinely finishes loading (not a delay -- a real signal). `ActivityTimeline.tsx`'s
`scrollToHighlightTarget` is called once immediately (for snappiness) and
again from that callback once the highlighted card's real, final height is
known -- no more guessing how long a fetch might take.

**A second, independent bug surfaced during this same fix**, again only
visible when clicking several notifications on the same deal without
reloading the page: every Activity card (and its `ActivityCommentThread`)
stays mounted for as long as the user keeps clicking different
notifications there, since the underlying list itself never unmounts --
only the earlier reproduction happened to always go through a full page
reload or a detour through Customer 360 first, which masked it. Two places
used a plain one-shot ref/`useState` that only takes effect on first mount:
(1) `ActivityCommentThread`'s `useState(initiallyExpanded)` -- a card
revisited a second time scrolled into view correctly but its thread stayed
collapsed, since React's initial-state argument is only read once, not on
every prop change; (2) `ActivityTimeline`'s `hasScrolledToHighlightRef`
boolean -- blocked the initial scroll attempt for every notification after
the first one in the same mounted screen (masked in testing because the
settle-callback fix above happened to cover for it). Fixed both: the
comment thread now has an effect that calls `setExpanded(true)` whenever
`initiallyExpanded` transitions to true (not just at mount), and the
timeline ref now tracks *which* activity id was last handled instead of a
bare boolean, so a new id always re-triggers the attempt.

**Verified live, all 5 of Basheer K's notifications on the Al Shifa Hospital
deal, clicked back-to-back with no page reloads in between** (the exact
sequence that exposed both bugs above) -- oldest urgent manager note
through newest, plus a repeat visit to two of them -- all land highlighted,
fully visible, comments expanded where applicable, every time. `tsc
--noEmit` clean throughout.

**Lesson for next time a scroll/animation timing bug shows up:** don't
reach for a delay or a `ResizeObserver` guess first -- find the actual
completion signal (a query's `isLoading`, a promise, a mutation's
`onSuccess`) and drive the corrective action from that instead. Every
timing-based attempt here looked fixed in isolation and then failed under
slightly different real conditions (a slower fetch, a revisited component).

**Pre-commit lint blocked the commit** (`.githooks/pre-commit` runs `npm run
lint`): `react-hooks/set-state-in-effect` correctly flagged the
`ActivityCommentThread.tsx` fix above for calling `setExpanded(true)` inside
a `useEffect` -- textbook "you might not need an effect" (deriving state
from a prop). Moved the re-expand logic to run during render instead (React's
documented pattern for adjusting state on a prop change), which then tripped
`react-hooks/refs` for writing to a ref during that same render -- split the
settle-tracking (which only touches refs, not state) into its own effect
that has no state or ref writes during render at all. Also picked up one new
`react-hooks/exhaustive-deps` warning on `scrollToHighlightTarget` in
`ActivityTimeline.tsx`; wrapped it in `useCallback`, which exposed a further
warning that `activities` (`data?.items ?? []`) creates a new array every
render while loading -- switched that effect's dependency to
`activities.length` instead. Verified the fix wasn't just "quieting the
linter": stashed these changes, ran lint against unmodified `main`, and
confirmed the same 245 warnings already existed there (identical text, only
shifted line numbers) -- so today's changes land at exactly 245 problems, 0
errors, the same count as before this session, with no accumulated
technical debt. Re-verified live after these edits that the notification
fix itself still works.

**Committed `5a0bd4e`** ("fix: point Activity comment/manager-note
notifications at the exact Activity") -- 8 files: `NotificationBell.tsx`,
`UrgentNotificationDialog.tsx`, `DemoApp.tsx`, `OpportunityDetailScreen.tsx`,
`Customer360Screen.tsx`, `ActivityTimeline.tsx`, `ActivityCommentThread.tsx`,
and this Progress Archive entry. Staging note: `docs/Progress-Archive-2026-
09.md` had a second, unrelated section appended by another session
(`## 2026-09-10 (later still) — Activity log privacy hole...`, below) that
was still uncommitted at the time -- a plain `git add` on the whole file
would have silently bundled it into this commit. Split it out (removed it
from the working copy, staged, restored it unstaged) so this commit carries
only this entry; that section's own commit is still pending, separately.

## 2026-09-10 (later still) — Activity log privacy hole: confirmed live with a real example, awaiting Haroon's decision

Picked up `docs/Backlog.md`'s standing item (surfaced 2026-08-27, never
confirmed live). Investigated live in the browser as Shruthi (Area
Manager, Bangalore, Imaging SBU) on Al Shifa Hospital's Activity tab.

**Confirmed real, with a concrete example.** Shruthi could see all 3 of
Fahad's deal-less activities on this account -- Fahad is Sales Staff,
Mangalore zone, Imaging SBU, reports to Fazal, with zero relationship to
Shruthi in zone, tier, or reporting chain. Direct query against Dev
confirmed all 3 rows have `activity.opportunity_id IS NULL`, matching the
`activity_tier_visibility` RLS policy's unconditional `opportunity_id IS
NULL` bypass clause exactly.

**One correction made mid-investigation:** an early read misattributed a
`MANAGER_NOTE` ("Hi Fazal, talk to GM") as Fazal's own exposed note.
Checking `activity/models.py`'s `created_by_user` comment caught the
mistake -- for `MANAGER_NOTE` specifically, `user_id` is who the note is
*about*, `created_by` is who actually wrote it (the two match for every
other activity type). That note was actually written by Basheer K
(Admin) about Fazal, not by Fazal -- doesn't change the finding (Fahad's
3 rows stand on their own), but flagged as a real open design question
for whoever builds the fix: which of the two identities should govern
visibility for a `MANAGER_NOTE` under the corrected rule.

**Confirmed which screens are actually exposed, and which aren't.**
Basheer's own framing assumption -- that this only surfaced via the
Daily Activity Report -- turned out to be wrong, and checking it
uncovered the real exposure: `_apply_daily_report_scope`
(`activity/repository.py:154`) already applies its own independent
hierarchy filter to that specific screen, mirroring
`TEAM_SCOPE_BUILDERS`, so the Daily Activity Report was never actually
affected. `list_by_account`/`list_by_project` (same file, lines 70/127)
have no such filter and rely solely on the buggy RLS policy -- that's
where a hospital or project's Activity tab genuinely leaks deal-less
notes to anyone.

**Proposed fix, discussed, not built:** replace the `opportunity_id IS
NULL` bypass with the same manager-chain logic
`_apply_daily_report_scope` already gets right, expressed as a database
rule rather than a per-screen check -- consistent with this app's
existing RLS-first architecture, and so it automatically covers
`list_by_account`/`list_by_project` today and any future activity-listing
endpoint (including the planned Sales Development Activities) without
relying on each new screen remembering to add its own filter.

**Basheer's call: discussing with Haroon before deciding how to build
this.** Logged to `docs/Backlog.md` and `.claude/active_progress.md`
for handover; nothing built yet.

**Housekeeping note:** while making this edit, found this file (and
`sales-os-app`'s notification/activity frontend files) had been modified
by a parallel, concurrent session on the exact same account (Al Shifa
Hospital) shortly before this entry -- see the "Activity comment
notifications" entry immediately above. No overlap or conflict with this
entry's content; noted here only per the standing practice of checking
`git status`/`git diff` before editing a file that might be in
concurrent use.

## 2026-09-11 — UAT login failure ("unable to verify your session"): Supabase pooler stuck from a platform incident, fixed by switching DATABASE_URL to transaction-mode pooling

**Trigger:** Basheer reported the UAT login screen showing "We were unable
to verify your session due to a connectivity issue" and asked for help
diagnosing it live.

**Path to root cause.** A pasted Render backend log looked completely
healthy (build succeeded, every request 200 OK) -- it was just a snapshot
from before the incident, not evidence either way. Reproduced live via
browser automation against `/demo`: the frontend's repeated
`GET /api/v1/auth/me` calls were all coming back **503**, and the
console showed `AuthContext.tsx`'s retry-then-give-up path
(`applySession()`) exhausting its retry budget. The backend's own
`/api/v1/health` was answering fine the whole time -- it never touches
the database (`app/api/routers/health.py`), so it couldn't have caught
this; `/auth/me` does (`db.get(UserProfile, ...)` in
`app/api/dependencies.py:24`), which is what actually failed.

Checked the UAT Supabase project's Pooler logs (with Basheer's live
go-ahead) and found a continuous stream of
`ClientHandler: (EMAXCONNSESSION) max clients reached in session mode --
max clients are limited to pool_size: 15`, recurring every ~30s with no
gaps. A direct `SELECT ... FROM pg_stat_activity` (also asked first)
showed only **13 total connections, all internal Supabase services --
none belonging to the app**, and 47 of 60 direct-connection slots free.
That combination -- the pooler's own session-slot count stuck at its
ceiling while the real database had plenty of room and no app
connections were actually attached -- meant the exhaustion was inside
Supavisor's own bookkeeping, not real load.

**Root cause: a genuine Supabase platform incident, not anything in this
codebase.** `status.supabase.com` recorded free-tier ("Nano") projects
"becoming unresponsive after a period of time, typically hours" from
2026-09-10 15:26 UTC (20:56 IST) to a global fix rollout at 19:41 UTC
(01:11 IST 2026-09-11) -- timing that matches almost exactly when the
UAT project's pooler errors turned from occasional isolated blips (first
seen ~15:19 UTC) into a continuous stream (~15:41 UTC onward). The
pooler was still stuck hours after Supabase's own "resolved" timestamp,
consistent with their own remediation advice for stragglers ("restart
your project if still experiencing issues"). **A project restart
(triggered by Basheer) did not visibly help** -- no gap appeared in the
live error stream across the restart attempt.

**Contributing factor, found along the way and fixed regardless of the
outage:** `DATABASE_URL` was on Supavisor's **session-mode** pooler port
(`5432`), whose free-tier client ceiling is a fixed 15 -- while
`DB_POOL_SIZE=10` + `DB_MAX_OVERFLOW=20` meant a single backend instance
alone could request up to 30 connections. That configuration was already
one moderately-busy moment away from this exact failure mode even
without Supabase's incident.

**Fix: switched `DATABASE_URL` to Supavisor's transaction-mode pooler
port (`6543`)**, in both `backend/.env.uat` (local reference copy) and
the matching environment variable on the `Calicut_Bio_Medicals` Render
service, followed by a redeploy. Confirmed safe before making the change:
`set_rls_context()` (`app/db/session.py:54`) sets RLS context via
`set_config(..., true)`, which is transaction-scoped (`SET LOCAL`
semantics) -- correct and safe under transaction pooling, unlike a plain
session-scoped `SET` would have been. **Deliberately left
`ADMIN_DATABASE_URL` on the session-mode port (`5432`)** -- it's used
only by Alembic migrations and `scripts/backup_uat.ps1`'s `pg_dump`, far
too low-traffic to hit the session-mode ceiling, and this project's own
2026-09-04 backup-approach entry above already established that the
transaction pooler is not safe for `pg_dump`. Documented as a standing
convention in `docs/Backend-Implementation-Standards.md` (§ Settings /
Configuration) so this choice doesn't need re-discovering later.

**Verified live, immediately:** `EMAXCONNSESSION` errors stopped
appearing in the Pooler logs within the same minute the new deploy went
live (last occurrence 08:52:38 UTC, clean afterward), and a live login
against `/demo` succeeded with no banner, straight into the Pipeline
view. No code changes, no migration, no commit -- purely an
infrastructure/config fix (env var + redeploy). Nothing pending from
this thread.

**Unrelated finding surfaced during the same conversation, checked and
closed:** a 10-days-prior Render email warning about 668/750 free
instance-hours used turned out to be safe -- that count was from before
the monthly reset; current-month usage was 219.62/750 (~29%), on a pace
(~20 hrs/day across the workspace's 2 free services) that comfortably
avoids hitting the cap before this month's reset. Worth re-checking
toward month-end, but not an active risk and unrelated to this incident.

## 2026-09-11 (later) — UAT migration: Activity Inline Comments + Audit Trail Extension promoted, 2 migrations applied

**Same-day follow-on to the login-outage fix above, unrelated to it.**
With the login issue closed, Basheer asked how far `uat` was behind
`main` (10 commits, 0 the other direction -- clean fast-forward) and,
given it was a lean-traffic morning window, decided to promote right
away rather than wait for the usual evening deploy slot.

**Scope:** Activity Inline Comments (Phases 1+2, migration `0040` --
new `activity_comment` table, thread + notifications) and the Audit
Trail Extension (migration `0041` -- `stakeholder`/`opportunity_item`/
`split` change tracking), plus three smaller riders already on `main`
(exact-Activity notification linking, a naming-clash refactor, the UAT
backup script's Docker-shutdown fix). Full scope, execution log, and
verification detail: `docs/UAT-Migration-2026-09-11.md`.

**Before pushing, estimated the likely user-facing interruption** (asked
directly: "how many minutes of interruption will users feel?") --
reasoned from historical deploy durations (~1 min) and the free-tier
single-instance caveat (no zero-downtime swap, unlike a paid instance)
to a ~30s-2min estimate, with the two migrations themselves contributing
negligible time (purely additive, no backfill, sub-second on a 13 MB
database). Flagged one nuance found along the way: the UAT frontend is a
PWA with a service worker (`registerSW.js`), so an already-open tab may
keep showing the old version until refreshed -- not downtime, but worth
telling the team.

**Execution, in order:** fresh backup (`cabio_uat_2026-09-11.dump`,
verified 361 TOC entries -- one blemish, Docker's graceful shutdown
timed out and had to be forced, not investigated further) -> `git push
origin main:uat` (`643256f..a28ac61`, fast-forward) -> both Render
services confirmed Live on `a28ac61` (backend 58.7s, frontend 19.2s) ->
Basheer ran `alembic upgrade head` (`0039 -> 0040 -> 0041`, clean) ->
UI-only smoke test.

**Smoke test deliberately stopped short of writing test data.**
Mid-verification, caught (by Basheer) about to post a real comment on a
live UAT Activity -- both Activity and comment rows are immutable on
this project (no DELETE endpoint), so a test comment would have been
permanent. Confirmed only that the Activity tab renders with no errors
and that the new "Add comment" control appears correctly under a real
Activity card. Actual comment-posting, notification fan-out, and the
Audit Log's new trigger coverage are left for Haroon to verify -- he's
the one who originally requested the comments feature.

**No RLS-trigger gotcha this time** (unlike 2026-09-08's promotion) --
UAT's `rls_auto_enable()` event trigger was permanently removed
2026-09-10, one fewer thing to check for on every future promotion.

**Nothing pending from this thread beyond Haroon's own verification
pass**, tracked in `docs/UAT-Migration-2026-09-11.md`'s "Still open"
section.

**Follow-on, same day: backfilled the missing promotion records.**
Basheer noticed only 2 of the (actual) 4 UAT promotions had a dedicated
`docs/UAT-Migration-*.md` file -- the standalone-record habit had only
ever been applied to 2026-09-08 and today, never written down anywhere
as a standing rule. Backfilled `docs/UAT-Migration-2026-08-21.md` (from
`docs/Progress-Archive-2026-08.md`'s 2026-08-21 entry -- two same-day
pushes, 39+1 commits, migrations `0016`-`0023`) and `docs/UAT-Migration-
2026-09-09.md` (from `active_progress.md`'s existing summary -- 8
commits, no migrations) so all four promotions now have a consistent
record. Both marked as backfilled, not live-session logs. `Demo-
Narrative-UAT-Migration-2026-08-19.md` confirmed to be a different kind
of document entirely (a leadership briefing, not a promotion record) --
not renamed or touched.

## 2026-09-11 (later still) — Duplicate hospital names confirmed live in UAT since 2026-09-09; Backlog corrected

Basheer confirmed the duplicate/near-duplicate hospital-name warning
(Option B, `pg_trgm` similarity check) is live and working in UAT.
`docs/Backlog.md` had it listed as built and manually E2E-passed but
still awaiting Haroon's ship/no-ship call -- stale. Verified via git
rather than taking the claim at face value: `e86d49a` (the feature's
commit) is an ancestor of `df0a7cc`, the 2026-09-09 UAT-promotion
close-out commit -- so it shipped two days earlier than the most recent
2026-09-11 migration, in the promotion before that one. `Backlog.md`
entry updated to DONE with the corrected ship date; no code change.
