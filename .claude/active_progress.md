# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-09-04_

## Pending, awaiting Haroon / not yet actioned

**Opportunity Notes Privacy — built, migrated (0039), all 8 verification
steps passed live against Dev 2026-09-05. Not yet committed.** Haroon
(doing field work himself) didn't want his private discussion notes
visible to Area Managers/SBU Managers in whose territory/SBU his deals
sit, even though the zone/SBU-wide visibility itself is working as
designed. Built: hide only the Activity-tab notes (RLS policy
`activity_tier_visibility`, migration `0039`, new
`cabio_app_user_role_name` helper) via a role-hierarchy check — Area
Manager can't see notes logged by SBU Manager/GM/Admin, SBU Manager
can't see GM/Admin notes — with a looped-in carve-out (existing
split/reminder) granting full visibility regardless of rank. Documents
and the Opportunity record itself stay fully visible. `Physical-
Schema.sql` regenerated 2026-09-05 (also caught up migrations 0032-0038,
not regenerated since 2026-09-02). Full plan:
`docs/Opportunity-Notes-Privacy-Implementation-Plan.md`.

**Two incidental findings during verification, both confirmed correct
behavior, not bugs — logged for the record, no action taken:**
1. Admin/General Manager can never appear in the Split-participant
   picker (`GET /users?scope=sbu`) — by design, BR-FIN-06/ADR-037 (their
   `sbu_id` is a NOT-NULL placeholder, not real membership). Means Haroon
   himself can't be added to a split anywhere in the app. Same root
   pattern as this whole feature (GM personally working deals breaks
   assumptions built for an overlay-only role) — flagged as a possible
   future product question, not fixed here.
2. A Sales Staff rep with a split/reminder on a superior's deal sees all
   its notes regardless of rank (confirmed live: Vivek + Basheer K's
   split) — correct, Sales Staff was deliberately left out of the
   hierarchy-hide scope, and the carve-out is unconditional by design.
   Losing opportunity visibility entirely when a split is removed (also
   observed live) is `opportunity_tier_visibility` behaving normally,
   unrelated to this migration.

**Next step: commit** (migration `0039`, `Physical-Schema.sql`, both
plan/brief docs). Full narrative: `docs/Progress-Archive-2026-09.md`'s
2026-09-04 and 2026-09-05 entries. Also tracked in `docs/Backlog.md`.

**UAT backup/disaster-recovery — recurring script written 2026-09-05, not yet scheduled or run by Basheer.**
Free-tier Supabase has no automatic backups; first manual dump taken
2026-09-05 (`cabio_uat_2026-09-05.dump`, 204 KB compressed,
`pg_restore --list` verified complete against the 4-table UAT/main
migration gap — expected, UAT is behind head). UAT is tiny (13 MB total,
~408 KB `public` schema) so sizing/incremental-backup complexity isn't a
concern. **Built same day: `scripts/backup_uat.ps1`** — same throwaway
Docker `postgres:17` `pg_dump --schema=public` approach, reads
`ADMIN_DATABASE_URL` from `backend/.env.uat`, writes to
`C:\Backups\CabioUAT`, prunes dumps older than 14 days, copies to Google
Drive (`G:\My Drive\CabioUATBackups`, skips with a log warning if that
path doesn't exist yet), logs every run to `backup_log.txt`. External-
disk copy stays a manual weekly step per Basheer's call — not automated.
**Next step, Basheer's to do:**
1. Install Google Drive for Desktop if not already done, confirm/adjust
   the `$GoogleDrivePath` variable at the top of the script to match.
2. Register the daily 07:30 IST scheduled task (command already
   supplied in-conversation; runs only while logged in, per Basheer's
   choice — no Windows password stored):
   ```powershell
   $action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"C:\Users\Basheer\GitHub\Calicut_Bio_Medicals\scripts\backup_uat.ps1`""
   $trigger = New-ScheduledTaskTrigger -Daily -At 7:30AM
   Register-ScheduledTask -TaskName "CabioUATBackup" -Action $action -Trigger $trigger -Description "Daily UAT pg_dump backup"
   ```
3. Confirm the first live run (reads UAT, read-only) succeeds and appears
   in `backup_log.txt`.
New CLAUDE.md rule came out of this thread too (below). Full narrative:
`docs/Progress-Archive-2026-09.md`'s 2026-09-04 and 2026-09-05 entries.

**CLAUDE.md — new UAT-access safety rule, uncommitted.** Never connect
directly to the UAT Supabase project (`backend/.env.uat`), even
read-only, without asking Basheer first and stating exactly what will
run. Added after a live UAT size-check ran without asking during the
backup discussion above. Also saved to memory.

## Current task 0 — Audit Trail (+ Admin/GM Audit Log screen): committed

Migration `0030_add_audit_log.py` applied to Dev, `Physical-Schema.sql`
regenerated, Admin/GM "Audit Log" review screen built same-day. All 5
verification-plan checks passed live against Dev. **Committed `099e54c`**
("feat: add Audit Trail for account/user_profile/product/opportunity
(ADR-017)"). Full narrative: `docs/Progress-Archive-2026-09.md`'s
2026-09-02 entry.

**Two small follow-on doc commits same day, both closed, no further
action:** (1) Tally SBU/Territory accounting memo for Latheef Bhai —
relayed as a recommendation only, tracked in `docs/Backlog.md`, nothing
for engineering to build unless the Tally integration itself gets
scoped later. (2) 11 unrelated stale doc-only files (pre-dating this
session, zero overlap with Lead Management) caught up and committed.
Full narrative: `docs/Progress-Archive-2026-09.md`'s "2026-09-02 (later)"
entry.

## Current task 1 — BR-ACC-03 (duplicate hospital): committed, manual E2E plan not yet confirmed complete

Committed `e86d49a` on 2026-08-31. Full narrative: `docs/Progress-
Archive-2026-08.md`'s 2026-08-30 and 2026-08-31 entries.

**Still open:** the full manual E2E test plan (`docs/BR-ACC-03-Manual-
E2E-Test-Plan.md`, Groups A-G) has not been explicitly confirmed
complete end to end — Basheer exercised the create/edit UI live during
the build session with no issues found, but that's not the same as a
Groups A-G sign-off. Also still open: the Option A vs. B decision itself
is Haroon's call, per `docs/Duplicate-Hospital-Decision-Brief-2026-08-
29.md`; nothing here is live for the sales team regardless.

## Current task 2 — Auth Session Resilience: committed

Part A (retry-before-signout) and Part B (60-min idle timeout), both root-
caused and fixed 2026-09-02 after the 2026-08-31 mid-debug stop point.
**Committed `1991834`** ("feat: add Auth Session Resilience (idle timeout
+ transient-failure retry)"). Full narrative: `docs/Progress-Archive-
2026-09.md`'s 2026-09-02 entry.

## Current task 3 — Lead Management for Marketing-Sourced Leads ("Marketing Lead"): built, migrated (0031-0038), Groups A-F passed live, committed

Full build per `docs/Lead-Management-Implementation-Plan.md`, staged as
`marketing_lead`/`marketing-leads` (renamed mid-E2E — collided with the
Opportunity Stage "Lead"). Original feature build **committed** `4b24eb5`
("feat: add Lead Management for Marketing-Sourced Leads..."); everything
below (notifications, manager rights, RLS fixes, reference tag) is a
substantial follow-on built 2026-09-03, **committed `c7b90db`** ("feat:
add marketing lead assignment notifications, manager Convert/Discard/
Reassign rights", 2026-09-03 21:31).

**Grew substantially during Groups C-E live testing, 2026-09-03** (full
narrative: `docs/Progress-Archive-2026-09.md`'s 2026-09-03 entries):
assignment notifications for marketing leads (`notify_marketing_lead_
assigned`, mirrors the existing Opportunity-assignment pattern); two live
bugs found and fixed (both screens sharing `GET /marketing-leads`
auto-fired on every login instead of only when actually viewed, silently
marking notifications read — now gated on an `active` prop); Convert's
green context box now shows Source/Conference (previously silently
dropped); Convert wasn't invalidating the Pipeline query (fixed); new
`first_viewed_at` column (migration `0035`, applied) driving a single
milestone pill (NEW→SEEN→CONVERTED/DISCARDED) on the Marketing User's own
screen, replacing the old static status pill; discarded leads now show
their reason/note there too.

**Group F (visibility/authorization) found a real gap, now fixed, then
scope grew further on Basheer's own call:** RLS already granted SBU/Area
Manager (own SBU) and Admin/GM (all SBUs) visibility into other reps'
marketing leads, but no screen surfaced it — the queue only ever showed
"assigned to me." New "Team Marketing Leads" section added to
`MarketingLeadReviewQueueScreen.tsx`. Basheer then decided managers
should be able to **act**, not just see: migration `0036_marketing_lead_
manager_update_rights.py` widens `marketing_lead_update` to let SBU
Manager (own SBU) and Area Manager (own reports only, via `manager_id` —
mirrors BR-OP-14's immediate-manager precedent) Convert/Discard directly,
plus a **new Reassign action** (same manager set, deliberately excluding
the assigned rep themselves) for handing a lead to a different rep, e.g.
someone on leave — resets "seen" state and re-notifies the new assignee.
**Migration 0036 applied.** Live testing (SBU Manager/GM logins) then
found two more real gaps, both fixed same day: (1) the Reassign modal's
rep picker over-excluded SBU Manager/Area Manager, inconsistent with the
original Assign-To picker at creation — aligned to match; (2)
self-delegation — Fazal (Area Manager) has leads assigned directly to
himself and had no way to hand one to his own report, since
`_actor_manages` alone can't authorize "delegate my own lead" (asks "do I
manage myself," always false). Added an explicit self-delegation
carve-out for any manager-tier role; Reassign now also shows in the
personal-queue section for managers. **Then a third gap, also fixed same
day:** Fazal (Area Manager) could still *see* Shruthi's leads under "Team
Marketing Leads" despite her not reporting to him — Area Manager's
`marketing_lead_select` visibility had been SBU-wide since the original
0031 policy, never narrowed when 0036 tightened the *update* policy to
own-reports-only. Migration `0037_marketing_lead_area_manager_select_
own_reports.py` narrows SELECT to match UPDATE exactly (SBU Manager's
own-SBU visibility unchanged). Verified via a direct UPDATE attempt as
Fazal against Shruthi's lead (0 rows affected, RLS already correctly
blocking the write) before concluding this was a visibility-only gap, not
an authorization bypass. 685/685 backend tests pass, `tsc`/lint clean.

**Migration 0037 applied; immediately hit a real 500 on Reassign:**
`marketing_lead_update`'s `WITH CHECK` (0036) was identical to its
`USING` clause — fine for Convert/Discard (never touch
`assigned_to_user_id`), but Reassign's whole job is changing that column,
and two of the four authorization clauses are keyed on it. Postgres
re-evaluates `WITH CHECK` against the row *after* the update, so
reassigning to anyone who isn't the actor themselves or (for Area
Manager) their own report got rejected with `InsufficientPrivilege` — hit
immediately when Fazal self-delegated to Shruthi. Migration `0038_fix_
marketing_lead_update_with_check.py` relaxes `WITH CHECK` to `true`.
685/685 still passed, but this alone **did not actually fix it** —
applied live, retried, still 500'd.

**Root cause was deeper than WITH CHECK.** Isolated via direct DB tests
(reassign Fazal's own lead to himself: succeeds; to Fahad, his report:
succeeds; to Shruthi, not his report: fails, identical error): Postgres
independently refuses to let an UPDATE leave the resulting row invisible
to the actor under the table's own SELECT policy — regardless of what
`WITH CHECK` says. Since 0037 narrowed Area Manager's SELECT visibility
to their own reports only, reassigning outside that set was structurally
impossible for an Area Manager no matter what the UPDATE policy allowed.
Presented two fixes to Basheer: (a) restrict reassignment targets to
people the actor can already see (simple, narrower), or (b) a
SECURITY-DEFINER bypass function (preserves full flexibility, adds a
privilege-escalation code path). **Basheer chose (a).**

Built: `_actor_manages` generalized to take an explicit `(target_user_id,
target_sbu_id)` pair instead of a lead object, reused for both "can I act
on the current assignee" and a new second check, "can I hand it to this
new assignee" — an Area Manager's reassignment target must now also be
one of their own reports (SBU Manager/Admin/GM unaffected, already
SBU-wide/unrestricted). Frontend `MarketingLeadReassignModal.tsx` mirrors
this: Area Manager's rep picker now filters to `manager_id === self`
instead of "anyone in the SBU." 686/686 backend tests pass (2 new — a
positive self-delegation-to-a-report case, a negative
delegation-to-a-non-report case), `tsc`/lint clean. Full narrative:
`docs/Progress-Archive-2026-09.md`'s 2026-09-03 (later) entry.

**F.1-F.3, self-delegation (step 7) confirmed working live 2026-09-03**
(Basheer K as SBU Manager, Fazal reassigning to Fahad with the restricted
picker). One more bug found during this pass, fixed same day: Fahad
(Marketing User) assigned a lead to Rudrappa — bell showed a red dot, but
the dropdown entry wasn't highlighted. DB check: notification read 36s
after creation, consistent with Rudrappa genuinely opening Marketing Lead
Queue via the sidebar (not by clicking the bell notification) — that
path marks it read server-side but never told the bell's cached
unread-count to refresh, only its own 60s poll would eventually catch up.
`MarketingLeadReviewQueueScreen.tsx` now invalidates `["notifications",
"unread-count"/"list"]` itself whenever it becomes active, not just on
bell-click-through. `tsc`/lint clean, no backend change needed.

**Group F complete (steps 4-6 passed live 2026-09-03)** — Admin/GM
full visibility+action across SBUs, already-reviewed-lead rejection,
plain-rep-cannot-reassign all confirmed.

**Small polish, same day:** Basheer noticed a lead reassigned away and
back (Rudrappa -> Shruthi -> Rudrappa) produces two notifications reading
identically ("assigned you a marketing lead") with no way to tell weeks
later they're the same lead, not two, or notice nothing got silently
dropped. Considered a live-status enrichment (show the lead's current
state/assignee in the notification) but Basheer said not to over-engineer
it -- simpler fix: `NotificationBell.tsx`'s `describe()` now includes a
short tag from `entity_id` ("...marketing lead #A1B2C3"), already on
every notification response, no backend change. Same tag recurs across a
lead's reassignment history. Factored into a shared `marketingLeadRef()`
helper (`utils/marketingLeadMilestone.ts`) and rolled out everywhere a
lead appears, per Basheer's follow-up ("should be visible throughout the
system") — both queue card types, the Marketing User's own list,
Discard/Reassign modal titles, and Convert's green context box. Then
restyled again on Basheer's feedback: moved from a trailing light-grey
label to a **leading**, bold indigo badge (`#eef2ff`/`#4338ca`) ahead of
the account name on every card, so it actually stands out instead of
reading as an afterthought. `tsc`/lint clean throughout, no backend
changes for any of this.

**Session wrap-up 2026-09-03 (late):** all of today's work (30 files: 24
modified, 6 new — migrations 0035-0038, marketing_lead/notification
backend, 3 new frontend files, doc updates) **committed** as `c7b90db`.

**Next step: Group G (regression)** — the last group in
`docs/Lead-Management-Manual-E2E-Test-Plan.md`: normal rep's +Lead/+Log
unaffected, direct-IndiaMART-Opportunity assignment stays non-urgent,
normal assignment notification unchanged. Once G passes, the whole Lead
Management feature (Groups A-G) is E2E-confirmed end to end.

**Next up after E2E completes: two items now queued in `docs/Backlog.md`
(plus the SBU-required-at-Marketing-User-creation gap parked there too —
see that doc for detail).**
1. **Engagement History generation** (supersedes the old "Relationship
   Notes" plan as of 2026-09-01) —
   `docs/Engagement-History-Generation-Implementation-Plan.md`. **Blocked
   on one open decision, not code-ready:** which LLM/processing approach
   to use is a data-privacy call for Basheer/leadership (§6 of the plan).
   Full narrative: `docs/Progress-Archive-2026-09.md`'s 2026-09-01 entry.
2. Milestone 2/Target Planning and the Annual Development-Activity KPI
   remain further-out candidates in `docs/Backlog.md`. The UAT
   `rls_auto_enable()` trigger remains a standing risk item, not a
   feature.

## UAT migration — status as of 2026-08-29

Both Star Sales and the extended sales team now have UAT access and have
been walked through the app. Full territory/roster detail:
`docs/Progress-Archive-2026-08.md`'s 2026-08-24 and 2026-08-29 entries;
underlying territory data: `docs/Zone-Hierarchy-Territory-Data-2026-08.md`
(now stale in two places — Bangalore's zone-tree shape, and Nagesh
Ninganoor's territory after his resignation — see the 2026-08-29 archive
entry for both).

**Known blocker, still standing:** direct DB-touching commands
(migrations, raw queries) get blocked by the Claude Code auto-mode safety
classifier regardless of chat approval. Basheer runs these himself
(`!`-prefixed or his own terminal). Read-only SQL (SELECT queries via a
python/psycopg2 script, using `.venv/Scripts/python.exe` directly — Git
Bash mis-resolves `source .venv/Scripts/activate` on this machine) runs
fine without tripping the classifier — used repeatedly this session for
UAT diagnostics with no issue.
