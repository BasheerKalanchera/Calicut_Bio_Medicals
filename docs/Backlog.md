# Backlog

Deferred/parked work and undecided product questions — not scheduled, not
part of the current task. See `.claude/active_progress.md` for what's
actively being worked on right now. Items here move out once picked up
(into the active task) or once formally decided (into the relevant
authoritative doc — ADR, Business-Rules, a standards doc — per CLAUDE.md's
Session Handoff rule).

## Parked initiatives

### MUI migration backlog (§9 of Frontend-Implementation-Standards.md)

**Milestone 1 gap-closure is fully complete** (all 6 items from
`docs/Prototype-Production-Parity-Audit.md` §6 shipped — Parent Customer
display + editing (`87fde5a`, `95e118a`), `CustomerType` (`70cf978`),
Opportunity Detail trio (`b662751`), Reminder click-through (`ac6d008`),
Product Catalog collateral links (`ab67209`), Catalog role gate GM+Admin
(`42fa050`)) — the MUI migration backlog resumes whenever picked back up.

**3 files remain** (`CustomerDirectoryScreen.jsx`, `ProductCatalogScreen.jsx`,
`ProjectDirectoryScreen.jsx`), all still needing the full triple-conversion
(styling + fetch + `.jsx`→`.tsx`) — bigger lift than `ErrorBoundary.jsx` was,
no precedent file has been this file type yet. End with an honest §9 update
per column, not a blanket "done."

**Per-file ritual, mandatory for every remaining migration:**
convert → property-diff (against pre-migration git history, full comparison
table, evidence not summary) → triage (categorize each gap using
Frontend-Implementation-Standards.md §6.8's rules: fix-theme / fix-per-file /
verify-first / do-not-fix) → verify on screen (manual E2E, Basheer's pass) →
guard-green (`npm run lint` clean, `npx tsc --noEmit` clean) → update §9
honestly (per-column, not a blanket "done") and the `check-no-tailwind.js`
GRANDFATHERED list to match, in the same commit → commit. If a file's
data-fetching and styling are genuinely separable risk profiles, split into
two commits rather than bundling.

`npx tsc --noEmit` is a deliberate addition, not a duplicate of `npm run lint`:
`sales-os-app/eslint.config.js` only has a `files: ['**/*.{js,jsx}']` block
(no `.ts`/`.tsx` glob) and there is no `typescript-eslint` package in
`devDependencies`, so `eslint .` silently skips every `.tsx` file. `npm run
build` is plain `vite build`, no `tsc` step either. Net effect: **no
automated step other than `tsc --noEmit` type-checks `.tsx` files.**

Update Frontend-Implementation-Standards.md as new gotchas/patterns surface
during these remaining migrations — §6.6/§6.8 are living documents.

## Deferred / undecided items

- **Make `user_profile.sbu_id` (and audit `zone_id`) properly nullable for
  Admin/General Manager.** Surfaced 2026-07-28 while fixing the `/users`
  endpoint's visibility filter (see `docs/Progress-Archive-2026-07.md`) —
  Admin/GM are an unrestricted overlay tier, not members of any SBU/zone, but
  `sbu_id` is `NOT NULL` today so their rows carry a meaningless placeholder
  value that can coincidentally leak into another tier's scoped view. Fixed
  for now with a contained role-based exclusion in `UserRepository.list_active`;
  the conceptually-correct fix is nullable columns, but that's real multi-file
  work, not a quick follow-up:
  1. Migration: `ALTER TABLE user_profile ALTER COLUMN sbu_id DROP NOT NULL`,
     backfill existing Admin/GM rows to `NULL`.
  2. `UserProfile` model: `sbu_id: Mapped[uuid.UUID | None]`,
     `sbu: Mapped[SBU | None]`.
  3. `set_rls_context()` (`app/db/session.py`): add the same
     `if user.sbu_id is not None:` guard `zone_id` already has. Lower risk
     than it first looked — confirmed `cabio_app_sbu_id()`
     (`0009_cabio_app_rls_helper_functions.py`) already does
     `NULLIF(current_setting(..., true), '')::uuid`, so a never-set or
     reset-to-empty session var already resolves to a clean SQL `NULL`
     rather than erroring; this exact problem was already solved once for
     `zone_id` and applied uniformly to all 4 identity functions.
  4. **Open product decision, not just plumbing:** `opportunity` router
     stamps `sbu_id=current_user.sbu_id` unconditionally on create, and
     `opportunity.sbu_id` is `NOT NULL` — if Admin/GM has no `sbu_id`, either
     they shouldn't create opportunities directly (business-rule gate), or
     the create form needs an explicit SBU picker when the creator has none.
     Needs Basheer's call before implementing.
  5. Audit every other unconditional read of `.sbu_id`/`.sbu` — `UserCreate`/
     `UserUpdate`/`UserListResponse` schemas, User Directory screen
     rendering, target/coverage plan creation.
  6. Data migration runs against the live shared dev DB — same care as any
     other live write.
  7. Touches the same doc surface as Phase 2E's Task 10 pass
     (`Physical-Schema.sql` etc., completed 2026-07-30) — update those docs
     again in the same commit as this migration rather than creating new
     doc debt.
  8. Dedicated manual verification pass logging in as Admin/GM post-change,
     same spirit as Task 8/9's role-by-role checks — confirm nothing breaks
     now that their session carries a genuinely absent `sbu_id` for the
     first time ever.
- **Parent-account cycle guard — recursive-CTE optimization, not needed yet.**
  `AccountService._creates_cycle` (`backend/app/domains/account/service.py`)
  walks the ancestor chain with one DB round-trip per level; full reasoning
  and the CTE alternative are in that function's own docstring, not repeated
  here. Revisit only if a future milestone introduces deeper hierarchies.
- **Parent/Child account navigation — richer `initialData` instant-paint.**
  Surfaced during Milestone 1 "Parent Customer display" planning (2026-07-10,
  see `docs/Prototype-Production-Parity-Audit.md` §6). `Customer360Screen.tsx`'s
  `account.parent_account`/`account.child_accounts` are typed as a minimal
  `AccountRef {id, name}` — clicking a parent or child link still paints
  instantly from that (and reliably kicks off an immediate background
  refetch), but the *initial* paint only has a name, no
  zone/payer_behavior/counts, unlike Directory-list navigation which has
  all of that from its already-fetched row data.
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
- **`OpportunityDetailScreen.tsx` — convert Products/Splits/Stakeholders inline edit
  forms to `FormModal` (desktop UX fix).** Surfaced during E2E verification 2026-07-06.
  On desktop (1920px) the inline edit mode for Products, Splits, and Stakeholders tabs
  renders as form fields floating inside the narrow content column — looks stranded and
  unfinished compared to the modal pattern used elsewhere. Not "free" to fold into an
  already-planned touch of the file — it's its own standalone future change.
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
  bug fix; not adopted then (minimal fix chosen instead).
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
  During the Project Details activity-logging build (`6075c80`, 2026-07-06),
  Project Detail was wired into `DemoApp.tsx`'s existing header `+Log` button
  instead of adding a 4th independent mount — `DemoApp.tsx` now has
  `selectedProject` state + `onSelectProject`/`openLogActivityRef` plumbing,
  proving the "lift state into DemoApp" approach works in practice.
  **Still remaining:** `Customer360Screen.tsx` and `OpportunityDetailScreen.tsx`
  still each have their own separate `LogActivityModal` mount, untouched —
  retrofitting those two onto the same header-button pattern is the rest of
  this item. Same rationale as before (duplication is what let the
  `.then()`-vs-`useQuery` defect go unnoticed). Sequence after the MUI
  migration backlog, or opportunistically if either file is touched again.
- **Extract a shared `BackButton` component.** The circular `IconButton` +
  `ArrowBackIcon` control (Frontend-Implementation-Standards.md §6.6 item 7)
  is inlined in `OpportunityDetailScreen.tsx` and will be needed unchanged in
  `Customer360Screen.tsx`, `ProductCatalogScreen.jsx`,
  `ProjectDirectoryScreen.jsx` when they migrate. Do as its own small refactor,
  or fold into the second of these files to migrate.
- **§6.7 enforcement gap** (Frontend-Implementation-Standards.md). No mechanical
  guard against hardcoded hex colors drifting back into per-component `sx`
  props (theme should be single source of truth). Post-demo, not blocking.
- **§9 enforcement gap** (Frontend-Implementation-Standards.md). §9's checkmarks
  are self-reported and have already drifted silently twice
  (`LogActivityModal.tsx`, `OpportunityDetailScreen.tsx` both mislabeled
  "React Query ✓" while still using manual `.then()`). Candidate guards: grep
  `.then(` in files listed "React Query ✓"; grep `: any`/`any[]` in files
  listed "TypeScript ✓". Post-demo, not blocking.
- **Inline "+ New Stakeholder" shortcut from the Opportunity Stakeholders tab.**
  `OpportunityDetailScreen.tsx`'s "Link Stakeholder" form only lists existing
  account-level `Stakeholder` records — no way to create one without leaving
  the opportunity. Not a data-model gap (Stakeholder is always account-scoped).
  Reuse `Customer360Screen.tsx`'s existing "New Stakeholder" `FormModal` field
  set/service call, then `addOpportunityStakeholder` to link it. Basheer's
  call: hold as deferred.
- **`brand` filtering on `ProductService.list_products` — not implemented.**
  If real brand filtering is ever needed, add it to
  `ProductService.list_products`/`ProductRepository.list_products` and add
  a genuine test for it then — not before.
- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
- **`docs/Physical-Schema.sql` is stale and unreliable — needs a real fix, not
  another hand-edit.** Surfaced 2026-08-02 while bootstrapping the UAT
  database. Verified against every migration's actual DDL: it's missing
  0002 (`stakeholder` contact fields), 0003/0004/0007 (indexes), and
  0013–0015 (`reminder.closing_activity_id`, Product Catalog RLS split,
  `stakeholder.whatsapp_number`) — not a clean "current through migration N"
  cutoff, gaps are scattered through the whole history. It cannot be used as
  an `alembic stamp <rev>` checkpoint for any revision. (The pre-migration-0001
  snapshot, git commit `a09794d`, is still accurate and was used instead to
  bootstrap UAT.) Root cause: hand-maintained in parallel with the real
  source of truth — the Alembic migration chain — with nothing forcing the
  two to stay in sync. Fix has two parts: (1) one-time regen via
  `pg_dump --schema-only` against a fully-migrated database (UAT, once
  built, or Dev) to get back to accurate; (2) a process change so it can't
  silently drift again — e.g. regenerate it as a documented step at the end
  of every migration PR, or automate it in CI — rather than trusting someone
  to hand-edit it alongside each migration. Basheer's call on which process
  fix.
