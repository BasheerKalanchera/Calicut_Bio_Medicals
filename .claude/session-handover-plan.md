# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- **16 Nov (now): Customer wording plan APPROVED** (`docs/Customer-Wording-Implementation-Plan.md`; 3 commits: MUI restyle of 3 screens, wording, code-names rename — Basheer). Build & Test is building it (started 16 Nov from the uncommitted plan). E2E plan `docs/Customer-Wording-Manual-E2E-Test-Plan.md` written (29 steps, Dev data 16 Nov). Both in the 16 Nov docs batch, pushed `1c34f3f`. Archive 16 Nov has the top 5 review and retro (3). **Next:** Sales Loss Report plan (Backlog entry "Sales Loss Report"; must not depend on product lines) — Product pricing and cost plan approved 16 Nov, pushed `5919c21`, waits on Haroon's sheet (Backlog "Waiting on people"); Basheer to confirm the top 5, the activity privacy rule (logger and their managers only?) and the build order (wording, then Activity Type table — both touch Log Activity).
- **17 Nov: UAT backup (Drive copy done) and doc tidy-up done; Harness review skipped. Uncommitted, this session's:** Backlog (2 removals only — the new "Account → Customer" entry is Build & Test's, leave it out), Insights Dashboard plan, Simpler Table plan, Doc-Integrity-Sweep-Log, Progress-Archive-2026-11 (17 Nov entries), this note. **Next:** propose that docs batch; then the Sales Loss Report questions. **Left out of the 16 Nov batch, still uncommitted:** Traceability, both scorecard HTML files, Phase1 Scorecard, `Discussion-Demo-Qualification-2026-11.md` (origin not checked; client-visible — load `cabio-post-commit`, show the diff first); `Progress-Archive-2026-08.md` (line endings only); launch scripts `B`, `BT`, `PC`.
- **Critical Care 2026 brand targets on UAT:** Basheer chose 0 for Equipwell, Kolkatta, We Make; rehearsal matched (archive 14 Nov). **Apply waits on Basheer's yes** (UAT rule).
- **Training sessions for Haroon's team** (plan `docs/Target-Plan-Training-Implementation-Plan.md`, Draft; archive 5–10 Nov). Open: Naeem and Gopika pv not on Dev; Irfan leaving? (Basheer asking Haroon); Session 3 question; instalments; 9 tidy-up fixes (archive 6 Nov); Haroon's questions 12, 13, 15, 17–21 and screen suggestions, then the four fixes' own plan.
- **Waiting on Basheer:** price fields on products (5 questions); NPS hide/delete and Neutral/Passive; Traceability beyond-contract row 3 wording; demo qualification paper to send, P1 filter yes/no, Requested-list client diff; Backlog B5's three answers, then B6, B7 and the three yes/no plans (archive 13 Nov); Marketing User sweep plan and season-percentages carry-over (yes/no each); Chrome tab refresh to confirm SQL "Untitled query" is gone.
- **Also urgent:** doc set for running 2–3 sessions in parallel, including the archive split (three decisions open).
- **Payment terms plan APPROVED 12 Nov;** build waits for Basheer's review with the Cabio leadership team; E2E plan after that. UAT fill-in list (7 Opportunities) with Haroon; Ambalpadi waits on Fahad (EMIs to Cabio or a lender?); 5 bank-loan customers not yet checked. Open on UAT: IQRAA value/lender, Gulf 5L line, SABA S50 Elite (archive 12–13 Nov).
- Forecast plan (untracked, written by Antigravity — Basheer 27 Oct): commit it, and by which session? Open. At review, line 110 → BR-FIN-09. Parked to 5 Nov (Basheer): `docs/Marketing-Lead-To-Project-Implementation-Plan.md`, Draft; **next:** discuss D1–D9.
- Backlog: remove Audit Trail Redesign and Milestone 2, move the Target vs Actuals Marketing User bullet into the sweep entry (check `git diff docs/Backlog.md` first). Annual SBU card: ignore quarters before 2026-Q3? (Basheer).

## 4 Nov — Competitive Loss and Demo-to-sale plans: paused

- Don't start either until Basheer says so (4 Nov). Dev look only; no plan file.

## 3 Nov — papers with Haroon; scorecard republish

- Overdue next actions paper `docs/Discussion-Overdue-Next-Actions-2026-11.md`
  (Q1–Q6), committed and pushed `58e7de2`. Already sent to the Cabio
  leadership team (Basheer, 6 Nov). **Next:** record their answers.
- Salesperson Performance paper section 10 (`d5b6a96`). 10.4 answered 9 Nov
  (archive 9 Nov). Product-cost question: Basheer checking with him.

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
