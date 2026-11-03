# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- Forecast plan (untracked, written by Antigravity — Basheer 27 Oct): commit it, and by which session? Open. At review, line 110 → BR-FIN-09.

## 3 Nov — papers with Haroon; scorecard republish

- Overdue next actions paper `docs/Discussion-Overdue-Next-Actions-2026-11.md`
  (Q1–Q6). **Next:** Basheer sends the WhatsApp summary to Haroon.
- Salesperson Performance paper section 10 (`d5b6a96`). **Next:** Basheer
  sends 10.4 to Haroon. Product-cost question: Basheer checking with him.
- **Next:** republish both client scorecard pages (diff shown 3 Nov,
  Basheer not yet answered).

## Build queue for `/build` (all Approved, E2E plans written)

- Next: Activity Type table (Approved 31 Oct, D1–D12; E2E plan
  `docs/Activity-Type-Table-Manual-E2E-Test-Plan.md`, 35 steps, Dev data
  checked 31 Oct 15:20 IST; `8c7a445`). Simpler table and Planning tabs
  are built and in `main`. Plan & Chore confirms plan and step before
  each `/build` starts.

## Rollout: when planning counts — to plan (Basheer, 30 Oct)

- Planning in the system won't be done properly in Oct–Dec; July–Sep Opportunities
  were entered without targets (paper only). Backlog "Rollout: when
  planning starts to count". Q1 decided (B — Oct–Dec learning quarter,
  Jan–Mar 2027 first proper one). App today counts from Oct–Dec
  (`FIRST_SAVED_PERIOD`, service.py:649). Q2 decided: (a) "Learning
  quarter, not counted", fix during the Simpler Table E2E; Backlog +
  Annual Target D66 updated. Still to add it to Simpler Table plan
  Decisions, its E2E plan, Business-Rules. Q3 decided: paper targets stay
  on paper. **Next:** Q4 (exit criteria); then ADR.

## After the UAT move (25 Oct, details in the archive)

- Duplicate hospitals step 19 on UAT; Audit Trail plan step 5 cautions.

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

- "← Back" check: /build after its MUI round 1 fixes (Basheer) — Backlog
  entry and /build's note still to update (quarter → year wording too).
  MUI check printing "no staged .ts/.tsx files" with three staged: not
  looked at yet.
- Code and UI checks trial (Basheer, 28 Oct): Backlog "Code and UI checks
  — minimal-effort trial". Cap one day; show scope first.

## Chores

- UAT User Manual says "SBU Target & Plans" (now three cards, D75): on hold until Part 2 E2E passes.
- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact") and "kims" (Rudrappa,
  Dev role check 25 Oct); read-only check first.
  Open: deactivate the test Marketing User login (2026-10-10)?
