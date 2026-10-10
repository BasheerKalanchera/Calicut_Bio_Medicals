# Process Improvements — tracker

One line per process suggestion from a session retro. Retros cite the
P-number; detail stays in Progress-Archive. Reviewed weekly (Monday;
SessionStart hook reminds): build at most 3, and drop or park with a date
anything skipped in two reviews. Status: open · built (<commit>) · merged (<where>, <date>) · dropped (<why>).

| # | Suggestion | First seen | Seen | Status |
|---|---|---|---|---|
| P1 | Every example and number in a plan or explanation names its source ("Dev query, 4 Oct" / "made-up example"); a quarter is given as code and months, checked against the app's quarter calculation; weekly review spot-checks | 2026-09-26 | 24 | open — first review |
| P2 | Test plans still built on wrong assumptions after the 3 Oct template (4 Oct live-data note had wrong roles) | 2026-09-27 | 9 | open |
| P3 | Explanations need a second, plainer pass; a plan drafted for approval opens with a plain explanation of its structural choices | 2026-09-27 | 19 | open |
| P4 | Heavy option offered first, or a fix proposed before asking "should this be here at all?" | 2026-09-26 | 5 | open |
| P7 | During an incident, state only what the evidence shows; label guesses | 2026-10-05 | 2 | merged (CLAUDE.md "Verify before claiming", 2026-10-08) — repeated after merge 2026-10-08 |
| P8 | Write an agreed design decision into the plan doc the same turn | 2026-10-05 | 1 | merged (CLAUDE.md "Standing decisions", 2026-10-08) |
| P9 | Before committing a shared doc, check `git log -3 -- <file>` for my own heading | 2026-10-05 | 1 | merged (CLAUDE.md "Parallel sessions", 2026-10-08) |
| P10 | Doc tidy-up flags any migration creating a SECURITY DEFINER function without `REVOKE EXECUTE` | 2026-09-29 | 1 | open |
| P11 | Take each browser reading in one step, not refresh/wait/read | 2026-10-06 | 5 | open |
| P12 | Starting a step of an approved plan: read the plan doc, handover and archive first; go to the code only for what they don't say (but see P39: check the handover's claims) | 2026-10-06 | 1 | merged (CLAUDE.md "Session handoff", 2026-10-08) |
| P13 | A plan built in partial steps says, before approval, what stops working on Dev until the next step lands | 2026-10-06 | 1 | merged (plan template "Build order"; CLAUDE.md "Checkpoint commits"; CLAUDE.md "Feature planning", 2026-10-08) |
| P14 | Use the edit tools and absolute paths from the start (shell guard rails); when a tool offers a fix, view its diff before editing | 2026-10-06 | 14 | open |
| P15 | During a long build, one short progress line each time a file is finished | 2026-10-06 | 8 | open |
| P16 | Update the handover note at every checkpoint within a build, not only at the end | 2026-10-06 | 4 | merged (CLAUDE.md "Session handoff", 2026-10-08) — repeated after merge 2026-10-08; repeated after merge 2026-10-09 |
| P17 | When an agreement between sessions changes (e.g. commit order), write it where the other session looks — its plan's progress table or its handover section — the same turn | 2026-10-06 | 1 | merged (CLAUDE.md "Parallel sessions", 2026-10-08) |
| P18 | When an action leaves something staged or half-done (e.g. `git mv` stages a rename), say so in the same report | 2026-10-06 | 1 | dropped (seen once, narrow; plan step D, 2026-10-10) |
| P19 | A check handed to Basheer names the exact record to open and what he should see, picked from live data first | 2026-10-06 | 8 | open |
| P20 | Before writing a query or script, look up table names and allowed values in `Physical-Schema.sql`, never guess | 2026-10-06 | 1 | merged (`cabio-db-and-scripting` skill "Scripts", 2026-10-08) |
| P21 | If what's built differs from the wording Basheer approved, say so in the report and offer the choice | 2026-10-06 | 5 | merged (CLAUDE.md "Show before you act", 2026-10-08); repeated after merge 2026-10-09; repeated after merge 2026-10-10 |
| P22 | A before/after check in a plan says what is recorded before the change, when, and by whom | 2026-10-06 | 4 | open |
| P23 | Before a doc describes what a screen does today, read that screen's code | 2026-10-06 | 10 | merged (CLAUDE.md "Verify before claiming", 2026-10-08; repeated after merge, 2026-10-08); repeated after merge 2026-10-09; repeated after merge 2026-10-10 (×2) |
| P24 | After each handover-note edit, check its line count; if it recurs, a save-time check; offer a trim before adding a section | 2026-10-06 | 3 | open |
| P25 | If building shows the approved plan's shape must change (e.g. what an endpoint returns), stop and ask before writing the code | 2026-10-06 | 1 | merged (CLAUDE.md "Feature planning", 2026-10-08) |
| P26 | When old code is loaded for an old-vs-fixed comparison, run every planned case before switching back | 2026-10-06 | 1 | dropped (seen once, narrow; plan step D, 2026-10-10) |
| P27 | If a measurement is still unreliable after 2 tries, stop and report; never run two measurements against the same database at once | 2026-10-06 | 1 | dropped (seen once, narrow; plan step D, 2026-10-10) |
| P28 | A test plan for a change with nothing visible on screen lists every way into the changed code, found by a code search, and is in the plan at approval, not after the commit | 2026-10-06 | 4 | built (plan template section 3; Query Load plan step 7 step 0; 2026-10-08) — also covers places that reuse or pre-fetch the data |
| P29 | Before the first browser action in a test, say which step and why it can't be handed to Basheer | 2026-10-06 | 1 | merged (`cabio-e2e-testing` skill, 2026-10-08) |
| P30 | In an agreed multi-step plan, check in before starting each next step, even when the whole plan is approved | 2026-10-07 | 2 | merged (CLAUDE.md "Feature planning", 2026-10-08) |
| P31 | Before copying a `main` fix to UAT, check that what it uses (fields, tables, functions) exists on `uat`, and say so in the trip plan | 2026-10-07 | 1 | merged (Deployment-Topology "Fix to UAT ahead of a full promotion"; building on a branch from `uat` removes the risk, 2026-10-08) |
| P33 | Draft UAT reports go in a `drafts` folder inside the backups folder, where Basheer can open them; they move up only after his approval | 2026-10-07 | 1 | built (CLAUDE.md, 2026-10-07) |
| P34 | If a session is a background job, the first reply says so in plain words, lists what it can't do (edit the main folder or handover, push or merge into main), and offers to stop so Basheer can reopen it as an ordinary session | 2026-10-07 | 1 | dropped (seen once, narrow; plan step D, 2026-10-10) |
| P35 | If a check will be repeated, put it in the permanent tool, not a temporary helper | 2026-10-07 | 1 | dropped (seen once, narrow; plan step D, 2026-10-10) |
| P36 | Before each step, say in one line what Basheer needs to do first (start servers, sign in), or that he needs to do nothing | 2026-10-07 | 2 | open |
| P37 | Tables in chat: at most 5 short columns; longer detail goes inside a cell, not in more columns | 2026-10-07 | 1 | dropped (seen once, narrow; plan step D, 2026-10-10) |
| P38 | When a routine step hits an unexpected obstacle (e.g. a forced delete), say what caused it in the same report and propose fixing the cause then | 2026-10-07 | 1 | dropped (seen once, narrow; plan step D, 2026-10-10) |
| P39 | Before answering a status or "what's next" question, check every claim in the handover note against git, docs and code; the note is a pointer, not proof (qualifies P12) | 2026-10-07 | 1 | merged (CLAUDE.md "Session handoff", 2026-10-08) |
| P41 | Before any browser check of a fix, list which screens and filters reach the changed code; skip browser work on paths it does not touch | 2026-10-08 | 1 | merged (plan template "What could be affected"; `cabio-e2e-testing` skill, 2026-10-08) |
| P42 | Timing a screen on UAT: force a fresh load (hard refresh) every time; menu clicks within 30 s reuse the stored copy | 2026-10-08 | 1 | dropped (seen once; already in Query Load plan section 6; plan step D, 2026-10-10) |
| P43 | When a side topic comes up during a chore, first say what is left of the chore: finish it (commit proposal included) or say plainly it is paused and what remains | 2026-10-08 | 1 | merged (CLAUDE.md "Show before you act", 2026-10-08) |
| P44 | A small gap found in a tidy-up, with its fix already drafted, is fixed in the same sweep (with approval), not parked in the Backlog | 2026-10-08 | 1 | dropped (the gap rightly needed a decision; drift now blocked by the commit check; plan step D, 2026-10-10) |
| P45 | Small housekeeping edits (handover note, logs) are shown before they are made, like any other edit | 2026-10-08 | 1 | merged (CLAUDE.md "Show before you act", 2026-10-08) |
| P47 | A UAT script runs only the queries described when asking; anything extra is asked for first | 2026-10-08 | 1 | open |
| P49 | When a piece of work is finished, say which file to open and what to look for, so Basheer can review it | 2026-10-08 | 1 | merged (counted as a repeat of P19, 2026-10-10) |
| P51 | Before giving an example for a business rule, read the rules next to it (overrides, fast-tracks, exemptions); the example must not contradict them | 2026-10-09 | 1 | merged (counted as a repeat of P1, 2026-10-10) |
| P58 | Every migration: say upfront that Basheer runs `alembic upgrade head` (the classifier blocks Claude's run even for a policy-only change) | 2026-10-09 | 1 | built (`cabio-db-and-scripting` skill, 2026-10-09) |
| P59 | Before promising a kind of test (e.g. a database-level RLS test), check the suite has that kind; otherwise offer the alternative (a read-only Dev check) upfront | 2026-10-09 | 1 | merged (counted as a repeat of P2, 2026-10-10) |
| P60 | When a decision depends on how real users use the app, offer the check on UAT (with its approval), not Dev, and say why: Dev is mostly test data | 2026-10-10 | 1 | merged (counted as a repeat of P1, 2026-10-10) |
| P62 | When explaining a change, finding or E2E step, start with the screen (and card/tab) it affects | 2026-10-10 | 1 | built (CLAUDE.md "Show before you act", 2026-10-10) |
| P65 | Before writing a new rule or fix, check every save path it touches — status changes, and edit forms that resend hidden fields — not only who reads the value (was watch-list P57) | 2026-10-09 | 2 | open |
| P66 | When several decisions are open, show the first one alone and wait; the next follows its answer (was watch-list P61) | 2026-10-10 | 2 | open |

## Watch list

Slips seen once. A second sighting moves the slip to the table above
as a new P-number with Seen 2; a line with no repeat 7 days after "Added"
is deleted at the process review (git history keeps it). Rules:
`process-review` skill.

| Added | First seen | Was | What happened |
|---|---|---|---|
| 2026-10-10 | 2026-10-04 | P5 | Plans for a list/table screen state who is listed (zero rows, no-home-SBU people); test plans add "member with no activity" and "dual-role person" cases |
| 2026-10-10 | 2026-10-04 | P6 | Before E2E, trace each plan decision to its code and test step; a decision with neither blocks E2E |
| 2026-10-10 | 2026-10-07 | P32 | In PowerShell, commit from a saved message file (`git commit -F`); Windows PowerShell splits a `-m` message at its quote marks |
| 2026-10-10 | 2026-10-07 | P40 | The E2E test-plan template says each of the four live-data lines needs text on the line itself (the save check reads only that line) |
| 2026-10-10 | 2026-10-08 | P46 | In anything written for others, undecided ideas go under "Options" or are left out, never written as "we will" |
| 2026-10-10 | 2026-10-08 | P48 | When Basheer makes a decision conditional ("if we find more cases"), check the condition and bring it back to him; never record it as decided or held |
| 2026-10-10 | 2026-10-08 | P50 | In a long session, offer the docs batch commit again at each natural pause |
| 2026-10-10 | 2026-10-09 | P52 | Before saying something "isn't written anywhere else", read the relevant section or search several wordings; an exact-phrase miss proves nothing |
| 2026-10-10 | 2026-10-09 | P53 | A commit message matches the detail of recent commits: the why, what changed per file, test results where relevant |
| 2026-10-10 | 2026-10-09 | P54 | Saved output from a UAT check keeps each record's id, so a follow-up never needs another UAT connection |
| 2026-10-10 | 2026-10-09 | P55 | When the handover has several threads, ask which one before choosing from open files or uncommitted changes (they may be another session's) |
| 2026-10-10 | 2026-10-09 | P56 | Every recommendation states what it leaves uncovered |
| 2026-10-10 | 2026-10-10 | P63 | Run backend tests with the project's own Python (`backend/.venv`) from the start, not the computer-wide one |
| 2026-10-10 | 2026-10-10 | P64 | When a save on one screen changes figures another screen shows, the pre-E2E review checks the other screen is told to reload, and the test plan checks it without a hard refresh |
| 2026-10-10 | 2026-10-10 | — | A change to `Business-Rules.md` needs its row in `Business-Rule-Implementation-Matrix.md` in the same commit (the commit hook refused it) |
| 2026-10-10 | 2026-10-10 | — | A `!` command given to Basheer uses forward-slash paths (`/c/Users/…`); Git Bash strips Windows backslashes |
| 2026-10-10 | 2026-10-10 | — | Before saying what a test step proved, check what that step actually did (said step 2 proved SBU clearing; its user never had one) |
| 2026-10-10 | 2026-10-10 | — | A new test plan starts from `docs/templates/Manual-E2E-Test-Plan-Template.md` (the save check refused a from-scratch one) |

## Weekly reviews
- 2026-10-06 — first fill, from the retros of 2026-09-26 to 2026-10-06.
