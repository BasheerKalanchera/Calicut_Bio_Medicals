# Zone Deactivate/Reactivate — Implementation Plan

**Status:** Draft — planned, not yet built.
**Date:** 2026-08-16

## Context

Territory Admin's zone lifecycle action is currently one-way: "Deprecate"
flips `zone.is_active` to `false`, but there is no way back through the
app — `ZoneUpdate` (the schema behind Edit) has no `is_active` field, and
no reactivate endpoint exists. This surfaced concretely deprecating
Central Kerala (2026-08-16, safe — zero real accounts, only deactivated
`Test - *` fixture references) — if it's ever needed again, today's only
path back is a direct DB edit, which isn't a supportable operational
path. Basheer's own framing for the whole Zone Hierarchy feature was
explicit that territory groupings will keep changing and the Admin screen
is meant to absorb that — a one-way flip cuts against that intent.

Separately, "Deprecate" reads as a software-engineering term (like a
deprecated API) where the app already has an established, well-tested
vocabulary for exactly this same underlying pattern (`is_active` flag,
non-destructive, grandfathered, reversible): User Directory's
**Deactivate/Reactivate**, shipped and verified 2026-08-15
(`980d81b`). This plan does both together — add the missing reactivate
action, and rename "deprecate" to "deactivate" throughout — rather than
as two separate passes, since the rename and the new action touch the
same lines of code either way.

**Scope note:** no DB migration. `zone.is_active` already exists; nothing
about the column, its default, or existing data changes. This is a
rename of existing identifiers/copy plus one new service method + one new
endpoint, mirroring `UserService.reactivate_user` almost exactly.

## What's in scope

### Backend

**`app/domains/reference/service.py`**
- Rename `deprecate_zone` → `deactivate_zone` (body unchanged).
- Add `reactivate_zone(zone_id, *, role_name)` — same shape as
  `deactivate_zone`/`UserService.reactivate_user`: admin-role check,
  `get_by_id` + `NotFoundError`, `zone.is_active = True`,
  `repository.update(zone)`. No closure rebuild needed (closure is keyed
  by id/structure, not `is_active`).
- Update `_validate_parent`'s error message and the two comments that
  reference "deprecate"/"deprecated" (lines 32-36, 106-109) to match the
  new wording.

**`app/domains/reference/router.py`**
- Rename route `POST /admin/zones/{zone_id}/deprecate` →
  `POST /admin/zones/{zone_id}/deactivate`; rename the handler function
  to match.
- Add `POST /admin/zones/{zone_id}/reactivate`, same shape as the
  existing deactivate route.

**`app/domains/reference/repository.py`, `models.py`** — update 3
docstring/comment cross-references to the renamed method (no logic
changes; these are pure documentation-of-code comments).

**`app/domains/organization/service.py`, `repository.py`** — update 2
comments that cross-reference "Zone.deprecate_zone" as the pattern
`deactivate_user` was modeled on, so they still point at the right name.

**Tests (`tests/domains/reference/test_zone_service.py`)**
- Rename the existing `deprecate_zone` call sites and the
  `test_rejects_deprecated_parent`/`test_rejects_deprecated_new_parent`
  assertions to match the new error wording.
- Add `reactivate_zone` tests mirroring `test_user_service.py`'s
  `reactivate_user` coverage: happy path (flips `is_active` back to
  `True`), not-found, and authorization-denied for a non-Admin/GM role.
- `test_zone_router.py` currently has no deprecate-specific test (only
  generic auth-gate tests on tree/create) — optionally add matching
  403/401 checks on the renamed and new routes for parity with the rest
  of that file, not strictly required to close this out.

### Frontend

**`services/territoryAdmin.ts`**
- Rename `deprecateZone` → `deactivateZone` (path → `/deactivate`).
- Add `reactivateZone(zoneId)` → `POST /admin/zones/{zoneId}/reactivate`.

**`screens/TerritoryAdminScreen.tsx`**
- `dialogMode`: `"deprecate"` → `"deactivate"`.
- State/handlers: `deprecatingZone`→`deactivatingZone`,
  `openDeprecate`/`handleDeprecate` → `openDeactivate`/`handleDeactivate`.
- Add `handleReactivate(zone)` — calls `reactivateZone` directly and
  invalidates the tree, **no confirmation modal**, mirroring
  `UserDirectoryScreen.tsx`'s pattern exactly (reactivation is the "undo"
  direction, lower-risk than deactivating, so it's a single click there
  too).
- Row rendering: chip label `"Deprecated"` → `"Inactive"` (matches
  Users' wording exactly). The single lifecycle IconButton toggles
  between 🚫 "Deactivate zone" (active zones) and ↩️ "Reactivate zone"
  (inactive zones) based on `node.is_active`, same icon pair
  `UserDirectoryScreen.tsx` already uses.
- FormModal: title `"Deactivate "X"?"`, submit label `"Deactivate"`.
- Remove the line "This cannot be undone from here." from the confirm
  copy — it becomes false once Reactivate exists.

**`types/api.ts`** regenerates automatically once the backend routes are
renamed (`npm run generate:types`) — re-apply the hand-maintained
type-alias block afterward; this is the same already-known gotcha
flagged in `active_progress.md`, not a new one.

## What's explicitly out of scope

- No change to `deprecate`/`deactivate` terminology anywhere outside the
  Zone domain (Products, etc.) — this plan is Zone-only.
- No rewrite of historical docs (`Zone-Hierarchy-Implementation-Plan.md`,
  `Zone-Hierarchy-Technical-Design.md`, `Discussion-Zone-Hierarchy-2026-
  08.md`, `Territory-Admin-Screen-Implementation-Plan.md`, `ZonePicker-
  And-Coverage-View-Implementation-Plan.md`) — they describe what was
  decided/built at the time; the terminology in them is a historical
  record, not a live reference. Confirmed neither `Business-Rules.md`
  nor `ADR.md` nor `Physical-Schema.sql` mention "deprecate" at all, so
  no authoritative doc needs an update either.

## Verification

Manual pass, using Central Kerala as the live case since it's the real
zone already sitting deactivated:
1. Reactivate Central Kerala via the new button — confirm it flips back
   to active, the "Inactive" chip disappears, and it becomes pickable
   again in `ZonePicker` (e.g. as a new zone's parent).
2. Re-deactivate it via the renamed action — confirm the wording
   throughout (chip, tooltip, confirm modal, button) reads "Deactivate"/
   "Inactive," not "Deprecate"/"Deprecated," anywhere.
3. Spot-check `_validate_parent`'s rejection message (try to add a child
   zone under a deactivated parent) — new wording, still rejects
   correctly.
4. Guard-green: `pytest` (full suite), `ruff check`, `npx tsc --noEmit`,
   `npm run lint`, `npm run build`.

## Effort estimate

Half a day: ~1-1.5h backend (rename + new method/endpoint + tests),
~1-1.5h frontend (rename + new button/copy), ~30min manual verification.
No migration, no authoritative-doc changes, and the core logic is a
near-verbatim copy of the already-shipped `reactivate_user` pattern —
this is lower-risk than most changes this size because it's copying a
proven shape, not designing a new one.
