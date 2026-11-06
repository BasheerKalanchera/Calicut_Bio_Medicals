# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- 5 Nov. **In progress: Target and plan training sessions for Haroon's team** (archive 5 Nov has the session plan and UAT team list). Order agreed, plan `docs/Target-Plan-Training-Implementation-Plan.md` (Draft, holds the dry-run step list; pushed `690c771`). 6 Nov: decisions recorded in the plan (uncommitted); picture republished, version 2 (https://claude.ai/artifact/KGBPpfiLUw8n39LTBbqCnd). Mock 2028 figures removed after the dry run and after Sessions 1, 2a and 2b (Basheer; script shown first, not written yet). **Next:** Basheer finishes the Customer with No Activity E2E first. Then a read-only Dev check that 2028 is still empty, and the dry run with him, in a fresh session, on Dev. Logins: normal Chrome, Incognito, Edge (Basheer, 6 Nov; Edge InPrivate as the fourth); not yet tested. Naeem and Gopika pv aren't on Dev: decide after the dry run. Basheer checking with Haroon whether Irfan is leaving.
- **Also urgent:** doc set for running 2–3 sessions in parallel, including the archive split (three decisions open).
- 6 Nov: Option 2 for a manager's plan (one figure for the whole target, with a "My team" line), confirmed by Haroon by phone, who also wants to see each rep's target and plan detail; in the training plan, uncommitted. Design questions 2–8 decided by Basheer, also in the plan. **Next:** Basheer answers the plan's two "proposed" Decisions (commit date, bell for Latheef Bhai); write the fixes' own plan; correct the picture's steps 4 and 8, diff first; Haroon's answers to questions 9–20 (archive 6 Nov). Answers also awaited: instalments; 9 tidy-up fixes (exact wording, archive 6 Nov).
- Forecast plan (untracked, written by Antigravity — Basheer 27 Oct): commit it, and by which session? Open. At review, line 110 → BR-FIN-09.
- Parked to 5 Nov (Basheer): `docs/Marketing-Lead-To-Project-Implementation-Plan.md`, Draft. **Next:** discuss D1–D9.

## 4 Nov — Competitive Loss and Demo-to-sale plans: paused

- Don't start either until Basheer says so (4 Nov). Dev look only; no plan file.

## 3 Nov — papers with Haroon; scorecard republish

- Overdue next actions paper `docs/Discussion-Overdue-Next-Actions-2026-11.md`
  (Q1–Q6), committed and pushed `58e7de2`. Already sent to the Cabio
  leadership team (Basheer, 6 Nov). **Next:** record their answers.
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

- Backlog "Rollout: when planning starts to count" holds Q1–Q3 (decided).
  App counts from Oct–Dec today (`FIRST_SAVED_PERIOD`, service.py:649).
  Still to add Q2 to Simpler Table plan Decisions, its E2E plan,
  Business-Rules. **Next:** Q4 (exit criteria); then ADR.

## After the UAT move (25 Oct, details in the archive)

- Duplicate hospitals step 19 on UAT; Audit Trail plan step 5 cautions.

## User Manual and help catch-up

- Moves a day or two after the app (User Manual plan D15). **Next:** Basheer
  reviews draft PDF `Desktop\cabio\Cabio-Sales-OS-User-Manual.pdf`.

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
