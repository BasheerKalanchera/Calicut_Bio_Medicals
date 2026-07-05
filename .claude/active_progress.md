# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-05 (continued)_

## Current task
MUI migration (ADR-031, MUI-only — non-negotiable, hybrid rejected). Actively
migrating screens off Tailwind, one file at a time. As of this session: **8 of
16 tracked files migrated** (§9 in Frontend-Implementation-Standards.md — 8
migrated · 7 pending · 1 out of scope). `QuickLeadModal.tsx` is the latest file
migrated, verified E2E, and ready to commit — see below.

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

## Next step
Resume forward migration on the remaining 7 pending files (§9). Order them by
demo importance — decide explicitly at next session start, not by investigation
order (same principle as before).

**New per-file ritual, mandatory for every remaining migration:**
convert → property-diff (against pre-migration git history, full comparison
table, evidence not summary) → triage (categorize each gap using §6.8's rules:
fix-theme / fix-per-file / verify-first / do-not-fix) → verify on screen
(manual E2E, Basheer's pass) → guard-green (`npm run lint` clean, `npx tsc
--noEmit` clean) → remove from §9's pending table AND the
`check-no-tailwind.js` GRANDFATHERED list in the same commit → commit.

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
`QuickLeadModal.tsx` migration + its §9/`check-no-tailwind.js` tracker updates
are staged and verified (guard-green, E2E'd by Basheer) but not yet committed
as of this point in the session — commit is the next action.
