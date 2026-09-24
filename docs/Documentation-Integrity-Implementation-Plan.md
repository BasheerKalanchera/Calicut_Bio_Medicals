# Documentation Integrity — Implementation Plan

**Status:** Part 1 (daily tidy-up) built 2026-09-24. Parts 2–3 not started. Option B chosen by Basheer (automatic checks +
daily sweep for the first ~2 weeks, frequency reduced as errors fall).
Open questions in §7 need answers before building.

## 1. Problem

On 2026-09-24 one review turned up many sync failures:
- the handover file grew to 1,722 lines, twice
- a memory note said the extended team hadn't been rolled out, a month after
  the 2026-08-29 walkthrough
- a test plan still said "in progress" three weeks after the feature shipped
- Group G's result was never recorded
- about 10 "see file X" pointers led nowhere
- Deployment-Topology's rollout checkbox was stale

Four causes:
1. The same fact is stored in several places.
2. Nothing checks: every rule depends on Claude remembering.
3. Pointers rot when their targets move.
4. Claude's private memory notes are never reviewed.

What has held: the scorecard, because a script regenerates it and `--check`
refuses a stale commit. This plan applies the same pattern to docs in
general.

**Environment:** everything here is local — repo files, the laptop, git
hooks. No Dev or UAT database access is involved.

## 2. One home per kind of fact

New CLAUDE.md section, "Documentation homes". Every other doc may **link**
to the home but must not **restate** the fact.

| Kind of fact | Home |
|---|---|
| Signed-requirement / feature status | `docs/Signed-Requirements-to-PRD-Traceability.md` |
| A feature's E2E result | that feature's `*-Manual-E2E-Test-Plan.md` status line (§4b) |
| Environments, rollout, UAT→Prod gates | `docs/Deployment-Topology.md` |
| Open or deferred work, undecided questions | `docs/Backlog.md` |
| Business rules / architecture decisions | `docs/Business-Rules.md` / `docs/ADR.md` |
| What happened, and why | `docs/Progress-Archive-<year>-<month>.md` |
| Task in progress right now | `.claude/session-handover.md` |
| How Basheer likes to work | Claude memory (feedback/user notes only) |

**Memory clean-up:** the 13 project-status memory notes are each removed, or
cut down to a one-line pointer to their home doc. Basheer sees the
note-by-note list before anything is deleted.

## 3. Historical vs living docs

A doc that records the past (old plans, dated migration and regression
records, archives) gets a first-line marker:
`<!-- doc-status: historical -->`. Checks skip historical docs, so their
old references stay true to the time they were written. Everything else is
living and must stay correct. A one-time classification of all 140 docs is
shown to Basheer before the markers are added.

## 4. `scripts/check_docs.py` — automatic checks

Runs with `--check` from `.githooks/pre-commit` on **every** commit (today
the hook only runs for frontend commits). A non-zero exit blocks the commit,
the same as the scorecard check.

- **a. Broken pointers** *(block)* — any backticked repo path (`docs/…`,
  `scripts/…`, `.claude/…`, `backend/…`, `sales-os-app/…`) in a living doc
  or in a code comment that doesn't exist.
- **b. Test-plan status line** *(block if missing)* — every
  `*-Manual-E2E-Test-Plan.md` starts with
  `**E2E status:** Not started | In progress | Complete (YYYY-MM-DD)`.
  *(warn)* "In progress" with no commit to the file in 7+ days. *(warn)*
  Traceability says Done, but the linked test plan isn't Complete.
- **c. Handover size** *(block)* — `session-handover.md` over 150 lines.
- **d. Memory pointers** *(warn)* — broken paths in Claude memory notes
  (they sit outside the repo, so this can't block).

**One-time clean-up first:** the first run will report existing violations.
They're fixed in one pass (shown to Basheer) before blocking is switched on.

## 5. Daily sweep (supervised)

- **Skill** `.claude/skills/doc-integrity-sweep/SKILL.md` holds the
  procedure, loaded on demand so it isn't added to every session's base
  instructions.
- **Reminder:** `session-start.sh` step 2c, the same pattern as the
  data-quality reminder. It is due when the last line of the sweep log is
  `SWEEP_EVERY_DAYS` or more days old (starts at 1).
- **Scope per sweep** (bounded, so a daily run stays short):
  1. Run `check_docs.py`, including the warnings.
  2. Commits since the last sweep: for each feature they touch, do its home
     docs (Traceability, test plan, Backlog, handover) agree with git?
  3. Backlog items still marked open whose feature appears to have shipped.
  4. `session-handover.md` against `git status` / `git log`.
  5. A rotating slice: 1–2 project memory notes (while any remain) and 3
     living docs, checked for statements contradicting their home doc.
- **Output:** a findings list in chat. Fixes are applied after one approval
  per sweep; the commit is approved separately, as always. Before editing
  any shared file, Claude checks for another session's uncommitted changes.
- **Log:** `docs/Doc-Integrity-Sweep-Log.md`, one line per sweep: date |
  issues found | fixed | deferred | one-line summary. It's in the repo so the
  trend is visible to Basheer.

## 6. Close the loop at commit time

The post-commit checklist gets a new step: search the docs for every mention
of the feature just committed, and update or remove any status claim not in
its home doc. `check_docs.py` enforces the mechanical part.

## 7. Open questions (answer together)

1. **Blocking:** block commits on §4a/4b/4c after the one-time clean-up
   (recommended), or warn-only for the first two weeks?
2. **Historical docs:** mark them with a header (recommended; nothing moves),
   or move them to `docs/historical/` (breaks existing links)?
3. **Sweep approvals:** one approval per sweep's batch of fixes
   (recommended), or approve each fix individually?
4. **Reducing frequency:** proposed rule — after 14 days, if the last 5
   sweeps each found ≤1 real issue, go to every 3 days; after another 2
   quiet weeks, weekly. Basheer makes each change; it's never automatic.
5. **Memory notes:** remove project-status notes entirely (recommended), or
   keep them as one-line pointers?

## 8. Build order (checkpoint commit after each part)

- **Part 1 — sweeps can start tomorrow:** CLAUDE.md "Documentation homes",
  sweep skill, reminder step 2c, sweep log, memory clean-up list.
- **Part 2 — automatic checks:** doc classification (shown first),
  `check_docs.py`, one-time clean-up, pre-commit wiring.
- **Part 3:** the post-commit checklist step, plus a Process-Rules-History
  entry.

The 6 frontend code-comment pointers are fixed in Part 2's clean-up, after
split-editing is committed (see `.claude/session-handover.md`).
