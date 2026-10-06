# Process Improvements — tracker

One line per process suggestion from a session retro. Retros cite the
P-number; detail stays in Progress-Archive. Reviewed weekly (Monday;
SessionStart hook reminds): build at most 3, and drop or park with a date
anything skipped in two reviews. Status: open · built (<commit>) · dropped (<why>).

| # | Suggestion | First seen | Seen | Status |
|---|---|---|---|---|
| P1 | Every example and number in a plan or explanation names its source ("Dev query, 4 Oct" / "made-up example"); weekly review spot-checks | 2026-09-26 | 11 | open — first review |
| P2 | Test plans still built on wrong assumptions after the 3 Oct template (4 Oct live-data note had wrong roles) | 2026-09-27 | 5 | open |
| P3 | Explanations need a second, plainer pass | 2026-09-27 | 8 | open |
| P4 | Heavy option offered first, or a fix proposed before asking "should this be here at all?" | 2026-09-26 | 4 | open |
| P5 | Plans for a list/table screen state who is listed (zero rows, no-home-SBU people); test plans add "member with no activity" and "dual-role person" cases | 2026-10-04 | 1 | open |
| P6 | Before E2E, trace each plan decision to its code and test step; a decision with neither blocks E2E | 2026-10-04 | 1 | open |
| P7 | During an incident, state only what the evidence shows; label guesses | 2026-10-05 | 1 | open |
| P8 | Write an agreed design decision into the plan doc the same turn | 2026-10-05 | 1 | open |
| P9 | Before committing a shared doc, check `git log -3 -- <file>` for my own heading | 2026-10-05 | 1 | open |
| P10 | Doc tidy-up flags any migration creating a SECURITY DEFINER function without `REVOKE EXECUTE` | 2026-09-29 | 1 | open |
| P11 | Take each browser reading in one step, not refresh/wait/read | 2026-10-06 | 3 | open |
| P12 | Starting a step of an approved plan: read the plan doc, handover and archive first; go to the code only for what they don't say | 2026-10-06 | 1 | open |
| P13 | A plan built in partial steps says, before approval, what stops working on Dev until the next step lands | 2026-10-06 | 1 | open |
| P14 | Use the edit tools and absolute paths from the start (shell guard rails); when a tool offers a fix, view its diff before editing | 2026-10-06 | 5 | open |
| P15 | During a long build, one short progress line each time a file is finished | 2026-10-06 | 6 | open |
| P16 | Update the handover note at every checkpoint within a build, not only at the end | 2026-10-06 | 1 | open |
| P17 | When an agreement between sessions changes (e.g. commit order), write it where the other session looks — its plan's progress table or its handover section — the same turn | 2026-10-06 | 1 | open |
| P18 | When an action leaves something staged or half-done (e.g. `git mv` stages a rename), say so in the same report | 2026-10-06 | 1 | open |
| P19 | A check handed to Basheer names the exact record to open and what he should see, picked from live data first | 2026-10-06 | 3 | open |
| P20 | Before writing a query or script, look up table names and allowed values in `Physical-Schema.sql`, never guess | 2026-10-06 | 1 | open |
| P21 | If what's built differs from the wording Basheer approved, say so in the report and offer the choice | 2026-10-06 | 2 | open |
| P22 | A before/after check in a plan says what is recorded before the change, when, and by whom | 2026-10-06 | 2 | open |
| P23 | Before a doc describes what a screen does today, read that screen's code | 2026-10-06 | 1 | open |
| P24 | After each handover-note edit, check its line count; if it recurs, a save-time check | 2026-10-06 | 1 | open |
| P25 | If building shows the approved plan's shape must change (e.g. what an endpoint returns), stop and ask before writing the code | 2026-10-06 | 1 | open |
| P26 | When old code is loaded for an old-vs-fixed comparison, run every planned case before switching back | 2026-10-06 | 1 | open |
| P27 | If a measurement is still unreliable after 2 tries, stop and report; never run two measurements against the same database at once | 2026-10-06 | 1 | open |

## Weekly reviews
- 2026-10-06 — first fill, from the retros of 2026-09-26 to 2026-10-06.
