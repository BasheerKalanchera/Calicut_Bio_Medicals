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
6. [ ] RLS policies: `activity`, `document`, `reminder` (conditional/two-hop — highest-risk item, see §2 of the estimate doc)
7. [ ] RLS policy: `product` (flat SBU check)
8. [ ] Local verification loop (side `psql` session, all 6 roles × every table above, before any cutover)
9. [ ] Cutover to `cabio_app` on dev, live retest all roles
10. [ ] Doc fixes: `Physical-Schema.sql`, `Backend-Implementation-Standards.md`, ADR-009, `Phase-2E-Security-Architecture.md` (now also needs its exact `cabio_app_*()` SQL snippet corrected, see Task 4 note below — not just the zone_id addendum already tracked), `CLAUDE.md` zone list
    *(fast-follow, not blocking, not numbered above: Admin/GM "Edit User" screen upgrade to full Supabase-Admin-API self-service signup — deferred until Cabio staff take autonomous ownership of onboarding)*

**2026-07-27 — Task 5 done: migration `0010_rls_opportunity_children.py`, applied
to live dev DB (`alembic current` = `0010`, head).** Enables RLS + one policy
each on `opportunity`, `split`, `opportunity_item`, `opportunity_stakeholder`,
plus a new helper function `cabio_app_role_name()` (resolves the caller's
`role_id` to its `role_name`, mirroring 0009's 4 identity functions, reused
across the 4 tier branches below). Encodes all 6 tiers from
`Opportunity-Access-Hierarchy-Technical-Design.md` §1/§5/§6 as one combined
`USING` clause on `opportunity` (Admin/GM unrestricted; SBU Manager →
`sbu_id` match; Area Manager → SBU Manager's check **and** the opportunity's
account is in-zone, joined via `account.zone_id` not the owner's, per §5's
frozen-attribution reasoning; Sales Manager → owner reports directly to the
caller via `user_profile.manager_id`, gated on role name per Basheer's
2026-07-27 call, defense-in-depth against a future data-entry mistake; Sales
Staff, and harmlessly every tier, → `owner_id = caller`, deliberately left
un-gated since it never grants more than "your own rows," a no-op for every
tier above). `split`/`opportunity_item`/`opportunity_stakeholder` each get a
one-line join-back policy (`opportunity_id IN (SELECT id FROM opportunity)`)
— Postgres re-applies `opportunity`'s own policy to that subquery
automatically, so the tier logic lives in exactly one place.

Verified via direct metadata query (not the full 6-tier behavioral matrix —
that's Task 8, deliberately deferred until Task 6/7's policies also exist,
per `Phase-2E-Build-Estimate.md` §5's discipline): all 4 tables show
`rowsecurity = true`, all 4 policies exist under their expected names,
`cabio_app_role_name()` exists, and the app's own connection (table owner,
exempt from RLS by default) still sees all 21 opportunities — confirms this
migration is inert on the running app, same as 0008/0009. `345 passed`
(unchanged — this migration touches no Python code), `ruff check` clean on
the new file.

**Real finding, flagged for Task 8, not resolved now:** a smoke-test attempt
to impersonate `cabio_app` hit two dead ends worth knowing about before that
task starts — (1) `SET ROLE cabio_app` from the app's own connection fails
with `permission denied`, so the current connecting role isn't a member of
`cabio_app` (despite PG16's "creator is granted membership" behavior —
worth checking why that didn't apply here, possibly a Supabase-managed-role
quirk); (2) connecting directly as `cabio_app` by swapping just the username
in `DATABASE_URL` fails against Supabase's Supavisor pooler with
`FATAL: no tenant identifier provided` — the pooler requires the
tenant-qualified username format (e.g. `cabio_app.<project-ref>`, mirroring
whatever format the existing `postgres.<project-ref>`-style `DATABASE_URL`
username already uses), not a bare role name. Task 8's verification loop
needs one of these two resolved before it can actually impersonate roles.

**2026-07-27 — Task 4 done: migration `0009_cabio_app_rls_helper_functions.py`
+ `set_rls_context()` rewrite, applied to live dev DB (`alembic current` =
`0009`, head). `db/session.py`'s `set_rls_context()` now takes the full
`UserProfile` (signature change per the architecture doc) and issues 4 `SET
LOCAL` statements — `app.current_user_id`/`sbu_id`/`role_id` always,
`app.current_zone_id` only when `user.zone_id is not None` (nullable
column). `api/dependencies.py`'s `get_current_user()` call site updated to
match (`set_rls_context(db, user)`, was `(db, user.id)`). New
`tests/test_session.py` (3 tests: all-4-set, zone-set, zone-skipped-when-
None). Full suite **345 passed** (up from 342), `ruff check` clean.

Real bug found and fixed before it could reach Tasks 5-7, via direct
reproduction against the live dev DB rather than trusting
`Phase-2E-Security-Architecture.md`'s exact snippet as written:
`current_setting(name, true)` returns `NULL` only the very first time a
custom session variable is ever referenced in a given backend connection —
but once a `SET LOCAL` on that variable has committed even once, PostgreSQL
resets it to `''` (empty string), not `NULL`, for the rest of that pooled
connection's life. `user_id`/`sbu_id`/`role_id` are safe in practice since
`set_rls_context()` unconditionally re-sets all three on every request
before any query runs — but `zone_id` is deliberately skipped for no-zone
users, so on a connection pool shared across requests, a no-zone user's
request reusing a connection a zoned user's request just committed on would
read back `''` and crash the `::uuid` cast. Fixed by wrapping all 4
functions' `current_setting()` call in `NULLIF(..., '')`, applied uniformly
(not just to zone) since any of the 4 could in principle be read outside
the normal request-start ordering (e.g. Task 8's manual `psql` verification
loop, switching test context between roles without a full disconnect).
Re-verified live post-fix: `SET LOCAL` + commit + read-with-no-new-SET on
the same pooled connection now correctly returns `NULL`, not a crash.
**COMMITTED (`9b07776`, "feat: wire real user identity into RLS session
context (Phase 2E Task 4)").**
**`Phase-2E-Security-Architecture.md`'s "RLS Helper Functions" section still
shows the un-guarded snippet — needs correcting as part of Task 10, this is
a second, separate reason beyond the already-tracked zone_id addendum.**

**2026-07-27 — Basheer's manual E2E on the User Directory screen, all 7
original test-plan steps passed.** Confirmed live: nav item shows for
Admin/GM, users list correctly (SBU/zone/role chip), edit works including
"reports to X" display, self-manager guard (a user can't be set as their own
manager), create success (fresh Supabase Auth UUID, done twice), create
conflict case (an already-used UUID fails as expected), and the role-gate
check (logged in as a non-Admin/GM account, confirmed "User Directory" is
fully absent from the sidebar). **Task 1a is now fully verified, nothing
outstanding.** Also stood up the 6-tier hierarchy end-to-end with real logins
(all via the Supabase Dashboard for the Auth side, then this screen for the
`user_profile` side — no raw SQL used for any of it except the one email
rename below, which the screen has no field for):
- `manager@cabio-demo.com` **renamed to `sbumanager@cabio-demo.com`**
  (dashboard had no direct email-edit field, so done via SQL Editor:
  `UPDATE auth.users SET email = ...` + matching
  `UPDATE auth.identities SET identity_data = jsonb_set(...)` to keep the
  provider identity in sync — same UUID preserved throughout, so the
  existing `user_profile` row needed no changes). `display_name` also
  updated in-app to `Test - SBU Manager` to match.
- Two new Supabase Auth users created (dashboard "Add user" + this screen's
  "Add User" for the `user_profile` row): `areamanager@cabio-demo.com`
  (`Test - Area Manager`) and `salesmanager@cabio-demo.com`
  (`Test - Sales Manager`). Note for next time: the Area Manager account
  came back from Supabase already `confirmed_at`-populated even without
  ticking "Auto Confirm User" at creation — this project's Supabase
  instance doesn't appear to require the checkbox to avoid the stuck-
  unconfirmed state originally expected; if a future account *does* come
  back unconfirmed, the fix is `UPDATE auth.users SET email_confirmed_at =
  now() WHERE email = '...'` via SQL Editor.

**Resulting reporting chain (all "Test -" accounts except Amit R/Basheer K,
who are real):** `Test - General Manager` → `Test - SBU Manager` (Critical
Care/North Kerala) → `Test - Area Manager` (Imaging/North Kerala) →
`Test - Sales Manager` (Imaging/North Kerala) → `Basheer K` (Sales Staff,
Imaging/North Kerala). `Amit R` (Sales Staff, Critical Care/South Kerala) has
no manager set. **Deliberate cross-SBU edge case in this chain:** the Area
Manager (Imaging) reports to the SBU Manager (Critical Care) — different
SBUs across a manager link, on purpose, to prove Task 8's verification loop
that SBU/Zone-level RLS scoping (Levels 3/4) stays keyed to `sbu_id`/`zone_id`
directly and isn't accidentally widened by the `manager_id` chain crossing
SBU lines. Keep this test topology intact through Task 8 rather than
"tidying" it into same-SBU reporting lines — the cross-SBU link is the point.

**Status as of 2026-07-26: Phase 2E RLS build started.** Working off
`docs/Phase-2E-Build-Estimate.md`'s 9-task list (tracked as harness Tasks
1-9; Task 10, the fast-follow "Edit User" screen, is separate/non-blocking,
not tracked). **Task 1 DONE, applied to the live dev DB, verified:**
new migration `backend/alembic/versions/0008_phase2e_manager_id_role_rename_cabio_app.py` —
`user_profile.manager_id` (nullable, self-ref FK, indexed) added; `role`
table renamed (`Sales Executive`→`Sales Staff`, `Sales Manager`→`SBU
Manager`) + 2 new rows inserted (`Area Manager`, new-meaning `Sales
Manager`) — all 6 tiers now present; `cabio_app` Postgres role + grants
created (inert — RLS not enabled anywhere yet, app's own `DATABASE_URL`
unchanged, so this is invisible to the running app for now). `UserProfile`
model updated to match (`manager_id` column, no ORM relationship added —
nothing yet needs to traverse it in Python). Password sourced via a new
`CABIO_APP_DB_PASSWORD` setting in `app/core/config.py` (`backend/.env`),
matching the existing `DATABASE_URL`/`SUPABASE_ANON_KEY` pattern — not a
raw `os.environ` read (first draft used that; corrected before running,
since `pydantic-settings` doesn't propagate `.env` values into the process
environment). Verified live via direct query: `alembic current` = `0008`,
role table has all 6 correct rows, `manager_id` column exists, `cabio_app`
role exists in `pg_roles`.

**Task 1a inserted ahead of Task 2 (Basheer's call, 2026-07-26): User
Directory screen (create + update `user_profile`, Admin/GM-gated), so Task
2's staff assignment happens through a real UI instead of raw SQL.**
Scope explicitly excludes Delete (no need surfaced) and full self-service
Create (new person still needs a Supabase Auth account made via the
dashboard first, same as today — admin pastes the resulting UUID into this
screen rather than hand-writing the `INSERT`). Full self-contained
Supabase-Admin-API signup explicitly deferred until Cabio staff take
autonomous ownership of onboarding — not needed while Basheer is the one
doing this a handful of times a year.

**Task 1a — backend DONE:**
- `organization/schemas.py` — `UserCreate`, `UserUpdate`, extended
  `UserListResponse` (+`role_name`, +`manager_id`).
- `organization/repository.py` — `sbu_exists`/`role_exists`/`zone_exists`.
- `organization/service.py` — `create_user`/`update_user`, gated to
  `{"Admin", "General Manager"}` (same pattern as the Product Catalog
  write-gate); existence checks on `sbu_id`/`role_id`/`zone_id`/
  `manager_id`; self-manager guard.
- `api/routers/master_data.py` — new `"roles"` master-data entity (needed
  its own fetch branch — `Role` has no `is_active` column, unlike
  `SBU`/`Zone`, so it can't reuse the generic filtered fetch); new
  `POST /users`, `PATCH /users/{user_id}`.
- Tests: 15 new service tests (`tests/domains/organization/test_organization_service.py`)
  + 6 new router auth-gate tests (`tests/test_master_data.py`) — matches
  this codebase's convention of full logic coverage at the service layer,
  401/403-only coverage at the router layer (mirrors
  `test_product_service.py`/`test_product_router.py` exactly). One
  pre-existing test (`test_returns_paginated_users`) needed its mock
  updated for the two new required response fields.
- Verified: **342 passed** (up from 321), `ruff check` clean on every
  touched file (one mutable-class-attribute lint issue was mine, fixed;
  16 pre-existing findings elsewhere untouched).

**Task 1a — frontend DONE:**
- `types/api.ts` regenerated in-process (`app.openapi()` dumped to JSON,
  no server needed — same technique as the `bb671bc` precedent), hand-written
  tail alias block re-added (wiped by regen, as documented in the file's
  own comment) plus 3 new aliases (`UserListResponse`, `UserCreate`,
  `UserUpdate`). Note: `RoleResponse`/`SBUResponse`/`ZoneResponse` don't
  appear in the generated schema at all, before or after — the
  `/master-data/{entity}` endpoint's return type is the untyped
  `APIResponse[list]`, so `listRoles()` stays `Promise<unknown>` like the
  existing `listSbus`/`listZones`, consistent with pre-existing behavior,
  not a regression.
- `services/masterData.ts` — added `listRoles`/`createUser`/`updateUser`,
  typed `listUsers`'s return (was `unknown`, now `UserListResponse[]`).
  Extended this file rather than creating a new `services/users.ts` —
  `/users` already lived here pre-existing, matching the established
  "domain-owner file groups all its endpoints regardless of URL shape"
  convention (same reasoning as `opportunities.ts` owning
  `/stakeholders/...` routes).
- New `screens/UserDirectoryScreen.tsx` — `List`/`ListItemButton` of users
  (name, SBU, zone, "reports to X", role chip), full-row tap target per
  the documented mobile-tap-target standard; "Add User" + row-click both
  open the same `FormModal`-based form (id field only shown in create
  mode); dropdowns for SBU/Role/Zone/Manager sourced from master-data
  queries; manager dropdown excludes the user being edited (self-manager
  guard, client-side mirror of the backend's).
- `DemoApp.tsx` — new nav item under "ADMINISTRATION", filtered out unless
  `userProfile.role_name` is Admin/GM (`ADMIN_ROLES` set, same two roles
  as the backend gate); new always-mounted-hidden view, same pattern as
  Product Catalog.
- Verified: `tsc --noEmit` / `npm run lint` (eslint + no-Tailwind guard) /
  `npm run build` all clean. **Not yet verified live in a browser** —
  per this project's own testing rule, that's Basheer's manual pass, not
  mine; flagging explicitly rather than claiming UI verification I didn't
  do. To exercise Create for real, a throwaway Supabase Auth user needs to
  exist first (dashboard-created) to get a UUID to paste in.

**Next step:** Basheer's manual E2E on the User Directory screen (paused
here, 2026-07-26, to do this live testing himself before continuing). Test
plan handed off:
1. Start backend (`uvicorn app.main:app --reload --port 8000` from
   `backend/`) and frontend (`npm run dev` from `sales-os-app/`).
2. Log in as `admin@cabio-demo.com` or `gm@cabio-demo.com` — confirm
   "User Directory" appears under Administration in the sidebar.
3. Open it, confirm the 5 existing users list correctly (SBU/zone/role
   chip per row).
4. Click a row (Edit) — change role and/or set a manager, save, confirm
   the row updates and "reports to X" appears if a manager was set.
   Confirm the person being edited doesn't appear in their own manager
   dropdown (self-manager guard).
5. Create — conflict case: "Add User" with an **existing** user's UUID
   pasted in, rest filled normally — should fail (expect a generic error
   message, not the specific "already exists" text; that's a pre-existing
   app-wide FormModal/error-handling gap, not new).
6. Create — success case: make a throwaway Supabase Auth user via the
   Supabase dashboard first (Authentication → Users), copy its UUID, use
   it in "Add User" — confirm the new person appears in the list. Note:
   deleting that throwaway Supabase user afterward won't remove the
   `user_profile` row created here — no cascade exists between the two
   systems.
7. Log out, log in as Basheer K (Sales Staff) or the SBU Manager test
   account — confirm "User Directory" is gone from the sidebar entirely
   (role-gate check).

Then Task 2 (assign real staff to Area Manager / Sales Manager tiers, now done
through this screen instead of raw SQL) or Task 3 (4-var
`set_rls_context()` + `cabio_app_uid()`/`cabio_app_sbu_id()`/
`cabio_app_role_id()`/`cabio_app_zone_id()` SQL helper functions, per
`Phase-2E-Security-Architecture.md` + Technical Design §5) — either can go
next, Task 3 doesn't depend on Task 2. Task 5 (conditional/two-hop RLS
policies on `activity`/`document`/`reminder`) remains the highest-risk item
in the whole build — see `Phase-2E-Build-Estimate.md` §2 for why, and §5's
discipline (verify every policy via a side `psql` session with `SET ROLE
cabio_app`, all 6 tiers, before ever touching the app's own `DATABASE_URL`
in Task 8).

---

## Older session history — archived

Full narrative for everything before 2026-07-26 (the login-loop bug saga, the mobile tab-chip scroll bug's two failed attempts + resolution, the Stakeholder/Opportunity linkage 11-step build, deployment-topology planning, demo review notes, etc. — all shipped/resolved, nothing open) moved to `docs/Progress-Archive-2026-07.md` on 2026-07-27 to keep this file focused on current and pending work. Not loaded at session start; grep it directly if you need the detail behind an old commit.

## Done in prior sessions (committed — see git log/commit messages for full detail)

(ledger rows are commits, not files; §9 status as of `71dc5a0`: 12 fully
migrated, 3 pending — `CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx` — and 1 permanently out of scope, `App.jsx`
itself, the prototype, never migrating. 12 + 3 + 1 = 16 tracked total; only
the 3 pending files are actual remaining work.)

| File / change                                       | Commit(s)   | What                                                                                 |
| ---------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| Docs reconciliation + Tailwind pre-commit guard      | `d25bea8`, `dc543fa`, `bb28f23` | CLAUDE.md/Frontend-Standards reconciled to ADR-031; `.githooks/pre-commit` activated |
| `main.tsx`                                           | `8ec95a4`   | MUI migration                                                                        |
| `ActivityTimeline.tsx`                               | `5eef75a`   | MUI migration (redesigned as cards)                                                  |
| `NextActionsScreen.tsx`                              | `219ff99`   | MUI migration                                                                        |
| `LogActivityModal.tsx`                               | `c1796d6`   | MUI migration + `.then()`→`useQuery` fix                                             |
| `OpportunityPipelineScreen.tsx`                      | `8a3ed70`   | MUI migration                                                                        |
| Fidelity audit fixes (theme + first 7 files)         | `a7cbb02`   | Theme-level + per-file corrections; wrote up §6.6/§6.7/§6.8                          |
| `QuickLeadModal.tsx`                                 | `fe68a91`   | MUI migration + React Query                                                          |
| `OpportunityDetailScreen.tsx` Commit A                | `3619295`   | Styling + missing stakeholder-link POST/DELETE endpoints                             |
| `OpportunityDetailScreen.tsx` Commit B                | `01cead0`   | React Query + BR-FIN-03 auto-sync + `applyOppPatch` + stakeholder-edit feature       |
| `check-no-tailwind.js` shape-matching fix            | `11dc051`   | Guard matches real Tailwind utility shape, not bare `className=`                     |
| `sales_os_prototype_demo_ready.jsx` deletion         | `6d7b9f7`   | Removed orphaned prototype file                                                      |
| `DemoApp.tsx`                                        | `d107c5b`   | MUI migration                                                                        |
| `Customer360Screen.tsx` Commit A                     | `fd57a32`   | Styling-only MUI migration                                                           |
| `Customer360Screen.tsx` Commit B                      | `1bc4678`   | React Query (ADR-032) + BR-OP-02/03/05 status-gated fields + activity_count field + Round 1 activity query optimization (account-scoped only — see Deferred) |
| Backend concurrency fix (48 `async def` → `def`)      | `2bb41b4`   | Fixed the real root cause of Activity-tab/general screen-load slowness — see "Backend concurrency fix" below |
| `Customer360Screen.tsx` graduation                    | `a0ef2e4`   | §9 fully-migrated table + `check-no-tailwind.js` GRANDFATHERED removal              |
| `OpportunityDetailScreen.tsx` BR-OP port + 4-tab prefetch | `2f7e074` | BR-OP-02/03/05 status gates, Overview display, Reactivation Overdue badge, always-mounted Products/Splits/Stakeholders/Activity prefetch |
| `OpportunityPipelineScreen.tsx` Reactivation Overdue badge | `349a41e` | Last piece of the BR-OP status-gate rollout (all 3 opportunity-facing screens now done) |
| `ReminderRepository.list_for_user`/`count_for_user` fix    | `39ff781` | `include_completed` changed from additive to exclusive filter — Next Actions "Completed" tab no longer shows pending rows too |
| Activity logging on Project Details                    | `6075c80` | New `list_by_project` backend path + Activity card on `ProjectDirectoryScreen.jsx`; see write-up below |
| `ErrorBoundary.jsx` rename + migration                 | `581c28d`, `71dc5a0` | `.jsx`→`.tsx` rename, then MUI migration; styling + type-conversion only, no data-fetching (per §9's own "N/A" row) — §9 now 12 migrated, 3 pending |
| Parent Customer display (read-side)                    | `87fde5a`   | `AccountRef` type + `list_children()` read path; Customer360Screen Overview tab + CustomerDirectoryScreen "Parent: X" badge; see write-up below |
| Parent Customer editing + 2 bugfixes                    | `95e118a`   | Edit Account/New Customer parent lookups, backend cycle guard, cache-invalidation + `initialDataUpdatedAt` fixes; see write-up below |
| `api.ts` regeneration + `ActivityType` backend fix       | `bb671bc`   | Closed out the generation-debt item below; see write-up below |
| Docs fix (`managing_sbu_id`/`zone_id` drift) + `ADR-035` | `1a6e633`   | `Enterprise-Data-Model.md`/`Physical-Schema.sql` corrected; new ADR formalizing Account-is-SBU-agnostic (previously only in an archived memo) |
| Stray-test fix, unrelated to any feature                | `31bafa8`   | `ProductService.list_products` test called a `brand` kwarg the method never had — fixed the test, did not build brand filtering |
| `CustomerType` (institution-nature)                      | `70cf978`   | Migration `0005` + model/schema/service/tests + `Customer360Screen.tsx`/`CustomerDirectoryScreen.jsx` UI + `ADR-036`; see write-up below. Manually verified by Basheer — see "Current task" for one open follow-up question this surfaced |
| Opportunity Detail trio (Project/Lead Source/Demo End)   | `b662751`   | `PipelineOpportunity` schema + `list_pipeline` noload fix + new `test_opportunity_router.py` + `OpportunityDetailScreen.tsx` Overview/Edit; see write-up below. Manually verified by Basheer, one layout tweak folded in |
| Reminder click-through                                   | `ac6d008`   | New `GET /opportunities/{id}` + `OpportunityDetailScreen.tsx` fetch-on-mount + `NextActionsScreen.tsx`/`DemoApp.tsx` wiring + return-view back-nav fix; see write-up below. Manually verified by Basheer, one back-navigation bug found and fixed |
| Product Catalog collateral links                         | `ab67209`   | New `document` domain (schemas/repository/service/router) + migration `0006` (`file_size_bytes` nullable, applied to live DB) + `ProductCatalogScreen.jsx` Collateral Links card; see write-up below. Manually verified by Basheer |
| Catalog role gate (GM+Admin)                              | `42fa050`   | `ProductService.create_product`/`update_product` require `role_name` kwarg, 403 unless GM/Admin; `ProductCatalogScreen.jsx` hides Add/Edit for other roles. Closes Milestone 1 gap-closure (all 6 items done). Manually verified by Basheer across all 4 roles (UI + direct `curl`) |
| Demo/rollout planning docs                                | `ffaa669`   | `Demo-Showcase-Flow-July-20.md` (8-act presenter script), `Regression-Test-Plan.md`, `Deployment-Topology.md` (Dev/UAT/Prod decision — see write-up below) |


Full write-ups for the rows above (backend concurrency fix, Parent Customer display+editing, `api.ts` generation debt, Milestone 1 screen mapping, the Prototype/Production Parity Audit) are in `docs/Progress-Archive-2026-07.md`.

## Reference: Customer360Screen.tsx Commit B query-key design

**Query keys — deliberately reusing existing keys from other files so
screens share one cache entry instead of duplicating fetches** (same
principle used in `OpportunityDetailScreen.tsx`'s Commit B for
stages/statuses/users, and now in its 4-tab prefetch too):

| Data                                 | `queryKey`                                                               | Shared with                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Account                              | `["account", accountId]`                                                 | — (screen-local)                                                                     |
| Account counts                       | `["account-counts", accountId]`                                          | —                                                                                    |
| Stakeholders (tab)                   | `["stakeholders", "byAccount", accountId]`                               | `OpportunityDetailScreen.tsx`'s stakeholder-link picker                              |
| Projects (tab)                       | `["projects", "byAccount", accountId]`                                   | `QuickLeadModal.tsx`'s project picker                                                |
| Opportunities (tab)                  | `["opportunities", "byAccount", accountId]`                              | — (new)                                                                              |
| Installed assets (tab)               | `["installed-assets", "byAccount", accountId]`                           | —                                                                                    |
| Zones                                | `["zones"]`, `staleTime: Infinity`                                       | — (new)                                                                              |
| Project statuses                     | `["project-statuses"]`, `staleTime: Infinity`                            | — (new)                                                                              |
| Stages / Opp statuses / Lead sources | `["stages"]` / `["statuses"]` / `["leadSources"]`, `staleTime: Infinity` | `OpportunityDetailScreen.tsx`, `OpportunityPipelineScreen.tsx`, `QuickLeadModal.tsx` |
| Hold / Loss reasons                  | `["holdReasons"]` / `["lossReasons"]`, `staleTime: Infinity`             | `OpportunityDetailScreen.tsx` (both screens' Edit Opportunity modal + Overview display) |
| Users                                | `["users", "all"]`                                                       | all of the above                                                                     |
| Products                             | `["products", "picker", sbuId]`                                         | `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx`                                  |
| Opportunity items                    | `["opp-items", <opportunityId>]`                                         | `OpportunityDetailScreen.tsx`'s Products tab, same opportunity                       |

**`initialAccount` → `useQuery`'s `initialData`.** First screen to
implement the pattern Frontend-Implementation-Standards.md §3.3 has held a
placeholder for since it was written. **§3.3 line 114 still says "No screen
in this codebase does this yet" — this is now stale and should be updated
with the real Customer360Screen.tsx example**, per that section's own
instruction. Small doc fix, not yet done.

**The ref-guarded seeding subtlety (implemented, verified in code):** the
Edit Opportunity modal's item list (`editOItems`) is an editable draft
buffer, not a direct render of query data. Since `listOpportunityItems` is
only fetched on-demand (`enabled: editingOpp !== null`), data isn't
available the instant the modal opens. Seeded in a `useEffect` guarded by a
ref (seed once per `editingOpp.id`, reset the guard on close) — confirmed
present in `Customer360Screen.tsx` (lines ~629-638) exactly as designed.

## Next step
**Milestone 1 gap-closure — fully complete.** All 6 items from
`docs/Prototype-Production-Parity-Audit.md` §6 ("Gaps to finish —
Milestone 1") are done: Parent Customer display + editing (`87fde5a`,
`95e118a`), `CustomerType` (`70cf978`), Opportunity Detail trio (`b662751`),
Reminder click-through (`ac6d008`), Product Catalog collateral links
(`ab67209`), Catalog role gate GM+Admin (`42fa050`).

**§9 MUI migration backlog resumes after Milestone 1** — 3 files remain
(`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx`), all still needing the full triple-conversion
(styling + fetch + `.jsx`→`.tsx`) — bigger lift than `ErrorBoundary.jsx` was,
no precedent file has been this file type yet. Resume the per-file
migration ritual (below) when picked back up — end with an honest §9 update
per column, not a blanket "done."

**Per-file ritual, mandatory for every remaining migration:**
convert → property-diff (against pre-migration git history, full comparison
table, evidence not summary) → triage (categorize each gap using §6.8's rules:
fix-theme / fix-per-file / verify-first / do-not-fix) → verify on screen
(manual E2E, Basheer's pass) → guard-green (`npm run lint` clean, `npx tsc
--noEmit` clean) → update §9 honestly (per-column, not a blanket "done") and
the `check-no-tailwind.js` GRANDFATHERED list to match, in the same commit →
commit. If a file's data-fetching and styling are genuinely separable risk
profiles, split into two commits rather than bundling.

`npx tsc --noEmit` is a deliberate addition, not a duplicate of `npm run lint`:
`sales-os-app/eslint.config.js` only has a `files: ['**/*.{js,jsx}']` block
(no `.ts`/`.tsx` glob) and there is no `typescript-eslint` package in
`devDependencies`, so `eslint .` silently skips every `.tsx` file. `npm run
build` is plain `vite build`, no `tsc` step either. Net effect: **no
automated step other than `tsc --noEmit` type-checks `.tsx` files.**

Update Frontend-Implementation-Standards.md as new gotchas/patterns surface
during these remaining migrations — §6.6/§6.8 are living documents.

## Deferred
- **Add an index on `account.zone_id`.** Surfaced during Task 5's migration
  review (2026-07-27). The Area Manager branch of the new `opportunity` RLS
  policy (`0010_rls_opportunity_children.py`) filters `account` by `zone_id`
  (`account_id IN (SELECT id FROM account WHERE zone_id = cabio_app_zone_id())`)
  — `account/models.py` has no index on that column today (checked: no
  `index=True`, no explicit `Index()` in `__table_args__`), so this is a
  sequential scan on every Area Manager row-visibility check. Not urgent at
  today's data volume (a few dozen accounts, imperceptible), but will slow
  down as the account list grows. Cheap one-line migration
  (`op.create_index(...)` on `account.zone_id`) whenever picked up — no
  behavior change, index-only.
- **Parent-account cycle guard — recursive-CTE optimization, not needed yet.**
  `AccountService._creates_cycle` (`backend/app/domains/account/service.py`)
  walks the ancestor chain with one DB round-trip per level; full reasoning
  and the CTE alternative are in that function's own docstring, not repeated
  here. Revisit only if a future milestone introduces deeper hierarchies.
- **Parent/Child account navigation — richer `initialData` instant-paint.**
  Surfaced during Milestone 1 "Parent Customer display" planning (2026-07-10, see
  `docs/Prototype-Production-Parity-Audit.md` §6). `Customer360Screen.tsx`'s
  `account.parent_account`/`account.child_accounts` are typed as a minimal
  `AccountRef {id, name}` — clicking a parent or child link still paints
  instantly from that (and, since the `initialDataUpdatedAt` fix landed
  2026-07-11, now reliably kicks off an immediate background refetch too —
  see write-up above), but the *initial* paint only has a name, no
  zone/payer_behavior/counts, unlike Directory-list navigation which has
  all of that from its already-fetched row data. This item is about
  closing that specific gap, not about the refetch-never-firing bug, which
  is already fixed.
  **Why it's cheap, if picked up later:** `account.zone` is a separate,
  non-self-referential relationship — always eager-joined regardless of nesting —
  so `parent_account.zone` is already in memory once `parent_account` loads; no
  extra query needed to expose it. For `child_accounts`, the `list_children()`
  repository query would just need `joinedload(Account.zone)` added to its
  options — one wider `SELECT`, not an extra round trip. Still 2 queries total for
  the whole account-detail endpoint, same as today.
  **What it'd take:** (1) backend — use `AccountListResponse` (zone, payer_behavior,
  parent_account_id) instead of the minimal `AccountRef` for `parent_account`/
  `child_accounts`, safe one level deep (no self-referential recursion risk since
  neither field nests a further `parent_account`); (2) frontend — `DemoApp.tsx`'s
  `selectedAccount` state (currently typed `{id, name}` only) needs widening to
  carry the richer object through `handleSelectAccount`, so it flows into
  `Customer360Screen`'s `initialAccount` prop → `useQuery`'s `initialData` the same
  way Directory-list navigation already works. Real cost is a slightly heavier
  payload on every account-detail fetch — negligible, and zero for the majority of
  accounts with no parent/children.
- **NPS field range enforcement + product dropdown label consistency (two-fix commit).**
  Surfaced during `Customer360Screen.tsx` Commit B E2E verification (2026-07-06).
  (1) NPS Score on Stakeholders has no range constraint today — free-number input.
  Standard NPS survey input is 0–10 per respondent; the -100 to +100 range is an
  aggregate metric, not a per-person score. Backend `nps_score` is already
  constrained `ge=-100, le=100` — the frontend-only 0–10 clamp idea needs
  revisiting/a decision before any fix is executed, not a ready-to-build task.
  (2) Opportunity item-picker renders `{p.name}` only; Installed Base dropdowns
  render `{p.name} — {p.model_number}`. One-line fix in `Customer360Screen.tsx`
  line ~928 (still present as of `1bc4678`).
- **Add `whatsapp_number` field to Stakeholder (backend migration + frontend).** Requested
  2026-07-06. Currently not in the DB schema or Pydantic schemas at all — needs a 3-layer
  change: (1) Alembic migration adding `whatsapp_number VARCHAR(50) NULLABLE` column to
  `stakeholder` table (follow pattern of `0002_add_stakeholder_contact_details.py`);
  (2) `stakeholder_schemas.py` → add `whatsapp_number: str | None = Field(None, max_length=50)`
  to `StakeholderCreate`, `StakeholderUpdate`, and `StakeholderResponse`; (3) frontend
  `Customer360Screen.tsx` → add "WhatsApp Number" `TextField` to both New Stakeholder and
  Edit Stakeholder modals. Also add to `OpportunityDetailScreen.tsx`'s stakeholder-edit
  modal if that modal shows contact fields. Run `python -m pytest` after migration.
- **`OpportunityDetailScreen.tsx` — convert Products/Splits/Stakeholders inline edit
  forms to `FormModal` (desktop UX fix).** Surfaced during E2E verification 2026-07-06.
  On desktop (1920px) the inline edit mode for Products, Splits, and Stakeholders tabs
  renders as form fields floating inside the narrow content column — looks stranded and
  unfinished compared to the modal pattern used elsewhere. **Note: the BR-OP-02/03/05
  port + 4-tab prefetch work already landed on this file without bundling this item in**
  (deliberately scoped out — unrelated to the status-change bug that was actually
  demo-blocking). So this is no longer "free" to fold into an already-planned touch of
  the file — it's now its own standalone future change, second touch on this file.
- **Round 1 activity query optimization — never ported to the opportunity-scoped
  path.** `activity/service.py::list_by_account` sources its `total` from
  `account.activity_count` (no separate COUNT query); `list_by_opportunity` still
  does the old 3-round-trip pattern (`opportunity_exists` + `list` + a separate
  `count_by_opportunity`). Minor now that the backend concurrency fix removed the
  actual bottleneck, but a real, verified gap. Also: `ActivityRepository.count_by_account`
  is now dead code (only referenced in tests, never called in production) — confirmed
  via repo-wide grep. And `list_by_account`'s own `total`/`total_pages` response fields
  are a "lower bound" approximation (`offset + len(items)`), not an accurate count —
  works today only because `Customer360Screen.tsx` overrides it with `activity_count`;
  any other caller of that endpoint would get a wrong total. Low priority, not
  demo-blocking, but a real correctness gap in the API contract.
- **Frontend-Implementation-Standards.md §3.3, line 114** — stale placeholder
  ("No screen in this codebase does this yet") for the `initialData` pattern,
  which `Customer360Screen.tsx` now implements. Small doc fix.
- **Input text size/weight on migrated `TextField`s.** Every pre-migration
  Tailwind file used a shared `inp` constant with `text-sm font-medium`
  (14px/500) on every text input. No migrated file's `TextField`s carry an
  explicit override — MUI default typography (~1rem/400) instead. Confirmed
  present in `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx`, and
  `Customer360Screen.tsx`. Basheer's call: fix once, holistically, in the
  theme (`src/theme/index.ts`'s `MuiOutlinedInput`/`MuiInputBase` override)
  rather than per-file. Grep `size="small"` across migrated files first.
- `statusColors.ts` — create as one pass after Tailwind migration; consolidates
  ~11 files; resolve emerald-50-vs-100 (and any other weight inconsistencies) at
  that time from complete view.
- **Type the shared frontend service functions properly.** `listUsers`
  (services/masterData.ts), `listAccounts`, `listOpportunities`,
  `updateOpportunity` (services/accounts.ts) — and likely their siblings —
  return `Promise<unknown>` instead of a typed shape, forcing callers to use
  `any[]`/local inline types. Cascades — consumed by Customer360Screen.tsx,
  CustomerDirectoryScreen.jsx, QuickLeadModal.tsx, LogActivityModal.tsx.
  Deferred because it's a shared-service-layer change, not part of any
  single file's migration. Post-migration, medium priority.
- **Next Actions screen: show everything + search/filter bar (by account/hospital
  name, reminder text, overdue, completed), replacing the Pending/Completed
  toggle.** Raised by Basheer 2026-07-06 as an alternative to the include_completed
  bug fix; not adopted now (see "Current task" — minimal fix chosen instead).
  Would need: backend query params on `/reminders` (`search`, `status:
  pending|completed|overdue|all`) built server-side to preserve pagination
  (reminders never get deleted — BR-ACT-04 mandates one per Activity, so the
  dataset grows indefinitely); `Reminder`/`Activity` already joins `Account`
  (`lazy="joined"`), so hospital-name search is cheap. Open question never
  resolved: what "name" should match — reminder_text, opportunity name, or a
  stakeholder/contact name (no such field exists on Reminder/Activity today —
  would need a new join if that's the intent). Frontend would replace
  `NextActionsScreen.tsx`'s `ToggleButtonGroup` with a search field + status
  filter. Not started.
- **Consolidate +LOG / +LEAD into context-sensitive global buttons — now
  PARTIALLY DONE, not fully.** Was: 3 independent `LogActivityModal` mounts
  (`DemoApp.tsx`, `Customer360Screen.tsx`, `OpportunityDetailScreen.tsx`).
  During the Project Details activity-logging build (`6075c80`, 2026-07-06,
  see write-up under "Done in prior sessions"), Project Detail was wired
  into `DemoApp.tsx`'s existing header
  `+Log` button instead of adding a 4th independent mount — `DemoApp.tsx` now
  has `selectedProject` state + `onSelectProject`/`openLogActivityRef`
  plumbing, proving the "lift state into DemoApp" approach works in practice.
  **Still remaining:** `Customer360Screen.tsx` and `OpportunityDetailScreen.tsx`
  still each have their own separate `LogActivityModal` mount, untouched —
  retrofitting those two onto the same header-button pattern is the rest of
  this item. Same rationale as before (duplication is what let the
  `.then()`-vs-`useQuery` defect go unnoticed). Sequence after the MUI
  migration backlog, or opportunistically if either file is touched again.
- **Extract a shared `BackButton` component.** The circular `IconButton` +
  `ArrowBackIcon` control (§6.6 item 7) is inlined in `OpportunityDetailScreen.tsx`
  and will be needed unchanged in `Customer360Screen.tsx`, `ProductCatalogScreen.jsx`,
  `ProjectDirectoryScreen.jsx` when they migrate. Do as its own small refactor,
  or fold into the second of these files to migrate.
- **§6.7 enforcement gap.** No mechanical guard against hardcoded hex colors
  drifting back into per-component `sx` props (theme should be single source
  of truth). Post-demo, not blocking.
- **§9 enforcement gap.** §9's checkmarks are self-reported and have already
  drifted silently twice (`LogActivityModal.tsx`, `OpportunityDetailScreen.tsx`
  both mislabeled "React Query ✓" while still using manual `.then()`).
  Candidate guards: grep `.then(` in files listed "React Query ✓"; grep
  `: any`/`any[]` in files listed "TypeScript ✓". Post-demo, not blocking.
- **Inline "+ New Stakeholder" shortcut from the Opportunity Stakeholders tab.**
  `OpportunityDetailScreen.tsx`'s "Link Stakeholder" form only lists existing
  account-level `Stakeholder` records — no way to create one without leaving
  the opportunity. Not a data-model gap (Stakeholder is always account-scoped).
  Reuse `Customer360Screen.tsx`'s existing "New Stakeholder" `FormModal` field
  set/service call, then `addOpportunityStakeholder` to link it. Basheer's
  call: hold as deferred.
- **`brand` filtering on `ProductService.list_products` — not implemented.**
  (Was: a pre-existing broken test — `test_delegates_to_repository` called
  a `brand` kwarg the method never had, `TypeError` on every run. Fixed
  2026-07-11 by correcting the test to match the real signature, not by
  adding the feature.) If real brand filtering is ever needed, add it to
  `ProductService.list_products`/`ProductRepository.list_products` and add
  a genuine test for it then — not before.

- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
