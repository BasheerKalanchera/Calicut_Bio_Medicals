# Process Consolidation — Implementation Plan

**Status:** Draft, 2026-10-08.
**Traceability rows:** none (how Claude works, not an app feature).
**Design / discussion:** chat 2026-10-08; tracker `docs/Process-Improvements.md`.

## Decisions

- Full pass: sort all tracker items, shorten CLAUDE.md, change how retros feed the tracker, review the guard rails — Basheer, 2026-10-08
- Process review every alternate day (replaces the weekly review); frequency comes down as mistakes fall — Basheer, 2026-10-08
- Review day: the same day as the UAT data-quality check, so the doc tidy-up keeps the other days and each day has one chore — proposed
- Frequency comes down when 3 reviews in a row each find at most 2 repeats of an existing item: then every 3 days; after 3 more such reviews, weekly. Basheer decides each step — proposed
- A slip already covered by an existing rule gets +1 on that item, never a new P-number; at the review each such item gets one of two answers: "enforce with a tool" or "accept as is" — proposed
- At most 10 open items in the tracker; adding one beyond that means closing one first — proposed
- Items seen once that are narrow tactics are dropped with a one-line reason; a narrow item that belongs to one procedure becomes one line in that procedure's skill or template — proposed
- CLAUDE.md shrinks to about half by moving procedures into skills/templates that load only when used; nothing is deleted by the move itself — deletions come only from the sorted list below, which Basheer approves — proposed
- New skill `cabio-e2e-testing` holds the "Pre-E2E code review" and "Manual E2E testing" sections; new skill `process-review` holds the review procedure (as `doc-integrity-sweep` does for the tidy-up) — proposed
- Each shell guard rail is reviewed against its deny log; a guard whose denials were harmless is loosened to stop only the dangerous case — proposed

## Open questions for Basheer (asked 2026-10-08; he is taking time to answer)

The "proposed" lines above, written as questions, with Claude's recommendation first.

1. **Which day does the process review run?** I recommend the same day as the UAT data-quality check. The documentation tidy-up already runs on the other days, so each day has one review chore. With that, tomorrow would be a UAT check plus process review day, and the day after a tidy-up day.
2. **When does the frequency come down?** I recommend: after 3 reviews in a row that each find at most 2 repeats of an existing item, move to every 3 days; after 3 more such reviews, move to weekly. You approve each change.
3. **What happens when a mistake repeats?** I recommend it adds +1 to the existing item and never gets a new P-number. At the review, each repeated item gets one of two answers: build a tool to enforce it, or accept it as is. Example: if I again forget a progress line during a build, P15's count goes from 7 to 8 instead of becoming a new item.
4. **Should there be a cap on open items?** I recommend at most 10 open at a time; adding an 11th means closing one first.
5. **Where do the procedures move?** I recommend two new skills that load only when needed. `cabio-e2e-testing` would take the "Pre-E2E code review" and "Manual E2E testing" sections out of the rules file. `process-review` would hold the review steps, the way the tidy-up skill does. The move itself deletes nothing; every rule gets a new home, and I'll show you a list of where each one went.
6. **The sorted list itself:** do you approve the 9 / 6 / 17 / 8 split as written in section 2, especially the 8 drops?

## 1. In plain terms

The tracker holds 42 suggestions and only 2 have been built. The
mistakes that repeat most are already covered by a written rule, and
the project rules file has grown to 2,878 words with 62 dated rules, all
read at the start of every session. Adding a rule after every slip has
stopped working: there are now too many to keep in view at each step.

This pass does four things:
1. Sorts every suggestion into build (a tool, template or check enforces
   it), merge (an existing rule already covers it), or drop.
2. Moves step-by-step procedures out of the always-read rules file into
   the skills and templates where they are used, and puts a short list
   of the most-repeated mistakes at the top.
3. Changes the retro rule so a repeat adds a count, not a new rule, and
   caps the open list.
4. Loosens guard rails that mostly blocked harmless commands — the
   guards are inconsistent (the same `cd … &&` command was blocked on
   7 Oct and allowed on 8 Oct), and tripping them is most of P14's 9
   repeats.

Then the review runs every alternate day.

## 2. The sorted list (proposed — Basheer approves before anything changes)

**Build — enforced by a tool, template or check (9)**

| P | What gets built |
|---|---|
| P1 (quarter part) | `scripts/quarter.py` prints the quarter code and months for a date, using the app's own quarter function; plans quote it |
| P2, P5, P40 | E2E test-plan template: live-data lines need a source and date on the line; standard cases "member with no activity", "dual-role person", "no-home-SBU person" |
| P6 | E2E test-plan template: a table mapping each plan decision to its code and test step; the test-plan guard refuses "Ready" with an empty row |
| P10 | Doc tidy-up: flag any migration creating a SECURITY DEFINER function without `REVOKE EXECUTE` |
| P24 | Save-time check: refuse a handover-note save above 150 lines |
| P32 | Shell guard: a PowerShell `git commit -m` is refused with "use `git commit -F <file>`" |
| P14 | Part 4: guard-rail review |

**Already covered — moves to a "Most-repeated mistakes" list at the top of CLAUDE.md (6)**

P1 (name the source of every number, 16×), P3 (plain explanation first, 12×),
P15 (progress line per finished file, 7×), P19 + P36 (a check handed to
Basheer names the record, what to see, and what he must do first, 5×),
P4 (light option first; ask "should this exist at all?", 4×), P21 (say
when what's built differs from what was approved, 3×).

**Merge — one clause added to the existing rule or skill, no new rule (17)**

| P | Merged into |
|---|---|
| P7, P23 | "Verify before claiming" |
| P8 | "Standing decisions" |
| P9 | "Parallel sessions" (commit check) |
| P11, P29, P41 | `cabio-e2e-testing` skill |
| P12, P39 | "Session handoff" (the note is a pointer, check its claims) |
| P13 | "Checkpoint commits" (say what stops working until the next step) |
| P16 | "Session handoff" (already says every pause) |
| P17 | "Parallel sessions" |
| P20 | `cabio-db-and-scripting` skill |
| P22 | Plan template section 3 |
| P25, P30 | "Feature planning" (a change of shape is a new decision; check in before each next step) |
| P31 | `docs/Deployment-Topology.md`, hotfix route |

**Drop — narrow, seen once (8)**

P18 (staged leftovers), P26 (old-vs-fixed switching), P27 (repeat
measurements), P34 (background-job sessions), P35 (temporary helpers),
P37 (chat table width), P38 (forced delete), P42 (UAT timing; already in
the Query Load plan section 6). Any that recurs comes back with evidence.

**Already built (2):** P28, P33.

Correction to the chat estimate of 2026-10-08 ("about 25 to drop"): read
one by one, most single sightings belong in an existing rule, so 8 drop
and 17 merge.

## 3. Build order

1. Basheer approves the sorted list and the proposed decisions.
2. New skills `cabio-e2e-testing` and `process-review`; move the two
   CLAUDE.md sections in word for word, then add the merged clauses.
3. CLAUDE.md: "Most-repeated mistakes" list at the top; merged clauses;
   moved sections replaced by one-line pointers; retro rule changed.
   Show the before/after word count and a list of every rule's new home.
4. Hook changes: `session-start.sh` section 2d becomes the alternate-day
   process review; handover line-count save check; PowerShell commit check.
5. Templates and `scripts/quarter.py`.
6. Guard-rail review: deny log per guard, proposed loosening, approved
   separately.
7. Tracker: sorted statuses written in; weekly-review header replaced.
   Commit (own approval). First alternate-day review on the next UAT
   check day.

Every shared file: `git status` / `git diff` first; another session may
be editing it.

## 4. Not in this plan (with reasons)

- The user-level CLAUDE.md (332 words) — already short; Basheer edits it.
- `docs/Process-Rules-History.md` — history, stays as written.
- The business-rule matrix drift — its own Backlog entry (2026-10-08).

## 5. Business rules and records to update

None in the app. Records: CLAUDE.md, `docs/Process-Improvements.md`,
`docs/Process-Rules-History.md` (one dated line for this change),
Progress-Archive.

## 6. Technical addendum

- Files: `CLAUDE.md`; `.claude/skills/cabio-e2e-testing/SKILL.md`,
  `.claude/skills/process-review/SKILL.md` (new);
  `.claude/hooks/session-start.sh` (2d); `.claude/hooks/shell_guard.py`,
  `cd_guard.py`, `test_plan_guard.py`; a handover save check alongside
  `plan-decisions-guard.sh` in `.claude/settings.json`;
  `docs/templates/Manual-E2E-Test-Plan-Template.md`; `scripts/quarter.py`.
- Evidence: `.claude/hooks/guard.log` — 73 `no-cd` and 25 `shell-guard`
  denials (to 2026-10-08).
