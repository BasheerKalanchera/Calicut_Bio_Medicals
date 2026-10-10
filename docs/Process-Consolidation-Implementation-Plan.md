# Process Consolidation — Implementation Plan

**Status:** Approved, 2026-10-08 (Basheer).
**Traceability rows:** none (how Claude works, not an app feature).
**Design / discussion:** chat 2026-10-08; tracker `docs/Process-Improvements.md`.

## Decisions

- Full pass: sort all tracker items, shorten CLAUDE.md, change how retros feed the tracker, review the guard rails — Basheer, 2026-10-08
- Process review runs daily until the process is streamlined (replaces the weekly review) — Basheer, 2026-10-08
- Frequency comes down as process adherence improves; Basheer decides each step. Claude brings the repeat counts to each review as the evidence — Basheer, 2026-10-08
- A slip already covered by an existing rule gets +1 on that item, never a new P-number; at the review each such item gets one of two answers: "enforce with a tool" or "accept as is" — Basheer, 2026-10-08
- Goal: Basheer's daily time on process work ("harness engineering") comes down to zero; every step is judged by that — Basheer, 2026-10-08
- At most 10 open items in the tracker. If the list goes over 10, process work stops until all open items are fixed, then the list starts fresh; app work continues in the parallel build session. The limit is lowered as progress allows, Basheer deciding each step — no fixed sequence — Basheer, 2026-10-08
- Items no tool can fully block (e.g. P3, plain explanation first — improving since the 2026-10-08 rule change): watch progress and decide case by case — Basheer, 2026-10-08
- After a finished feature or fix (not checkpoint or docs commits), the after-commit pack runs a paperwork check of every doc that names the work — Traceability, Backlog, other plans, handover — not only the feature's own plan — Basheer, 2026-10-08
- The end-of-session retro checks whether the right pack was opened for each job; the daily review reads the retro's count — Basheer, 2026-10-08
- Step-by-step procedures move out of CLAUDE.md into the SKILL.md files where they are used; the move deletes nothing — Basheer, 2026-10-08
- The sorting in section 2 is approved, and the work runs in Pareto order: build the skills first, fold the small items in, then the top 10 by impact, then drop the rest — Basheer, 2026-10-08
- The four small one-off checks (P6, P10, P24, P32) count as one top-10 item, "small guards batch" — Basheer, 2026-10-08
- A slip seen once goes on a watch list in `docs/Process-Improvements.md` and gets a P-number only on its second sighting; slips touching live data, UAT or lost work get one at once. Watch-list lines with no repeat 7 days after they were added are deleted at the review — Basheer, 2026-10-10
- No separate retro file; full retro text stays in Progress-Archive — Basheer, 2026-10-10
- The 15 items added since 8 Oct (P46–P61, less built P58) and the old seen-once items are sorted by the new rules: 4 counted as repeats (P49 → P19, P51 → P1, P59 → P2, P60 → P1); 16 moved to the watch list (P5, P6, P32, P40, P46, P48, P50, P52–P57, P61, and P63–P64 from the 10 Oct retro); P47 and P10 stay open (UAT / database security). Open list 40 → 13 items in 11 jobs: the top 10 below (small guards batch now P10 + P24) plus P47 — Basheer, 2026-10-10

## 1. In plain terms

The tracker holds 45 suggestions (seen 114 times in all — sum of its
"Seen" column, 8 Oct) and only 2 have been built. The mistakes that
repeat most are already covered by a written rule, and the project rules
file has grown to 2,878 words, all read at the start of every session.
Adding a rule after every slip has stopped working: there are now too
many to keep in view at each step.

This pass, in order:
1. Moves step-by-step procedures out of the always-read rules file into
   skills and templates that load only when used — about 1,000 words
   (35%) of the rules file. The rest are rules that must stay in view
   all the time (corrected from 1,300 / 45% after a line-by-line read).
2. Folds 19 small suggestions into an existing rule or skill as one
   sentence each, and closes them.
3. Works through the 10 items that give most of the benefit (the top 9
   by repeat count cover 69 of the 114 sightings, 61%), each enforced by
   a tool, template or check where possible.
4. Drops 8 narrow one-off items.

Then the process review runs every day until mistakes fall.

## 2. The sorted list

**Step A — procedures that move out of CLAUDE.md (word counts, 8 Oct)**

| From CLAUDE.md | Words | New home |
|---|---|---|
| "Pre-E2E code review" + "Manual E2E testing" + "Testing narration" | ~545 | new skill `cabio-e2e-testing` |
| "Post-commit checklist" + "Scorecard integrity" + "Natural Transition Checkpoint" | ~310 | new skill `cabio-post-commit`; adds the paperwork check (new wording, shown before saving) |
| "Retros and weekly review" | ~50 | new skill `process-review`: end-of-session retro (incl. right-pack check) and daily review (new wording, shown before saving) |
| "UAT data-quality check" details | ~90 | `cabio-db-and-scripting` skill |
| Feature planning: environments, heavy-vs-light, no symmetry cases, "Mirroring an existing feature" | ~150 | `docs/templates/Implementation-Plan-Template.md` |

Each moved section leaves a one-line pointer in CLAUDE.md. The short
"never do X" rules (safety, UAT access, commit approval) stay.

**Step B — fold in as one sentence, then close (18; done 2026-10-08)**

| P | Folded into |
|---|---|
| P7, P23 | "Verify before claiming" |
| P8 | "Standing decisions" |
| P9, P17 | "Parallel sessions" |
| P12, P16, P39 | "Session handoff" (the note is a pointer, check its claims; update at every checkpoint) |
| P13 | Plan template "Build order" + "Checkpoint commits" + "Feature planning" (say what stops working on Dev until the next step) |
| P21, P43, P45 | "Show before you act" |
| P25, P30 | "Feature planning" (a change of shape is a new decision; check in before each next step) |
| P29 | `cabio-e2e-testing` skill |
| P41 | Plan template section 3 + `cabio-e2e-testing` skill (check with Basheer before browser checks) |
| P20 | `cabio-db-and-scripting` skill, "Scripts" |
| P31 | `docs/Deployment-Topology.md`, new "Fix to UAT ahead of a full promotion" (hotfix branch from `uat` removes the risk) |

**Step C — the top 10, in Pareto order (the open list)**

| # | P (seen) | Fix |
|---|---|---|
| 1 | P1 (21) | `scripts/quarter.py` prints the quarter code and months for a date, using the app's own quarter function; plan and test-plan templates give each number a source slot; each daily review spot-checks 3 numbers |
| 2 | P3 (12) | Top of a short "Most-repeated mistakes" list at the head of CLAUDE.md; each daily review checks a sample of explanations |
| 3 | P14 (9) | Guard-rail review: deny log per guard; a guard whose denials were harmless is loosened to stop only the dangerous case (approved separately) |
| 4 | P15 (7) | Automatic reminder after each finished file during a build |
| 5 | P2 (6), P5, P40 | E2E test-plan template: every live-data line names its source and date; standard cases "member with no activity", "dual-role person", "no-home-SBU person" |
| 6 | P19 (5), P36 | Fixed format for every check handed to Basheer: what to do first, which record, what to see — in `cabio-e2e-testing` |
| 7 | P11 (5) | One step per browser reading — in `cabio-e2e-testing` |
| 8 | P4 (4) | Plan template line: lighter option, and "should this exist at all?" |
| 9 | P22 (4) | Plan template: a before/after check says what is recorded, when, and by whom |
| 10 | P6, P10, P24, P32 (1 each) | Small guards batch: test-plan guard refuses "Ready" without a decision-to-test row (P6); doc tidy-up flags a SECURITY DEFINER function without `REVOKE EXECUTE` (P10); save-time check refuses a handover note above 150 lines (P24); shell guard refuses a PowerShell `git commit -m` with "use `git commit -F <file>`" (P32) |

Items 1, 2, 4 and 6 also appear in the "Most-repeated mistakes" list at
the top of CLAUDE.md.

**Step D — drop, narrow and seen once (9)**

P18 (staged leftovers), P26 (old-vs-fixed switching), P27 (repeat
measurements), P34 (background-job sessions), P35 (temporary helpers),
P37 (chat table width), P38 (forced delete), P42 (UAT timing; already in
the Query Load plan section 6), P44 (moved from step B 2026-10-08: the
incident was a large gap that rightly needed a decision; drift is now
blocked by the commit check). Any that recurs comes back with evidence.

**Already built (2):** P28, P33.

Tally: 16 in the top 10 + 18 folded + 9 dropped + 2 built = 45.
Corrections to chat: the 2026-10-08 estimate "about 25 to drop" became 8
once read one by one; "20 to fold in" is 19 (P11 and P22 moved into the
top 10, P21 and P43–P45 joined).

## 3. Build order

1. Skills: create `cabio-e2e-testing`, `process-review` and
   `cabio-post-commit`; move the step A sections in word for word; move
   the plan-writing details into the plan template.
2. CLAUDE.md: moved sections replaced by one-line pointers; retro rule
   changed (repeat = +1, cap of 10). Show the before/after word count and
   a list of every rule's new home.
3. Step B: fold the 18 items in; mark them closed in the tracker. Done
   2026-10-08; tracker updated as each item was approved.
4. Step C, items 1 → 10 in order. Item 3 (guard rails) gets its own
   approval for the loosening.
5. Hook: `session-start.sh` section 2d becomes the daily process review.
6. Tracker: header rewritten (daily review, cap of 10, repeat rule);
   statuses written in; step D items marked dropped with their reason.
7. Commit (own approval) at each natural pause; first daily review the
   day after step 6.

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
  `.claude/skills/process-review/SKILL.md`,
  `.claude/skills/cabio-post-commit/SKILL.md` (new);
  `.claude/hooks/session-start.sh` (2d); `.claude/hooks/shell_guard.py`,
  `cd_guard.py`, `test_plan_guard.py`; a handover save check and a
  build-progress reminder alongside `plan-decisions-guard.sh` in
  `.claude/settings.json`; `docs/templates/Manual-E2E-Test-Plan-Template.md`,
  `docs/templates/Implementation-Plan-Template.md`; `scripts/quarter.py`.
- Word counts: `awk` per `## ` heading of CLAUDE.md, 2026-10-08.
- Evidence for item 3: `.claude/hooks/guard.log` — 73 `no-cd` and 25
  `shell-guard` denials (to 2026-10-08).
