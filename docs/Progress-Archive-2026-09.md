# Progress Archive — September 2026

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
