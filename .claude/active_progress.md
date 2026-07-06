# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-06+ (continued across multiple days)_

## Current task — STOP HERE FIRST
**Backend-wide concurrency fix for the Activity tab slowness (and every
other screen): convert all 48 `async def` signatures that block on sync I/O
to plain `def`.** `Customer360Screen.tsx` Commit B (React Query, ADR-032)
landed this session as its own commit (see ledger below — hash to be
recorded in the next trim pass, per this file's established convention).
Its two tracking-doc updates were deliberately **held back, not
committed** — see "Held back" immediately below.

### Held back (working tree only, not committed)
- `docs/Frontend-Implementation-Standards.md` — adds `Customer360Screen.tsx`
  to §9's fully-migrated table.
- `sales-os-app/scripts/check-no-tailwind.js` — removes
  `Customer360Screen.tsx` from `GRANDFATHERED`.

Reason: the Activity tab bug below was found during this same file's own
E2E verification pass and is still unresolved — marking the file "fully
migrated" while a bug from its own verification pass remains open would
violate §9's own "checkmarks must be earned" standard. Both diffs are
single-purpose and harmless to leave sitting in the working tree (staying on
`GRANDFATHERED` just means the Tailwind guard keeps skipping this file,
which is permissive, not broken). **Commit these two together, in their own
small commit, once the Activity tab issue is actually resolved and
reverified — not bundled into any other commit before that.**

### Activity tab performance — investigation history and next step
Symptom: clicking the Activity tab on `Customer360Screen.tsx` loads visibly
slower than the other four tabs. Two rounds of fixes already landed (in the
Commit B commit above) — **neither resolved it, confirmed by Basheer's
retest 2026-07-06:**

1. **Round 1 (backend, endpoint-level):** removed the account-scoped
   activities endpoint's redundant COUNT round-trip (sourced from a new
   `activity_count` on the account instead) and unneeded `account`/
   `project`/`opportunity` joins (only `user` is actually read by
   `ActivityResponse`). Made the endpoint itself faster in isolation
   (pytest/trace-confirmed, ~600ms vs Opportunities' ~3s) but did **not**
   fix the perceived slowness.
2. **Round 2 (frontend, duplicate query observer):** `ActivityTimeline.tsx`
   had a second, independently-fetching `useQuery` observer for a cache key
   already owned by `Customer360Screen.tsx`'s always-mounted prefetch query.
   Added a `selfFetch?: boolean` prop (default `true`, `false` from
   Customer360Screen.tsx) so only one observer ever fetches, matching the
   pattern used by the other four tabs. Also **not confirmed to resolve the
   symptom** — Basheer retested 2026-07-06: "still slow."

**Root cause now suspected: a backend-wide concurrency bug, not anything
specific to Activity.** Verified by reading the code, not guessed:
`backend/app/db/session.py` uses plain sync SQLAlchemy (`create_engine`/
`sessionmaker`, no `asyncpg`), yet **every one of the 47 route handlers**
across all 6 domain routers is declared `async def`, and there is **zero**
`await` anywhere in `backend/app/domains/`. An `async def` handler that
calls blocking sync I/O runs directly on Uvicorn's single event-loop thread,
so concurrent requests serialize instead of overlapping. Customer360Screen
fires ~12 requests on mount; whichever lands last in that queue looks slow
regardless of its own query cost — explaining why rounds 1 and 2 couldn't
fix it alone. `app/api/dependencies.py::get_current_user` (line 10, a
dependency on every authenticated endpoint) has the identical bug — a
blocking `db.get(...)` call inside an `async def` — and would need to
convert too, or the auth check alone keeps serializing every request
regardless of the route handler. Capacity checked: `DB_POOL_SIZE=10` +
`DB_MAX_OVERFLOW=20` = 30 sync connections vs. FastAPI's default 40-thread
threadpool — safe headroom for this screen's ~12 concurrent requests.

**Agreed plan (Basheer's call, 2026-07-06 — go straight to the full fix
rather than a scoped test first):** convert all 48 `async def` signatures
that block on sync I/O to plain `def`, in one pass:
1. `app/api/dependencies.py::get_current_user` (line 10) — shared by every
   authenticated endpoint; has a blocking `db.get(...)` call.
2. All 47 route handlers across the 6 domain routers — `account/router.py`,
   `activity/router.py`, `opportunity/router.py`, `project/router.py`,
   `product/router.py`, `asset/router.py`. Confirmed safe to convert: no
   streaming responses, websockets, or background tasks anywhere in any of
   them that would need real `async`; `main.py`/`middleware/
   correlation_id.py`'s legitimate `await` usage (lifespan/ASGI protocol) is
   untouched.

**Next action: make all 48 edits, run the full pytest suite + guard-green
(tsc/lint), then get Basheer's retest/trace result** confirming the
Activity tab (and ideally other screens' initial-load time) now loads in
parallel rather than queuing. Once confirmed: commit this as its own
dedicated commit (separate from the frontend bucket and from the
"held back" tracking-doc commit above, which still waits on this
resolving before it lands).

### Commit B — query-key design (implemented; kept here as reference)

This removed the module-level `tabDataCache`/`accountDataCache` SWR cache
entirely and converted all ~14 manual `.then()` fetch sites to
`useQuery`/`useMutation`.

**Query keys — deliberately reusing existing keys from other files so
screens share one cache entry instead of duplicating fetches** (same
principle already used in `OpportunityDetailScreen.tsx`'s Commit B for
stages/statuses/users):

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
| Users                                | `["users", "all"]`                                                       | all of the above                                                                     |
| Products                             | `["products", "picker", sbuId]`                                          | `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx`                                  |
| Opportunity items (Edit Opp modal)   | `["opp-items", editingOpp.id]`                                           | `OpportunityDetailScreen.tsx`'s Products tab, same opportunity                       |

**`initialAccount` → `useQuery`'s `initialData`.** This is the first screen
to actually implement the pattern §3.3 has held a placeholder for since it
was written ("no screen does this yet"). Replaces the hand-rolled
`getCachedAccount`/`setCachedAccount` + separate `loading` boolean with the
account query's own `isLoading`, seeded via `initialData: initialAccount`.
**Update §3.3 with the real implementation once this lands**, per that
section's own instruction to replace the placeholder paragraph with a
verified example.

**The one real subtlety identified and designed for (not yet coded):** the
Edit Opportunity modal's item list (`editOItems`) is an editable draft
buffer, not a direct render of query data — same shape as
`OpportunityDetailScreen.tsx`'s `ProductsTab`. But that file's items query
is *unconditional* (always fetched), so it can seed the draft synchronously
inside its `openEdit()` handler. Here, `listOpportunityItems` is only
fetched on-demand (`enabled: editingOpp !== null`), so data isn't available
the instant the modal opens — it arrives asynchronously. Plan: seed the
draft in a `useEffect` guarded by a ref (seed once per `editingOpp.id`,
reset the guard on close), **not** a plain `[items]`-keyed effect —
otherwise a background refetch (React Query's default
`refetchOnWindowFocus`, active app-wide per `main.tsx`'s `QueryClient`
config) while the modal is open would silently clobber any unsaved edits
the user made. Same guard pattern needed nowhere else in this file since
every other on-demand master-data lookup (zones/stages/statuses/etc.) is
read-only, not an editable draft.

**Everything else stays the same shape:** all validation logic and payload
construction in the mutation handlers (`handleCreateOpp`, `handleUpdateOpp`,
etc.) are untouched — only the trailing manual `.then(() => setX(d))`
re-fetch after each mutation becomes `queryClient.invalidateQueries(...)`.

## Done in prior sessions (committed — see git log/commit messages for full detail)

(ledger rows are commits, not files; migrated §9 file count is 10 of 16 as of
the last commit, `32e3274`. This session's `Customer360Screen.tsx` Commit B +
everything else is real, guard-green work but NOT in this ledger because it
is not yet committed — see "Files in flight" for that. Once it lands, this
count becomes 11/16 and Customer360Screen.tsx's row moves into §9's "Fully
migrated" list, which the working tree already reflects.)

| File / change                                   | Commit(s)                       | What                                                                                 |
| ----------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| Docs reconciliation + Tailwind pre-commit guard | `d25bea8`, `dc543fa`, `bb28f23` | CLAUDE.md/Frontend-Standards reconciled to ADR-031; `.githooks/pre-commit` activated |
| `main.tsx`                                      | `8ec95a4`                       | MUI migration                                                                        |
| `ActivityTimeline.tsx`                          | `5eef75a`                       | MUI migration (redesigned as cards)                                                  |
| `NextActionsScreen.tsx`                         | `219ff99`                       | MUI migration                                                                        |
| `LogActivityModal.tsx`                          | `c1796d6`                       | MUI migration + `.then()`→`useQuery` fix                                             |
| `OpportunityPipelineScreen.tsx`                 | `8a3ed70`                       | MUI migration                                                                        |
| Fidelity audit fixes (theme + first 7 files)    | `a7cbb02`                       | Theme-level + per-file corrections; wrote up §6.6/§6.7/§6.8                          |
| `QuickLeadModal.tsx`                            | `fe68a91`                       | MUI migration + React Query                                                          |
| `OpportunityDetailScreen.tsx` Commit A          | `3619295`                       | Styling + missing stakeholder-link POST/DELETE endpoints                             |
| `OpportunityDetailScreen.tsx` Commit B          | `01cead0`                       | React Query + BR-FIN-03 auto-sync + `applyOppPatch` + stakeholder-edit feature       |
| `check-no-tailwind.js` shape-matching fix       | `11dc051`                       | Guard matches real Tailwind utility shape, not bare `className=`                     |
| `sales_os_prototype_demo_ready.jsx` deletion    | `6d7b9f7`                       | Removed orphaned prototype file                                                      |
| `DemoApp.tsx`                                   | `d107c5b`                       | MUI migration                                                                        |
| `Customer360Screen.tsx` Commit A                | `fd57a32`                       | Styling-only MUI migration                                                           |

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

## Next step
1. **Run the full 48-signature async→def conversion** — see the full plan
   under "Current task" above. This is the very next action, already agreed
   with Basheer, nothing to re-decide.
2. Once confirmed via retest, land it as its own commit, then land the
   held-back tracking-doc commit (§9 graduation + Tailwind-guard grandfather
   removal for `Customer360Screen.tsx`).
3. Resume the per-file migration ritual (below) for the remaining screens —
   end with an honest §9 update per column, not a blanket "done."
4. The July 10/13 freeze/demo timeline question (see Notes / decisions)
   still hasn't been explicitly reconfirmed with Basheer since it was first
   flagged — worth raising before starting the 4 fully-untouched files
   (`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
   `ProjectDirectoryScreen.jsx`, `ErrorBoundary.jsx`), since those are a
   bigger lift than anything done so far (styling + fetch + `.jsx`→`.tsx`
   all at once, no precedent file has been this file type yet).

**Per-file ritual, mandatory for every remaining migration:**
convert → property-diff (against pre-migration git history, full comparison
table, evidence not summary) → triage (categorize each gap using §6.8's rules:
fix-theme / fix-per-file / verify-first / do-not-fix) → verify on screen
(manual E2E, Basheer's pass) → guard-green (`npm run lint` clean, `npx tsc
--noEmit` clean) → update §9 honestly (per-column, not a blanket "done") and
the `check-no-tailwind.js` GRANDFATHERED list to match, in the same commit →
commit. If a file's data-fetching and styling are genuinely separable risk
profiles (as here), split into two commits rather than bundling.

`npx tsc --noEmit` is a deliberate addition, not a duplicate of `npm run lint`:
checked `sales-os-app/eslint.config.js` — it only has a `files:
['**/*.{js,jsx}']` block (no `.ts`/`.tsx` glob) and there is no
`typescript-eslint`/`@typescript-eslint/parser` package in `devDependencies`
at all, so `eslint .` silently skips every `.tsx` file in the repo. The
Tailwind guard (`check-no-tailwind.js`) does read `.tsx` contents but only via
regex for `className`/Tailwind utility patterns — no type awareness. `npm run
build` is plain `vite build`, no `tsc` step either. Net effect: **no
automated step has ever type-checked a `.tsx` file in this project** —
confirmed by running `npm run lint` clean on a file with real, uncaught type
surface (7 new local interfaces + several `useQuery` hooks). `tsc --noEmit`
fills that gap; it does not overlap with what lint checks.

Update Frontend-Implementation-Standards.md as new gotchas/patterns surface
during these remaining migrations — §6.6/§6.8 are living documents, not fixed
at today's content.

## Deferred
- **NPS field range enforcement + product dropdown label consistency (two-fix commit).**
  Surfaced during `Customer360Screen.tsx` Commit B E2E verification (2026-07-06).
  (1) NPS Score on Stakeholders has no range constraint today — free-number input.
  Standard NPS survey input is 0–10 per respondent (9–10 = Promoter, 7–8 = Passive,
  0–6 = Detractor); the -100 to +100 range is an aggregate metric, not a per-person
  score. Fix: backend `schemas.py` → add `ge=0, le=10` to `nps_score` field;
  frontend `Customer360Screen.tsx` → relabel both Stakeholder modals' NPS field to
  "NPS Rating (0–10)" and add `slotProps={{ htmlInput: { min: 0, max: 10 } }}`.
  (2) Opportunity item-picker renders `{p.name}` only; Installed Base dropdowns
  render `{p.name} — {p.model_number}`. One-line fix in `Customer360Screen.tsx`
  line ~928. Both fixes go in one commit; lint + tsc + pytest must stay green.
  Claude Code prompt already drafted — see conversation 2026-07-06.
  **Note:** backend `nps_score` is already constrained `ge=-100, le=100` — the deferred
  item above should be updated to reflect this; the frontend-only 0–10 clamp idea needs
  revisiting before that prompt is executed.
- **Add `whatsapp_number` field to Stakeholder (backend migration + frontend).** Requested
  2026-07-06. Currently not in the DB schema or Pydantic schemas at all — needs a 3-layer
  change: (1) Alembic migration adding `whatsapp_number VARCHAR(50) NULLABLE` column to
  `stakeholder` table (follow pattern of `0002_add_stakeholder_contact_details.py`);
  (2) `stakeholder_schemas.py` → add `whatsapp_number: str | None = Field(None, max_length=50)`
  to `StakeholderCreate`, `StakeholderUpdate`, and `StakeholderResponse`; (3) frontend
  `Customer360Screen.tsx` → add "WhatsApp Number" `TextField` to both New Stakeholder and
  Edit Stakeholder modals (alongside the existing Phone field). Also add to
  `OpportunityDetailScreen.tsx`'s stakeholder-edit modal if that modal shows contact
  fields. Run `python -m pytest` after migration to confirm 264/265 still holds.
- **`OpportunityDetailScreen.tsx` — convert Products/Splits/Stakeholders inline edit
  forms to `FormModal` (desktop UX fix).** Surfaced during E2E verification 2026-07-06.
  On desktop (1920px) the inline edit mode for Products, Splits, and Stakeholders tabs
  renders as form fields floating inside the narrow content column — looks stranded and
  unfinished compared to the modal pattern used by Log Activity / Overview Edit / all
  of `Customer360Screen.tsx`. On mobile the inline form fills the column naturally and
  looks acceptable. Fix: wrap the Products edit state, Splits edit state, and Stakeholders
  link form in `<FormModal>` (already imported in the file) instead of replacing the
  tab content inline. Logic inside stays unchanged — only the shell changes. Sequence
  this inside the `OpportunityDetailScreen.tsx` migration pass (its own commit), not
  as a standalone change — the file is already being touched for the Hold/Loss/PO/badge
  port, so avoid a second touch on the same file.
- **Input text size/weight on migrated `TextField`s.** Every pre-migration
  Tailwind file used a shared `inp` constant with `text-sm font-medium`
  (14px/500) on every text input. No migrated file's `TextField`s carry an
  explicit override for this — they render at MUI's default input
  typography (~1rem/400) instead. Confirmed present in at least
  `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx`, and
  `Customer360Screen.tsx` (surfaced during the latter's property-diff audit,
  2026-07-05) — a cross-file gap, not specific to any one screen. Basheer's
  call: fix once, holistically, rather than patching per-file as each is
  touched (would create yet more cross-file inconsistency in the interim).
  Root-cause fix belongs in the theme (`src/theme/index.ts`'s
  `MuiOutlinedInput`/`MuiInputBase` override, e.g. `fontSize: "0.875rem"`,
  matching how the `#f9fafb` input fill was already centralized there per
  §6.7) rather than per-`TextField` `sx`. Grep `size="small"` across
  migrated files to get the full affected-field list before starting.
- `statusColors.ts` — create as one pass after Tailwind migration; consolidates
  ~11 files; resolve emerald-50-vs-100 (and any other weight inconsistencies) at
  that time from complete view.
- **Type the shared frontend service functions properly.** `listUsers`
  (services/masterData.ts) and `listAccounts` (services/accounts.ts) — and
  likely their siblings — return `Promise<unknown>` instead of a typed shape,
  forcing callers to use `any[]` or local inline types. Root-cause fix: give
  these functions proper return types (e.g. `{ id: string; display_name: string }[]`).
  Cascades — these services are consumed by Customer360Screen.tsx,
  CustomerDirectoryScreen.jsx, QuickLeadModal.tsx, and LogActivityModal.tsx
  (grep `listUsers`/`listAccounts` before starting to get the full caller list).
  When done, remove the local stopgap types added during migration (currently
  in LogActivityModal.tsx, marked with a "fix at service layer" comment; check
  other migrated files for the same). Deferred because it's a shared-service-layer
  change, not part of any single file's migration. Post-migration, medium priority.
- ~~Delete `sales_os_prototype_demo_ready.jsx`~~ **Done, committed**
  (`6d7b9f7`, 2026-07-05, ahead of schedule). Basheer reviewed the file
  himself first (asked what it actually did) before agreeing to delete —
  the very first commit's minimal Kanban sketch, 2026-04-14, 290 lines,
  superseded early by `App.jsx` and never touched again; confirmed `App.jsx`
  never imported it, zero references anywhere in the repo. Note: this
  replaced an earlier commit `4f41e0e` whose message wrongly also claimed
  the `check-no-tailwind.js` fix (since committed separately as `11dc051` —
  see ledger) — corrected via amend + `push --force-with-lease` (Basheer
  approved the force-push explicitly after being told it rewrites
  already-pushed history on `main`).
- **Reminders "Completed" tab shows pending items too — backend bug, not a
  migration regression.** `NextActionsScreen.tsx` calls `listReminders(includeCompleted)`
  unchanged from its pre-migration behavior; the bug is in
  `backend/app/domains/activity/repository.py` (`list_for_user` /
  `count_for_user`, lines ~74-104). `include_completed` is additive, not a
  filter: `include_completed=False` correctly filters to `is_completed==False`
  (Pending tab works), but `include_completed=True` applies no filter at all
  and returns pending + completed together — there's no way today to request
  "only completed." Same bug affects any completed-count. Needs a product/
  architecture decision on the fix shape before touching it (discussed three
  options: change `include_completed`'s semantics to mean "only completed";
  replace it with an explicit `status: pending|completed|all` filter; or
  filter client-side off an always-`include_completed=true` fetch, which
  changes pagination behavior). Live shared Supabase dev DB — verify carefully
  once a direction is picked. Not blocking the frontend migration; unrelated
  to it.
- **Add Activity logging to Project Details screen.** Not on
  `ProjectDirectoryScreen`'s list view, not on `CustomerDirectoryScreen` either
  — only the Project Details (360-equivalent) view, mirroring the exact
  pattern already used on `Customer360Screen.tsx` (`ActivityTimeline` at line
  796 + scoped `LogActivityModal` at line 993, `showLogActivity` state at line
  319) and `OpportunityDetailScreen.tsx` (line 759 / 796 / 596 respectively).
  Backend already supports this — `project_id` is already a first-class
  optional field on `ActivityCreate`/the activity response schema
  (`backend/app/domains/activity/schemas.py:43,70`) and on the frontend's
  `LogActivityPayload` (`services/activities.ts:7`) — nothing currently uses
  it. Three things needed: (1) a `projectId` prop + project-picker/scoping in
  `LogActivityModal.tsx`, alongside its existing `accountId`/`opportunityId`
  handling; (2) a `listActivitiesByProject` service function (only
  `listActivitiesByAccount`/`listActivitiesByOpportunity` exist today); (3)
  an `ActivityTimeline` + "Log Activity" trigger + locally-scoped
  `LogActivityModal` instance added inside `ProjectDirectoryScreen.jsx`'s
  detail mode (`onDetailModeChange`), matching the two existing screens.
  Note: `ProjectDirectoryScreen.jsx` is one of the 5 pending §9 migration
  files (still Tailwind/`.jsx`) — decide at build time whether to add this
  before or after its MUI migration, to avoid touching the same file twice
  under two different standards.
- **Consolidate +LOG / +LEAD into context-sensitive global buttons (defer,
  separate from the item above — do not bundle).** Today there are 3
  independent `LogActivityModal` mounts (global unscoped fallback in
  `DemoApp.tsx:315`; account-scoped in `Customer360Screen.tsx:993`;
  opportunity+account-scoped in `OpportunityDetailScreen.tsx:796`) plus
  `QuickLeadModal` mounted only globally (`DemoApp.tsx:309`). Basheer's
  proposal: make the header's `+ Log`/`+ Lead` buttons context-sensitive so a
  single global instance of each modal auto-populates Account/Project/
  Opportunity from whatever detail screen is currently in view, instead of
  replicating the button + modal instance on every detail screen (Project
  Details, per the item above, would otherwise become a 4th copy).
  **Why worth doing eventually:** this exact duplication pattern is what let
  a real defect (manual `.then()` vs `useQuery`) go unnoticed on
  `LogActivityModal.tsx` until this migration's fidelity audit caught it —
  fewer independent copies of the same modal means fewer places for behavior
  to drift.
  **Why not now:** it's a cross-cutting architecture change, not a
  feature add — requires lifting the modal instances out of
  `Customer360Screen.tsx`/`OpportunityDetailScreen.tsx` up into `DemoApp.tsx`,
  giving `DemoApp` a unified "selected entity" context across all detail
  screens (it currently tracks `selectedAccount`/`selectedOpportunity` but
  has no equivalent `selectedProject` state), and rerouting each screen's
  "Log Activity" trigger (currently `ActivityTimeline`'s `onLogActivity`
  callback toggling local state) to bubble up via a ref/callback instead.
  Touches at least `DemoApp.tsx`, `Customer360Screen.tsx`,
  `OpportunityDetailScreen.tsx`, `QuickLeadModal.tsx`, `LogActivityModal.tsx`
  — possibly ADR-worthy since it changes a pattern repeated in 3 places.
  Larger and riskier than the item above; sequence after it, and after the
  MUI migration backlog (or at least after the specific files it touches have
  migrated, to avoid mixing Tailwind and MUI changes in the same commit).
- **Extract a shared `BackButton` component.** The circular `IconButton` +
  `ArrowBackIcon` back control (Frontend-Implementation-Standards §6.6 item 7)
  is now inlined in `OpportunityDetailScreen.tsx` and will be needed unchanged
  in `Customer360Screen.tsx`, `ProductCatalogScreen.jsx`, and
  `ProjectDirectoryScreen.jsx` when they migrate — four screens sharing one
  control is an app-wide convention (§6.7 logic), not a per-file style choice.
  Banked rather than built now because extraction was more than trivial to
  fold into Commit A without expanding its scope. Do it either as its own
  small refactor, or folded into the second of these four screens to migrate
  (so there's a second real caller to design the props against, not just one).
- **§6.7 enforcement gap.** §6.7 mandates the theme (e.g. `#f9fafb` input
  fill) as the single source of truth for visual defaults, but nothing
  mechanically checks for hardcoded hex drifting back into per-component `sx`
  props. A pre-commit guard grepping screen/component files for hardcoded
  background hex (same shape as `check-no-tailwind.js`) would catch this
  mechanically instead of relying on the next fidelity audit to notice.
  Post-demo, not blocking.
- **§9 enforcement gap.** §9's Styling/React Query/TypeScript checkmarks are
  self-reported and have already drifted silently twice this migration
  (`LogActivityModal.tsx`, now `OpportunityDetailScreen.tsx` — both mislabeled
  "React Query ✓" while still using manual `.then()`). No mechanical surface
  keeps these honest today. Candidate guards: grep for `.then(` in any file
  listed "React Query ✓"; grep for `: any`/`any[]` in any file listed
  "TypeScript ✓". Post-demo, not blocking — but a second occurrence of the
  same drift is a signal this shouldn't wait too long.
- **Inline "+ New Stakeholder" shortcut from the Opportunity Stakeholders tab.**
  Today `OpportunityDetailScreen.tsx`'s "Link Stakeholder" form only lists
  existing account-level `Stakeholder` records (via `listStakeholders(accountId)`)
  — there's no way to create a brand-new one without leaving the opportunity,
  going to `Customer360Screen.tsx` to create it there, then coming back to link
  it. Real friction for early-stage deals on thin/new accounts, where you meet a
  stakeholder mid-sales-cycle before the account has a full roster.
  **Not a data-model gap** — a `Stakeholder` is always account-scoped
  (`account_id` FK on the table), so however it gets created, it's immediately
  available for every other opportunity on that account too; no "propagate
  opportunity-level stakeholder up to account-level" mechanism is needed, one
  doesn't exist to build. Purely a UX shortcut: add an inline create option to
  the "Link Stakeholder" form, reusing the existing account-level
  `create_stakeholder` service/endpoint (`stakeholder_service.py`,
  `POST /accounts/{account_id}/stakeholders` in `stakeholder_router.py`) rather
  than building new backend capability.
  **Don't build a second create form — one already exists and should be reused
  as-is.** `Customer360Screen.tsx`'s "New Stakeholder" `FormModal`
  (`showCreateStakeholder`/`openCreateStakeholder`/`handleCreateStakeholder`,
  lines 329/551/556, rendered at line 821) already has the exact field set
  needed: Name*, Designation, Email, Phone, NPS Score, Sentiment, submitting
  via `createStakeholder(accountId, payload)`. When this gets built, the
  opportunity-side flow is: create the `Stakeholder` via that same field set
  and service call, then immediately `addOpportunityStakeholder` (or the
  update endpoint) to link it with the opportunity-specific Influence
  Level/Decision Role/Notes — two calls, not a new schema or a redesigned
  form. Basheer's call: hold as deferred, not scoped for this session's work.
- **Pre-existing broken test: `test_product_service.py::TestListProducts::test_delegates_to_repository`.**
  Fails with `TypeError: ProductService.list_products() got an unexpected
  keyword argument 'brand'` — `ProductService.list_products()`
  (`backend/app/domains/product/service.py:19-34`) only accepts `offset`,
  `limit`, `search`, `sbu_id`, `include_count`; there is no `brand` parameter
  or filtering logic anywhere in that method. The test was written against a
  `brand` filter that was either removed or never implemented, and never
  updated. Confirmed pre-existing and unrelated to the opportunity/account
  status-gate work (2026-07-08): reproduced identically on `main` via `git
  stash` before any of that session's changes. Unrelated domain (product, not
  opportunity/account) — not fixed as part of that work. Whoever next touches
  `ProductService.list_products` should decide whether to add real `brand`
  filtering or delete the stale test expectation.

## Notes / decisions
- MUI-only decided, non-negotiable. §9 is the authoritative migration tracker.
- Enforcement is live: pre-commit hook blocks new Tailwind automatically.
- The 14 eslint-disable suppressions are load-bearing (they keep lint green / the
  commit gate working) — they get DELETED as each file migrates, not before.
- Timing: original plan was "finish whatever is migrated AND re-verified by
  July 10; freeze rest, demo July 13 on clean mix of migrated + untouched
  screens, resume after." **Reconfirmed 2026-07-06: still holds.** Raised
  explicitly at the start of this session per the prior handoff's own
  instruction, given `OpportunityDetailScreen.tsx` (chosen as smallest-lift
  remaining file) still consumed a full session on real pre-existing bugs.
  Basheer's call: proceed as fast as possible; scope may need to be cut on
  the remaining 4 files if time runs short. Not to be re-litigated again
  unless circumstances change materially.
- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
- Live shared Supabase DB caution applies when touching real data.

## Files in flight
**`Customer360Screen.tsx` Commit B bucket committed this session (hash to be
recorded in the next trim pass). Only 2 files remain uncommitted, deliberately
held back:**

- `docs/Frontend-Implementation-Standards.md` — §9 graduation for
  Customer360Screen.tsx
- `sales-os-app/scripts/check-no-tailwind.js` — GRANDFATHERED list removal
  for Customer360Screen.tsx

Both held back pending resolution of the Activity tab performance issue —
see "Current task" at the top. Commit them together, in their own small
commit, once that's resolved and reverified. Do not bundle them into any
other commit in the meantime.

**First action of next session: run the full 48-signature async→def
conversion** (see "Current task" at the top), guard-green, get Basheer's
retest result, then commit it as its own dedicated commit.

**After that lands**, per Basheer's explicit sequencing (separate commits,
not bundled):
1. `types/api.ts` — add the 4 new opportunity fields to the hand-written
   `PipelineOpportunity` interface (~line 2336) — needed before step 2,
   since `OpportunityDetailScreen.tsx`/`OpportunityPipelineScreen.tsx` are
   typed against it (unlike Customer360Screen.tsx, which is untyped `any`).
2. **`OpportunityDetailScreen.tsx` port** — currently has *zero* handling for
   any of the three BR-OP status gates (bigger gap than Customer360Screen.tsx
   had). Port the same PO Number/Hold Reason+Reactivation Date/Loss Reason+
   Competitor Name fields, validation, and payload wiring; include the new
   fields in `applyOppPatch`; add the "Reactivation Overdue" badge next to
   its status badge. Also fold in the already-deferred "convert Products/
   Splits/Stakeholders inline edit forms to FormModal" item (see Deferred)
   since it's the same file — avoid touching it twice under two different
   changes.
3. **`OpportunityPipelineScreen.tsx` badge** — add the same "Reactivation
   Overdue" badge to the Kanban `DealCard` and List `ListRow`, using the
   already-built shared helper (`utils/opportunityStatus.ts`'s
   `isReactivationOverdue`) — no new logic needed, just wire it in.

After all of the above: 4 pending §9 files remain —
`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx`, and `ErrorBoundary.jsx`. Three need the full
triple-conversion — styling + React Query + `.jsx`→`.tsx` (verify per-file);
`ErrorBoundary.jsx` is styling + `.jsx`→`.tsx` only, per §9's own row (React
Query: "N/A, no fetching") — confirm this holds once actually touched, but
don't assume it needs a fetch-layer commit like the other three.
