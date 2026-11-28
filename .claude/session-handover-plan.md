# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- **28 Nov (now):** UAT backup `cabio_uat_2026-11-28_0752.dump` done (537 TOC entries; pruned 11-13); Drive copy — Basheer. Doc tidy-up skipped (Basheer). Build's mailbox: (1) ◀ / "← Back" rules added to the MUI check (Basheer: this session, B&T busy), tested 8 of 8, committed and pushed `e6974c9` (lint 0 errors). (2) Sales Loss and Margin Report into the help list, 30 → 32 (Basheer yes; help plan D17), uncommitted. Mailbox emptied. **UAT price load script** (archive 28 Nov "UAT price load script"): the 23 Nov script recovered whole from transcript `a12d5a55…` (copy: this session's scratchpad `old_load/v01_write.py`, may be gone; re-extract from the transcript). UAT plan D4a–D4c added (openpyxl in `backend/.venv` done; new models only; fallback to the 23 Nov sheet; "Product type" column). Note to Haroon sent (Basheer, his wording, point 2 corrected). **Open:** cut-off time tonight replacing D4c's "10 pm" (recommended 7 pm; Basheer: no late night). **Next:** on his go-ahead, write `scripts/uat_price_load.py`: Excel read; match by name, new rows by Brand+Model; prices + cost + first-cost fill (`fill_empty_won_costs`), skipped in UAT mode because 0068 isn't there yet (D3a); `uat` switch, `--apply`; then Dev preview.
- **27 Nov:** UAT backup and Drive copy done; doc tidy-up skipped (Basheer). Weekly Harness review (Option B) **done**: items 1–2 in `b36ed86`, items 3–6 in `eeef91b` (pushed; archive 27 Nov; retro 2 corrections, new P111). Header name `2ac7f25` kept for good, goes to UAT; Sessions 2a/2b second half of Dec (Basheer). Mailbox message to Build & Test written (header name, code-comment task). **Evening (archive 27 Nov, evening):** session clock idle 30 → 10 min (tests 20 OK); scripting rule (Dev load scripts for UAT kept in `scripts/`). **UAT move plan** `docs/UAT-Promotion-2026-11-29-Plan.md` **Approved 27 Nov** (D0–D10, D3a–d). **Next:** Sat 28 Nov: rewrite the load script into `scripts/` (Dev first, new variations, D3b/D4), read-only UAT check with his yes (D6), 6 pm outcome (D10), team message (D8). Evening docs batch `94772b5` pushed (plan, clock, skills, rules history, tracker P112/P113, archive evening section incl. retro 4 corrections; Build & Test's note left out, theirs). Start-up files `B`/`BT`/`PC` fixed 20:15 (Build & Test's message; `//` instead of `MSYS_NO_PATHCONV`, archive 27 Nov evening) — **next start:** check the start-up note shows; this session still has the setting, so commit with `env -u MSYS_NO_PATHCONV git commit …`.
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
- Help wording into the help plan's section 7: 11 of 32 agreed (`8c853d4`;
  30 → 32 by D17, 28 Nov). Every reply closes with "Help wording: N of 32
  (P %)" (Basheer, 25 Oct). Help editor E2E plan still says 30: its save
  guard refuses any edit until it gets a phone-layout step — fix at build.
  **Next:** word-rules pass over the 10 earlier entries, then next screen.

## Harness Engineering

- Code and UI checks trial (Basheer, 28 Oct): Backlog "Code and UI checks
  — minimal-effort trial". Cap one day; show scope first.

## Chores

- UAT User Manual says "SBU Target & Plans" (now three cards, D75): on hold until Part 2 E2E passes.
- Delete Dev test data from Duplicate hospitals Part A (five "zz Test
  duplicate guard…" hospitals, "zz Test contact") and "kims" (Rudrappa,
  Dev role check 25 Oct); read-only check first.
