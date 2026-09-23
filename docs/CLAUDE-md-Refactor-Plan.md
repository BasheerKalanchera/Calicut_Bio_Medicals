# CLAUDE.md Refactor — Implementation Plan

**Status:** Approved by Basheer 2026-09-23 (all four parts). Applied 2026-09-23:
`CLAUDE.md` 4,134 → 1,600 words. Deviations approved in review: plain-language-
before-query moved to "Show before you act" (not the skill); venv-activation rule
added to the skill from memory; scorecard process doc now names both client pages.

## Goal

Make `CLAUDE.md` cheaper to load every session without dropping any rule.
Today it is ~4,100 words (~5,500 tokens); nearly half is backstory ("**Why:**"
paragraphs), not rules. Target: roughly half the current size.

Honest scope note: `CLAUDE.md` is loaded once per session and prompt-cached,
so the saving is a few thousand tokens per session — worthwhile, and a shorter
file is easier to follow, but small next to browser screenshots (already
addressed 2026-09-23 by the Simple/Complex step split in "Manual E2E testing").

Supersedes the parked "CLAUDE.md refactor" item in `.claude/active_progress.md`
(the external `docs/claude_md_analysis.md` proposal) — this plan adopts its
one agreed extraction (Troubleshooting & scripting) and rejects the rest.

## Part 1 — Move backstories out (~40% of the file)

- All 29 "**Why:** …" paragraphs move, verbatim, to a new
  `docs/Process-Rules-History.md`, grouped under the same section headings.
- In `CLAUDE.md` each shrinks to a short date tag, e.g. *(2026-09-18)*, so the
  origin is still traceable by grepping the history doc for that date.
- No rule text changes in this part — only the backstory moves.

## Part 2 — "Troubleshooting & scripting" becomes an on-demand skill (~800 words)

- New project skill `.claude/skills/cabio-db-and-scripting/SKILL.md`, holding
  the section's content: the three RLS session settings for raw SQL, the
  PowerShell 5.1 `2>&1` quirk, `pg_constraint` FK check before retire/delete
  migrations, target-environment check before data analysis, scratchpad-only
  throwaway scripts, isolate-the-variable diagnostics, check tools before
  claiming a capability is missing, pull the commit list when a branch lags.
- The skill's description must trigger on: raw SQL against Dev/UAT, writing a
  migration, writing a PowerShell/Python script, git branch divergence.
- `CLAUDE.md` keeps a one-line pointer to the skill, plus the single rule
  that's a safety net if the skill doesn't trigger: *never trust a zero/low
  count from a raw RLS-table query until all three session settings are
  verified*.

## Part 3 — "Scorecard integrity" points to its process doc (~150 words saved)

- Keep only the three hard rules inline: never hand-edit the generated files
  or the tally line; a row flips to Done only after its E2E plan is fully
  checked off; `generate_scorecard.py --check` must pass before any commit
  touching Traceability/Scorecard/HTML.
- Everything else points to `docs/Scorecard-Maintenance-Process.md` (verify
  that doc already covers it before deleting; move any missing detail there).

## Part 4 — Tighten wording throughout

- Remove rules duplicated from the global `~/.claude/CLAUDE.md` (e.g.
  plain-language-first) — keep one line pointing to the global rule if needed.
- Merge bullets that restate the same rule in two places.

## Stays in full, on purpose

Feature planning, Pre-E2E code review, Commit approval, Show before you act,
Mirroring an existing feature. These are in-the-moment judgment rules; moving
them out of the always-loaded file raises the risk of them being skipped —
the Pre-E2E rule was skipped once even while fully inline (2026-09-22), and
two commits slipped through unapproved on 2026-09-23 while the approval rule
lived only in memory.

## Process

1. Draft the new `CLAUDE.md`, `docs/Process-Rules-History.md` and the skill
   file — not touching the live `CLAUDE.md` yet.
2. Show Basheer a section-by-section old-vs-new comparison so he can confirm
   every rule survived, plus before/after word counts.
3. On approval, replace `CLAUDE.md`. The uncommitted "Commit approval" section
   (added 2026-09-23) is folded in, not committed separately.
4. One commit — file list and message shown first, per "Commit approval".
5. Update the memory index: drop memory entries that only duplicate a rule now
   in `CLAUDE.md`, so they aren't restated in two places.

## Verification

- Every rule in the old file maps to a location in the new file, the history
  doc, or the skill — checked as a table in step 2.
- Word count before/after reported.
- Next session: confirm the skill appears in the available-skills list.
