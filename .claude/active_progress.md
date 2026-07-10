# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-06+ (continued across multiple days)_

## Current task — STOP HERE FIRST
**Priority decision (2026-07-10): Milestone 1 gap-closure work from the
Prototype/Production Parity Audit comes first, ahead of resuming the §9 MUI
migration backlog.** The demo checkpoint moved from July 13 to July 20,
which is what freed up room to do this instead of migration work — not an
abandonment of §9, just a sequencing call. See "Prototype/Production Parity
Audit" write-up below and `docs/Prototype-Production-Parity-Audit.md` §6
("Gaps to finish — Milestone 1") for the actual scope: Associated Project
link, Lead Source display, Demo end date, Reminder click-through, Catalog
role gate (GM+Admin), Parent Customer display, `CustomerType`
(institution-nature), Product Catalog collateral links.

**Prior work status:** working tree was clean as of `6075c80` plus
`581c28d`/`71dc5a0` (ErrorBoundary.jsx MUI migration — see updated §9 count
below). Activity logging on Project Details (+ the +LOG header-consolidation
step + a stale-detail-view bugfix) is committed — confirmed working by
Basheer's live E2E. See "Done in prior sessions" table and the write-ups
below it for full detail.

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
list in `docs/Prototype-Production-Parity-Audit.md` §6 ("Gaps to finish —
Milestone 1"): Associated Project link, Lead Source display, Demo end date,
Reminder click-through, Catalog role gate (GM+Admin), Parent Customer
display, `CustomerType` (institution-nature), Product Catalog collateral
links. No fixed order committed yet — pick starting point next session.

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
- **Pre-existing broken test: `test_product_service.py::TestListProducts::test_delegates_to_repository`.**
  Fails with `TypeError: ProductService.list_products() got an unexpected
  keyword argument 'brand'` — no `brand` parameter exists on that method.
  Confirmed pre-existing and unrelated to any of this session's work
  (reproduced identically on `main` via `git stash` before changes).
  Whoever next touches `ProductService.list_products` should decide whether
  to add real `brand` filtering or delete the stale test expectation.

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

## Files in flight
**Two uncommitted files, both pending commit as of 2026-07-10:**
- `docs/Prototype-Production-Parity-Audit.md` — new file, the parity audit
  (v3, see write-up above). Ready to commit.
- `.claude/active_progress.md` — this file, updated to reflect the
  ErrorBoundary migration, the demo date move, this session's audit work,
  and the Milestone 1 priority decision. Ready to commit.

No code changes in flight — the Milestone 1 gap-closure work itself hasn't
started yet. Next session: pick a starting item from
`docs/Prototype-Production-Parity-Audit.md` §6 and begin the build. The §9
migration backlog (`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx`) stays paused until Milestone 1 is closed out —
see "Next step" above.
