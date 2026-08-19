# Active Progress — Cabio Sales OS
_Session: 2026-08-18_

## Current task — STOP HERE FIRST

**`ProjectDirectoryScreen.tsx` MUI migration — DONE, verified, staged,
not yet committed.** Full triple-conversion landed, 3 real bugs found
and fixed during Basheer's manual verification (query-key collision
crashing `QuickLeadModal.tsx`, Edit Project bouncing to the list instead
of updating in place, Edit Opportunity's product picker ignoring the
opportunity's own SBU — the last one also fixed in
`Customer360Screen.tsx`, same pre-existing gap there). Global "+ Lead"
now pre-fills Account/Project from context too. `docs/Frontend-
Implementation-Standards.md`'s §9 migration table closed out (0 pending,
collapsed to a pointer at Progress Archive per the doc's own
post-migration cleanup instructions) and bumped to v3.0. Full narrative
in `docs/Progress-Archive-2026-08.md`'s 2026-08-18 entries — not
repeated here.

**Signal for the parallel Referral Credit session (below):** this
migration has landed — the "deliberately held back" `ProjectDirectoryScreen`
referral toggle (their item, not this one) can now be added as their
follow-up.

**Committed 2026-08-18 (`1d51b6d`).** The staging split described below
worked cleanly — confirmed post-commit: `QuickLeadModal.tsx`/
`Customer360Screen.tsx` in the commit carry only this migration's hunks
(query-key collision fix, `initialAccountId`/`initialProjectId` props,
the SBU product-picker fix); the Referral Credit session's edits to
those same two files were undisturbed in the working tree afterward and
confirmed intact (`tsc --noEmit`/`npm run lint` clean, referral markers
all present) — see that session's note below.

## Recently shipped, all committed (context for the migration above)

- **BR-OP-10 fix** (`91e7fc2`) — all 3 Opportunity create screens
  (Customer 360, +LEAD, Project Directory) were violating an
  already-documented rule by offering On Hold/Lost/Won as initial Status
  choices; filtered each to Active-only. Edit/Detail screens unchanged.
- **`ProjectDirectoryScreen.jsx` SBU-parity fix** (`874bd8f`) — Add
  Opportunity now has BR-OP-12's Admin/GM SBU-override logic, matching
  Customer 360/+LEAD.
- User Directory manager_id-resend fix (`49e7dfd`), Activity Notes
  multi-line fix (`c9861a0`, `1a3738d`), Zone Deactivate/Reactivate
  (`b0b4109`) — all from the 2026-08-17 session, detail in
  `docs/Progress-Archive-2026-08.md`.

Full manual regression pass against `docs/Regression-Test-Plan-2026-08.md`
completed 2026-08-17 — nothing broken. Detail in Progress Archive.

**Staging note for whoever commits next:** `QuickLeadModal.tsx` and
`Customer360Screen.tsx` currently have this session's fixes staged
(hunk-level, via `git apply --cached`) alongside the Referral Credit
session's unstaged work in the same working-tree files. Committing now
only commits the staged MUI-migration hunks — the Referral Credit
session's edits stay untouched in the working tree, ready for them to
stage and commit separately. Don't run a blanket `git add` on either
file without checking `git diff --cached` first, or the two sessions'
work will get committed together.

## Also still open (unrelated, carried over)

The Critical Care/Imaging manager hierarchy build-out — see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed
plan. Blocked item resolved for Dev; concerns UAT/Prod rollout more
broadly — revisit once UAT is fully proven out.

**Deliberately left unconverted, not forgotten** (Basheer's explicit scope
call, see the `@mui/x-date-pickers` archive entry): 9 date-only
`type="date"` fields in `Customer360Screen.tsx`/`OpportunityDetailScreen.
tsx`, and 2 more in `ProjectDirectoryScreen.jsx` (will naturally come up
during the MUI migration above — pick up only if Basheer decides to
extend scope during that pass).

**Also flagged, not yet decided:** `sales-os-app/src/App.jsx` (legacy
`/prototype` route, mock data only) still references "Sales Manager" —
out of scope pending Basheer's call on whether the prototype route is
worth touching at all.

## Parallel task (separate session) — Referral Credit, Part 1 of 2

Split from `docs/Referral-Credit-And-Relationship-Support-Implementation-
Plan.md` — Part 1 (Referral Credit) being built now; Part 2
(Relationship-Support Activity) deliberately deferred to a later pass,
not touched here. Runs alongside the MUI migration above in a separate
session — **zero file overlap** except one deliberately-held-back item
(see below).

**Backend — done, not yet committed:** migration `0023_add_referral_
credit.py` (adds `opportunity.referred_by_user_id` FK + `referred_by_note`
text + `ck_opportunity_referral_not_both` CHECK constraint), model,
schemas (`OpportunityCreate`/`Update`/`Response`/`PipelineOpportunity`,
mutual-exclusivity validator), `create_opportunity` service fix (doc's
claim that no service change was needed was wrong — `create_opportunity`
builds `Opportunity(...)` with named fields, unlike `update_opportunity`'s
generic loop), BR-FIN-07 (`docs/Business-Rules.md`), 7 new backend tests.
Applied to Dev (`alembic upgrade head`, now at `0023`). Full 526-test
backend suite green, `ruff check` clean on all touched files.

**`docs/Physical-Schema.sql` regen — DONE, 2026-08-18.** Docker Desktop
started, `docker pull postgres:17` + `pg_dump --schema-only` against Dev,
committed. Turned out to be further behind than just `0022`/`0023` — last
regenerated after `0019`, so this pass also picked up `0020`'s
`idx_zone_name_trgm` index (never regenerated after that one landed
either). Diff verified clean: `opportunity.referred_by_user_id`/
`referred_by_note`/`ck_opportunity_referral_not_both`/FK, `user_profile.
sbu_id` nullable, `idx_zone_name_trgm` — all present, nothing unexpected.

**Frontend — done, not yet committed.** Referral toggle built in all 3
non-conflicting entry points: `QuickLeadModal.tsx`, `Customer360Screen.tsx`
(both its New and Edit Opportunity forms), `OpportunityDetailScreen.tsx`
edit form. Toggle shown only when Lead Source = Referral (not
`OEM_REFERRAL`); colleague picker uses a new, distinctly-keyed
`["users","referral-picker"]` query (`listUsers("all")`) in each file —
confirmed and avoided the pre-existing `["users","all"]` naming-quirk
collision in all 3.

**Two real gaps found beyond the original plan doc, both fixed:**
1. `WorkspaceOpportunity` (`backend/app/domains/account/workspace_schemas.py`)
   is a *third* Opportunity response shape the doc never accounted for —
   it's what `GET /accounts/{id}/opportunities` actually returns, and what
   `Customer360Screen.tsx`'s `openEditOpp` reads from to prefill its Edit
   form. Without adding `referred_by`/`referred_by_note` there too, that
   screen's Edit form could never have shown the current referral value.
2. `types/api.ts` has a hand-maintained "convenience aliases" block
   (named type exports like `PipelineOpportunity`) appended after
   openapi-typescript's generated output — `npm run generate:types`
   silently wipes it (the file's own comment warns of this). Restored
   from git history after regenerating; `tsc --noEmit` catches this
   immediately if it's ever missed again (30+ errors, one per lost alias).

`tsc --noEmit` and `npm run lint` (incl. `check-no-tailwind.js`) both
clean across the whole project. Backend suite re-confirmed green (526
passed) after the `workspace_schemas.py` change.

**4th entry point — `ProjectDirectoryScreen.tsx` referral toggle — DONE,
2026-08-18**, added once the MUI migration above landed. Both its Add and
Edit Opportunity forms (`addOpp*`/`editOpp*` state, matching this file's
own naming convention, not Customer360Screen.tsx's `newO*`/`editO*`) got
the same toggle, same distinctly-keyed `["users","referral-picker"]`
query (shared across both forms in this file). `openEditOpp` seeds from
`opp.referred_by`/`referred_by_note` — same `WorkspaceOpportunity`
response shape as Customer360Screen.tsx's byAccount list, already
carries the fields (no further backend change needed). Simplified one
pre-existing inline `leadSources.find(...)` REPEAT_ORDER check to reuse
the new `addOppLeadSourceCode` const while touching that line anyway.
`tsc --noEmit` and `npm run lint` both clean across the whole project
after this addition. **All 4 entry points for Referral Credit now done.**

**Still open for Part 1:** manual verification on Dev (Basheer, per
usual) across all 4 entry points now (QuickLeadModal, Customer360 New +
Edit, OpportunityDetailScreen edit, ProjectDirectoryScreen Add + Edit) —
toggle appears only for Referral not OEM Referral, mutual exclusivity
produces a 422, values round-trip on reload. Nothing committed yet —
review diff first.
