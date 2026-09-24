---
name: doc-integrity-sweep
description: Cabio daily documentation tidy-up. Load when the session-start hook says a doc-integrity sweep is due, or when Basheer asks for a documentation tidy-up, consistency sweep, or doc-sync check. Compares what the docs claim with what git shows, fixes gaps with one batch approval, and logs the result.
---

# Daily documentation tidy-up

Why this exists: on 2026-09-24 one review turned up stale status claims,
unrecorded test results, a month-old wrong memory note, and ~40 broken "see
file X" pointers. Prose rules alone didn't prevent any of it. Plan:
`docs/Documentation-Integrity-Implementation-Plan.md`.

**Time box: about 20 minutes.** If it runs longer, stop, report what's done,
and log it as partial.

## Before starting

1. `git status`. If another session has uncommitted changes to a file you'd
   fix, leave that file alone and say so.
2. Read the last line of `docs/Doc-Integrity-Sweep-Log.md` for the date of
   the previous sweep. Everything below covers **changes since that date**.

## The five checks

1. **Broken file pointers:** run `sh scripts/find_broken_doc_links.sh`. Fix
   the ones in (a) files changed since the last sweep and (b) today's
   rotating slice (check 5). Record the TOTAL in the log so the trend shows.
   Old plan docs pointing at files that were renamed later are expected
   until Part 2 labels historical docs; don't chase them all at once.
2. **Commits since the last sweep:** `git log --since=<last date> --oneline`.
   For each feature or fix, check that its home docs agree with git (see
   CLAUDE.md "Documentation homes"):
   - Traceability status
   - the test plan's status and results
   - the Backlog entry, closed or updated
   - no leftover "not yet committed / pending / in progress" claims about it
3. **Backlog items still marked open whose work has shipped:** search the
   Backlog for the feature names in check 2's commits.
4. **Handover file against git:** every commit hash or "uncommitted" claim
   in `.claude/session-handover.md` is true right now.
5. **Rotating slice:** 1–2 project-type memory notes (oldest `modified`
   first) plus 3 living docs, not reviewed recently (use the log to see
   which were covered). For each statement of current status, check it
   against its home doc. Memory notes holding project status: propose
   deleting them or cutting them to a pointer.

## Reporting and fixing

- Show Basheer the findings in **plain language**, one line each: what's
  wrong and the proposed fix. Group them: fix now, or needs Basheer's
  decision.
- **Every fix is shown as an exact before → after table** (where, before,
  after) **before anything is changed**, so the approval covers text Basheer
  has actually seen. This includes memory notes, which git can't show later.
  *(2026-09-24: 8 fixes were applied after an outline-only approval.)*
- **One approval for the whole batch**, then apply the fixes. The commit
  follows the normal rule: show the file list and message, then wait for a
  separate yes. Fixes may ride along in the next commit if Basheer prefers.
- Never rewrite history: Progress-Archive, Process-Rules-History, and dated
  records stay as written. Fix the *pointers* in living docs instead.

## Log (always, even when nothing is found)

Append one line to `docs/Doc-Integrity-Sweep-Log.md`:

`- YYYY-MM-DD | found N | fixed N | deferred N | broken links TOTAL | slice: <what was covered> | <one-line summary>`

The session-start hook reads the date on the last line to decide when the
next sweep is due. A skipped log line means the reminder keeps firing.

## Frequency

Set by `SWEEP_EVERY_DAYS` in `.claude/hooks/session-start.sh` (starts at 1).
Proposed rule, and **Basheer decides each change**:
- after 14 days, if the last 5 sweeps each found ≤1 real issue → every 3 days
- after 2 more quiet weeks → weekly
