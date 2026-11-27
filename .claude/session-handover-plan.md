# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- **27 Nov (now):** UAT backup done, Drive copy done; doc tidy-up skipped (Basheer). **Weekly Harness review, Option B, in progress** (archive 27 Nov: counts, decisions). Done, uncommitted: 7 read-only permission rules in `.claude/settings.json`; 4 risky lines removed from `settings.local.json` (git-ignored); item 1 — retro in the clock's refresh message + end-of-session wording reminder (`session_clock.py`, 17 tests OK; `harness-engineering`, `cabio-post-commit`). Item 2 done, uncommitted: `/test` retired (skill + note `git rm`'d, CLAUDE.md, 3 skills, 3 hooks; archive 27 Nov). **Next, each shown to Basheer first:** 3 shorten `cabio-e2e-testing` (writing / running split, ~85 lines); 4 skill A session hand-offs (note shown first, archived once answered); 5 skill B messages for the Cabio team; 6 status line (time worked + start time); then Reviews line, retro, docs batch (leave out Build & Test's files: their note, Backlog, date-picker plan, Frontend standards, `docs/screenshots/2026-11-27-…png`, their archive lines). Session refreshed after item 2 (Basheer, 27 Nov); next session starts at item 3.
- **26 Nov:** UAT backup `cabio_uat_2026-11-26_0644.dump` done (537 TOC entries; pruned 11-11); Drive copy done (Basheer). Doc tidy-up and Harness review skipped (Basheer). **Sales Loss Report E2E plan corrected** (archive 26 Nov; 4 pre-flight, 32 steps; Basheer approved): step 1 no fast-track, step 5 no value, regrouped by login. Reviewed Build & Test's Margin Report E2E figures (archive 26 Nov); Basheer passed the points and his E1 answer to them — their plan, not ours. Docs batch `ce8fb44` pushed (Build & Test's note and both Margin plans left out, theirs). Probe-sets docs batch `d14624a` pushed (BR-CAT-08 + matrix row; sample list kept out of the repo as client data — Basheer). Morning session ended without its retro; written late (6 corrections, new P110 client-data item; archive 26 Nov). Later 26 Nov (archive): case-study scan re-run on UAT (`scripts/uat_case_study_scan.py`, committed `33ce392`); good-example Case C and the weekly-check figures table drafted (scratchpad, client data); the 7 possible-duplicate pairs read (3 real, 1 partial, 3 not); Haroon's date-picker cut-off saved to Backlog for Build & Test; retro written (1 correction). Docs batches `33ce392` and `afdf9c4` (photo, retro addendum: session total 3 corrections) pushed (Build & Test's archive sections, note and Margin plans left out, theirs). **Next (27 Nov):** draft the duplicates note for the team (Basheer sends); send the weekly-check message with the table. Haroon's photo moved to `docs/screenshots/2026-11-26-date-picker-cut-off.jpeg` and linked from the Backlog entry (Basheer yes). Other images: none in `docs/` (counted 26 Nov); asked Basheer whether he meant the architecture picture in the repo root (move to `docs/`?) — not answered. **Next, fresh session (Basheer chose Option B, 26 Nov):** this week's Harness review widened to the 9 skills — read the retros and open tracker items since 18 Nov, the 9 `SKILL.md` files, and the 41 transcripts since 18 Nov (144 MB; est. 1.5–2 h); show the exact skill changes per skill first; aim for shorter skills and tool checks, not more rules. Builder corrects loss-report labels in P2 when built.
- **25 Nov** (archive 25 Nov, midday, afternoon, late afternoon; committed to `c589836`). Machine-and-probe sets decided 26 Nov (BR-CAT-08); sample list PDF given to Basheer for the leadership team (archive 26 Nov) — waiting on Cabio's PO/invoice analysis. Backlog entry for "competitor's machine into installed equipment on a loss" — offered, not answered. 24 Nov's demo deck is done (demo held 24 Nov).
- **23 Nov** (details in archive 23 Nov). **Next:** UAT price load after the UAT move (its own yes, D7); switch off the 13 unsold products from the screen once Product Deactivate is on UAT; waiting on Haroon's WhatsApp answer (elite V6, SE-1202E); offered, not answered: Backlog "Q1–Q6" → "Q1–Q5" fix. **21–22 Nov** (archive 21–22 Nov) still open: launch scripts `B`, `BT`, `PC` untracked; Basheer to tell Haroon about Manager Note D5; UAT people check (ask first) before the UAT move.
- **19 Nov:** UAT backup `cabio_uat_2026-11-19_0654.dump` done (537 TOC entries; pruned 11-04), Drive copy done (Basheer). Doc tidy-up skipped today (Basheer). Docs batch `e4d77e7` pushed (Build & Test's pricing archive lines left out, theirs). **Next:** Basheer's three answers (top 5 without Customer Wording; activity privacy rule — his call or Haroon's?; Activity Type table to /build next), then the Sales Loss Report plan. **Case studies:** shared with Area Managers 19 Nov; findings parked, re-run the scan week of 26 Nov, then good-example case studies (Backlog "Opportunity data habits"). Docs batch `d0490db` pushed 19 Nov (another session's retro line at archive line 2092 left out, theirs).
- **17–18 Nov** (archive 17–18 Nov), still open with Basheer: republish the two client scorecard pages; Traceability row 3 "hospital account" → customer wording?; add the two wrong UAT product descriptions (OxyMag, Servo i) to the Backlog? Still untracked: Forecast plan; `Operational-and-Financial-Levers.md`; `target-vs-actuals-mockup.html` (origin not recorded).
- **Training sessions for Haroon's team** (plan `docs/Target-Plan-Training-Implementation-Plan.md`, Draft; archive 5–10 Nov). Open: Naeem and Gopika pv not on Dev; Irfan leaving? (Basheer asking Haroon); Session 3 question; instalments; 9 tidy-up fixes (archive 6 Nov); Haroon's questions 12, 13, 15, 17–21 and screen suggestions, then the four fixes' own plan.
- **Waiting on Basheer:** price fields on products (5 questions); NPS hide/delete and Neutral/Passive; Traceability beyond-contract row 3 wording; demo qualification paper to send, P1 filter yes/no, Requested-list client diff; Backlog B5's three answers, then B6, B7 and the three yes/no plans (archive 13 Nov); Marketing User sweep plan and season-percentages carry-over (yes/no each); Chrome tab refresh to confirm SQL "Untitled query" is gone.
- Demo-to-sale plan: paused — don't start until Basheer says so (4 Nov). (Competitive Loss = Sales Loss Report, Approved 25 Nov.)
- **Also urgent:** doc set for running 2–3 sessions in parallel, including the archive split (three decisions open).
- **Payment terms plan APPROVED 12 Nov;** build waits for Basheer's review with the Cabio leadership team; E2E plan after that. UAT fill-in list (7 Opportunities) with Haroon; Ambalpadi waits on Fahad (EMIs to Cabio or a lender?); 5 bank-loan customers not yet checked. Open on UAT: IQRAA value/lender, Gulf 5L line, SABA S50 Elite (archive 12–13 Nov).
- Forecast plan (untracked, written by Antigravity — Basheer 27 Oct): commit it, and by which session? Open. At review, line 110 → BR-FIN-09. Parked to 5 Nov (Basheer): `docs/Marketing-Lead-To-Project-Implementation-Plan.md`, Draft; **next:** discuss D1–D9.
- Backlog: remove Audit Trail Redesign and Milestone 2, move the Target vs Actuals Marketing User bullet into the sweep entry (check `git diff docs/Backlog.md` first). Annual SBU card: ignore quarters before 2026-Q3? (Basheer).

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
