# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-06+ (continued across multiple days)_

## Current task — STOP HERE FIRST
**Reminders "Completed" tab bug fix landed as `39ff781`** (committed since
last update — `include_completed` is now a real True/False filter, see
"Done in prior sessions" table below).

**Activity logging on Project Details is IMPLEMENTED and guard-green
(pytest 267/268 — only pre-existing unrelated failure; ruff clean; `npx tsc
--noEmit` clean; `npm run lint` clean), NOT YET COMMITTED.** 9 files, backend
+ frontend. Full detail in "Files in flight" below. Needs Basheer's live E2E
on the shared dev DB before commit (new `GET /projects/{id}/activities`
endpoint + a new UI path that writes real `Activity`/`Reminder` rows, which
are immutable — verify carefully).

**Design decision made during this work, worth remembering:** rather than
adding a third independent `LogActivityModal` mount inside
`ProjectDirectoryScreen.jsx` (which would have deepened the exact
already-flagged "+LOG/+LEAD duplication" deferred item), Basheer chose to
extend `DemoApp.tsx`'s existing header `+Log` button — already
context-sensitive for Customer360/OpportunityDetail — to also cover Project
Detail. This required lifting `selectedProject` state up into `DemoApp.tsx`
(new `onSelectProject` callback + `openLogActivityRef`, mirroring the
`onDetailModeChange`/`refreshOppsRef` idiom already used in this exact file)
instead of adding local modal state to `ProjectDirectoryScreen.jsx`. This is
a partial step toward the "Consolidate +LOG/+LEAD" deferred item below —
Customer360Screen.tsx and OpportunityDetailScreen.tsx still have their own
separate modal mounts, untouched.

**Next up after this is committed:** reconfirm the July 10/13 freeze/demo
timeline before starting the 4 remaining §9 migration files, then resume the
per-file ritual. See "Next step" and "Notes / decisions" below.

## Done in prior sessions (committed — see git log/commit messages for full detail)

(ledger rows are commits, not files; migrated §9 file count is 11 of 16 as of
`a0ef2e4` — 4 files remain fully untouched: `CustomerDirectoryScreen.jsx`,
`ProductCatalogScreen.jsx`, `ProjectDirectoryScreen.jsx`, `ErrorBoundary.jsx`.)

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
treatment. Fixed as part of the current uncommitted work: added always-
mounted prefetch queries for all four (reusing each tab's existing query
key), matching `staleTime` on both ends so a click shortly after mount reads
cache instead of silently re-fetching. See "Current task" above.

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
1. Reconfirm the July 10/13 freeze/demo timeline with Basheer before starting
   the 4 fully-untouched files (`CustomerDirectoryScreen.jsx`,
   `ProductCatalogScreen.jsx`, `ProjectDirectoryScreen.jsx`,
   `ErrorBoundary.jsx`) — bigger lift than anything done so far (styling +
   fetch + `.jsx`→`.tsx` all at once, no precedent file has been this file
   type yet).
2. Resume the per-file migration ritual (below) for those remaining screens —
   end with an honest §9 update per column, not a blanket "done."

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
  During the Project Details activity-logging build (2026-07-06, see "Files
  in flight"), Project Detail was wired into `DemoApp.tsx`'s existing header
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
  screens, resume after." **Reconfirmed 2026-07-06: still holds.** Basheer's
  call: proceed as fast as possible; scope may need to be cut on the remaining
  4 files if time runs short.
- **Demo-blocking bug found and fixed 2026-07-06:** the July 13 demo will
  change opportunity status from `OpportunityDetailScreen.tsx` (confirmed
  with Basheer), which had zero UI for the BR-OP-02/03/05 status-gated
  fields the backend validator already enforces — any such status change
  would have failed with no way to fix it in the form. Fixed as part of the
  current uncommitted work (see "Current task").
- Confirmed by design, not a bug (2026-07-06): changing a LOST opportunity's
  status back to Active correctly fails ("Cannot change the status of a LOST
  opportunity") — per `Business-Rules.md:114-122`, WON/LOST are terminal;
  a new Opportunity must be created instead, to keep historical WON/LOST
  records immutable for audit.
- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
- Live shared Supabase DB caution applies when touching real data.

## Files in flight
**9 files, implemented and guard-green (pytest 267/268 — pre-existing unrelated
failure only; ruff clean; `tsc --noEmit` clean; `npm run lint` clean),
NOT YET COMMITTED — Activity logging on Project Details:**

Backend — new project-scoped read path (POST already accepted `project_id`;
there was no GET-by-project endpoint at all):
- `backend/app/domains/activity/repository.py` — `ActivityRepository.project_exists`,
  `list_by_project`, `count_by_project`, mirroring the opportunity-scoped methods.
- `backend/app/domains/activity/service.py` — `ActivityService.list_by_project`
  (`NotFoundError` if project missing, same shape as `list_by_opportunity`).
- `backend/app/domains/activity/router.py` — `GET /projects/{project_id}/activities`.
- `backend/tests/domains/activity/test_activity_service.py` — `TestListByProject`,
  mirroring `TestListByAccount` (not-found, items/total, offset calc ×2).

Frontend:
- `sales-os-app/src/services/activities.ts` — `listActivitiesByProject`.
- `sales-os-app/src/components/LogActivityModal.tsx` — new `projectId?: string`
  prop, threaded into the `logActivity` payload (field already existed, unused)
  and into cache invalidation; new `projectName?: string` prop rendering a
  "Project: {name}" chip (mirrors the existing "Linked to this opportunity"
  chip, but shows the actual name — added so it's unambiguous which project
  an activity logged via the header `+Log` button lands on, not just that
  some project is linked). The opportunity chip itself is NOT retrofitted to
  show its name — Basheer's call: do that as part of the full context-sensitive
  `+Log` consolidation (see deferred item), not bundled in here.
- `sales-os-app/src/components/ActivityTimeline.tsx` — new `projectId?: string`
  prop, third branch alongside the existing account/opportunity queryKey/queryFn.
- `sales-os-app/src/screens/ProjectDirectoryScreen.jsx` — `ProjectDetailView` gets
  a new "Activity" card (`<ActivityTimeline projectId={p.id} .../>`, same visual
  pattern as the existing Opportunities card); reports the selected project up
  via a new `onSelectProject` prop instead of keeping it purely local; new
  `openLogActivityRef` prop wired to the Activity card's `+Log` trigger; new
  `resetDetailRef` prop (see stale-state fix below).
  **Deliberately no local modal or `showLogActivity` state added here** — see
  the header-consolidation design decision in "Current task" above.
- `sales-os-app/src/DemoApp.tsx` — new `selectedProject` state (mirrors
  `selectedAccount`/`selectedOpportunity`, widened to also carry `name` for the
  chip above), `onSelectProject` handler passed to `ProjectDirectoryScreen`,
  `openLogActivityRef` (mirrors `refreshOppsRef`), and a third branch in the
  header `LogActivityModal`'s `accountId`/`projectId`/`projectName`
  resolution, gated on `projectDetailMode`.

**Stale-detail-view bug found and fixed in the same pass (2026-07-06,
confirmed by Basheer, pre-existing — not caused by this session's work):**
`ProjectDirectoryScreen.jsx` stays mounted-but-hidden (CSS `display: none`)
rather than unmounting like `Customer360Screen`/`OpportunityDetailScreen` (each
their own conditionally-rendered `view`), so navigating away via the sidebar
and back re-showed the previously-open project's detail view with the
Customers/Projects sub-tab header stacked on top of it — `DemoApp.tsx`'s
`navigate()` reset its own `projectDetailMode`/`selectedProject` copies but had
no channel to reset the child's local state. Fixed with the same
parent-invokes-child-ref idiom already used for `openCreateRef`: new
`projectResetRef` in `DemoApp.tsx`, called from `navigate()`; `ProjectDirectoryScreen.jsx`
assigns a `resetDetailRef` handler that clears `selectedProject`/`editingProject`
and calls `onSelectProject?.(null)`. ~10 lines across the 2 files already
being touched.

**After that commit lands:** resume the per-file migration ritual for the 4 remaining §9 files —
`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx`, `ErrorBoundary.jsx`. Three need the full
triple-conversion (styling + React Query + `.jsx`→`.tsx`); `ErrorBoundary.jsx`
is styling + `.jsx`→`.tsx` only, per §9's own row ("N/A, no fetching") —
confirm this holds once actually touched. Raise the July 10/13 freeze/demo
timeline question again before starting these (see Notes / decisions) —
bigger lift than anything done so far.
