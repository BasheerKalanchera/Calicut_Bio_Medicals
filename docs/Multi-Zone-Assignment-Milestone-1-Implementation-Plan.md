# Multi-Zone User Assignment — Milestone 1 Implementation Plan

**Status:** Planned — approved for build, not yet started.
**Date:** 2026-08-10
**Prepared by:** Basheer Kalanchera (with Claude)
**Purpose:** Concrete, ordered implementation plan for Milestone 1 of
`Multi-Zone-Assignment-Technical-Design.md` (§§3–6) — the design doc records
the *decisions*; this doc records the *execution steps* (exact SQL, files,
tests, sequencing) needed to actually build it. Target/Coverage Planning
zone-scoping (that doc's §7) is Milestone 2, a separate unbuilt module, out
of scope here.

---

## Context

Fazal (Area Manager, Imaging) needs to cover both North Kerala and Mangalore,
but `user_profile.zone_id` is a single scalar FK — one zone per user, no way
to represent this today. **Correction to the design doc's and
`active_progress.md`'s account of this** — Basheer confirmed 2026-08-10 that
Fazal was never actually promoted to SBU Manager; that was a proposed
stopgap, not one that was applied. Fazal's `zone_id` today is simply North
Kerala — he currently cannot see Mangalore opportunities at all, which is the
actual, live gap this feature closes. (Both docs describing the SBU Manager
promotion as already-applied should be corrected separately — flagged here
so it isn't lost.)

The fix, fully designed and decided in `Multi-Zone-Assignment-Technical-
Design.md` (all §8 decisions resolved 2026-08-07): add a `user_zone` join
table and rewrite the one RLS branch that does scalar zone equality (Area
Manager's) into a set-membership check.

This touches a live RLS security policy — flagged **High risk** in the
design doc, requires full six-tier manual re-verification before shipping,
not just automated tests.

## Confirmed current state (verified directly against the codebase, not assumed)

- **Schema**: `user_profile.zone_id uuid` (nullable scalar FK), no junction
  table. Next migration number: **0018** (`down_revision = "0017"`) — the
  Buyback free-text change (`docs/Buyback-Freetext-Implementation-Plan.md`)
  is being built first and claims `0017`. **Re-verify the actual head in
  `backend/alembic/versions/` at build time** rather than trusting this
  number blindly, in case ordering has shifted again since this was written.
- **The one RLS branch to rewrite** — `opportunity_tier_visibility` on
  `opportunity` (created `0010`, widened `0011`, unchanged since):
  ```sql
  OR (
      cabio_app_role_name() = 'Area Manager'
      AND sbu_id = cabio_app_sbu_id()
      AND account_id IN (SELECT id FROM account WHERE zone_id = cabio_app_zone_id())  -- scalar, rewrite this line
  )
  ```
  Confirmed by grepping every migration file: `cabio_app_zone_id()` /
  `app.current_zone_id` is used in **exactly this one place** in the entire
  schema. `split`, `opportunity_item`, `opportunity_stakeholder`, `activity`,
  `document`, `reminder` all inherit visibility purely by joining back to
  `opportunity` — no independent zone logic anywhere else. Rewriting this one
  policy is sufficient.
- **Session context** (`backend/app/db/session.py`, `set_rls_context()`):
  conditionally does `SET LOCAL app.current_zone_id` when `user.zone_id is
  not None`. Becomes dead code once the policy reads `user_zone` directly via
  `cabio_app_uid()` (already in session context) instead of a scalar GUC —
  Postgres session vars can't hold a set anyway, so the new policy doesn't
  push zone into session context at all.
- **Backend scoping** (`backend/app/domains/organization/repository.py:19`):
  `TEAM_SCOPE_BUILDERS["Area Manager"]` = `and_(UserProfile.sbu_id ==
  u.sbu_id, UserProfile.zone_id == u.zone_id)` — same scalar-equality
  problem, rewrite to set-intersection. `scope="sbu"` (Split picker) already
  has no zone check (fixed 2026-08-07, unrelated fix) — do not touch.
- **Account creation zone default** (`account/service.py:105-107`,
  `account/router.py:106`): defaults from `current_user.zone_id`. **No
  change** — `zone_id` is deliberately kept as a "primary zone" convenience
  pointer (design doc §3), stays the correct default even for multi-zone
  users. Note this explicitly so nobody "fixes" it unnecessarily.
- **Schemas** (`backend/app/domains/organization/schemas.py`, verified in
  full): `UserListResponse`, `UserCreate`, `UserUpdate` all currently have
  scalar `zone_id: uuid.UUID | None`. Response is built manually in
  `_to_user_list_response()` (`backend/app/api/routers/master_data.py:101-
  113`), not via bare `model_validate` (because `role_name` isn't a plain
  column) — confirmed.
- **Models** (`backend/app/domains/organization/models.py`, verified):
  `UserProfile(AuditMixin, Base)`, existing collections use `lazy="select"`
  as a deliberate override (avoid N+1 on bulk list, since those aren't
  needed per-row). `Zone` (`reference/models.py`, verified): no
  `TYPE_CHECKING` import block — relationships resolve by string, zero new
  imports needed for a new relationship.
- **Precedent for "replace a set of child rows" (verified)**:
  `OpportunityRepository.replace_splits()` (`opportunity/repository.py:258-
  270`) — delete-then-reinsert, `flush()` not `commit()`. `zone_exists()`
  already exists on `UserRepository` (`organization/repository.py:96-99`) —
  reuse directly, no new helper needed.
- **Frontend**: `UserDirectoryScreen.tsx` (already MUI+TypeScript). No
  react-hook-form/Zod anywhere in the codebase — plain `useState` + manual
  validation. No `useMutation` for user create/update — plain `async`
  handler + `queryClient.invalidateQueries(["users"...])`, stay consistent
  with this file's existing style. Zone list source of truth: `listZones()`
  in `services/masterData.ts`, `useQuery({ queryKey: ["zones"] })` — reuse
  as-is.
- **Live shared Supabase dev DB** — the backfill migration runs against real
  data, must be idempotent (`ON CONFLICT DO NOTHING`).

## Implementation steps

### 1. Migration `0018_add_user_zone_and_rewrite_area_manager_rls.py`

- Create `user_zone` (composite PK `user_id, zone_id`, both FK'd + named per
  standards, plus `AuditMixin`-equivalent audit columns — a zone assignment
  is an auditable action, same reasoning as `OpportunityStakeholder`). Index
  on `zone_id`.
- Backfill: `INSERT INTO user_zone (user_id, zone_id) SELECT id, zone_id FROM
  user_profile WHERE zone_id IS NOT NULL ON CONFLICT DO NOTHING;`
- `ALTER POLICY opportunity_tier_visibility ON opportunity USING (...)` —
  same policy, Area Manager branch rewritten:
  ```sql
  AND account_id IN (
      SELECT id FROM account
      WHERE zone_id IN (SELECT zone_id FROM user_zone WHERE user_id = cabio_app_uid())
  )
  ```
- `DROP FUNCTION IF EXISTS public.cabio_app_zone_id();` (confirmed dead
  after the rewrite).
- `downgrade()`: recreate `cabio_app_zone_id()` first (so the reverted
  policy compiles), revert the `ALTER POLICY`, drop `user_zone`. **Note in
  the migration docstring**: a DB-only downgrade without also reverting
  `session.py` (step 2) leaves the function permanently returning NULL (no
  session var ever set again), silently breaking the Area Manager branch
  instead of restoring it — the two must roll back together.

### 2. `backend/app/db/session.py`

Remove the `if user.zone_id is not None: SET LOCAL app.current_zone_id`
block from `set_rls_context()`.

### 3. Models

- `organization/models.py`: new `UserZone(AuditMixin, Base)` model
  (composite PK, `relationship` back-refs). On `UserProfile`, add `zones:
  Mapped[list["UserZone"]] = relationship(..., lazy="selectin")` —
  `selectin` deliberately, not `select`, because `_to_user_list_response`
  needs it on every row of every list page (one batched query, not N+1) —
  the opposite case from this class's other `lazy="select"` collections.
- `reference/models.py`: on `Zone`, add `user_zones: Mapped[list["UserZone"]]
  = relationship(..., lazy="select")`.

### 4. `organization/schemas.py`

Add `zone_ids: list[uuid.UUID]` to `UserListResponse` (required, always
returned); `zone_ids: list[uuid.UUID] = []` to `UserCreate`; `zone_ids:
list[uuid.UUID] | None = None` to `UserUpdate` (`None` = field omitted from
PATCH, `[]` = explicitly clear all zones — standard `exclude_unset`
semantics). Keep `zone_id` on all three, unchanged.

### 5. `organization/repository.py`

- Rewrite `TEAM_SCOPE_BUILDERS["Area Manager"]` to a set-intersection
  between caller's and candidate's `user_zone` rows (both may now be
  multi-zone).
- Add `replace_zones(user_id, zone_ids)`: delete-then-reinsert against
  `user_zone`, `flush()` — mirrors `replace_splits` exactly.
- `zone_exists()` already present, reuse as-is.

### 6. `organization/service.py`

In `create_user`/`update_user`: validate every `zone_id` in `zone_ids`
exists (`NotFoundError` if not); enforce the design doc's §3 invariant —
`zone_id` (primary) must be a member of `zone_ids` (`ValidationError` if
not); call `repository.replace_zones()` after the user row is
created/updated. For `update_user`, only touch `user_zone` when `zone_ids`
is explicitly present in the PATCH payload (`exclude_unset`), not on every
update.

### 7. Router

`_to_user_list_response()` (`master_data.py:101-113`): add
`zone_ids=[uz.zone_id for uz in user.zones]` to the manual construction.

### 8. Account creation default — confirm no change

Note explicitly in the PR: `account/service.py`/`router.py` stay as-is,
`current_user.zone_id` remains the correct default.

### 9. Regenerate `docs/Physical-Schema.sql`

`pg_dump --schema-only` against dev immediately after applying migration
0018 — do this right away, not batched to the end (this has gone stale
before per the Change Log).

### 10. Tests

- `test_session.py::TestSetRlsContext` — remove the two zone-specific tests,
  fix the remaining call-count assertion (3 `SET LOCAL`s now, not 4).
- `test_organization_repository.py::test_area_manager_scoped_to_own_sbu_and_zone_and_self`
  — rewrite to assert the new `user_zone` subquery shape instead of a
  literal scalar equality string. `test_scope_sbu_matches_caller_own_sbu_any_zone`
  — unaffected, don't touch.
- `test_organization_service.py` — new cases: `zone_ids` persisted via
  `replace_zones` call assertion; unknown zone → `NotFoundError`; primary
  `zone_id` not in `zone_ids` → `ValidationError`; `zone_ids` omitted from
  PATCH → `replace_zones` not called.
- New: `replace_zones()` repository test (mirror however `replace_splits` is
  tested).
- New: backfill correctness (every pre-existing non-null `zone_id` → exactly
  one `user_zone` row; re-running backfill is a no-op).
- New: RLS coverage for a multi-zone Area Manager — extend whatever harness
  already exercises `opportunity_tier_visibility` (check `backend/tests/`
  for the existing RLS suite first) to add a two-zone case.
- Gap noted, worth closing alongside this work: no existing test exercises
  `create_account(..., default_zone_id=...)` at all — add one, since step 8
  is now claiming "no change needed" and should be pinned by a test.

### 11. Manual six-tier verification (required — High risk, not just unit tests)

After migration 0018 + backend deploy to dev, using the live app:
1. Assign one Area Manager two zones (Fazal-style) via `user_zone`, with
   opportunities in each zone they don't own/have no split/reminder on.
2. **Multi-zone Area Manager**: confirm opportunities visible from *both*
   zones, nothing from a third unassigned zone.
3. **Single-zone Area Manager** (control): confirm unchanged from
   pre-migration behavior.
4. **Admin/GM**: still fully unrestricted.
5. **SBU Manager**: still whole-SBU, zone-blind.
6. **Sales Manager**: still scoped to direct reports (including a report who
   is multi-zone).
7. **Sales Staff**: still `owner_id = self` only.
8. For the multi-zone Area Manager, open one opportunity from each zone —
   confirm Activities/Documents/Reminders tabs still load (join-back
   inheritance intact post-rewrite).
9. Give the multi-zone Area Manager a split/assigned-reminder on an
   opportunity outside both their zones — confirm still visible (unaffected
   branches, sanity check on the `ALTER POLICY`).

### 12. Frontend — after backend is merged and running on dev

- `npm run generate:types` — regenerates `types/api.ts` automatically,
  `UserCreate`/`UserUpdate`/`UserListResponse` pick up `zone_ids` with zero
  manual edits above the hand-written-aliases marker.
- `UserDirectoryScreen.tsx` — **UI design resolved 2026-08-10**:
  - The existing single "Zone" `TextField select` **stays exactly as it is
    today**, unchanged in appearance or behavior — its value continues to be
    `zone_id`, the person's primary zone, always explicit, never silently
    derived. For the vast majority of single-zone users (everyone except
    rare Fazal-style cases), the form looks identical to today — no new
    concept, nothing to learn.
  - Below it, a small **"+ Add another zone"** link/button (not shown by
    default as a picker — just the link). Clicking it reveals a zone picker
    to add one more zone; repeatable to add a third, etc. Follows the
    existing Splits-tab precedent (`OpportunityDetailScreen.tsx` ~line
    604-767: single-select + "Add" building a local array, rendered as a
    removable list) — "primary" + "extras" are visually and functionally
    distinct, not one flat multi-select.
  - Internally: `zone_ids` sent to the backend = `[form.zone_id,
    ...additionalZones]`, deduped. `zone_id` (the primary field) is
    unaffected by this and continues to be sent exactly as it is today — no
    ambiguity about which one is primary, since it's just whatever's in the
    field that was always there.
  - Update `EMPTY_FORM`/local state to add an `additionalZones: string[]`
    array (or similar), `openEdit` seeding it from `zone_ids` minus
    `zone_id`, `handleCreate`/`handleUpdate` payloads combining both into
    `zone_ids`, and the list-row zone-name display (join all matching names
    from `zone_ids`, not just `zone_id`).
- `DemoApp.tsx` header (`{userProfile.zone...}`): **no change** — keeps
  showing just the primary zone, a compact identity strip, not a permissions
  summary. Full zone-set display there is an independent follow-up if wanted
  later, not part of Milestone 1.

### 13. Business rule documentation

`docs/Business-Rules.md` §5a (Organization & User Management, currently only
`BR-ORG-01`): add a new rule (e.g. `BR-ORG-02`) describing multi-zone
assignment and that only the Area Manager tier's visibility keys off zone
membership. Confirmed nothing pre-existing describes this in prose (grepped
— no match), so this is a new rule, not an amendment. Ship in the same PR as
the RLS change.

## Ordering

Migration (1) + `session.py` (2) together first (rollback story depends on
both). Then models → schemas → repository → service → router (3–7), tests
alongside (10). Regenerate `Physical-Schema.sql` (9) right after migration 1
is applied. Manual six-tier verification (11) before any frontend work
starts — don't mask a broken RLS rewrite behind a simultaneous UI change.
Frontend (12) only after backend is fully merged/deployed to dev. Business
rule doc (13) can land anytime but ship in the same PR as the RLS change.
