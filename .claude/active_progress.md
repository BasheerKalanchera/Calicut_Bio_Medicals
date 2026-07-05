# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-05 (continued)_

## Current task
MUI migration (ADR-031, MUI-only — non-negotiable, hybrid rejected). Migrating
screens off Tailwind one file at a time — see the ledger in "Done this
session" below for everything landed so far (10 of 16 tracked §9 files fully
migrated; `Customer360Screen.tsx` Commit A/styling done, `fd57a32`).
**Commit B (React Query, ADR-032) for `Customer360Screen.tsx` is next and
hasn't started yet** — full plan below, agreed with Basheer before the
session ended for the day.

### Commit B plan (React Query, ADR-032) — next action, not yet started

Full plan agreed with Basheer before starting (session ended here for the
day — implementation begins fresh next session). This removes the
module-level `tabDataCache`/`accountDataCache` SWR cache entirely and
converts all ~14 manual `.then()` fetch sites to `useQuery`/`useMutation`.

**Query keys — deliberately reusing existing keys from other files so
screens share one cache entry instead of duplicating fetches** (same
principle already used in `OpportunityDetailScreen.tsx`'s Commit B for
stages/statuses/users):

| Data | `queryKey` | Shared with |
|---|---|---|
| Account | `["account", accountId]` | — (screen-local) |
| Account counts | `["account-counts", accountId]` | — |
| Stakeholders (tab) | `["stakeholders", "byAccount", accountId]` | `OpportunityDetailScreen.tsx`'s stakeholder-link picker |
| Projects (tab) | `["projects", "byAccount", accountId]` | `QuickLeadModal.tsx`'s project picker |
| Opportunities (tab) | `["opportunities", "byAccount", accountId]` | — (new) |
| Installed assets (tab) | `["installed-assets", "byAccount", accountId]` | — |
| Zones | `["zones"]`, `staleTime: Infinity` | — (new) |
| Project statuses | `["project-statuses"]`, `staleTime: Infinity` | — (new) |
| Stages / Opp statuses / Lead sources | `["stages"]` / `["statuses"]` / `["leadSources"]`, `staleTime: Infinity` | `OpportunityDetailScreen.tsx`, `OpportunityPipelineScreen.tsx`, `QuickLeadModal.tsx` |
| Users | `["users", "all"]` | all of the above |
| Products | `["products", "picker", sbuId]` | `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx` |
| Opportunity items (Edit Opp modal) | `["opp-items", editingOpp.id]` | `OpportunityDetailScreen.tsx`'s Products tab, same opportunity |

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

## Done this session (committed — see git log/commit messages for full detail)

(ledger rows are commits, not files; migrated §9 file count is 10 of 16)

| File / change | Commit(s) | What |
|---|---|---|
| Docs reconciliation + Tailwind pre-commit guard | `d25bea8`, `dc543fa`, `bb28f23` | CLAUDE.md/Frontend-Standards reconciled to ADR-031; `.githooks/pre-commit` activated |
| `main.tsx` | `8ec95a4` | MUI migration |
| `ActivityTimeline.tsx` | `5eef75a` | MUI migration (redesigned as cards) |
| `NextActionsScreen.tsx` | `219ff99` | MUI migration |
| `LogActivityModal.tsx` | `c1796d6` | MUI migration + `.then()`→`useQuery` fix |
| `OpportunityPipelineScreen.tsx` | `8a3ed70` | MUI migration |
| Fidelity audit fixes (theme + first 7 files) | `a7cbb02` | Theme-level + per-file corrections; wrote up §6.6/§6.7/§6.8 |
| `QuickLeadModal.tsx` | `fe68a91` | MUI migration + React Query |
| `OpportunityDetailScreen.tsx` Commit A | `3619295` | Styling + missing stakeholder-link POST/DELETE endpoints |
| `OpportunityDetailScreen.tsx` Commit B | `01cead0` | React Query + BR-FIN-03 auto-sync + `applyOppPatch` + stakeholder-edit feature |
| `check-no-tailwind.js` shape-matching fix | `11dc051` | Guard matches real Tailwind utility shape, not bare `className=` |
| `sales_os_prototype_demo_ready.jsx` deletion | `6d7b9f7` | Removed orphaned prototype file |
| `DemoApp.tsx` | `d107c5b` | MUI migration |
| `Customer360Screen.tsx` Commit A | `fd57a32` | Styling-only MUI migration |

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
1. **Start `Customer360Screen.tsx` Commit B** (React Query, ADR-032) — see
   the full plan written up under "Current task" above. This is the very
   next action, already agreed with Basheer, nothing to re-decide.
2. Resume the same per-file ritual (below) — end with an honest §9 update
   per column, not a blanket "done."
3. The July 10/13 freeze/demo timeline question (see Notes / decisions)
   still hasn't been explicitly reconfirmed with Basheer since it was first
   flagged — worth raising before starting the 4 fully-untouched files after
   Commit B (`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
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

## Notes / decisions
- MUI-only decided, non-negotiable. §9 is the authoritative migration tracker.
- Enforcement is live: pre-commit hook blocks new Tailwind automatically.
- The 14 eslint-disable suppressions are load-bearing (they keep lint green / the
  commit gate working) — they get DELETED as each file migrates, not before.
- Timing: original plan was "finish whatever is migrated AND re-verified by
  July 10; freeze rest, demo July 13 on clean mix of migrated + untouched
  screens, resume after." **Still not reassessed, and now has a harder data
  point against it:** `OpportunityDetailScreen.tsx` was explicitly chosen as
  the *smallest-lift* remaining file (React Query already done per its old
  §9 row — turned out to be false, but styling-only was still the intended
  scope) and still consumed an entire session once E2E started surfacing
  real, pre-existing bugs (stakeholder linking fully broken, BR-FIN-03 never
  implemented, a stale-cache bug, a missing edit feature). The files pending
  at the time (6) were *not* styling-only, and that still holds for most of
  what's left (5 pending now; 4 after Commit B lands) — most need styling +
  React Query conversion + `.jsx`→`.tsx` all at once. **First thing the next
  session should do is
  get an explicit answer from Basheer on whether July 10/13 still holds**,
  not just start converting the next file on the list.
- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
- Live shared Supabase DB caution applies when touching real data.

## Files in flight
None — working tree clean as of session end. `DemoApp.tsx` (`d107c5b`) and
`Customer360Screen.tsx` Commit A (`fd57a32`) both E2E-verified and committed
this session.

**First action of next session: start `Customer360Screen.tsx` Commit B**
(React Query, ADR-032) — full plan already written up above (query-key
table, `initialData` usage, the edit-buffer seeding-safety design). Nothing
else queued ahead of it; do not start a different §9 file first.

After Commit B lands (guard-green, property-diffed, Basheer's E2E,
committed): 4 pending §9 files remain — `CustomerDirectoryScreen.jsx`,
`ProductCatalogScreen.jsx`, `ProjectDirectoryScreen.jsx`, and
`ErrorBoundary.jsx`. Three need the full triple-conversion — styling +
React Query + `.jsx`→`.tsx` (verify per-file); `ErrorBoundary.jsx` is
styling + `.jsx`→`.tsx` only, per §9's own row (React Query: "N/A, no
fetching") — confirm this holds once actually touched, but don't assume
it needs a fetch-layer commit like the other three.
