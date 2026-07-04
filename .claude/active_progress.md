# Active Progress — Cabio Sales OS
_Session: 2026-07-03_

## Current task
MUI migration (ADR-031, MUI-only — non-negotiable, hybrid rejected). This session
was infrastructure/enforcement setup, NOT screen migration yet.

## Done this session
- Discovered MUI migration had silently stalled: only LoginScreen.tsx and
  FormModal.tsx are true MUI; ~13 files still Tailwind (see Frontend-Standards §9).
- Root cause: CLAUDE.md + Frontend-Standards both still said Tailwind; ADR-031 was
  unreferenced; no enforcement layer existed.
- Reconciled docs: CLAUDE.md stack line points at ADR-031; Frontend-Standards v2.0
  (MUI + React Query + TS, §9 migration tracker); ADR-031 reconciliation note added.
  Committed `d25bea8`.
- Built + activated a pre-commit guard: `.githooks/pre-commit` runs `npm run lint`
  (ESLint + Tailwind className guard), blocks commits with new Tailwind in
  non-grandfathered files. Verified end-to-end (real commit refused). Activated
  locally via `git config core.hooksPath .githooks`; README documents activation.
  Committed `dc543fa`.
- ESLint: 14 remaining errors all fall inside §9 migration-scope files, suppressed
  file-top with TODO-on-migration notes; no standalone lint debt. Lint chain green.
  Committed `bb28f23`.
- All three commits are in on `main`; working tree clean as of session end.

## Next step
Begin actual screen migration — leaf screens first, ONE complete-and-verified file
at a time, never half-migrated. Per file: convert to MUI + React Query + TS, verify
E2E, then REMOVE it from BOTH §9's pending table AND the guard's GRANDFATHERED
allowlist in the same commit (else the guard keeps permitting Tailwind there).
First file: pick by July 13 demo importance + small-first to set the pattern —
decide ordering at session start (do NOT default to investigation order).

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
- Enforcement is now live: pre-commit hook blocks new Tailwind automatically.
- The 14 eslint-disable suppressions are load-bearing (they keep lint green / the
  commit gate working) — they get DELETED as each file migrates, not before.
- Timing: finish whatever is fully migrated AND re-verified by July 10; freeze rest,
  demo July 13 on clean mix of migrated + untouched screens, resume after.
- Reminders-on-login feature is DEFERRED behind the migration — not lost, not current.
- Live shared Supabase DB caution applies when touching real data.

## Files in flight
None — working tree clean, nothing to commit (`git status` confirmed at session
close). All infrastructure/enforcement work is committed across `d25bea8`,
`dc543fa`, `bb28f23`.
