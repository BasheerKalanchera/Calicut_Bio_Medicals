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
  4. ~~**Open product decision, not just plumbing:** `opportunity` router
     stamps `sbu_id=current_user.sbu_id` unconditionally on create, and
     `opportunity.sbu_id` is `NOT NULL` — if Admin/GM has no `sbu_id`, either
     they shouldn't create opportunities directly (business-rule gate), or
     the create form needs an explicit SBU picker when the creator has none.
     Needs Basheer's call before implementing.~~ — **RESOLVED 2026-08-04** as
     BR-OP-12 (`docs/Business-Rules.md`): Admin/GM now get an explicit,
     required SBU picker on both create forms and are never defaulted to
     their own `sbu_id`. This code path is already forward-compatible with
     `sbu_id` going nullable — no further change needed here when/if this
     migration is picked up.
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
- ~~**`docs/Physical-Schema.sql` is stale and unreliable**~~ — **RESOLVED
  2026-08-03.** Regenerated via `pg_dump --schema-only` (Docker, `postgres:17`
  image matched to the live server's actual version — see finding below)
  against the UAT database; confirmed all previously-missing objects are now
  present. Process fix landed too: `Backend-Implementation-Standards.md`'s
  migration workflow now has an explicit "Regenerate Physical-Schema.sql"
  step, so this can't silently drift again. Full history in
  `docs/Progress-Archive-2026-08.md`'s 2026-08-03 entry.
  **Side finding:** both Dev and UAT are actually running **Postgres 17.6**,
  not 16 as `CLAUDE.md` stated (corrected same day) — likely just stale from
  the original planning-stage writeup, not an actual environment mismatch.
- **`sales-os-app` has a real `typescript`/`openapi-typescript` peer dependency
  conflict.** Surfaced 2026-08-02 deploying the UAT frontend to Render, which
  does a genuinely clean `npm install` — `package.json` declares
  `typescript@^6.0.3`, but `openapi-typescript@7.13.0` (dev-only, used solely
  by the `generate:types` script) peer-requires `typescript@^5.x`, so a clean
  `npm install` fails with `ERESOLVE`. Not caught locally because Basheer's
  local `node_modules` predates the `typescript` 6.x bump and was never
  reinstalled from scratch. Worked around for UAT with
  `npm install --legacy-peer-deps` in Render's Build Command — safe there
  specifically because `openapi-typescript` never runs during `vite build`,
  but the underlying mismatch is still real and will hit the same wall on
  any other clean install (a new dev machine, CI, Prod's frontend build).
  Real fix: either downgrade `typescript` to `^5.x` or wait for
  `openapi-typescript` to support the `6.x` peer range — not decided yet.
- **`npm audit` reports 9 vulnerabilities (1 low, 8 high)** in `sales-os-app`'s
  dependency tree, surfaced during the same 2026-08-02 UAT frontend deploy.
  Pre-existing, not introduced by that deploy. Needs a proper look (`npm
  audit` for detail, then `npm audit fix` or manual upgrades) — not done
  under Monday-deadline time pressure.
- **`sales-os-app`'s production JS bundle is 1.58 MB**, over Vite's 500 kB
  chunk-size warning threshold — flagged in the same 2026-08-02 UAT deploy
  log. Performance item (code-splitting via dynamic `import()`), not a
  correctness one. Candidate approach in the build's own warning: dynamic
  imports or `build.rolldownOptions.output.codeSplitting`.
- **`ProjectDirectoryScreen.jsx`'s opportunity create/update never refreshes
  React Query caches at all** — surfaced 2026-08-03 while fixing the Pipeline
  screen's stale-after-create bug (`7bdafae`, see
  `docs/Progress-Archive-2026-08.md`). That fix added
  `invalidateQueries(["pipeline"])` to every other create/update call site
  (`Customer360Screen.tsx`, `OpportunityDetailScreen.tsx`), but
  `ProjectDirectoryScreen.tsx handleCreateOpp`/`handleUpdateOpp` (~lines 135,
  180) don't use React Query at all — they refresh their own local `opps`
  state via a direct `listOpportunities()` call and nothing else, so an
  opportunity created/edited from a Project's detail view won't show up on
  Pipeline *or* on that account's Customer 360 Opportunities tab
  (`["opportunities", "byAccount", accountId]`) without a hard refresh.
  Deferred rather than bundled into the Pipeline fix because it needs
  `useQueryClient` wired into the file from scratch, not a one-line addition
  — and this file is already on the pending MUI-migration list above, which
  is a more natural place to fix it properly.
- ~~**Opportunity create forms are missing stage-gate fields (Demo Date,
  Expected Closure Date, PO Number) — BR-OP-00 direct-to-advanced-stage
  creation fails.**~~ — **SHIPPED 2026-08-05, `main` commit `6a8e841`.**
  Surfaced 2026-08-04, UAT orientation session — a rep creating an
  Opportunity directly at Order stage hit a server rejection for a
  missing Demo Date, a field that screen didn't even show. Turned into
  two decisions, both now shipped: (1) all 4 opportunity create/edit
  entry points brought to field parity — Demo Start/End Date, Expected
  Closure Date, PO Number, and (found during Basheer's manual
  verification) Hold/Lost/Won status-gated fields that Project Detail's
  edit modal was missing entirely; (2) a new `REPEAT_ORDER` lead-source value
  relaxes the Demo/Clinical Evaluation gates (`BR-OP-13`) for customers
  repeat-ordering the exact same equipment (~40% of the pipeline, per Haroon),
  while Order Value/Product Details stay required. Full decision record
  and implementation summary in
  `docs/Discussion-FastTrack-Opportunity-Creation.md`. **Still
  outstanding:** not yet pushed to `uat`; `REPEAT_ORDER` seed row applied to
  Dev only, needs the same on UAT once this ships there; verified working
  on Dev by Basheer, UAT not yet checked.
  **Opportunity cloning** (auto-fill a REPEAT_ORDER deal from the
  customer's last order) was considered and deliberately kept separate —
  logged here as a future item, not picked up yet.
- **Split participant picker / cross-SBU contribution — DECIDED 2026-08-05,
  ready to build.** Surfaced 2026-08-04, UAT orientation session — team
  expected to be able to split a deal with anyone regardless of SBU. Turned
  out to bundle three separate needs, each resolved on its own terms with
  Haroon — full record in `docs/Discussion-SplitParticipant-SBU-Scope.md`
  (v6):
  1. **Split stays same-SBU, any-zone — SHIPPED 2026-08-07.** Cross-SBU
     splits remain deliberately disallowed (ADR-037/`BR-FIN-06`) — not
     reopened. The picker's `listUsers()` scope was renamed from
     `sbu_zone` to `sbu` and its zone check dropped (small backend change,
     see `Discussion-SplitParticipant-SBU-Scope.md` SS3.1 for why "no
     backend change" turned out not to hold).
  2. **Referral credit** — new `referred_by_user_id` on Opportunity, any
     SBU/zone (reuses the existing `scope="all"` picker), one-time, no
     revenue/visibility impact.
  3. **Relationship-support activity** — self-reported `Activity` logged
     against the Account with a structured `opportunity_id` link,
     `activity_type = RELATIONSHIP_SUPPORT`. Needs one new Postgres function
     (`cabio_app_opportunity_in_account`, mirrors the existing
     `cabio_app_has_split` pattern) and a small `activity_tier_visibility`
     RLS amendment (`OR user_id = cabio_app_uid()`, so a cross-SBU
     contributor can read back their own logged activity) — both confirmed
     against the live policy source, not assumed.
  **Nothing implemented yet** — this entry moves once picked up.
- ~~**Admin/General Manager can't create Opportunities outside their own home
  SBU, despite RLS already granting them unrestricted cross-SBU access.**~~ —
  **RESOLVED 2026-08-04.** Surfaced during the UAT orientation session —
  Haroon Sidheeq (General Manager role) unable to enter opportunities in the
  SBU other than his own. Root cause was `opportunity/router.py` hardcoding
  `sbu_id=current_user.sbu_id` for every caller unconditionally, with no way
  for any role to override it — contradicting the `opportunity_tier_visibility`
  RLS policy (ADR-009), which already granted Admin/General Manager
  unrestricted cross-SBU write access at the database level. Fixed as
  **BR-OP-12** (`docs/Business-Rules.md`): `OpportunityCreate` gained an
  optional `sbu_id` field, honored only for Admin/General Manager
  (`OpportunityService.create_opportunity` — `AuthorizationError` for any
  other role attempting an override, `NotFoundError` for a nonexistent SBU;
  BR-OP-11's item-SBU check validates against the overridden SBU, not the
  caller's own). Both opportunity-create entry points got a role-gated SBU
  dropdown wired to it: `Customer360Screen.tsx`'s "Add Opportunity" modal and
  the global "+ Lead" `QuickLeadModal.tsx` — the Products picker in each now
  filters by the selected SBU too, not just the caller's own.
  **Follow-up (2026-08-04, same day):** the SBU field was initially optional
  with a "My own SBU" default — Basheer flagged that a default doesn't make
  sense for a role with no meaningful "own" SBU, and that leaving it
  untouched would silently create the Opportunity in the caller's
  placeholder `sbu_id`. Tightened so Admin/GM must always explicitly choose
  (no default, `"My own SBU"` removed from both pickers, label changed to
  "SBU *"): backend rejects with `BusinessRuleViolation` if `role_name` is
  Admin/GM and `sbu_id` is omitted; frontend blocks submission client-side
  too. Also considered and rejected (again) giving Admin/GM a real
  `SBU = "Corporate"` row instead of a placeholder — same objection as the
  2026-07-28 finding in `docs/Progress-Archive-2026-07.md`: it would leak
  into every other SBU-scoped picker/report (Product Catalog filters, User
  Directory's SBU assignment dropdown, Target/Coverage Planning's SBU
  dimension) and only holds if every future Admin/GM account remembers the
  convention. The role-gated dropdown already avoids needing any sentinel
  value. Also hid the "SBU: {name}" placeholder chip in the sidebar user
  footer (`DemoApp.tsx`) for Admin/GM, same reasoning. 9 new/updated backend
  unit tests total, 397/397 backend suite passing, `npx tsc --noEmit` and
  `npm run lint` clean. Not yet manually verified on Dev/UAT by Basheer.
  **Still separate/unresolved:** the "Make `user_profile.sbu_id` ... nullable"
  item above — that's Admin/GM having *no* home SBU value at all in the DB
  (vs. today's placeholder value that the app now knows to ignore). Point 4
  of that item (the open product decision about opportunity creation) is
  now effectively answered by this fix and needs no further work whenever
  that migration is eventually picked up — the create-opportunity path
  never relies on Admin/GM's own `sbu_id` being meaningful in the first
  place. The sidebar/zone display (line 272 of `DemoApp.tsx`, same
  meaningless-placeholder problem) was raised but deliberately left alone —
  not asked for.
- **New product line onboarding (e.g., Cardiology) — not yet conceptualized.**
  Raised in leadership discussion, 2026-08-05. Cabio is considering adding
  entirely new departments/specialties beyond the current two SBUs (Imaging,
  Critical Care). Open question not yet scoped: does a new line like
  Cardiology become a third `SBU`, or a `category_name` within an existing
  SBU's product catalog — the two have very different implications (RLS
  tier scoping, target planning, zone/team assignment all key off `sbu_id`).
  No design work started; needs scoping before it's actionable.
- **Account Manager concept — relationship ownership distinct from
  Opportunity ownership — not yet conceptualized.** Raised in leadership
  discussion, 2026-08-05. Idea: a named Account Manager owns the overall
  relationship with a customer (hospital), responsible for mining further
  business there, as distinct from whoever owns a given Opportunity at that
  account. Today `Account` has no owner concept at all — only Opportunities
  have an `owner_id`. **Basheer's explicit call: this needs to be
  conceptualized and presented to Haroon and Latheef Bhai before any
  implementation work starts** — not a build item yet, don't design ahead of
  that conversation.
  **Update 2026-08-06:** this isn't starting from a blank page — the PRD
  already specifies it. §6.3 "Account Manager Assignment" and §6.3A "Customer
  Ownership Management" call for an optional "Primary Account Manager" per
  customer account, explicitly noted to "coexist with product-category
  ownership" (a separate, also-unbuilt PRD concept). Full analysis in
  `docs/Discussion-Strategic-Growth-Topics-2026-08.md` §2 — worth bringing to
  the Haroon/Latheef conversation as a starting point.
- **New lines of business — geography expansion via joint venture partners —
  not yet conceptualized.** Raised in leadership discussion, 2026-08-05.
  Cabio is considering partnering with a third party to sell Cabio's
  products in a new geography as a joint venture. Open question: how would
  that kind of expansion be represented in the system — a new `Zone`, a
  different `SBU`, a distinct owning entity/tenant, or something else
  entirely — given the current model assumes Cabio is the single selling
  entity throughout. No design work started; likely the largest-scope item
  of the four raised in this meeting, worth scoping carefully before
  committing to a data-model direction.
- **Multi-zone user assignment — decided 2026-08-07, moved to
  `active_progress.md` as the next build item.** All of design doc
  `docs/Multi-Zone-Assignment-Technical-Design.md`'s §8 decisions are now
  resolved (raw zone list, no named territory entity; open to all roles).
  One narrower question remains open within §7 (Target/Coverage Planning's
  `target_plan.zone_id` nullability) — see the design doc, not tracked here
  since the core feature is unblocked.
- **Pipeline screen zone filter — proposed 2026-08-07, ready to build, no
  open questions.** Surfaced while discussing Multi-Zone Assignment:
  `OpportunityPipelineScreen.tsx` has no way to narrow the Kanban/list view
  to one zone, unlike `CustomerDirectoryScreen.jsx`'s existing zone-filter
  pill (`8aff9cd`). Useful independent of Multi-Zone Assignment shipping —
  SBU Manager/GM/Admin already see opportunities across multiple zones today
  (existing RLS) with no way to filter down to one. Bigger lift than the
  Account Directory version, though: `Opportunity` has no `zone_id` of its
  own (one hop away via `account_id → account.zone_id`), and
  `opportunity/repository.py`'s pipeline query only supports `owner_id`
  filtering today — needs a new `zone_id` param threaded through repository
  (join to `Account`) → service → router, plus a frontend `Select` next to
  the existing Owner filter in `OpportunityPipelineScreen.tsx`, following the
  same `listPipeline({ zone_id, ... })` / `listZones()` pattern already used
  there for owners.
