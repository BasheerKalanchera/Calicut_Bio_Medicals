# Active Progress — Cabio Sales OS
_Session: 2026-08-17_

## Current task — STOP HERE FIRST

**Regression pass complete, demo now tomorrow evening (2026-08-18).**
Full manual pass against `docs/Regression-Test-Plan-2026-08.md` finished
2026-08-17 — every Part A item (A0–A9), plus B5/B8/B9 and both Part C
cross-cutting checks, confirmed working correctly. Nothing broken found.
Two orphaned test zones (`Darwad`, `REGRESSION TEST ZONE`) deleted
directly from Dev during the pass — verified clean, closure table
rebuilt, no dangling references. Doc itself updated with a completion
note; full narrative in `docs/Progress-Archive-2026-08.md`'s 2026-08-17
entry.

**Also shipped tonight, both committed:**
- Activity Notes multi-line entry + line-break display fix
  (`c9861a0`, `1a3738d`) — `FormModal.tsx`'s Enter-key guard was blocking
  newline entry in every `multiline` field, not just Activity Notes; same
  fix applied to buyback item descriptions and product descriptions.
- Zone Deactivate/Reactivate (`b0b4109`) — Territory Admin's zone
  lifecycle was one-way before this; renamed "Deprecate"→"Deactivate" to
  match User Directory's established vocabulary, added the missing
  reactivate action.

**Landed independently today, outside this session (`91a0906`):** Admin/GM
made SBU- and zone-agnostic (migration `0022`, `user_profile.sbu_id`
nullable) — full detail in `docs/Admin-GM-SBU-Agnostic-Implementation-
Plan.md`. Shipped and verified (519-test suite green, `/auth/me` checked
live for all 3 real Admin/GM accounts). **One loose end:**
`Physical-Schema.sql` regen still pending — needs Docker Desktop running
(`docker run postgres:17 pg_dump`), daemon wasn't reachable when this was
built. Run once Docker Desktop is available.

**Next step:** pick a backlog item to build before tomorrow evening's
demo — see conversation for the shortlist under consideration
(`docs/Referral-Credit-And-Relationship-Support-Implementation-Plan.md`
is the strongest, already-approved candidate).

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

**Also flagged, not yet decided:** `sales-os-app/src/App.jsx` (legacy
`/prototype` route, mock data only) still references "Sales Manager" —
out of scope pending Basheer's call on whether the prototype route is
worth touching at all.
