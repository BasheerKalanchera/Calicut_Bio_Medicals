# Active Progress — Cabio Sales OS
_Session: 2026-08-13_

## Current task — STOP HERE FIRST

**ZonePicker + Territory Admin coverage view: build done, manual
verification in progress.** All 6 backend pieces and all 5 frontend
retrofits from `docs/ZonePicker-And-Coverage-View-Implementation-Plan.md`
are built — `tsc --noEmit`, `npm run lint`, and `ruff check` all clean.
Migration `0020_zone_name_trigram_index.py` has been applied to Dev
(confirmed at head). Basheer is now running the checklist (Verification
section of the plan doc, sections 0-8).

**Post-build tweak, already done:** Territory Admin's assignee chips were
cluttering the tree view by default — added a "Show Coverage"/"Hide
Coverage" toggle button (`showCoverage` state, defaults to `false`) so
chips only render on request. Client-side only, no backend change.

**Two more tweaks found and fixed during manual verification, already
done:**
- `ZonePicker.tsx`'s breadcrumb color fix used `color="info.main"`, an
  invalid Typography `color` value (MUI's `color` prop only special-cases
  bare palette keys like `"info"`, plus the hardcoded `"text.secondary"`
  string — not dot-paths). It silently fell through to the default dark
  text, looking unchanged. Fixed to `color="info"`.
- Customer Directory / Opportunity Pipeline zone filters did an *exact*
  `zone_id` match, so picking a parent zone (e.g. "Kerala") returned
  nothing, since hospitals are tagged at the leaf level (e.g. Kozhikode),
  never the state umbrella. Needed for GM-level reporting rollups.
  Fixed `account/repository.py::list_accounts` and
  `opportunity/repository.py::list_pipeline`/`count_pipeline` to match the
  picked zone's full subtree via `zone_closure` (same pattern already used
  by the deprecate blast-radius check in `reference/repository.py`).
  Backend-only change, no frontend touch. Confirmed both modules still
  import cleanly and lint clean (one pre-existing, unrelated E501 at
  `account/repository.py:117` not touched by this edit) — not yet
  exercised against Dev data.

**UX add-on, already done:** New Customer create form (`CustomerDirectoryScreen.
tsx`) now pre-fills the Zone field with the logged-in user's own zone
(`useAuth().userProfile.zone`), so sales staff aren't re-searching their
home zone on every new customer. Still fully editable — just a starting
value. Uses primary `zone_id` only, not the `zone_ids` coverage list.
Admin/GM users with no personal zone see the field start empty, same as
before. `tsc --noEmit` and `npm run lint` both clean. Not yet manually
verified on Dev.

**Territory Admin fixes, already done, this session:**
- Duplicate zone name (same name, same parent) used to crash with a raw
  500 "Internal server error" — `reference/service.py`'s `create_zone`/
  `update_zone` never pre-checked, just let the DB's unique constraint
  (`uq_zone_parent_name`/`uq_zone_root_name`, migration 0019) throw an
  uncaught `IntegrityError`. Added `ZoneRepository.exists_by_name()`
  (scoped per-parent, mirrors `account/repository.py`'s version) and a
  `ConflictError` (409, proper message) pre-check in both methods.
- Separately: clearing the Parent Zone field on Edit silently did nothing
  — `update_zone` only treated a *new* parent id as a move, never a move
  *to* null, so "make this zone top-level" was unreachable via Edit.
  Fixed using Pydantic's `model_fields_set` to tell "field explicitly set
  to null" apart from "field not included in the payload." Paired with a
  new "This is a top-level zone (no parent)" checkbox in the Add/Edit
  form (`TerritoryAdminScreen.tsx`) — required parent unless checked, and
  an inline warning ("'X' will no longer belong to 'Y'") when unchecking
  an existing zone's parent — since blank-parent-as-top-level used to be
  silent/implicit with no on-screen signal either way. `ZonePicker.tsx`
  gained a `disabled` prop to support this (grays out Parent Zone while
  the checkbox is checked).
  `tsc --noEmit`, `npm run lint`, `ruff check`, and module-import checks
  all clean on every file touched. Not yet manually verified on Dev.

**Soft name-collision warning, already done, this session:** Add/Edit
Zone form now warns (non-blocking) if the name being typed already
exists elsewhere in the tree under a different parent — e.g. adding
"Kasaragod" under South Kerala when it already exists under North Kerala.
Deliberately soft: `uq_zone_parent_name`/`uq_zone_root_name` (migration
0019) allow the same name in different branches on purpose, so this never
blocks Create/Save, it just flags the more likely case (same real place
added twice by mistake) before the Admin commits. New backend: `GET
/admin/zones/name-check` (`reference/router.py`), `ZoneAdminService.
find_name_elsewhere` (`reference/service.py`), `ZoneRepository.
find_by_name_elsewhere` (`reference/repository.py`, NULL-safe via
`is_distinct_from` so it also catches top-level collisions), `ZoneNameMatch`
schema. Frontend: debounced (same 300ms/2-char pattern as `ZonePicker`)
`useQuery` in `TerritoryAdminScreen.tsx`, `checkZoneName()` in
`services/territoryAdmin.ts`. Full verification run 2026-08-15: `tsc
--noEmit`, `npm run lint`, `ruff check`, backend module-import + FastAPI
app-build checks all clean. Not yet manually verified on Dev — also
surfaced the real Kasaragod duplicate now on the loose-ends cleanup list
below.

**Territory Map sort fix, already done, this session:** child zones were
rendering in insertion order, not alphabetical — `Zone.children`
(`reference/models.py:68`) had no `order_by`, unlike `get_tree()`'s root
query which already sorted by name. Added `order_by="Zone.name"` to the
relationship. No migration needed (ORM-level, not schema). Import/ruff
clean, not yet manually verified on Dev.

**User Deactivate/Reactivate, already done, this session:** closed a gap
found while cleaning up 5 test-fixture users (`Test - General Manager`,
`Test - Admin`, `Test - Area Manager`, `Test - SBU Manager`, `Test - Sales
Manager`) — there was no way to deactivate any user, ever, through the app
itself (`UserUpdate` had no `is_active` field, `UserListResponse` didn't
even return it). Built to match the proven zone-deprecate pattern
(grandfathered, non-destructive, reversible, visible-but-grayed-out):
- Backend: `UserListResponse.is_active`, new `UserBlastRadius` schema
  (direct-report + open-opportunity counts), `UserRepository.blast_radius`/
  `list_active(include_inactive=...)`, `UserService.deactivate_user`/
  `reactivate_user`/`user_blast_radius`, and `POST /users/{id}/deactivate`,
  `POST /users/{id}/reactivate`, `GET /users/{id}/blast-radius`
  (`organization/schemas.py`, `repository.py`, `service.py`,
  `api/routers/master_data.py`). The 3 existing picker scopes (Next
  Action/Split participant/Opportunity owner) still always exclude
  inactive users — only User Directory's own listing can opt in.
- Frontend: `UserDirectoryScreen.tsx` gets a "Show Inactive"/"Hide
  Inactive" toggle, a Deactivate/Reactivate icon per row (🚫/↩️, same
  blast-radius-style confirm-before-deactivate as Territory Admin's
  deprecate flow), grayed-out + "Inactive" chip rendering, and excludes
  inactive users from the Manager picker.
- **Ran `npm run generate:types` for the first time since these Zone/
  Territory endpoints landed** (backend dev server was live on :8000, so
  this used the real running schema) — it overwrote `types/api.ts`
  entirely and silently deleted the hand-maintained block of convenience
  type aliases (`UserListResponse`, `AccountResponse`, `ActivityResponse`,
  etc. — ~23 lines) that don't come from openapi-typescript itself,
  breaking type-checking across ~15 unrelated files. Recovered via `git
  diff` and re-appended the same block (plus the new `UserBlastRadius`
  alias) with a comment warning this will happen again on the next regen.
  **Worth fixing properly later:** either teach the generator to preserve
  that block, or stop hand-aliasing and update call sites to the
  `components["schemas"]["X"]` form directly.
  `tsc --noEmit`, `npm run lint`, `ruff check`, and backend module/app-build
  checks all clean.

**Bug found and fixed during Basheer's first manual try of Deactivate:**
clicking Deactivate hung forever on "Checking current assignments…".
Root cause: `UserRepository.blast_radius`'s lazy import had `OpportunityStatus`
imported from `app.domains.opportunity.models`, but it actually lives in
`app.domains.reference.models` — a plain `ImportError` at call time, 500
from the endpoint. This is exactly the kind of bug the earlier "imports
cleanly" checks can't catch, since it's a *lazy* import inside the method
body, not a module-level one — only executes (and only fails) when the
method is actually called. Fixed the import path, and separately hardened
`UserDirectoryScreen.tsx`'s `openDeactivate` with error handling (was
previously unguarded, same as Territory Admin's `openDeprecate` still is)
so a future failure for any reason shows an inline error instead of
hanging silently. Re-verified this time by actually *calling* the fixed
method (not just importing the module) against a real user id — got a
real `(3, 0)` back. `tsc`/`lint`/`ruff` all clean. Still not yet manually
verified end-to-end on Dev (Basheer's retry is next).

**Pipeline Owner filter now includes deactivated owners, already done, this
session:** `OpportunityPipelineScreen.tsx`'s Owner filter was calling
`listUsers()` with default `include_inactive=false`, same as the
assignment pickers — but this is a filter over existing deals, not an
assignment action, so a deactivated owner's opportunities need to stay
findable (Basheer: "else we have to visually scroll down the list").
Changed to `listUsers("scoped", true)`, split into `activeOwners`/
`inactiveOwners`, with inactive names grouped under a `ListSubheader`
("Inactive") and muted (`text.secondary`) so they're visually distinct
without a separate label suffix. The 3 actual assignment pickers (Next
Action, Split participant, Opportunity owner reassignment) are
unaffected — still always active-only. `tsc --noEmit`/`npm run lint`
clean. Not yet manually verified on Dev.

**User Directory layout fix, already done, this session:** the title +
Show/Hide Inactive + Add User row was scrolling away with the list.
Restructured to the same fixed-header/scrollable-body pattern
`CustomerDirectoryScreen.tsx` already uses (outer flex column, header as
a plain `Box`, list wrapped in `flex:1, overflowY:auto`) — only the user
list scrolls now. `tsc`/`lint` clean.

**Bug found and fixed, this session — manager display silently "clearing"
on deactivate:** Basheer deactivated Haroon (5 direct reports) and every
one of them stopped showing "reports to Haroon," both as list-row text and
in the Edit form's Manager dropdown. Not real data loss — `manager_id` on
those 5 rows was never touched — but the name lookup only searched the
currently-fetched, active-only-by-default `users` list, so once Haroon
dropped out of it, the lookup silently failed and the label vanished.
Fixed in `UserDirectoryScreen.tsx`: the query now always fetches the full
roster (`listUsers("scoped", true)`), and "Show Inactive" is applied as a
client-side filter (`visibleUsers`) purely on which *rows* render, not on
what's available for name lookups. The Manager dropdown now lists inactive
managers too (red, grouped under "Inactive," same pattern as the Pipeline
Owner filter) but `disabled` — so an existing assignment to a deactivated
manager still displays correctly, while nobody can freshly pick a
deactivated person as someone's new manager. `tsc`/`lint` clean.

**Bug found and fixed, this session — deactivated users could still "log
in":** Basheer confirmed a deactivated user's Auth credentials still got
them into the app shell. Root cause: Supabase Auth has no concept of
`user_profile.is_active` (a plain app-level column, not synced to Auth),
so `signInWithPassword` always succeeds for a deactivated account. The
actual `is_active` check only lived in `/auth/me`
(`api/dependencies.py::get_current_user`), and `AuthContext.tsx`'s
handlers only did `setUserProfile(null)` on failure — never cleared the
Supabase session — so `main.tsx`'s `AuthGate` (gated on `isAuthenticated`,
i.e. `!!session`) still let them into the full `DemoApp` shell, just with
a null profile and every subsequent data call failing individually.
Fixed in `AuthContext.tsx`: `signIn()` now checks `/auth/me` immediately
after the Auth call succeeds, before ever setting local session state —
on failure it signs back out of Supabase Auth and re-throws, so
`LoginScreen` shows "User account is inactive" right on the login form
instead of granting a broken shell (checking before setting session also
avoids a brief isAuthenticated-flicker). The passive session-restore and
`onAuthStateChange` paths get the same treatment via a shared
`loadProfileOrSignOut` helper, so someone deactivated *mid-session* also
gets bounced back to login on their next request/tab reload, not left
half-working. `tsc`/`lint` clean.

**Follow-up fix #1, same session:** Basheer tried it on Dev — correctly
threw the deactivated user out, but flashed the Pipeline screen briefly
first. Root cause missed in the first pass: `signIn()`'s own
check-before-set ordering was fine, but the initial session-restore effect
and the `onAuthStateChange` listener were *still* calling `setSession(s)`
immediately/unconditionally, before `loadProfileOrSignOut`'s `is_active`
check ran — and `onAuthStateChange` fires on its own the instant
`signInWithPassword` succeeds, completely independent of `signIn()`'s
sequencing, so it raced ahead and briefly set `isAuthenticated` true
regardless. Consolidated all three call sites (initial load, listener,
`signIn()`) around one `applySession()` helper that is now the *only*
place allowed to call `setSession` with a non-null value, and only ever
does so after the `/auth/me` check succeeds.

**Follow-up fix #2, same session:** flicker was gone, but the "User
account is inactive" message stopped showing on the login form. Root
cause: `signIn()`'s own explicit `await applySession(data.session)` and
the listener's independent `applySession(s)` call for that same login
were racing each other — both call `signOut()` on failure, and one's
`signOut()` could invalidate the session out from under the other's
in-flight `/auth/me` request. First attempt at a fix routed the result
through a new `authError` context field instead of a promise rejection —
**this didn't hold up**: Basheer reported the message now showed then
disappeared, "as if the sign-in modal reloaded." Real cause: since
`signIn()` no longer awaited the full check, the button re-enabled almost
immediately (right after the bare Auth call), inviting a double-submit —
and the second `signIn()` call's first line (`setAuthError(null)`) wiped
out whatever the first attempt's listener-driven check had just set.

**Follow-up fix #3, same session — the one that actually holds:**
reverted the `authError`-channel design. Added a `signingInRef` guard:
while `signIn()` is actively driving a login attempt end to end (Auth
call → `/auth/me` check → resolve/reject), the `onAuthStateChange`
listener skips that same event entirely instead of independently
re-running the check — so there's exactly one handler per login attempt,
never two racing. `signIn()` now awaits `applySession()` to full
completion again before its promise resolves, which also means the
submit button correctly stays disabled for the *entire* check, not just
the initial Auth call — closing off the double-submit path structurally,
not just patching its symptom. `LoginScreen.tsx` reverted to its
original simple catch-based error display (no `authError`). `tsc`/`lint`
clean.

**Regression found and fixed before committing — never ran the real
backend test suite this whole thread, only import/manual-exercise
checks.** A concurrent session doing the Sales Manager Tier Collapse
work happened to run `pytest` and noted 4 pre-existing failures unrelated
to their own change. Investigated: 1 was genuinely mine (`include_inactive`
kwarg addition breaking a strict `assert_called_once_with` in
`test_organization_service.py` — fixed, updated the assertion) and the
other 3 were also mine, from earlier this session's duplicate-zone-name
`exists_by_name` pre-check (`test_zone_service.py`'s shared `_make_repo()`
mock didn't set `exists_by_name.return_value = False`, so it defaulted
truthy and every zone create/rename test tripped a false `ConflictError`)
— fixed the mock default and added two tests that were genuinely missing
coverage for the ConflictError path itself. Full suite: 509 passed, 0
failed. **Lesson: `pytest` needs to run before calling backend work done,
not just `ruff check` + manual method calls** — those checks never would
have caught either regression.

**Next, in this order:**

1. **Manual verification on Dev** — checklist is the Verification section
   of the plan doc: search "kozh" in each of the 5 retrofitted pickers
   (correct breadcrumb, deprecated zones excluded); Territory Admin's Edit
   form can't select the zone being edited as its own parent; assign a
   Sales Staff person to a leaf zone via the picker and confirm their
   opportunity visibility stays owner-only (unchanged); confirm the
   assignee chip shows on Territory Admin with the right role label; a
   zone with zero assignees renders with no chips, no gap/error.
3. Also still pending from before (not yet touched this session): the
   Territory Admin screen's own original create/edit/blast-radius/
   deprecate-grandfathering/rebuild-noop/nav-gating checklist
   (`docs/Territory-Admin-Screen-Implementation-Plan.md`), and the three
   real-data loose ends below.

**Four loose ends from the real-data review, none actioned yet:**
- Deprecate Central Kerala (check its blast radius first) — Kerala
  runs North+South only going forward, per Basheer's standing call.
- Confirm "Coastal Karnataka" vs. the territory doc's "Karnataka
  Coastal" naming is intentional, or rename to match.
- Clean up `TEST-Parent`/`TEST-Child` — RLS-verification fixtures, no
  longer needed now that verification has passed.
- Remove Kasaragod under South Kerala (data-entry duplicate — it's a real
  North Kerala district, found while testing the new soft name-collision
  warning). Keep the North Kerala copy.

**Still separately open, not urgent:** Sales Manager Tier Collapse
(`docs/Sales-Manager-Tier-Collapse-Implementation-Plan.md`) is planned
only — needs a Haroon review before any build, since it revises a
leadership-approved ADR (ADR-009).

**`docs/Backlog.md` still has an uncommitted diff mixing content from
different sessions** (a pre-existing note from earlier this session, still
true) — review before committing, don't blind `git add`.

Full narrative for everything above: `docs/Progress-Archive-2026-08.md`'s
2026-08-12 (later) entry.

## Also still open (unrelated, carried over)

The Critical Care/Imaging manager hierarchy build-out — see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed
plan. The "create Supabase Auth accounts" blocker this was waiting on is
resolved for Dev, but this item concerns the UAT/Prod rollout more
broadly — revisit once UAT is fully proven out.

**Deliberately left unconverted, not forgotten** (Basheer's explicit scope
call, see the `@mui/x-date-pickers` archive entry): 9 date-only
`type="date"` fields in `Customer360Screen.tsx`/`OpportunityDetailScreen.
tsx`, and 2 more in `ProjectDirectoryScreen.jsx` (entangled with that
file's own pending MUI migration). Pick up only if Basheer decides to
extend scope.
