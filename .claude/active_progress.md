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
