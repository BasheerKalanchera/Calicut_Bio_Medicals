# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-06+ (continued across multiple days)_

## Current task — STOP HERE FIRST
**Reminder click-through is DONE, verified by Basheer, not yet committed —
commit pending (see bottom of this file for the drafted message).** Closes
item 2 of the Milestone 1 gap-closure list; remaining: Catalog role gate
(GM+Admin), Product Catalog collateral links — no fixed order between those
two, pick a starting point next session. Full write-up below ("Reminder
click-through — full write-up").

**Opportunity Detail trio (Associated Project link + Lead Source display/edit
+ Demo End Date display/edit) is DONE and COMMITTED (`b662751`, 2026-07-12).**
Basheer's manual browser pass found one issue (Overview tab field order),
fixed and folded into the same commit — see ledger below for full write-up.
This closes item 1 of the Milestone 1 gap-closure list.

**Open question surfaced during `CustomerType` review, NOT YET RESOLVED —
check before assuming the 8-value enum is complete:** Basheer's real
example — Aster DM is the parent of Aster MIMS Calicut and Aster Medicity
Kochi. Structurally "is this a parent" is already answered by
`parent_account_id` (no `CustomerType` needed for that). The open question
is narrower: **is Aster DM itself, as an institution, a functioning
hospital (fits an existing value, e.g. Multispeciality Hospital) — or a
pure corporate/holding entity with no clinical operations of its own (fits
none of the 8 values well; "Other" would be a lossy fallback)?** If the
latter is true for Aster DM or similar real accounts, the enum has a real
gap and needs a 9th value (something like "Corporate Group / Holding
Entity") — a small follow-up migration (`0006`), not a big change, but a
real one. Basheer's own words: "I need to check" — action is on him to
check the real data; revisit this before treating the 8-value list as
final/closed.

**Priority decision (2026-07-10, still in force): Milestone 1 gap-closure
work from the Prototype/Production Parity Audit comes first, ahead of
resuming the §9 MUI migration backlog.** The demo checkpoint moved from
July 13 to July 20, which is what freed up room to do this instead of
migration work — not an abandonment of §9, just a sequencing call. See
`docs/Prototype-Production-Parity-Audit.md` §6 ("Gaps to finish —
Milestone 1") for the full scope. Remaining, untouched: Reminder
click-through, Catalog role gate (GM+Admin), Product Catalog collateral
links.

**Mapped all 6 (now 2 remaining) items to screens/files 2026-07-11
(research agent, verified against actual code, not just the audit doc's
summary) — see "Milestone 1 remaining items — screen mapping" write-up
below for full detail. Recommended order, supersedes the earlier flat
list:**
1. ~~Opportunity Detail trio~~ — DONE, `b662751`.
2. ~~Reminder click-through~~ — DONE, verified, commit pending (see "Reminder
   click-through — full write-up" below).
3. **Catalog role gate** — medium, standalone (no shared logic with #4
   despite touching the same screen file).
4. **Product Catalog collateral links** — medium, standalone, biggest of
   the four since there's zero Document API surface today (only the ORM
   model exists — no schemas.py/service.py/router.py at all).

**§9 migration backlog is paused, not abandoned** — resume the 3 remaining
files (`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx`) after Milestone 1 gaps are closed. See "Next
step" below.

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
| Reminder click-through                                   | *pending*   | New `GET /opportunities/{id}` + `OpportunityDetailScreen.tsx` fetch-on-mount + `NextActionsScreen.tsx`/`DemoApp.tsx` wiring + return-view back-nav fix; see write-up below. Manually verified by Basheer, one back-navigation bug found and fixed |

### Backend concurrency fix (`2bb41b4`) — why the Activity tab was actually slow
Two earlier fix attempts (Round 1: activity endpoint query optimization;
Round 2: frontend duplicate-query-observer fix, both landed in `1bc4678`)
did not resolve the reported slowness. Root cause, found by reading the
code, not guessed: `backend/app/db/session.py` uses plain sync SQLAlchemy
(`create_engine`/`sessionmaker`, no `asyncpg`), yet every route handler in
the app — 48 signatures across 11 files, including `get_current_user`, a
dependency on every authenticated endpoint — was `async def` with zero
`await` anywhere in the call chain. An `async def` handler that calls
blocking sync I/O runs directly on Uvicorn's single event-loop thread, so
concurrent requests serialize instead of overlapping; `Customer360Screen`
fires ~12 requests on mount, and whichever landed last in that queue looked
slow regardless of its own query cost. Converted all 48 to plain `def` so
FastAPI dispatches them to its threadpool instead. Confirmed fixed by
Basheer's live retest — "lightning fast now." Full detail (capacity check,
the `tests/test_auth.py` fallout found and fixed) in `2bb41b4`'s commit
message.

### `OpportunityDetailScreen.tsx`'s Activity tab — same investigation, different cause
After the backend fix landed, Basheer noted `OpportunityDetailScreen.tsx`'s
Activity tab still felt slow. Confirmed (his testing) that **all four tabs**
on that screen (Products/Splits/Stakeholders/Activity) load lazily on click
— this screen never got Customer360Screen's Commit B always-mounted-prefetch
treatment. Fixed and committed as `2f7e074`: added always-mounted prefetch
queries for all four (reusing each tab's existing query key), matching
`staleTime` on both ends so a click shortly after mount reads cache instead
of silently re-fetching.

### Activity logging on Project Details (`6075c80`) — design decisions worth remembering
Backend had `project_id` on `ActivityCreate` (write side) but no read path at
all — added `ActivityRepository.project_exists`/`list_by_project`/`count_by_project`,
`ActivityService.list_by_project`, and `GET /projects/{project_id}/activities`,
mirroring the opportunity-scoped pattern exactly.

**Why the frontend went through `DemoApp.tsx`'s header button instead of a
local modal:** the obvious approach was a third independent `LogActivityModal`
mount inside `ProjectDirectoryScreen.jsx` (`Customer360Screen.tsx` and
`OpportunityDetailScreen.tsx` each already have their own). Basheer chose
instead to extend `DemoApp.tsx`'s header `+Log` button — already
context-sensitive for Customer360/OpportunityDetail — to also cover Project
Detail, avoiding a third copy of the duplication already flagged in the
"Consolidate +LOG/+LEAD" deferred item below. Required lifting `selectedProject`
state into `DemoApp.tsx` (`onSelectProject` callback + `openLogActivityRef`,
mirroring the `onDetailModeChange`/`refreshOppsRef` idiom already used in this
file) instead of adding local modal state to `ProjectDirectoryScreen.jsx`.
`LogActivityModal.tsx` also gained a `projectName`-aware "Project: {name}"
chip so it's unambiguous which project an activity lands on when logged via
the header button (opportunity chip intentionally left generic — Basheer's
call, retrofit it when the full +LOG consolidation happens, not bundled here).

**Stale-detail-view bug found and fixed in the same pass** (pre-existing, not
caused by this work): `ProjectDirectoryScreen.jsx` stays mounted-but-hidden
(CSS `display: none`) rather than unmounting like `Customer360Screen`/
`OpportunityDetailScreen` (each their own conditionally-rendered `view`), so
navigating away via the sidebar and back re-showed the previously-open
project's detail view with the Customers/Projects sub-tab header stacked on
top of it. Fixed with the same parent-invokes-child-ref idiom as `openCreateRef`:
new `projectResetRef` in `DemoApp.tsx` called from `navigate()`;
`ProjectDirectoryScreen.jsx`'s `resetDetailRef` handler clears
`selectedProject`/`editingProject` and calls `onSelectProject?.(null)`.

Two decisions from this history had reasoning that lived only in this log,
not in any commit message or ADR — both now fixed at the source instead of
just narrated here:
- The bulk-replace stakeholder `PUT` endpoint's audit-trail-corruption risk
  (why a frontend-only workaround was rejected in `3619295`) is now a code
  comment on `replace_opportunity_stakeholders` (router.py) and
  `replace_stakeholders` (repository.py), so a future caller sees the warning
  without needing this file.
- BR-FIN-03 auto-sync (not a computed field) and the patch-not-invalidate
  cache strategy are both already spelled out in `01cead0`'s commit message
  — verified present, nothing further needed.

### Prototype/Production Parity Audit (2026-07-10) — new, not yet acted on

Produced `docs/Prototype-Production-Parity-Audit.md` — a systematic
comparison of the old prototype (`sales-os-app/src/App.jsx`, 8,740 lines)
against every production screen, then verified against `ADR.md`,
`Business-Rules.md`, `Enterprise-Data-Model.md`, `API-Catalog.md`,
`physical-data-model.md`, `Cabio Sales OS – Phase 1 - PRD.md`, and the live
backend — not a naive diff. Went through three revisions in one session
(v1 raw diff → v2 architecture-verified → v3 re-scoped after the demo date
moved), each documented in the file's own §7 changelog so the corrections
are auditable rather than just asserted.

**Headline corrections from the verification pass, worth remembering so they
don't get re-litigated:**
- Project On-Hold workflow and the Marketing Campaign field both looked like
  gaps in a raw prototype diff but are **not** — `ON_HOLD` isn't a defined
  `ProjectStatus` anywhere in the architecture, and Campaign is explicitly
  named as a future-phase item in `Enterprise-Data-Model.md §10`.
- The claim "no per-stage pipeline validation exists" was wrong — 5 of
  `BR-OP-01`'s 6 stage gates are already enforced server-side in
  `backend/app/domains/opportunity/validators.py`. Only Demo→Clinical-Eval
  and half of Order→Delivery are genuinely missing (confirmed via the
  validator's own code comments admitting the deferral).
- **New compliance gaps found independent of the prototype**, by checking
  `Business-Rules.md` directly: `BR-OP-06` Stalled Opportunity Detection
  (180-day auto-stall) is 0% implemented, no scheduled job exists anywhere.
  Demo Outcome, Handover Information, and Delivery Date/Installation Site
  are all formally mandated `BR-OP-01` gate fields with zero schema support.
- **RBAC reality check:** there is no role-gating pattern anywhere in
  production (frontend or backend) to reuse for the Catalog fix — verified
  false a claim to the contrary. `role` table + 4 seeded roles exist, but
  `get_current_user()` only authenticates, never authorizes. The bigger,
  approved-but-unbuilt initiative for this is `docs/Phase-2E-Security-Architecture.md`
  (full PostgreSQL RLS) — its own `set_rls_context()` hook is currently a
  literal no-op in `db/session.py`. Confirmed that's a separate, multi-day
  project; the Catalog role check is small, standalone service-layer work
  that doesn't need to wait for it.
- **PRD cross-check surfaced a real drop between the PRD and the formalized
  data model**, not a deliberate Phase 1 simplification: `Cabio Sales OS –
  Phase 1 - PRD.md` §1.1/§1.2/§1.3/§B.2.6 define `CustomerType`,
  `CustomerClass`, `CustomerTier`, `CustomerStatus`, and an address block for
  Account — none of it exists in `Enterprise-Data-Model.md`,
  `Physical-Schema.sql`, or the live `Account` model. The PRD also defines
  `CustomerType` two contradictory ways (hierarchy-level vs.
  institution-nature) — resolved by using `account.parent_account_id`
  (already live, structurally one-to-many, but no children-listing read path
  exists yet) for hierarchy, and reserving `CustomerType` for institution
  nature per the PRD §B.2.6 enum.

**Decisions made this session (recorded in the audit doc, not repeated in
full here):**
- Catalog Add/Edit restricted to General Manager + Admin roles — not yet
  built.
- `CustomerType` (institution-nature): approved to build, per PRD §B.2.6.
  `CustomerClass`/`CustomerStatus` remain undecided, explicitly parked.
- Quick Lead inline account creation: **not** built for Phase 1 — reps
  create the account via Account Management first. Simplicity call, not a
  BR-ACT-01/03 requirement (that justification was floated during review and
  didn't hold up on inspection).
- Stakeholder delete: removed from scope entirely — was a straight
  prototype-diff finding never backed by a Business Rule or ADR; its absence
  actually matches a deliberate no-DELETE pattern used elsewhere in
  `API-Catalog.md` (Installed Assets, Reminders, Target Plans).
- Demo checkpoint confirmed moved to **July 20** (from July 13) — this is
  what freed the "Current task" priority call above.

Full detail, tables, and the complete Milestone 1 / Milestone 2 scope split
are in `docs/Prototype-Production-Parity-Audit.md` — treat it as the
authoritative reference, don't re-derive it here.

### Parent Customer display + editing (`87fde5a`, `95e118a`) — full write-up

**Display (`87fde5a`, 2026-07-10):** backend `AccountRef` type + `list_children()`
read path on `GET /accounts/{id}`; frontend `Customer360Screen.tsx` Overview
tab (clickable Parent Customer field + Child Accounts chips) and
`CustomerDirectoryScreen.jsx` ("Parent: X" directory-card badge, Tailwind
one-off exception to ADR-031 — file still pending its own §9 migration).

**Editing (`95e118a`, 2026-07-11):** built because Basheer's review of the
display-only feature concluded *"without ability to add a parent to an
account, this feature is not complete"* — display was the only thing
originally scoped for Milestone 1, editing was a deliberate scope cut that
didn't hold up once the display was actually live.
- **Backend cycle guard:** `service.py`'s `_validate_references` previously
  only blocked *direct* self-parenting. Added `AccountService._creates_cycle`
  + `AccountRepository.get_parent_id`, which walks the full ancestor chain
  from a proposed parent looking for the account itself — catches deeper
  cycles (A→B→C→A), not just the direct case. 4 new tests (2 repository, 2
  service). Cost/complexity tradeoff (one DB round-trip per ancestor level)
  is documented in the function's own docstring, not repeated here — only
  revisit if a future milestone introduces deeper hierarchies than today's
  1-2 levels.
- **Frontend:** `Customer360Screen.tsx`'s Edit Customer modal got a "Parent
  Customer" MUI `Autocomplete` (debounced search via `listAccounts`,
  excludes self + direct children client-side, backend cycle guard as the
  backstop for deeper cycles). `CustomerDirectoryScreen.jsx`'s New Customer
  modal got a matching bespoke Tailwind search/select (no MUI import — same
  file-boundary exception as the badge above).

**Two real bugs found and fixed during manual verification of this and the
display work together** (neither had had a live pass until this session):
1. **Cache invalidation.** Setting a parent only invalidated the edited
   account's own React Query cache entry (`["account", accountId]`), never
   the parent's — so a parent's Child Accounts list could stay stale on any
   screen already open or revisited within the 30s global `staleTime`
   (`main.tsx`). Fixed in both `Customer360Screen.tsx`'s `handleUpdateAccount`
   (invalidates both old and new parent on a reparent) and
   `CustomerDirectoryScreen.jsx`'s `handleCreateAccount` (invalidates the
   new parent) — the latter needed importing `useQueryClient` into a
   Tailwind-only file, which is fine; that boundary is about UI components,
   not data-cache hooks.
2. **`initialDataUpdatedAt` — the real root cause, found after the cache fix
   alone didn't resolve it ("children not showing for a very long time").**
   `Customer360Screen.tsx`'s account query seeds from a name/id-only summary
   (a Directory row, or a parent/child link) via `initialData`, but never
   set `initialDataUpdatedAt`. React Query treats unstamped `initialData` as
   fetched "just now," so under the 30s global `staleTime` the query is
   considered fresh at mount and never kicks off the correcting background
   fetch — and nothing else was forcing one either (no polling; only window
   refocus or a fresh mount would trigger a staleness re-check). On a screen
   the user just leaves open, the incomplete snapshot could persist
   indefinitely. Fixed by backdating `initialDataUpdatedAt: initialAccount ?
   0 : undefined` — forces immediate staleness so a background refetch
   starts right on mount, while still painting instantly from the seed data.
   Verified against the live DB directly (backend `list_children()`/
   `GET /accounts/{id}` both confirmed correct via `TestClient`, read-only,
   before concluding the bug was frontend-only) — root-caused, not guessed.

Basheer's manual verification pass (2026-07-11) confirmed: adding a parent,
viewing parent, viewing children, clicking parent, clicking children all
working.

### `api.ts` generation debt + `ActivityType` backend fix (`bb671bc`) — full write-up

**The debt:** `api.ts` (header: "auto-generated ... do not make direct
changes to this file") hadn't had a real `npm run generate:types` run since
`3bab93f` (2026-07-03). Two commits since then hand-patched fields directly
into the file's "Phase A — Pipeline types (hand-written, not auto-generated)"
tail block instead of regenerating (`2f7e074`, 2026-07-06 — 4 fields
hand-added to `PipelineOpportunity`), and two real backend endpoints shipped
with zero corresponding frontend types ever generated: opportunity
stakeholder `POST`/`PATCH`/`DELETE` (`3619295`, 2026-07-05) and
`GET /projects/{project_id}/activities` (`6075c80`, 2026-07-06). No external
actor — a prior session took a "hand-edit the generated file" shortcut
twice without flagging it as debt.

**The fix:** regenerated against the live backend's OpenAPI spec (pulled
in-process via `TestClient`, no server needed — safe, read-only). Diffed
every hand-written type field-by-field against its backend equivalent
before touching anything:
- Aliased to `components["schemas"][...]` (exact match or additive-only
  diff, safe): `PipelineOpportunity` (+ nested `stage`/`status`/`owner`/
  `account`/`sbu`), `StakeholderLinkResponse`, `OpportunityItemResponse`,
  `SplitResponse` (backend now also returns an `id` field the hand-written
  type never had — additive), `ReminderResponse` (nested `activity` object
  renamed `ActivityContextNested` backend-side, aliased under the existing
  `ReminderResponse` name so nothing importing it breaks).
- `ActivityResponse`/`ActivityType`/`ActivityContextNested.activity_type`
  initially could NOT be safely aliased — the backend's own schema typed
  `activity_type` as plain `str` instead of the 6-value enum
  `ActivityCreate` already used correctly. Fixed at the source instead of
  leaving the frontend override in place: checked the live DB first for any
  value outside the 6-value enum (tightening a *response* schema means
  Pydantic validates on the way out too — a stray value would 500 on
  `GET .../activities`), confirmed clean (only `MEETING`/`CALL`/`EMAIL` in
  use), then fixed `backend/app/domains/activity/schemas.py` lines 72 and 99
  (`ActivityResponse.activity_type` and `ActivityContextNested.activity_type`,
  both `str` → `ActivityType`) and regenerated again. `ActivityResponse` and
  `ActivityPage` are now aliases too; `ActivityType` itself is derived via
  `components["schemas"]["ActivityResponse"]["activity_type"]` rather than
  hand-listed, so it can't drift from the backend enum again.
- `ActivityPage` needed its own hand-written wrapper even after the backend
  fix — aliasing it to the generated `PaginatedResponse_ActivityResponse_`
  wrapper would nest the *backend's* `ActivityResponse` inside, not
  necessarily the same TS symbol as the top-level exported alias, so it's
  written by hand as `{ items: ActivityResponse[]; total; page; page_size;
  total_pages }` referencing the local alias explicitly. `tsc --noEmit`
  caught this the first time it was tried and aliased directly — proof the
  whole-project typecheck after a regen is load-bearing, not a formality.
- `PipelinePage` aliases cleanly to `PaginatedResponse_PipelineOpportunity_`
  (no such ActivityResponse-style trap there, since `PipelineOpportunity` is
  itself already a clean alias).

**Result: `api.ts`'s hand-written tail is now genuinely minimal** — every
exported name still needed by other files (grep-verified against actual
imports, not kept "just in case") is a one-line alias, nothing has a
hand-typed body. Repo-wide grep confirmed no other file carries the same
"auto-generated, do not edit" anti-pattern. `tsc --noEmit`/`npm run lint`/
`npm run build` and `pytest` (275 passed, 1 pre-existing unrelated failure)
all clean. Manual smoke test (Basheer, 2026-07-11) of the most-affected
screens — Opportunity Pipeline, Opportunity Detail (Splits/Stakeholders/
Items tabs), Activity timelines, Next Actions — confirmed normal.

### Milestone 1 remaining items — screen mapping (2026-07-11, research only)

Ran a research agent against the actual code (not just the audit doc's
summary — this session already found a few "documented state" vs. "real
code" mismatches, so worth double-checking) to map all 6 remaining items to
files, before picking what to build next.

| Item | Screen(s) | Backend touch |
| --- | --- | --- |
| Associated Project link | `OpportunityDetailScreen.tsx` | `PipelineOpportunity` schema — add `project_id` + nested `Project` (column/relationship already exist on the ORM model, just missing from this response shape) |
| Lead Source display | `OpportunityDetailScreen.tsx` | `PipelineOpportunity` schema — add `lead_source_id` + nested `LeadSource` (`validators.py` already hard-requires it to advance Lead→Qualified — the write path is enforced, the screen just has no field to satisfy it) |
| Demo end date | `OpportunityDetailScreen.tsx` | none — `demo_end_date` already in `PipelineOpportunity`/`OpportunityCreate`/`OpportunityUpdate`; only `demo_start_date` is actually wired into the Overview display and Edit form today |
| Reminder click-through | `NextActionsScreen.tsx` + `DemoApp.tsx` | mostly none — see gap below |
| Catalog role gate (GM+Admin) | `ProductCatalogScreen.jsx` | new `require_role()`-style FastAPI dependency — confirmed zero role-checking logic exists anywhere in the backend today (`get_current_user` only authenticates) |
| Product Catalog collateral links | `ProductCatalogScreen.jsx` | new Document `schemas.py`/`service.py`/`router.py` — `backend/app/domains/document/` today has only `models.py` (the ORM model + `Product.documents` relationship exist per ADR-025, zero API surface) |

**Key discovery driving the grouping recommendation above:**
`OpportunityDetailScreen.tsx` never fetches its own data — `DemoApp.tsx`'s
`handleSelectOpportunity` just hands it whatever `PipelineOpportunity`
object was already sitting in the pipeline list. So Associated Project,
Lead Source, and Demo End Date all depend on that one schema and that one
screen's Overview tab/Edit form — doing them as one pass is a real
efficiency, not just "same file, do together" convenience.

**Reminder click-through's real design gap, found by the agent, not in
the original audit:** the account-side of this (`handleSelectAccount`)
is safe — a Reminder's nested account is `{id, name}`, exactly the
minimal shape `Customer360Screen.tsx` already expects as a seed, and
that screen already has the `initialDataUpdatedAt` fix from this session
to correctly refetch the rest. The opportunity-side is not safe:
`handleSelectOpportunity` expects a full `PipelineOpportunity` (stage,
status, owner, sbu, account...), but `ReminderResponse.activity.opportunity`
is only `OpportunityNested` (`{id, name}` — see `activity/schemas.py`).
Wiring the click-through naively would open `OpportunityDetailScreen.tsx`
mostly blank, because that screen has no fallback fetch of its own — it's
the same "minimal object treated as complete" bug class as the Parent/Child
account issue fixed earlier this session (`95e118a`), just not yet fixed
for Opportunities. Needs a decision before building: either give
`OpportunityDetailScreen.tsx` a real fetch-on-mount (bigger, more durable
fix — arguably the right one, matching how the account screen now works),
or fatten the reminder's nested opportunity payload to match
`PipelineOpportunity` (cheaper, but only patches this one entry point).

**Catalog role gate + collateral links share a file, not logic** — treat
as two separate efforts even though both touch `ProductCatalogScreen.jsx`;
one's an authorization wrapper on existing buttons, the other's a net-new
Documents tab on a screen with no tab structure today.

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
**Milestone 1 gap-closure first (2026-07-10 priority decision)** — work the
remaining list in `docs/Prototype-Production-Parity-Audit.md` §6 ("Gaps to
finish — Milestone 1"). Done so far: Parent Customer display + editing
(`87fde5a`, `95e118a`), `CustomerType` (`70cf978`), Opportunity Detail trio
(`b662751`), Reminder click-through (verified, commit pending — see
write-up above). Still open: Catalog role gate (GM+Admin), Product Catalog
collateral links. No fixed order committed yet between those two — pick
starting point next session.

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

## Notes / decisions
- MUI-only decided, non-negotiable. §9 is the authoritative migration tracker.
- Enforcement is live: pre-commit hook blocks new Tailwind automatically.
- The 14 eslint-disable suppressions are load-bearing (they keep lint green / the
  commit gate working) — they get DELETED as each file migrates, not before.
- Timing: original plan was "finish whatever is migrated AND re-verified by
  July 10; freeze rest, demo July 13 on clean mix of migrated + untouched
  screens, resume after." Superseded 2026-07-10: **demo checkpoint moved to
  July 20.** The extra runway is why Milestone 1 gap-closure work (see
  "Current task"/"Next step") was prioritized ahead of resuming the §9
  migration backlog rather than the other way around.
- **Demo-blocking bug found and fixed 2026-07-06:** the (then-)July 13 demo
  would have changed opportunity status from `OpportunityDetailScreen.tsx` (confirmed
  with Basheer), which had zero UI for the BR-OP-02/03/05 status-gated
  fields the backend validator already enforces — any such status change
  would have failed with no way to fix it in the form. Fixed and committed
  as `2f7e074`.
- Confirmed by design, not a bug (2026-07-06): changing a LOST opportunity's
  status back to Active correctly fails ("Cannot change the status of a LOST
  opportunity") — per `Business-Rules.md:114-122`, WON/LOST are terminal;
  a new Opportunity must be created instead, to keep historical WON/LOST
  records immutable for audit.
- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
- Live shared Supabase DB caution applies when touching real data.

### `CustomerType` (institution-nature) — full write-up (`70cf978`)

**Backend:**
- `backend/alembic/versions/0005_add_account_customer_type.py` — nullable
  `customer_type` column + `ck_account_customer_type` CHECK constraint
  (8-value enum, PRD §B.2.6). **Applied to the live shared dev DB
  2026-07-11** — verified via `information_schema`/`pg_constraint` queries
  (read-only), not just "migration file exists." `alembic current` → `0005
  (head)`.
- `backend/app/domains/account/models.py` — `Account.customer_type` column +
  matching `CheckConstraint` in `__table_args__`.
- `backend/app/domains/account/schemas.py` — new `CustomerType` `StrEnum`;
  `customer_type` added to `AccountBase` (→ `AccountCreate`), `AccountUpdate`,
  `AccountListResponse`, `AccountResponse` (`AccountDetailResponse` inherits
  it for free).
- `backend/app/domains/account/service.py` — `create_account`'s `Account(...)`
  constructor now passes `customer_type` (`update_account` already handles
  new fields generically, no change needed there).
- `backend/tests/domains/account/{test_account_service,test_account_router}.py`
  — 4 new tests (valid/invalid `customer_type` on create + update) + fixed
  `test_account_router.py`'s `_mock_account` helper (was missing
  `customer_type`, which broke `AccountResponse`/`AccountListResponse`
  Pydantic validation in 4 unrelated pre-existing tests once the field
  existed on the model).

**Frontend:**
- `sales-os-app/src/screens/Customer360Screen.tsx` — new `formatEnumLabel()`
  helper (`"MULTISPECIALITY_HOSPITAL"` → `"Multispeciality Hospital"`,
  generic underscore-split + title-case, works for all 8 values with no
  special-casing); "Customer Type" hardcoded `<MenuItem>` select in Edit
  Customer modal (same pattern as Payer Behavior — no master-data fetch,
  per `ADR-036`); "Customer Type" row added to the Overview tab's `fields`
  array, rendered via `formatEnumLabel`. `handleUpdateAccount` always sends
  `customer_type` (even `null`) so it can be cleared, same convention as
  `parent_account_id`.
- `sales-os-app/src/screens/CustomerDirectoryScreen.jsx` — same
  `formatEnumLabel()` helper (duplicated, not shared — this file is plain
  JS/Tailwind, `Customer360Screen.tsx` is TSX/MUI, no shared util module for
  this one function yet); "Customer Type" hardcoded `<select>` in New
  Customer modal; amber directory-card badge (`bg-amber-50`/`text-amber-700`)
  matching the existing Zone/Parent/Payer Behavior badge row exactly.
- `sales-os-app/src/types/api.ts` — regenerated again (same
  dump-OpenAPI-in-process, no-server-needed approach as the earlier
  `bb671bc` cleanup) to pick up `customer_type` on the Account schemas; the
  hand-written alias tail (wiped by every regen) was re-appended unchanged.
  Note: `services/accounts.ts`'s `listAccounts`/`getAccount` still return
  `Promise<unknown>` (pre-existing deferred item — "type the shared frontend
  service functions properly") — neither screen's use of `account.customer_type`
  is actually type-checked against the regenerated schema as a result; the
  regen was still worth doing to keep `api.ts` itself accurate, just noting
  it wasn't required for `tsc --noEmit` to pass this time, unlike the
  Activity/Pipeline types from the `bb671bc` cleanup which are genuinely
  imported and checked.

`tsc --noEmit`/`npm run lint`/`npm run build`/`pytest` (280 passed) all
clean. Manually verified by Basheer (2026-07-11): New Customer select, Edit
Customer select (change + clear-to-blank), Overview tab display, Directory
badge, regression on accounts with no `customer_type` set — all confirmed
working.

**Open follow-up, not yet resolved — see "Current task" for full detail:**
whether the 8-value enum needs a 9th value for pure corporate/holding
accounts (e.g. Aster DM) that have no clinical nature of their own,
distinct from the hierarchy question (already answered by
`parent_account_id`, no field needed for that part). Basheer is checking
the real data before any further change.

### Opportunity Detail trio (Project link / Lead Source / Demo End Date) — full write-up (`b662751`)

First item of the Milestone 1 gap-closure list. Three fields bundled into
one pass because all three live or die on the same `PipelineOpportunity`
schema and the same screen — `OpportunityDetailScreen.tsx` never fetches
its own data, `DemoApp.tsx` just hands it whatever pipeline-list object was
already loaded (see "Milestone 1 remaining items — screen mapping" above).

**Scope decisions, both made via `AskUserQuestion` before coding:**
- **Associated Project: plain text display, no click-through.** Basheer's
  call — click-through deferred as a post-demo follow-up if a customer asks
  for it; building it now would have required new cross-screen navigation
  plumbing (`onSelectProject` prop + handler in `DemoApp.tsx`) that doesn't
  exist today for Opportunity Detail (Project Detail today only renders
  inline inside `ProjectDirectoryScreen`, no standalone route).
- **Lead Source: display AND editable**, not display-only. Reason: today
  Lead Source can only be set once, at Opportunity creation via
  `QuickLeadModal` — if missed, there was no way to backfill it, which
  silently blocks the Lead→Qualified stage gate (`validators.py`). Confirmed
  via code read that `validate_stage_transition` only runs when a PATCH
  includes `stage_id` (`service.py:182`, `if "stage_id" in updates:`), so
  adding a second write-entry-point for `lead_source_id` (this edit form)
  has zero interaction with that gate's logic when Lead Source is edited
  alone (no stage change in the same request).
- Demo End Date: straightforward, mirrors `demo_start_date` exactly — the
  field already existed on the backend schema, nothing had ever read it.

**Backend:**
- `schemas.py` — `PipelineOpportunity` gained `project: ProjectNested |
  None` and `lead_source: LeadSourceNested | None` (new minimal `{id,
  name}` nested types, same shape as `AccountNested`/`SBUNested`).
- `repository.py`'s `list_pipeline` had `noload(Opportunity.lead_source)`
  explicitly blanking that relationship out on every pipeline fetch —
  removed. (`project` needed no repository change; already rides the ORM's
  default `lazy="joined"`, was never noloaded.)
- New `backend/tests/domains/opportunity/test_opportunity_router.py` — this
  domain had **zero** router-level test coverage before (`list_pipeline`/
  `PipelineOpportunity` had never been tested at any layer). Added 4 tests
  covering the exact risk this change introduces: null-safety when
  project/lead_source are unset, correct serialization when set, and
  `demo_end_date` passthrough.

**Frontend:**
- `sales-os-app/src/types/api.ts` regenerated (same in-process
  TestClient→OpenAPI-dump approach as `bb671bc`); hand-written alias tail
  re-appended unchanged (confirmed via diff: 22 pure additions, 0
  deletions).
- `OpportunityDetailScreen.tsx` — Overview tab grid gained Demo End / Lead
  Source / Associated Project fields (plain `Field` rows, `opp.project?.name`
  read directly, no separate fetch needed for display). Edit modal gained a
  Demo End Date `TextField` (mirrors `demo_start_date`'s 4 wiring points:
  state, populate-on-open, PATCH payload, `applyOppPatch`) and a Lead Source
  `Select` dropdown backed by a new `["leadSources"]` query (mirrors
  `QuickLeadModal.tsx`'s pattern) — sends `null` when cleared, same
  clear-to-blank convention as `CustomerType`/`parent_account_id`. Project
  is **not** in the edit form — display-only per the scope decision above.

`tsc --noEmit`/`npm run lint`/`npm run build`/`pytest` (284 passed = 280 +
4 new) all clean.

**Manually verified by Basheer (2026-07-12):** one issue found — Overview
tab field order — Demo Start/Demo End moved onto the same first row,
Expected Closure moved to the second row (next to PO Number); SBU/Lead
Source/Associated Project unchanged after that. Fixed and folded into the
same commit rather than a separate follow-up, since it landed before the
commit was made. No other issues found.

### Reminder click-through — full write-up (pending commit)

Second item of the Milestone 1 gap-closure list. Closes the design gap
identified while mapping this item (2026-07-11): a Reminder's nested
opportunity is only `OpportunityNested` (`{id, name}`), but
`OpportunityDetailScreen.tsx` never fetched its own data — `DemoApp.tsx`
just handed it whatever full `PipelineOpportunity` object the Pipeline
screen already had loaded. Wiring the click-through naively would have
opened the screen mostly blank.

**Design decision (`AskUserQuestion` before coding): give
`OpportunityDetailScreen.tsx` a real fetch-on-mount**, mirroring
Customer360Screen's parent/child account click-through pattern
(`useQuery` + `initialData` + `initialDataUpdatedAt: 0`) rather than the
cheaper alternative (fattening the reminder's nested opportunity payload to
match `PipelineOpportunity`, which would only have patched this one entry
point). Basheer confirmed this explicitly rather than leaving it to
inference.

**One deliberate deviation from the Customer360 precedent, flagged and
confirmed with Basheer before building:** Customer360Screen's render was
already null-safe throughout (written that way originally for the
Directory-row-seed case), so it could paint instantly from a partial
account and fill in fields as they arrived. `OpportunityDetailScreen.tsx`
accesses `opp.stage`/`opp.status`/`opp.owner`/`opp.account`/`opp.sbu`
unconditionally in ~10 places — retrofitting null-safety through all of
them was judged not worth it, especially since the new endpoint returns
the entire opportunity in one response (no staggered field-by-field
arrival to justify the extra surface area). Used a **loading-spinner gate**
instead: if any of those five required fields aren't loaded yet, render the
screen's existing `LoadingPlaceholder` instead of the full detail body.
Only affects the new Reminder entry point (a few hundred ms); Pipeline
navigation is unaffected since its seed is already a complete object.

**Backend:**
- `opportunity/repository.py` — new `get_for_detail(opportunity_id)`,
  single-row fetch with the exact same eager-load/noload profile as
  `list_pipeline` (feeds the same `PipelineOpportunity` schema).
- `opportunity/service.py` — new `get_opportunity(id)`, raises
  `NotFoundError` if missing (same pattern as `account/service.py`).
- `opportunity/router.py` — new `GET /opportunities/{opportunity_id}` →
  `APIResponse[PipelineOpportunity]`.
- `test_opportunity_router.py` — new `TestGetOpportunity` class: 401
  unauthenticated, 404 not found, 200 full shape, null-safety for
  project/lead_source. 288 passed (284 + 4 new).

**Frontend:**
- `services/opportunities.ts` — new `getOpportunity(id)`.
- `types/api.ts` regenerated (same in-process TestClient→OpenAPI-dump
  approach as prior sessions); hand-written alias tail re-appended
  unchanged (49 additions, 1 deletion — the new path's generated types).
- `OpportunityDetailScreen.tsx` — `opp` changed from `useState(initialOpp)`
  to a `useQuery` (`initialData`/`initialDataUpdatedAt: 0`, same comment
  as Customer360's account query); new `opportunityId`/`initialOpportunity`
  (any-typed seed, same convention as Customer360's `initialAccount?: any`)
  /`onOpportunityUpdate` props replacing the old `opportunity` prop;
  always-mounted prefetch query keys switched from `opp.id` to the
  `opportunityId` prop (always defined, unlike `opp` during the loading
  gap); `applyOppPatch` switched from `setOpp` to
  `queryClient.setQueryData`; `openEditOpp`/`handleUpdateOpp` each gained an
  `if (!opp) return;` guard (closures don't inherit the render-body gate's
  TS narrowing); loading gate added right before the final render.
- `DemoApp.tsx` — `selectedOpportunity` widened to accept
  `PipelineOpportunity | { id; name }`; `handleSelectOpportunity` now takes
  either shape (Pipeline and the new Reminder click-through share it, same
  as `handleSelectAccount` already does); `OpportunityDetailScreen` now
  gets `opportunityId`/`initialOpportunity`/`onOpportunityUpdate` (the last
  one keeps `selectedOpportunity` upgraded to the full object once loaded,
  so the header `+Log` button's `accountId` keeps working regardless of
  entry point); `NextActionsScreen` wired with
  `onSelectAccount`/`onSelectOpportunity`.
- `NextActionsScreen.tsx` — `ReminderRow` gained the same two props;
  account name and (if present) opportunity name are now independently
  clickable, styled identically to Customer360's parent/child links
  (`color: primary.main`, pointer cursor, underline on hover).

`tsc --noEmit`/`npm run lint`/`npm run build` all clean.

**Back-navigation bug found during Basheer's manual verification, fixed in
the same pass:** `handleBack360`/`handleBackToOpportunities` in
`DemoApp.tsx` hardcoded their return view (`"customers"`/`"opportunities"`)
— a fine assumption when the Directory/Pipeline were each screen's only
entry point, but wrong now that Next Actions is a second entry point for
both. Fixed with two new `accountReturnView`/`opportunityReturnView` state
variables, captured at the moment of entry and consumed by the two Back
handlers. `handleSelectAccount`'s capture is guarded with
`if (view !== "customer360")` — Customer360Screen also calls it internally
for parent/child account links, and without the guard, re-navigating
between accounts inside that screen would overwrite the return view with
`"customer360"` itself, turning Back into a no-op (a regression from
today's "Back always returns to the Directory" behavior for that
multi-hop case). `handleSelectOpportunity` needed no such guard —
`OpportunityDetailScreen.tsx` has no internal opportunity-to-opportunity
navigation of its own.

**Manually verified by Basheer:** reminder → account click-through, and
reminder → opportunity click-through (with the brief loading spinner),
both confirmed working; the back-navigation bug above was the only issue
found, confirmed fixed after the patch; regression-checked Directory→
account→Back and Pipeline→opportunity→Back (unchanged), and multi-hop
parent/child navigation inside Customer360 still returns to the Directory
on Back (not stuck on the last-viewed account).

## Files in flight
**Reminder click-through — implemented and verified, commit pending.**
- `backend/app/domains/opportunity/repository.py` — `get_for_detail` added
- `backend/app/domains/opportunity/service.py` — `get_opportunity` added
- `backend/app/domains/opportunity/router.py` — `GET /opportunities/{id}` added
- `backend/tests/domains/opportunity/test_opportunity_router.py` — `TestGetOpportunity` added
- `sales-os-app/src/services/opportunities.ts` — `getOpportunity` added
- `sales-os-app/src/types/api.ts` — regenerated
- `sales-os-app/src/screens/OpportunityDetailScreen.tsx` — fetch-on-mount + loading gate
- `sales-os-app/src/DemoApp.tsx` — wiring + return-view back-nav fix
- `sales-os-app/src/screens/NextActionsScreen.tsx` — clickable reminder rows
