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
