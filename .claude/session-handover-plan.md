# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- 5 Nov. **In progress: Target and plan training sessions for Haroon's team** (archive 5 Nov has the session plan and UAT team list). Order agreed, plan `docs/Target-Plan-Training-Implementation-Plan.md` (Draft, holds the dry-run step list; pushed `690c771`). 6 Nov: decisions recorded in the plan (pushed `32bc3bb`); picture republished, version 2 (https://claude.ai/artifact/KGBPpfiLUw8n39LTBbqCnd). Mock 2028 figures removed after the dry run and after Sessions 1, 2a and 2b (Basheer). Naeem and Gopika pv aren't on Dev: still to decide. Basheer checking with Haroon whether Irfan is leaving.
- **Also urgent:** doc set for running 2–3 sessions in parallel, including the archive split (three decisions open).
- 6 Nov: Option 2 for a manager's plan (one figure for the whole target, with a "My team" line), confirmed by Haroon by phone, who also wants to see each rep's target and plan detail; in the training plan, pushed `32bc3bb`. Design questions 2–8 decided by Basheer, also in the plan. Last two Decisions answered 6 Nov (no commit date; no alert to Latheef Bhai for now), uncommitted. **Session 1 with Haroon: morning of 7 Nov, ready by end of 6 Nov (Basheer).** Picture is now one slide, republished 6 Nov. Removal script: `C:\Users\Basheer\AppData\Local\Temp\claude\64ff8a3d3152792a\7c7d2394-d312-4f5b-8b08-008fb3f427d9\scratchpad\dev_remove_2028_mock.py` (rehearses unless given `--apply`). Logins in (normal Edge Haroon, Chrome Incognito Arun Adarsh, normal Chrome Vivek); Dev 2028 still empty, re-checked 6 Nov before step 1. Dry run steps 1–19 passed (Basheer, 6 Nov); mock data removed from Dev 6 Nov, re-checked empty. The four fixes go in with Haroon's suggestions (Basheer, 6 Nov). Pushed `07a6abf`. Still open: Session 3 question; instalments; 9 tidy-up fixes (archive 6 Nov).
- 9 Nov: UAT backup done (`cabio_uat_2026-11-09_1242.dump`, archive 9 Nov); Drive copy done (Basheer). MUI round 1 Part 1 paperwork done (archive 9 Nov). Both sessions' docs batch pushed as `08383b0` (with Build & Test's 7 Nov items). Later session's retro written (archive 9 Nov, 4 corrections). Doc tidy-up done (log 9 Nov, found 10, fixed 8, in `08383b0`; archive 9 Nov); DQ check paused again until bulk next actions is on UAT + ~1 week (Basheer). Harness review done 9 Nov (tracker Reviews line; 106 corrections in 29 sessions vs 79 in 21; nothing built; 8 watch-list lines deleted), uncommitted (`docs/Process-Improvements.md`). **UAT move plan** `docs/UAT-Promotion-2026-11-Plan.md` Draft, in `08383b0`; D1–D11 all decided; **move Tue 10 Nov 07:00 IST** (D3, Basheer 9 Nov; timing message sent by Basheer, 8 am follow-up proposed; pre-check ALL PASSED, UAT at 0063, no rejected plans — archive 9 Nov; training order settled 9 Nov: 2a/2b on Dev after the fixes, Session 3 on UAT after the second move). Plan edits uncommitted: D7 five Area Managers incl. Naeem (Basheer); restore doesn't touch passwords (`backup_uat.ps1:117`, public only). Pilot passwords done 9 Nov, Haroon and Latheef Bhai, 1 row each (archive 9 Nov). **Next:** confirm end-sign-ins command; prepare after-move check and per-person password commands (plan section 2, step 3). Passwords in the move window (D7); Basheer's own changed 9 Nov (archive 9 Nov); open: Basheer refreshes the Claude Chrome tab to confirm SQL "Untitled query" is gone. Retros: archive 9 Nov (1 and 2 corrections). 7 Nov: Session 1 deck published, https://claude.ai/artifact/QrpyAogcd8fFc9uMs1Xf32 (private until Basheer shares it). Plan and archive updated, uncommitted. Session 1 done, went well (Basheer); Latheef Bhai's approval step worked; header name helped. Temporary header name: Backlog entry added, remove before the UAT move (Basheer). Haroon's decisions 1–8 recorded in the plan's Decisions (2 changed: plans may be above or below target; app says so neutrally; 3: mismatch also on Haroon's managers list); pushed `101db3b`. Mock 2028 data removed from Dev after Session 1, re-checked empty (Basheer yes, 7 Nov; archive). Haroon's answers 9, 10, 11, 14, 16 recorded (archive 7 Nov, second session); pushed `d88c29d`. **Waiting on Basheer:** Adydev (read-only UAT check proposed 8 Nov, not run); price fields on products (5 questions); qualified demo checklist — continue after the UAT move, 10 Nov after 08:00 (archive 9 Nov evening, open 1–6; paper not yet written); NPS saved scores hide/delete and Neutral/Passive; Traceability beyond-contract row 3 wording (shown). **Next:** remaining questions 12, 13, 15, 17–21 and Haroon's screen suggestions; then the four fixes' own plan.
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
