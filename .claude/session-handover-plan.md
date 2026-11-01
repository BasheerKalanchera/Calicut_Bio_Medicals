# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- Forecast plan (untracked, written by Antigravity — Basheer 27 Oct): commit it, and by which session? Open. At review, line 110 → BR-FIN-09.

## Build queue for `/build` (all Approved, E2E plans written)

- Hospital next-action rule: merged into `main` 31 Oct (`dce73f5`,
  pushed); its E2E is Build & Test's.
- Then, in order: Target vs Actuals simpler table, Target & Coverage
  Planning tabs (both Approved 31 Oct, mock-up v26, `43f146e`); Activity
  Type table (Approved 31 Oct, D1–D12; E2E plan
  `docs/Activity-Type-Table-Manual-E2E-Test-Plan.md`, 35 steps, Dev data
  checked 31 Oct 15:20 IST; committed `8c7a445`, pushed). Plan & Chore confirms plan and step before
  each `/build` starts.

## Rollout: when planning counts — to plan (Basheer, 30 Oct)

- Planning in the system won't be done properly in Oct–Dec; July–Sep Opportunities
  were entered without targets (paper only). Plan the go-live quarter,
  pilot quarter, exit criteria, paper targets. Backlog "Rollout: when
  planning starts to count". 1 Nov: Q1 decided (B — Oct–Dec learning
  quarter, Jan–Mar 2027 first proper one; in the Backlog entry). App today
  counts from Oct–Dec (`FIRST_SAVED_PERIOD`, service.py:649). Q2 decided:
  (a) "Learning quarter, not counted", fix after Simpler Table merge
  (merged into main 1 Nov, `515a2f2`) during its E2E; Backlog + Annual Target D66 updated. After the
  merge: add it to Simpler Table plan Decisions, its E2E plan,
  Business-Rules. Q3 decided: paper targets stay on paper (official for
  Jul–Sep, Oct–Dec). **Next:** Q4 (exit criteria); then ADR.

## After the UAT move (25 Oct, details in the archive)

- Checks paused to 1 Nov: then run both scripts on UAT (ask first).
  Duplicate hospitals step 19 on UAT; Audit Trail plan step 5 cautions.

## User Manual and help catch-up

- Moves a day or two after the app (User Manual plan D15). Draft PDF
  `Desktop\cabio\Cabio-Sales-OS-User-Manual.pdf`. **Next:** Basheer
  reviews it.

## In-app help (help plan step 3a) — in progress 2026-10-22

- Step 3b (help editor) is Build & Test's plan (`4aadacc`), not yet built.
- Help wording into the help plan's section 7: 11 of 30 agreed (`8c853d4`).
  Every reply closes with "Help wording: N of 30 (P %)" (Basheer, 25 Oct).
  **Next:** word-rules pass over the 10 earlier entries, then next screen.

## Harness Engineering

- Weekly review done 1 Nov (tracker Reviews line): P98 session clock,
  P77 gap, P102 docs-batch reminder built, tests 18/18; 27 watch-list
  lines deleted. **Not committed** — harness commit to propose
  (`.claude/hooks/session_clock.py`, `session-clock.sh`, `shell_guard.py`,
  `shell-guard.sh`, `settings.json`, tracker). "← Back" check: /build
  after its MUI round 1 fixes (Basheer) — Backlog entry and /build's note
  still to update (quarter → year wording too). /build reported the MUI
  check printing "no staged .ts/.tsx files" with three staged: not looked
  at yet.
- Code and UI checks trial (Basheer, 28 Oct, via Build & Test): Backlog
  "Code and UI checks — minimal-effort trial". Cap one day; show scope first.

## Chores

- UAT User Manual still says "SBU Target & Plans" (now three cards;
  archive 23 and 26 Oct, Annual Target plan D75). **On hold** until the
  Part 2 E2E passes, then re-read the screens and redo the 4 edits.
- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact") and "kims" (Rudrappa,
  Dev role check 25 Oct); read-only check first.
  Open: deactivate the test Marketing User login (2026-10-10)?
