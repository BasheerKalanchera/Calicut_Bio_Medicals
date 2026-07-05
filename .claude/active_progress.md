# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-05 (continued)_

## Current task
MUI migration (ADR-031, MUI-only — non-negotiable, hybrid rejected). Actively
migrating screens off Tailwind, one file at a time. `QuickLeadModal.tsx`
(`fe68a91`) confirmed landed from the prior session.
`OpportunityDetailScreen.tsx`'s Commit A (styling) plus a stakeholder-linking
bug fix (discovered during Commit A's E2E) landed together as `3619295`, per
Basheer's decision to combine rather than split hunks across one file.
**Commit B (ADR-032 compliance — all 6 manual `.then()` chains → `useQuery`,
plus local stopgap types for the master-data lookups) is now done, guard-green,
and staged — pending Basheer's E2E pass before commit.** §9/`check-no-tailwind.js`
already updated to reflect the file as fully migrated (9 of 16 tracked files).

## Done this session
- Discovered MUI migration had silently stalled: only LoginScreen.tsx and
  FormModal.tsx were true MUI; ~13 files still Tailwind (see Frontend-Standards
  §9). Root cause: CLAUDE.md + Frontend-Standards both still said Tailwind;
  ADR-031 was unreferenced; no enforcement layer existed.
- Reconciled docs (CLAUDE.md → ADR-031; Frontend-Standards v2.0 with §9 tracker)
  and built + activated a pre-commit Tailwind guard (`.githooks/pre-commit`).
  Committed `d25bea8`, `dc543fa`, `bb28f23`.
- Migrated 5 screens to MUI, one at a time, each verified E2E before commit:
  - `main.tsx` (`8ec95a4`)
  - `ActivityTimeline.tsx` (`5eef75a`)
  - `NextActionsScreen.tsx` (`219ff99`)
  - `LogActivityModal.tsx` (`c1796d6`) — found and fixed a real defect along
    the way: §9 mislabeled this file "React Query ✓" when it actually used
    manual `.then()` fetches; converted to `useQuery` as part of the migration.
  - `OpportunityPipelineScreen.tsx` (`8a3ed70`)
- Two visual regressions surfaced during `LogActivityModal.tsx` review
  (missing input background fill, modal height jumping between tabs) that
  traced back to gaps in earlier "fully migrated" files — triggered a full
  stop on new migration to audit what had already shipped.
- Ran a strict property-by-property fidelity audit of all 7 migrated files
  against their pre-migration Tailwind version (via `git show <commit>^:<path>`),
  full comparison table per file, every gap catalogued and triaged
  (fix-theme / fix-per-file / verify-first / do-not-fix).
- Fixed everything the audit found; committed as `a7cbb02`:
  - 4 theme-level corrections (`src/theme/index.ts`): `MuiOutlinedInput`
    input-fill default (`#f9fafb`, was missing entirely on every migrated
    field), `MuiButton` disabled-contained-primary blue tint (was defaulting
    to MUI gray), `MuiBackdrop` opacity+blur, `MuiDialogActions` border+padding,
    and `palette.background.default` corrected `#f8fafc`→`#f9fafb` (a
    close-but-wrong drift from the actual app-wide convention).
  - Per-file fixes: `LoginScreen.tsx` (`<h1>` semantics restored, password
    placeholder restored, stray margin removed), `FormModal.tsx` (448px width
    restored, `<h3>` title restored, neutral Cancel button color, restored the
    children-spacing contract it silently dropped), `LogActivityModal.tsx`
    (removed a margin that duplicated FormModal's restored spacing),
    `NextActionsScreen.tsx`/`OpportunityPipelineScreen.tsx` (removed local
    color hardcodes now superseded by the theme fix), `OpportunityPipelineScreen.tsx`'s
    × clear button (font-weight/size typo).
  - `ActivityTimeline.tsx` redesigned as cards — a deliberate UX change, not a
    fidelity restore (the original never used cards there); confirmed
    consistent with the app-wide non-clickable-card recipe (`NextActionsScreen`'s
    `ReminderRow`), same base styling as the clickable directory-row cards
    minus their hover states.
- Wrote the audit's lessons into Frontend-Implementation-Standards.md as three
  sections: §6.6 (MUI gotchas, merged + expanded), §6.7 (theme is the source
  of truth for visual defaults), §6.8 (migration fidelity — what to match vs.
  let go). These now govern how the remaining files get migrated.
- Found and deferred an unrelated, pre-existing backend bug (reminders
  "Completed" tab shows pending items too) — confirmed unrelated to the
  frontend migration (frontend code calling the endpoint is byte-for-byte
  unchanged); not fixed this session, needs a product decision first.
- Migrated `QuickLeadModal.tsx` to MUI — data fetching (6 manual `.then()`
  calls → `useQuery`, incl. a dependent project-by-account query replacing a
  hand-rolled `projectsLoading` flag), full Tailwind→MUI styling conversion,
  local stopgap option types added (services still return `Promise<unknown>`).
  Property-diffed against the pre-migration file (full table, not summary);
  one real gap found and fixed (nested item-row mini-fields had lost their
  `bg-white`-vs-container contrast — restored via a per-field
  `MuiOutlinedInput-root` override); two decorative gaps accepted per §6.8
  (Project-select loading hint and Indicative Value's "(auto)" hint lost
  their sub-emphasis styling but kept the underlying signal).
  Follow-up fixes requested after E2E, all applied and re-verified:
  - Win Probability / Indicative Value floating-label animations made
    consistent (a stray forced `inputLabel.shrink` on Indicative Value was
    blocking its natural float); placeholders changed to "Enter Win
    Probability %" / "Enter Indicative Value (Lakhs)".
  - Add-Product row (Qty/Price/Disc): forced consistent label-floating on
    all three (Price defaulted to `""` while Qty/Disc defaulted to non-empty
    strings, so only Price rendered unfloated at rest); widened Price/Disc to
    `7.5rem` (50% wider than Qty); `justifyContent:"space-between"` added to
    spread the row across the modal width (was left-packed); same width +
    justify treatment applied to the item-edit-row's mini-fields for
    consistency between the two rows.
  - `itemPrice` default changed from `""` (introduced by the migration) back
    to `"0"`, restoring the pre-migration Tailwind source's actual default —
    this was a fidelity slip in the first migration pass, not a new ask.
  - "+ Add Product" validation tightened (`!itemQty`/`!itemPrice` empty-string
    checks were rendered meaningless once both default to non-empty values)
    to `Number(...) <= 0`, and failures now show a specific inline `Alert`
    instead of the original's silent no-op `return`.
  - Name field given `mt: 1.5` — its floating label (immediate, via
    `autoFocus`) was clipping into the dialog title's bottom edge; fixed
    locally in this file only, not in the shared `FormModal.tsx`.
  - A reported "Project picker is dead" bug turned out to be expected
    behavior (field is intentionally disabled until an Account is picked,
    to gate the dependent project fetch) — confirmed false alarm after
    hard-refresh ruled out stale-HMR as a cause; the `disabled` condition was
    simplified from `!accountId || projectsLoading` to `!accountId` along the
    way regardless (removes a reactive-fetch-tied flag for no loss of
    correctness).
  Guard-green (`npm run lint`, `npx tsc --noEmit`) confirmed clean. §9 table
  and `check-no-tailwind.js` GRANDFATHERED list both updated in the same
  commit as the migration. Committed as `fe68a91`.
- Ran a dedicated, whole-project `npx tsc --noEmit` pass (confirmed
  `tsconfig.json`'s `include: ["src"]` covers everything, not scoped to any
  one file) — zero errors. Closes out the retroactive-type-check concern for
  all 8 migrated files (`main.tsx`, `ActivityTimeline.tsx`,
  `NextActionsScreen.tsx`, `LogActivityModal.tsx`,
  `OpportunityPipelineScreen.tsx`, `LoginScreen.tsx`, `FormModal.tsx`,
  `QuickLeadModal.tsx`) as a confirmed, explicit run — not just incidental
  coverage from other work.
- All work committed; working tree clean as of session end.
- Picked `OpportunityDetailScreen.tsx` as the next file (Basheer chose the
  smallest-lift option of the three offered; July 10 freeze / July 13 demo
  timeline confirmed still holding, not reassessed further).
- Audited the file before touching it — found §9's "React Query ✓" mark false:
  6 manual `.then()` chains remain (`ProductsTab`/`SplitsTab`/`StakeholdersTab`
  on-demand master-data lookups, plus screen-level stage/status/user loads in
  `openEditOpp`) — same defect class as `LogActivityModal.tsx`'s earlier miss.
  Also flagged "TypeScript ✓" as certifying only "compiles," not "no `any`" —
  the file is `any[]`-typed throughout.
- Basheer's correction: split into **Commit A (styling only)** and **Commit B
  (ADR-032 fetch conversion)** — two different risk profiles, one verification
  pass can't certify both; explicitly instructed not to bundle them.
- **Commit A done** — full Tailwind→MUI conversion of all 4 tab sub-components
  (Overview/Products/Splits/Stakeholders), the back button, the tab chip bar
  (reused the exact scroll-to-active-pill recipe from
  `OpportunityPipelineScreen.tsx`, per §6.6 item 3), and both modals (Edit
  Opportunity fields, `LogActivityModal` unchanged). Deliberately left every
  data-fetching call, `any` typing, and `as any` cast untouched — Commit B's
  scope only.
  - Preempted the known "autofocus label clips into dialog title" gotcha
    (first hit in `QuickLeadModal.tsx`) by giving the Name field `mt: 1.5` up
    front instead of waiting for E2E to catch it again.
  - Kept the Qty/Price/Disc mini-field widths equal (matching the original
    Tailwind `w-20` on all three) rather than adopting `QuickLeadModal.tsx`'s
    later 7.5rem-widened convention — that widening was a specific ask for
    that file, not yet an established app-wide rule. Flag for Basheer: request
    the same widening here explicitly if he wants cross-file consistency.
  - Preserved this file's own pre-migration `StatusBadge` shades (`-50`/`-700`)
    rather than aligning to `OpportunityPipelineScreen.tsx`'s different
    (`-100`/`-700`) shades for the same statuses — that cross-file
    inconsistency is explicitly banked for the `statusColors.ts` consolidation
    pass, not something to resolve silently per-file mid-migration.
  - `npm run lint` and `npx tsc --noEmit` both clean; `check-no-tailwind.js`
    confirms zero `className` usage in the file.
  - Corrected §9 rather than marking it fully done: added a column legend
    (defining what Styling/React Query/TypeScript ✓ each actually certify),
    merged the two pending tables into one, and gave
    `OpportunityDetailScreen.tsx` its own honest row — Styling ✓, React Query
    still Pending (6-chain detail spelled out), TypeScript "Compiles ✓ —
    verified `any[]`-typed, not type-safe." Row stays off the "fully migrated"
    table; `check-no-tailwind.js`'s `GRANDFATHERED` list stays untouched until
    Commit B lands (confirmed via the script's own comment — entries mirror
    §9's pending rows, and this file is still pending).
  - Added Frontend-Implementation-Standards.md §6.6 item 7: back button is
    `IconButton` + `ArrowBackIcon` (not a chevron — chevron reads as
    collapse/previous, not navigate-back). Noted it's inlined here today but
    appears identically on all four 360/detail screens (Customer, Product,
    Opportunity, Project) — banked the shared `BackButton` extraction (see
    Deferred) rather than building it inside this commit.
- Basheer's E2E of Commit A surfaced two real issues, both fixed before commit:
  - **Products tab Add/Edit rows had the same floating-label/validation bug
    already fixed once in `QuickLeadModal.tsx`** — `addPrice` defaulted to
    `""` while `addQty`/`addDisc` defaulted to non-empty strings (inconsistent
    label float), and the add-guard silently no-opped instead of erroring.
    Fixed identically to the earlier precedent: `addPrice` default `"0"`,
    validation tightened to `Number(...) <= 0` with inline `Alert`, button
    `disabled` prop dropped, Price/Disc widened to `7.5rem` with
    `justifyContent: "space-between"` on both the Add row and the per-item
    edit row. Folded into Commit A (styling/consistency, not a fetch change).
  - **Stakeholder linking returned "Method Not Allowed" on every attempt.**
    Traced to `addOpportunityStakeholder`/`removeOpportunityStakeholder`
    calling `POST`/`DELETE` routes that were never implemented backend-side —
    confirmed via `git log`/`git show` that these were introduced as explicit
    stubs in an earlier commit ("backend endpoints pending") predating this
    session entirely, not something broken by the migration. First attempted
    a frontend-only workaround (bulk-replace via the existing `PUT` endpoint)
    but Basheer correctly pushed back: the bulk endpoint deletes and
    reinserts every stakeholder link on the opportunity on every call,
    silently stamping a fresh `created_at`/`created_by` onto every
    already-linked stakeholder each time one is added or removed — real
    audit-trail corruption, not just an inferior UX. Reverted the workaround
    and built the actual missing single-item endpoints instead, mirroring the
    existing `OpportunityItem` add/delete pattern in the same router:
    `repository.py` (`get_stakeholder_link`, `add_stakeholder`,
    `delete_stakeholder`), `service.py` (`add_stakeholder` raises
    `ConflictError` on duplicate link, `remove_stakeholder` raises
    `NotFoundError` if not linked), `router.py` (`POST`/`DELETE
    /opportunities/{id}/stakeholders[/{stakeholder_id}]`), plus 5 new unit
    tests in `test_opportunity_service.py` (all passing, confirmed against
    the pre-existing 33-test baseline). The pre-existing bulk-replace `PUT`
    endpoint was left alone per Basheer's explicit call — confirmed it has no
    other caller anywhere in the frontend, before or after this fix.
  - Both fixes landed in the same commit as Commit A (`3619295`) — Basheer's
    call to combine rather than stage hunks separately, since Commit B (the
    fetch-layer conversion) was still separately staged and unaffected.
- **Commit B done** — converted all 6 manual `.then()` chains to `useQuery`,
  gated by `enabled` on whatever state used to trigger each fetch (so
  behavior is unchanged, just cached/parallelized instead of hand-rolled):
  `ProductsTab`'s product picker (`enabled: editing`), `SplitsTab`'s user
  picker (`enabled: editing`), `StakeholdersTab`'s account-stakeholder picker
  (`enabled: showAdd`), and the screen-level stage/status/user loads for the
  Edit Opportunity modal (`enabled: showEditOpp`, `staleTime: Infinity` —
  matching the existing convention in `OpportunityPipelineScreen.tsx` for the
  same master data, and sharing its cache key so both screens hit one cache
  entry). Added local stopgap types (`StageOption`/`StatusOption`/
  `UserOption`/`ProductOption`/`StakeholderOption`) replacing `any[]` for
  these lookups specifically — surfaced one real latent type bug in the
  process: `StageOption.default_win_probability` has to be `string`, not
  `number` (`QuickLeadModal.tsx`'s copy of this same stopgap type declared it
  as `number`, untested against this constraint), because
  `handleUpdateOpp` feeds it directly into a `PipelineStageNested`-shaped
  object where the field is `string` — `tsc` caught the mismatch immediately
  once `stages` had a real type instead of `any[]`. Left `editItems`/
  `editSplits` (transient edit-buffer state) and a handful of pre-existing
  `as any` ID casts untyped — out of scope for this pass. `npm run lint` and
  `npx tsc --noEmit` both clean; zero remaining `.then(` in the file
  (confirmed by grep). Updated §9 (moved the file to the fully-migrated
  table, 9 of 16 now done) and removed it from `check-no-tailwind.js`'s
  `GRANDFATHERED` list in the same pass, since both Styling and React Query
  are now genuinely done, not just claimed.
  - **Not yet done:** Basheer's manual E2E pass on Commit B, then the commit
    itself.

## Next step
1. Basheer E2E's Commit B (React Query conversion) on screen — the Products/
   Splits/Stakeholders picker dropdowns and the Edit Opportunity modal's
   Stage/Status/Owner dropdowns are the surfaces that actually changed
   fetch timing; check they still populate correctly on first open of each
   edit/add panel, not just that they look the same.
2. Commit B once green.
3. Resume the same per-file ritual on the remaining 6 pending files (now
   corrected: end with an honest §9 update, not just "mark done" — verify
   each column's claim before checking it).

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
- **Delete `sales_os_prototype_demo_ready.jsx`** (repo root, 290 lines, from
  initial commit April 14). Orphaned prototype: not imported by any file in
  sales-os-app/src (grep confirmed zero references), not part of the Vite build,
  not listed in §9. It is dead code, not a migration target — do NOT add it to §9.
  Action: re-confirm zero imports (`grep -rn "sales_os_prototype_demo_ready"
  sales-os-app/ src/`), then `git rm` it. Safe because nothing references it and
  it's not in the build — deletion cannot affect the running app. Post-demo, low
  priority.
- **Fix `check-no-tailwind.js` to match Tailwind utility shape, not bare
  `className=`.** The guard currently flags any `className=` at all, including
  non-Tailwind uses (e.g. a plain hook name like `className="deal-avatar"` used
  only as a CSS selector target, with zero Tailwind classes in it). Root-cause
  fix: match against actual Tailwind utility patterns (e.g. `bg-`, `text-`,
  `flex`, `p-`/`px-`/`py-`, `rounded`, etc.) instead of the bare attribute name.
  Current workaround — using `data-*` attributes instead of `className` for
  CSS-selector hooks (see OpportunityPipelineScreen.tsx's ListRow hover pattern)
  — is a local stopgap only, adopted because it was blocking a commit, not the
  long-term answer. Post-migration, low priority (guard still functions
  correctly for its actual job, just over-flags this one edge case).
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
  Note: `ProjectDirectoryScreen.jsx` is one of the 8 pending §9 migration
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
  screens, resume after." **Not reassessed since** — a significant chunk of
  this session went to the fidelity audit rather than new-file migration.
  Worth explicitly revisiting whether July 10/13 still holds before the next
  session commits to an ordering.
- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
- Live shared Supabase DB caution applies when touching real data.

## Files in flight
`OpportunityDetailScreen.tsx` Commit B (all 6 `.then()`→`useQuery`
conversions + master-data stopgap types) + the `docs/Frontend-Implementation-Standards.md`
§9 update (file moved to fully-migrated) + `check-no-tailwind.js`'s
`GRANDFATHERED`-list removal are staged and guard-green (`npm run lint`,
`npx tsc --noEmit` both clean, zero remaining `.then(` confirmed by grep) but
**not yet E2E'd by Basheer and not yet committed**. Commit A (styling) plus
the stakeholder-linking bug fix (backend `POST`/`DELETE` endpoints +
frontend rewire) already landed as `3619295`.
