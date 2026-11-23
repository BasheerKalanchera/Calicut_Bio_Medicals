# Handover — Plan & Chore session
_Only the task actively in progress and its immediate next step. Limit 75
lines (the startup hook warns above that). Finished threads and waiting
items go to Progress-Archive; unstarted work goes to Backlog. Build & Test
keeps its own note: `.claude/session-handover-build.md`. Only the Plan & Chore
session edits this note._

- **23 Nov (now):** UAT backup `cabio_uat_2026-11-23_0711.dump` done (1,023,161 bytes, 537 TOC entries; pruned 11-08). Drive copy done (Basheer). Doc tidy-up done (found 8, fixed 5, 3 parked by Basheer; log and archive 23 Nov). Corrected price sheet checked: only the 4 queried rows changed, 58 priced, 0 out of order, 13 blank (archive 23 Nov). Haroon: Cabio doesn't sell the 13. UAT read-only checks done (archive 23 Nov): 11 unused; elite V6 on 1 Opportunity (ZYRA Koppam), SE-1202E on 1 lead; WhatsApp sent to Haroon (Basheer), waiting on his answer. **Product Deactivate plan** `docs/Product-Deactivate-Implementation-Plan.md` (new, untracked, Draft): D3, D4 Basheer 23 Nov; **D1, D2, D5–D8 waiting on Basheer**, then Approved → Build & Test. The 13 get switched off from the screen once it's on UAT (no migration). Docs batch not yet committed — this session's: Backlog, Business-Rules, BR Matrix, Manager-Note-Privacy plan, Pricing plan, Sweep-Log, archive, this note, the new Deactivate plan. Build & Test's Traceability, build note and Manager Note E2E plan are theirs, leave out. Offered, not answered: Backlog "Q1–Q6" → "Q1–Q5" fix. **Next:** D1, D2, D5–D8 answers; docs batch commit (show first); step 4 price load (which session, Basheer); retro (1 correction: "beating around the bush").
- **22 Nov:** UAT backup `cabio_uat_2026-11-22_1646.dump` done (537 TOC entries; pruned 11-07); Drive copy done (Basheer). Doc tidy-up skipped today (Basheer). Manager Note privacy committed and applied on Dev (`dac003f`); only the zone-only Area Manager E2E case is left (Build & Test). Forecast plan, Levers overview and mockup committed `8490bc9`; launch scripts `B`, `BT`, `PC` still untracked. Pricing rounding decided: plan D16 (Basheer 21 Nov, Haroon's OK 22 Nov; archive 22 Nov) — 21 Nov line's "confirm, then add it" is done. Docs batch `8b51350` pushed 22 Nov (retro included, 0 corrections). **Next:** the leadership team's answers on the 4 wrong + 13 blank rows, then step 4 load (which session, Basheer to say); then the Sales Loss Report questions.
- **21 Nov:** UAT backup `cabio_uat_2026-11-21_0633.dump` done (537 TOC entries; pruned 11-06); Drive copy done (Basheer). Doc tidy-up skipped today (Basheer). Manager Note privacy: already with Build & Test (no handoff needed). Plan & Chore read their uncommitted migration `0067_manager_note_privacy.py` against the plan, 21 Nov: matches D1–D6 and D10 (zone path needs the rep's SBU, reporting-line path doesn't; own-zone accounts covered via zone_closure self-row; downgrade restores 0046's rule). `docs/Physical-Schema.sql` was regenerated 06:41 from Dev naming 0067, so it looks applied on Dev though their note says "not applied" — not confirmed by query. Still theirs: tests (plan section 6), BR-ACT-02, 5 Sep plan line, Backlog, E2E plan, D10 into plan section 6. Left with Basheer: tell Haroon about D5; UAT people check (ask first) before the UAT move. **Product pricing sheet** (leadership team's filled sheet, Desktop\Cabio): checked 21 Nov, 4 rows wrong + 13 blank (archive 21 Nov); WhatsApp sent (Basheer). Plan line 99 updated (sheet received). Rounding: prices stay in lakhs, 2 decimals, like Opportunities; 9 values in 5 small products (Equipwell monitor stands, H100B, M3A, Sonotrax Basic) round to nearest ₹1,000 at load — Basheer said "note this", not yet a written yes, so not in the plan's Decisions; confirm, then add it. One-line note to the leadership team on rounding when they reply (draft in archive 21 Nov). Docs batch `f643076` pushed 21 Nov (retro included). **Next:** their answers, then step 4 load (Dev first; rupees ÷ 1,00,000) — which session, Basheer to say. Then Basheer picks from the waiting items below.
- **19 Nov:** UAT backup `cabio_uat_2026-11-19_0654.dump` done (537 TOC entries; pruned 11-04), Drive copy done (Basheer). Doc tidy-up skipped today (Basheer). Docs batch `e4d77e7` pushed (Build & Test's pricing archive lines left out, theirs). **Next:** Basheer's three answers (top 5 without Customer Wording; activity privacy rule — his call or Haroon's?; Activity Type table to /build next), then the Sales Loss Report plan. **Case studies:** shared with Area Managers 19 Nov; findings parked, re-run the scan week of 26 Nov, then good-example case studies (Backlog "Opportunity data habits"). Docs batch `d0490db` pushed 19 Nov (another session's retro line at archive line 2092 left out, theirs).
- **18 Nov: UAT backup and Harness review done (period-code check: leave it). Product pricing:** D14 — steps 1–3 start now in the Build session (Basheer asks it), only step 4 waits on Haroon's sheet; UAT catalog checked read-only (one entry per model, no probes; archive 18 Nov); E2E plan `docs/Product-Pricing-And-Cost-Manual-E2E-Test-Plan.md` (5 pre-flight, 32 steps). WhatsApp to Haroon (probes priced separately?) drafted for Basheer to send. All of this committed and pushed `10631f3` (Build & Test's 18 Nov archive entry left out, theirs). Afternoon 18 Nov (archive): /build's MUI-check fault reviewed (fix A, /build applies it); group-by-login E2E rule added; 14 Nov "deal" wording files and demo paper D11 go in the same docs batch (check `git log` for it). **Open with Basheer:** republish the two client scorecard pages; Traceability row 3 "hospital account" → customer wording? Open with Basheer: add the two wrong UAT product descriptions (OxyMag, Servo i) to the Backlog? Build & Test finished both (Customer Wording `176ec74`, "Why this change?" `2ee250c`). **Next:** Sales Loss Report plan (Backlog entry "Sales Loss Report"; must not depend on product lines) — Basheer to confirm the top 5, the activity privacy rule (logger and their managers only?) and the build order (wording, then Activity Type table — both touch Log Activity).
- **17 Nov: UAT backup (Drive copy done) and doc tidy-up done; Harness review skipped. Uncommitted, this session's:** Backlog (2 removals only — the new "Account → Customer" entry is Build & Test's, leave it out), Insights Dashboard plan, Simpler Table plan, Doc-Integrity-Sweep-Log, Progress-Archive-2026-11 (17 Nov entries), this note — committed and pushed `54de08b`. Since then: line-ending fix (P105) `dc0f087` and docs batch `2d0cb95` (Backlog entry "Opportunity stage change: keep the 'Why this change?' typing…" — Basheer hands it to Build & Test after the wording E2E; archive entries, retro) — both pushed 17 Nov. **Next:** the Sales Loss Report questions. **Still untracked:** launch scripts `B`, `BT`, `PC`; Forecast plan; `Operational-and-Financial-Levers.md`; `target-vs-actuals-mockup.html` (origin not recorded).
- **Training sessions for Haroon's team** (plan `docs/Target-Plan-Training-Implementation-Plan.md`, Draft; archive 5–10 Nov). Open: Naeem and Gopika pv not on Dev; Irfan leaving? (Basheer asking Haroon); Session 3 question; instalments; 9 tidy-up fixes (archive 6 Nov); Haroon's questions 12, 13, 15, 17–21 and screen suggestions, then the four fixes' own plan.
- **Waiting on Basheer:** price fields on products (5 questions); NPS hide/delete and Neutral/Passive; Traceability beyond-contract row 3 wording; demo qualification paper to send, P1 filter yes/no, Requested-list client diff; Backlog B5's three answers, then B6, B7 and the three yes/no plans (archive 13 Nov); Marketing User sweep plan and season-percentages carry-over (yes/no each); Chrome tab refresh to confirm SQL "Untitled query" is gone.
- Competitive Loss and Demo-to-sale plans: paused — don't start until Basheer says so (4 Nov).
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
