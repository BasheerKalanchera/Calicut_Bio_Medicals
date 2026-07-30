# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-06+ (continued across multiple days)_

## Current task — STOP HERE FIRST

**Phase 2E task checklist (see `docs/Phase-2E-Build-Estimate.md` §6 for the
original 10-item source list; Task 1a was inserted ahead of Task 2 mid-build,
2026-07-26, so numbering below reflects actual build order, not the doc):**
1. [x] Migration: `manager_id`, role rename/new tiers, `cabio_app` role+grants — DONE
2. [x] User Directory screen: create + update `user_profile` (Admin/GM gated) — DONE, Basheer's manual E2E passed 2026-07-27 (see note below)
3. [ ] **PARKED, not blocking** — Assign real staff to Area Manager / Sales Manager tiers (via the Task 1a screen, not raw SQL). Per `Phase-2E-Build-Estimate.md` (line 151/157), this was always scoped as "Basheer's call on names/reporting lines, not build work," and the plan's own RLS verification step (Item 8) explicitly says Area Manager/Sales Manager testing happens via *reassigning an existing test account*, not real staff — so nothing in Tasks 4-9 depends on this. Test accounts already stood up (2026-07-27, see note below) fully cover Task 7/8's verification needs. **Do this before UAT rollout** (once real names/reporting lines are confirmed with Cabio leadership), not before continuing the RLS build.
4. [x] 4-var `set_rls_context()` + `cabio_app_uid`/`sbu_id`/`role_id`/`zone_id` SQL helper functions — DONE, applied to live dev DB 2026-07-27 (see note below), real bug found + fixed before it could hit Tasks 5-7
5. [x] RLS policies: `opportunity`, `split`, `opportunity_item`, `opportunity_stakeholder` (clean join-back bucket) — DONE, applied to live dev DB 2026-07-27 (see note below)
6. [x] RLS policies: `activity`, `document`, `reminder` (conditional/two-hop — highest-risk item, see §2 of the estimate doc) — DONE, applied to live dev DB 2026-07-27 (see note below), scope grew mid-build to also widen `opportunity`'s own policy (participant visibility)
7. [x] RLS policy: `product` (flat SBU check) — DONE, applied to live dev DB 2026-07-27 (see note below)
8. [x] Local verification loop (all 6 tiers × every table above) — DONE 2026-07-27 (see note below), 56/56 checks passed
9. [~] Cutover to `cabio_app` on dev — DONE, connection split + swap live 2026-07-27 (see note below); automated read-path retest passed, **write-path retest (create/update Opportunity, log Activity, etc.) across roles still needs Basheer's manual E2E pass** before this is fully closed out
10. [ ] Doc fixes: `Physical-Schema.sql`, `Backend-Implementation-Standards.md`, ADR-009, `Phase-2E-Security-Architecture.md` (now also needs its exact `cabio_app_*()` SQL snippet corrected, see Task 4 note below — not just the zone_id addendum already tracked), `CLAUDE.md` zone list
    *(fast-follow, not blocking, not numbered above: Admin/GM "Edit User" screen upgrade to full Supabase-Admin-API self-service signup — deferred until Cabio staff take autonomous ownership of onboarding)*

**2026-07-30 — Task 9 manual write-path retest, in progress (Basheer live,
guided step-by-step against `docs/Phase-2E-Task9-Write-Retest-Plan.md`).**
Baseline 1-3 of 5 passed clean, no errors:
1. Basheer K (Sales Staff) — logged a new Activity on own opportunity. Pass.
2. Test - Sales Manager — edited an existing owned opportunity (field edit,
   not a new create). Pass.
3. Test - Area Manager — logged an Activity + linked a Stakeholder on one of
   their 9 currently-visible opportunities (not one they own — exercises the
   combined SBU+zone branch). Pass. Note: Task 8's recorded count for this
   tier was 12 (2026-07-27); now 9, explained by the 2026-07-28 Basheer K
   opportunity cleanup (4 deleted, some in-zone) — data drift, not a bug.
4. Test - SBU Manager (Critical Care) — created a brand-new opportunity
   (`TEST - SBU Manager Baseline`, owner-at-creation branch, per the known
   no-existing-Critical-Care-opportunity test-data gap). Pass.

**Real bug found + fixed mid-retest, not RLS-related:** creating an
opportunity via the global "+ Lead" button did not make it appear on the
Pipeline screen until a hard browser refresh. Root cause: `DemoApp.tsx`'s
`QuickLeadModal onCreated` handler only refreshed a Project-Detail-scoped
ref (`projectOppsRefreshRef`), never invalidated the React Query key
`OpportunityPipelineScreen.tsx` actually reads (`["pipeline", ownerFilter]`)
— so the Pipeline list kept rendering its stale cache; a hard refresh
"fixed" it only by wiping the whole cache. Fixed by adding
`useQueryClient` + `queryClient.invalidateQueries({ queryKey: ["pipeline"] })`
alongside the existing ref call. Verified live: new opportunity now appears
on the Kanban view immediately on save, no refresh needed. **Not yet
committed** — folding into the same commit as the Task 9 cutover config
once the full retest is done, per Basheer's existing "commit after retest
results are in" call.

5. Admin/GM — logged in as GM (whose own `sbu_id` happens to be the
   meaningless Critical Care placeholder), deliberately edited an **Imaging**
   opportunity (different SBU from GM's own, to actually prove the
   unrestricted branch rather than a same-SBU coincidence) by logging an
   Activity and assigning the Next Action to Basheer K. Pass — verified the
   reminder shows up on Basheer K's Next Actions screen.

**All 5 baseline checks passed.** Moved to the 4 targeted edge cases.

**Real regression found on Edge Case 1 (cross-SBU Next Action reassignment)
— found, fixed, and documented permanently (ADR-037, BR-FIN-06, BR-ACT-06),
not just here.** Logged in as Basheer K, the "Assign Next Action To" dropdown
only ever showed himself — could not reassign to Amit R at all, breaking the
exact workflow this edge case exists to test.

**Root cause:** the 2026-07-28 `/users` visibility fix (`978c850`) correctly
tier-scoped the endpoint for the Opportunity Owner reassignment dropdown, but
`LogActivityModal.tsx`'s "Assign Next Action To" picker calls that same
`listUsers()` → same endpoint. `_SCOPE_BUILDERS` in
`organization/repository.py` has no entry for "Sales Staff", so it silently
fell through to "self only" — a real loss of functionality Task 6 deliberately
designed for (any user can be handed a follow-up regardless of tier; the
permanent `cabio_app_assigned_reminder()` RLS carve-out grants visibility
*after* assignment, not before). Investigating further, the same endpoint also
feeds `OpportunityDetailScreen.tsx`'s Splits "add participant" picker — also
silently broken by the same fix (Task 6/retest Edge Case 2 both require this
to allow anyone, not just the caller's own scope).

**Bigger question this surfaced, taken to Basheer before writing any code:**
should the Splits picker be unrestricted like Next Action, or scoped? Basheer's
call: Splits should stay within the caller's own SBU + zone — narrower than
Next Action, since commission-sharing colleagues should realistically be
co-located, unlike cross-SBU follow-up handoffs.

**That collided with existing doc: `BR-FIN-01`/ADR-003 explicitly says splits
"can cross SBUs."** Basheer clarified this was written for a now-obsolete
case — one Opportunity carrying products/credit across multiple SBUs
simultaneously — which ADR-004 (Projects) and ADR-035 (`Opportunity.sbu_id`
fixed, single-SBU) have since superseded; multi-SBU deals are now modeled as
a Project containing separate per-SBU Opportunities, not one Opportunity with
a cross-SBU split. Confirmed no validation exists preventing this today
(purely a business-process change, not a code constraint), and ran a
read-only impact check against the live dev DB before deciding enforcement
level: only 2 `split` rows exist total, both on "New USG m/c" (the same
opportunity already preserved as Task 9 edge-case evidence), and that row
*is* an existing cross-SBU/cross-zone split (Amit R, Critical Care, on an
Imaging opportunity). Since `replace_splits` is a full-list replace (not an
append), a naive hard check would have permanently frozen that opportunity's
splits (any future edit re-validates the *entire* submitted list). Basheer
chose to hard-enforce the SBU rule anyway, with existing participants
grandfathered (only *newly added* participants are checked against the
Opportunity's own `sbu_id`) — zone stays a soft, UI-picker-only restriction,
not backend-enforced (no clean business meaning for hard-gating zone the same
way, since `Account.zone_id` can differ from every participant's own zone
simultaneously, as the live data confirmed).

**Implementation (backend):**
- `organization/repository.py` — `UserRepository.list_active()` gains a
  3-way `scope` param (`"scoped"` default / `"sbu_zone"` / `"all"`) replacing
  a boolean I'd started with before realizing 2 modes weren't enough for 3
  distinct pickers.
- `organization/service.py` — `list_active_users()` passes `scope` through.
- `api/routers/master_data.py` — `GET /users?scope=` (pattern
  `^(scoped|sbu_zone|all)$`).
- `opportunity/repository.py` — new `get_user_sbu_ids()`.
- `opportunity/service.py` — `replace_splits()` now diffs incoming
  participants against currently-persisted ones; only genuinely new
  participants are checked against the opportunity's `sbu_id`
  (`BusinessRuleViolation` on mismatch).
- Tests: 2 new repository tests (`scope="all"`/`"sbu_zone"` compiled-SQL
  checks), 1 service test updated (`scope="scoped"` now always passed
  through explicitly), 3 new `replace_splits` tests (cross-SBU new
  participant rejected, same-SBU passes, pre-existing cross-SBU participant
  grandfathered through an otherwise-valid resave). **360/360 passed**, `ruff
  check` clean on every touched file (one pre-existing unrelated unused
  import in `test_opportunity_service.py` cleaned up in the same pass, per
  this project's established "fix lint in files you touch" precedent).

**Implementation (frontend):** `masterData.ts`'s `listUsers()` gains a
`scope` param. `LogActivityModal.tsx` (Next Action picker) → `scope: "all"`,
new query key `["users", "assignable"]`. `OpportunityDetailScreen.tsx`'s
Splits picker → `scope: "sbu_zone"`, new query key `["users", "sbu_zone"]`.
Every other `listUsers()` caller (Opportunity Owner pickers in
`QuickLeadModal.tsx`, `Customer360Screen.tsx`, `OpportunityDetailScreen.tsx`'s
Edit Opportunity modal, `OpportunityPipelineScreen.tsx`'s owner filter) stays
on the default `scoped` behavior, unchanged — these previously all shared one
`["users", "all"]` cache key despite needing different data post-fix, a real
collision risk now resolved by giving the two changed consumers their own
keys. `tsc --noEmit` / `npm run lint` both clean.

**Docs updated permanently, not just here** (per Basheer's explicit
instruction — this file gets trimmed/archived over time and would lose the
reasoning): `docs/ADR.md` — new **ADR-037** (Split Participant SBU
Restriction, supersedes ADR-003's cross-SBU scope), ADR-003's own status line
annotated to point to it. `docs/Business-Rules.md` — **BR-FIN-01** amended
(cross-SBU scope struck through, reasoning + pointer to BR-FIN-06 added);
new **BR-FIN-06** (Split Participant Eligibility — SBU hard rule +
grandfathering + zone-is-UI-only caveat); new **BR-ACT-06** (Next Action
Assignee Eligibility — unrestricted, with the RLS-carve-out rationale).
Code comments in `organization/repository.py` and
`opportunity/service.py::replace_splits` cross-reference these BR numbers.

**Not yet committed** — same as the earlier pipeline-cache fix, folding into
the post-retest commit per Basheer's "commit after retest results are in"
call.

**Edge Case 1 retried — pass**, confirmed via direct read-only DB check
(Amit R doesn't have a live login handy) rather than the UI: the new
reminder exists, `assigned_to_user_id` = Amit R, logged by Basheer K.

**Edge Case 2 — pass, both halves.** Test - Sales Manager added a 50% split
to Test - Area Manager (not a direct report — reports the *other* direction
in this hierarchy) via the now-`sbu_zone`-scoped picker (confirmed picker
only offered Imaging/North Kerala colleagues, as designed). Write succeeded;
logged in as Test - Area Manager afterward, the opportunity now appears in
their own pipeline — the permanent `cabio_app_has_split()` carve-out
confirmed live, not just Task 8's synthetic data.

**Edge Case 3 — real architecture contradiction found, business rule added
(BR-ACT-07), decision: no code change.** Basheer questioned the test itself:
if Product Catalog is SBU-restricted, how would a cross-SBU user ever reach
a product's documents to test this? Investigated: `DocumentService.list_by_product()`
gates on `product_exists()` first, which queries the RLS-restricted `product`
table (Task 7) — a cross-SBU user 404s before `document`'s own (technically
permissive, `opportunity_id IS NULL`) policy is ever evaluated. There's also
no UI path to a product's documents other than Product Catalog → click into
the product, itself correctly SBU-filtered. **Decision: drop the original
Task 6 cross-SBU intent, keep the restriction** — Product Catalog's own SBU
boundary (Task 7) takes precedence, nothing to fix in code. Documented in
`Business-Rules.md` (new BR-ACT-07) since this was never actually written
into any authoritative doc before (only informally in narrative, now
archived) — nothing to retract, but a real rule worth stating going forward.
`docs/Phase-2E-Task9-Write-Retest-Plan.md`'s edge case 3 corrected to match
(moved from "expect succeeds" to the expected-to-fail bucket).

**Edge Case 4 — pass.** No Amit R login exists (no Supabase Auth account for
him, just a `user_profile` row from demo data) — substituted Test - Area
Manager. Existing pending reminders assigned to him were all self-logged on
opportunities he owns (didn't isolate assignee-vs-owner), so a fresh one was
needed: Basheer K logged an Activity, assigned the Next Action to Test - Area
Manager; logged in as Test - Area Manager, marked it complete successfully —
confirms the assignee alone (not the logger or opportunity owner) can close
out a reminder.

**All 4 edge cases done.** Next: the expected-to-fail check (Sales Staff
genuinely can't reach an out-of-visibility Opportunity), which now also
covers the revised Edge Case 3 (cross-SBU product/document 404).

**Next: Edge Case 4** (reminder completion by the assignee, not the owner —
have Amit R mark the reminder from Edge Case 1 complete), **then the
expected-to-fail check** (Sales Staff genuinely can't reach an
out-of-visibility Opportunity), **which now also covers the revised Edge
Case 3** (cross-SBU product/document 404).

**UI issues noticed during the retest, not yet investigated, moved to
`docs/Backlog.md`** — mobile Owner-field truncation, no Next Actions tab on
Opportunity Detail, Next Actions screen missing "logged by." None blocking
the retest itself.

**2026-07-27 — Task 9 in progress: `cabio_app` cutover live on dev.** Before
flipping `backend/.env`, found a real gap the architecture doc had
anticipated but the codebase never implemented: `alembic/env.py` and
`app/db/session.py` both read the same single `settings.DATABASE_URL` —
swapping it wholesale would've made every future `alembic upgrade` run as
`cabio_app`, which has no `CREATE`/`ALTER` grants, breaking migrations
permanently. Fixed by splitting the connection:
- `app/core/config.py` — new required `ADMIN_DATABASE_URL: SecretStr`.
- `backend/.env` — `ADMIN_DATABASE_URL` now holds the former `DATABASE_URL`
  value (table-owner/postgres connection); `DATABASE_URL` itself repointed
  to `cabio_app` (tenant-qualified username `cabio_app.<project-ref>`
  through the Supavisor pooler, password percent-encoded via
  `urllib.parse.quote` since it contains literal `!`/`@`).
- `alembic/env.py` — now builds `sqlalchemy.url` from `ADMIN_DATABASE_URL`,
  not `DATABASE_URL`, so migrations keep running with DDL privileges,
  fully decoupled from the app's own connection going forward.
- `tests/conftest.py` — added a matching `ADMIN_DATABASE_URL` default
  (pydantic requires it to instantiate `Settings()` at all, even though
  no test actually uses it — tests never touch alembic). Confirmed
  `tests/conftest.py` already pins `DATABASE_URL` to a separate
  `localhost:54322` default regardless of `backend/.env`'s real value, so
  the pytest suite was never at risk from this cutover either way.

Verified post-swap: `alembic current` still resolves via `ADMIN_DATABASE_URL`
(unaffected, still `0012`/head); `app.db.session.engine` now connects as
`cabio_app` (confirmed via `SELECT current_user`); **345 passed**, `ruff
check` clean on all 3 touched files.

**Automated read-path retest, through the real app code path (not a bespoke
script)** — re-ran Task 8's exact 7-identity × 8-table matrix through
`SessionLocal` + `set_rls_context()` (the actual production call path,
pooled connections, same as every real request), not raw psycopg2. All
counts matched Task 8's numbers exactly (opportunity: 21/21/0/12/16/18/5;
product: 27/27/19/8/8/8/19; same parity across the other 6 tables) —
confirms the cutover's actual connection-pooling behavior reproduces the
already-proven policy logic, not just that the policies exist.

**Deliberately not yet done, held for Basheer's manual E2E pass (same
division of labor as the User Directory screen):** write-path retest
(create/update Opportunity, log Activity, etc.) across all 6 tiers. Task 8
and this session's read-path check only ever exercised `SELECT` — these
policies have no `FOR SELECT` clause and no separate `WITH CHECK`, so
`INSERT`/`UPDATE` are gated by the identical `USING` expression, untested
until now. `Activity` rows are immutable (`CLAUDE.md` safety note — no
DELETE endpoint, so a bad test write is permanent), and this is the live
shared dev DB — real risk, not automated blindly.

**Test plan handed off in `docs/Phase-2E-Task9-Write-Retest-Plan.md`**
(scratch doc, Basheer will delete once retest is done) — baseline
one-write-per-tier sanity checks, 4 targeted edge cases (cross-SBU Next
Action reassignment, Split to someone outside the reporting chain, a
product-only Document's cross-SBU visibility, reminder completion by the
assignee not the owner), and one expected-to-fail check (a Sales Staff
account genuinely can't reach an out-of-visibility Opportunity to edit it).
**Config/env changes (`config.py`, `alembic/env.py`, `tests/conftest.py`,
`backend/.env`) deliberately left uncommitted until the retest results are
in**, per Basheer's call — a finding could still fold a fix into the same
change before it's committed.

**Automated write-retest suite — designed, paused mid-build, not started.**
`TestClient` in-process with SQLAlchemy's `join_transaction_mode="create_savepoint"`
so `get_db` hands back a session bound to one externally-controlled
transaction — every real code path runs but nothing survives a forced
rollback. **Blocked on:** where the suite should read each test account's
real password from (env var vs `.env.test`) — asked, never answered, since
Basheer redirected to the `/users` fix instead. Planned file list once
resumed: `backend/tests/rls/__init__.py`, `conftest.py` (transactional
fixture + `login()` helper), `test_write_retest.py`.

**2026-07-28 — Amit R opportunity cleanup + Critical Care/Imaging hierarchy
build-out planned, first 3 junk rows deleted.** Amit R's opportunities were
invisible to Test - SBU Manager (Critical Care) because all 5 were stamped
`sbu_id = Imaging` (frozen-attribution, ADR-035 — set from creator Basheer K,
doesn't follow ownership reassignment) — not a bug. 3 were childless test
junk ("Test opportunity 3", "New opportunity", "one more") — deleted after
the usual precondition check, Amit R now owns exactly 2. The other 2 ("New
USG m/c", "Mims calicut") stay untouched: immutable `Activity`/`Reminder`
rows tied to Task 9 edge cases 1/2 (see the Amit R cross-visibility entry
below), and Imaging-only line items (SonoScape E2/HD-550) — reassigning
owner or `sbu_id` would either hit Activity immutability or create a
Critical-Care-opportunity-selling-Imaging-products inconsistency.

**Hierarchy build-out — plan confirmed with Basheer, blocked on new accounts.**
Critical Care gets its own chain: new Area Manager → new Sales Manager →
Amit R, under the existing Test - SBU Manager. Imaging gets its own new SBU
Manager: Test - Area Manager/Test - Sales Manager stay put (still governing
Basheer K), just get a new Imaging-specific manager, replacing today's
cross-SBU wiring (Test - Area Manager currently reports to the Critical Care
SBU Manager). **Blocked:** `user_profile.id` must match a real Supabase Auth
UUID, and `backend/.env` only has the anon key — 3 new accounts need Basheer
to either create them via the Supabase dashboard and hand over the UUIDs, or
provide a service-role key. Once accounts exist, wiring
`sbu_id`/`zone_id`/`manager_id` is a normal `/users` API operation, same
path the User Directory screen uses. **Still open, waiting on Basheer.**

**2026-07-28 — Amit R cross-visibility question, investigated and closed: not
a bug.** Basheer reported seeing opportunities owned by Amit R while logged in
as `sales@cabio-demo.com` (Sales Staff) and asked whether that was expected.
Verified directly against the live DB using the app's real code path: of
Amit R's 5 owned opportunities, Basheer sees exactly **2** — "New USG m/c"
(Basheer has a 50% Split + an incomplete assigned Next Action reminder on
it) and "Mims calicut" (a completed assigned reminder). The other 3 are
correctly hidden. This is the Task 6 permanent split/reminder carve-out
(`0011_rls_activity_document_reminder.py`) working as designed — both ties
are pre-existing data from 2026-07-05. **Doubles as a live confirmation of
Task 9 retest edge cases 1/2** (cross-owner reminder assignment, split
visibility) — can be checked off without re-running them fresh when the
write-retest results are written up.

---

**Session-handoff restructuring, 2026-07-30** (see `CLAUDE.md`'s Session
Handoff section for the new rule): this file no longer carries narrative,
backlog, or standing decisions going forward — only the current task and
immediate next step. Anything resolved and unrelated to the still-open
Task 9 thread above (the `/users` cache-leak fix, Basheer K junk-opportunity
cleanup, Phase 2E Tasks 1a/4-8's detailed write-ups, the User Directory E2E)
moved to `docs/Progress-Archive-2026-07.md`. The old Deferred section moved
to `docs/Backlog.md`. The Customer360Screen query-key/`initialData`
reference moved into `Frontend-Implementation-Standards.md` §3.3. Older
history before 2026-07-26 was already in `docs/Progress-Archive-2026-07.md`
(archived 2026-07-27/28).
