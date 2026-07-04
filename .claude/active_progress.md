# Active Progress — Cabio Sales OS
_Session: 2026-07-03 → 2026-07-04 (continued)_

## Current task
MUI migration (ADR-031, MUI-only — non-negotiable, hybrid rejected). Actively
migrating screens off Tailwind, one file at a time. As of this session: **7 of
16 tracked files migrated** (§9 in Frontend-Implementation-Standards.md — 7
migrated · 8 pending · 1 out of scope). A full property-by-property fidelity
audit of all 7 already-migrated files was just completed and fixed (see below);
migration is un-frozen and resuming on the remaining 8.

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
- All work committed; working tree clean as of session end.

## Next step
Resume forward migration on the remaining 8 pending files (§9). Order them by
demo importance — decide explicitly at next session start, not by investigation
order (same principle as before).

**New per-file ritual, mandatory for every remaining migration:**
convert → property-diff (against pre-migration git history, full comparison
table, evidence not summary) → triage (categorize each gap using §6.8's rules:
fix-theme / fix-per-file / verify-first / do-not-fix) → verify on screen
(manual E2E, Basheer's pass) → guard-green (`npm run lint` clean) → remove from
§9's pending table AND the `check-no-tailwind.js` GRANDFATHERED list in the
same commit → commit.

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
None — working tree clean (`git status` confirmed at session close). All work
this session is committed: `d25bea8`, `dc543fa`, `bb28f23` (infra/enforcement),
`8ec95a4`, `5eef75a`, `219ff99`, `c1796d6`, `8a3ed70` (5 screen migrations),
`a7cbb02` (fidelity audit + fixes across all 7 migrated files).
