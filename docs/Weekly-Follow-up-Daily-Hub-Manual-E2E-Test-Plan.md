<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Weekly Follow-up (My Work) — Manual E2E Test Plan

**Covers:** `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`, steps
2–5 (step 1 passed its Dev check 2026-10-19 and is on UAT).
**Built:** steps 2, 4 and 5 on branch `worktree-build` (`42bd5f8`,
`8d4bdac`, `d4a8df4`; code-review fixes `8c0e0c9`), merged after the
Annual Target Planning Part 2 E2E (D18).
**Where:** Dev.

**Read first (Build session, 28 Oct):** nobody has seen My Work in a
browser. The Build session has no browser, so the usual phone-width check
before handover was not done. Do section G (phone 390 px, tablet 768 px,
laptop 1280 px) before the other sections. A layout problem found there
goes back to the Build session as a fix, not a test failure.

**Written ahead of the build.** The screen doesn't exist yet, so its
labels below come from the plan (D2, D3, D3a, D4). Before the run, Build &
Test replaces each with the exact words in the built code (P3), as the
testing checklist requires. Day counts and totals marked "(25 Oct)" move
on every day and with other tests' data; P4 refreshes them.

**What this test saves on Dev** (Basheer clicks, Claude watches): on
Fahad's "USG M/c - Test Aug 18" (Aster MIMS Calicut) a Note, then a Call
that closes its next action; on "Now fastack lead" (Aster MIMS Calicut) a
Visit; three "zz E2E MyWork" next actions; approval of Vivek's Oct–Dec
2026 plan. Activities can't be deleted, so these stay on Dev.

## Checked against live data

Checked read-only on Dev, 2026-10-25, as General Manager (Haroon
Sidheeq), all three RLS settings set and verified (user id set, role
General Manager, SBU NULL — GM has no SBU by design). Raw output in the
session scratchpad (session c1568b11): `mywork_e2e_data_out.txt`,
`mywork_team_out.txt`, `mywork_splits_out.txt`.

- **Who sees:** a rep sees only their own: Fahad (Sales Staff, Imaging) — 6 Active Opportunities, no open next actions. Managers' teams, by the rule the reports already use (D1): Fazal (Area Manager, Imaging) — Fahad; Shruthi (Area Manager, Imaging) — Rudrappa; Arun Adarsh (Area Manager, Critical Care) — Vivek; Nishad K V (Area Manager, Critical Care) — nobody; Basheer K (SBU Manager, Imaging) — Fahad, Fazal, Rudrappa, Shruthi; Haroon Sidheeq and Abdul Latheef P — everyone. Hide-check: Basheer K must not see Nishad K V's "Test demo lead" (Aster MIMS Calicut) or anything of Arun Adarsh, Nishad K V or Vivek; Fahad must not see Fazal's "New oppotunity fast track" (Aster DM).
- **Who can approve:** Vivek's Oct–Dec 2026 plan (PENDING_APPROVAL; KIMS Hospital Trivandrum 51, Test hospital 2 10, Test hospital 3 5 Lakhs) — his manager Arun Adarsh (section F). Nothing on My Work itself is approved.
- **Who can save:** the "Done" and "Log Activity" buttons: the viewer on their own rows only; a manager viewing a rep gets no buttons on that rep's rows (D15; no "My team" view, D1).
- **Existing values:** Fahad (25 Oct) — High priority or 70 %+: 5, ₹78 Lakhs; Closing date passed: 1, ₹20 Lakhs; Not visited in 30+ days: 6, ₹95 Lakhs; Overdue next actions: 0; Due this week: 0. Fazal (25 Oct) — 2, ₹24; 2, ₹24; 8, ₹139; overdue 2. Shared: "New USG m/c" (aster medicity), owner Fazal, Basheer K 50 %, closing date 15 Sep passed. On Hold: "Imaging department refresh" (Baby Memorial Hospital, Basheer K), "New ICU Monitor deal" (Aster DM, Nishad K V). No approved Oct–Dec plan has hospitals yet.

Button labels, messages and the order of checks are taken from the code,
not the design doc (for this screen, from the built code at P3).

## Figures and sources

- Users, roles, SBUs, zones and managers — Dev read-only query, 2026-10-25
  (`mywork_e2e_data_out.txt`).
- Each manager's team — Dev read-only query, 2026-10-25, using the Area
  Manager and SBU Manager rule in `organization/repository.py:15–40`
  (`mywork_team_out.txt`).
- Every Opportunity, its stage, chance, value, closing date and idle days;
  On Hold Opportunities; open next actions; Oct–Dec 2026 plans — Dev
  read-only query, 2026-10-25 (`mywork_e2e_data_out.txt`). Idle days count
  only visits, calls, meetings and emails (D6d).
- Counts and ₹ totals for Fahad and Fazal — added up from that output,
  2026-10-25.
- Split on "New USG m/c" (aster medicity) — Dev read-only query, 2026-10-25
  (`mywork_splits_out.txt`).
- High priority = a stage after Demo, or raised by hand —
  `opportunity/repository.py:94` and `:263` (BR-OP-15).
- Oct–Dec 2026 is quarter 2026-Q3 — `scripts/quarter.py`.
- Section names, the "70 %+ only" tick box, default 30 days, Monday–Sunday
  week, overdue = due by end of today, owner-only closing dates, buttons
  only on own rows, landing screen — plan D2, D3, D3a, D4, D6, D7, D9b,
  D15, D16, D17; first on the menu, N days or more, count-only
  next-action cards, owner-only lists — D19–D22 (Basheer, 2026-10-25).
- "zz E2E MyWork …" texts — made-up test data.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Opportunities:** every step that names an Opportunity puts its hospital
beside it in brackets, e.g. "usg m/c" (aster medicity). An Opportunity the
test creates has its hospital fixed in this plan, never "any hospital".

## Pre-flight

- P1. [Simple] Basheer restarts the Dev backend after the feature's last backend change and confirms it's running. —
- P2. [Simple] Frontend running; a normal window plus a private window, so a manager and a rep can be signed in at once. The run is on a Monday to Saturday (on a Sunday nothing can be "due this week" after today, D17). —
- P3. [Complex: compares this plan with the built code] Claude replaces every screen label, section name, empty-list message and button name below with the exact words in the built code. —
- P4. [Complex: read-only database check] Claude re-runs the 25 Oct data checks (announced first) and updates every "(25 Oct)" figure, and re-runs the team check for the hide-checks in D. —
- P5. [Simple] The code review, backend tests, type check and lint passed (testing checklist). —

## A — Menu and first look (Fahad)

1. [Simple] Sign in as Fahad. Open the menu. **Expected:** "My Work" is the first item, above Account Management; not under Reports (D19). —
2. [Simple] Open My Work. **Expected:** the four sections "High priority or 70 %+", "Closing date passed", "Not visited in 30+ days", "Overdue next actions", plus "Next actions due this week"; the three Opportunity cards show count and ₹ total, the two next-action cards a count only (D21); no grand total across cards. —
3. [Simple] Hide-check. **Expected:** no "Showing:" switch (Fahad is a rep); Fazal's "New oppotunity fast track" (Aster DM) appears nowhere. —

## B — The lists, as a rep (Fahad)

1. [Simple] "High priority or 70 %+". **Expected (25 Oct):** 5, ₹78 Lakhs: "New Fastrack deal direct to Order" (Al Shifa Hospital Perinthalmanna) Order 90 % ₹30; "Test fast track deal from customer 360" (Al Shifa Hospital Perinthalmanna) Negotiation 70 % ₹5; "Now fastack lead" (Aster MIMS Calicut) Negotiation 70 % ₹20; "Test one more direct Opportunity" (EMS Hospital) Negotiation 70 % ₹3; "Test Gate override oppotunity (renamed for TC-19/22)" (Maulana) Negotiation 70 % ₹20. Not "USG M/c - Test Aug 18" (Aster MIMS Calicut) — Demo, 35 %. —
2. [Simple] Each row shows Opportunity, hospital, stage, chance, value and days since visit, with "Log Activity" (D3). **Expected:** all columns on every row; no owner column, since the screen shows one person's rows. —
3. [Simple] Tick "70 %+ only". **Expected:** still the same 5 (all are 70 % or more). Untick. —
4. [Simple] "Closing date passed". **Expected (25 Oct):** 1, ₹20 Lakhs: "Test Gate override oppotunity (renamed for TC-19/22)" (Maulana), closing date 3 Sep, 52 days overdue. —
5. [Simple] "Not visited in 30+ days", box shows 30. **Expected (25 Oct):** 6, ₹95 Lakhs — all six of Fahad's Opportunities: idle 59, 59, 56, 67, 59, 59 days. —
6. [Simple] Type the idle-day count of "Now fastack lead" (Aster MIMS Calicut) (56 on 25 Oct). **Expected:** it stays on the list (N days or more, D20); typing one more drops it. —
7. [Simple] Type 60. **Expected (25 Oct):** 1, ₹17 Lakhs: "USG M/c - Test Aug 18" (Aster MIMS Calicut), 67 days. —
8. [Simple] Open another screen, come back to My Work. **Expected:** the box shows 30 again and the list is back to 6 (D6). —
9. [Simple] "Overdue next actions" and "Next actions due this week". **Expected:** both empty, with the empty-list message from the code, and no ₹ total on either card (D21). —

## C — Acting from My Work (Fahad; Basheer clicks, Claude watches)

1. [Complex: save to Dev, then three lists checked] On "USG M/c - Test Aug 18" (Aster MIMS Calicut) in "Not visited", click "Log Activity". Log a Note "zz E2E MyWork C1 note", next action "zz E2E MyWork C1 due today", due today. **Expected:** form opens with the Opportunity filled in; after saving, "Overdue next actions" 1 (due today counts as overdue, D17), "Due this week" still empty, and the Opportunity is still in "Not visited" (a Note doesn't count, D6d). —
2. [Complex: save to Dev, then three lists checked] On "zz E2E MyWork C1 due today", click "Done". Close it as a Call "zz E2E MyWork C2 call", follow-up "zz E2E MyWork C2 follow-up" due tomorrow. **Expected:** the existing close form with its pre-fill (D8); after saving, "Overdue next actions" empty, "Due this week" 1 (the follow-up), "Not visited" 5, ₹78 Lakhs ("USG M/c - Test Aug 18" (Aster MIMS Calicut) gone). —
3. [Complex: save to Dev, then three lists checked] On "Now fastack lead" (Aster MIMS Calicut), click "Log Activity". Log a Visit "zz E2E MyWork C3 visit", next action "zz E2E MyWork C3 next Monday", due next Monday. **Expected:** "Not visited" 4, ₹58 Lakhs; "Due this week" still 1 (next Monday is next week, D7); "Overdue" still empty; "Now fastack lead" (Aster MIMS Calicut) still in "High priority or 70 %+" (a visit doesn't change that). —
4. [Simple] Open the Opportunity "USG M/c - Test Aug 18" (Aster MIMS Calicut), Activities tab. **Expected:** the Note and the Call from C1–C2, newest first. —

## D — Manager views and hide-checks

1. [Simple] Sign in as Fazal, open My Work. **Expected:** opens on "Showing: Me"; the switch offers "Me" and "Fahad" only (no "My team", D1) — not Rudrappa, Vivek or any Critical Care person. —
2. [Simple] As Fazal, "Me". **Expected (25 Oct):** "High priority or 70 %+" 2, ₹24 Lakhs; "Closing date passed" 2, ₹24 Lakhs: "New oppotunity fast track" (Aster DM) 1 Oct and "New USG m/c" (aster medicity) 15 Sep; "Not visited" 8, ₹139 Lakhs; "Overdue next actions" 2. Buttons on every row. —
3. [Simple] As Fazal, pick "Fahad". **Expected:** exactly the lists Fahad saw at the end of C ("Due this week" 1, "zz E2E MyWork C2 follow-up"), with no "Done" or "Log Activity" button on any row (D15). Switch back to "Me": the buttons are back. —
4. [Simple] Sign in as Basheer K, "Me". **Expected:** "Closing date passed" does not list "New USG m/c" (aster medicity) — Basheer K holds 50 % but Fazal owns it (D16); nor is it on "High priority or 70 %+" or "Not visited" (D22). "High priority or 70 %+" lists "New Cath Lab Equipment" (Aster MIMS Calicut), Lead, 75 % (raised by hand). —
5. [Simple] Hide-check as Basheer K. **Expected:** the switch offers "Me", Fahad, Fazal, Rudrappa, Shruthi — not Arun Adarsh, Nishad K V or Vivek; Nishad K V's "Test demo lead" (Aster MIMS Calicut) appears under none of the people he can pick. —
6. [Simple] As Basheer K, "Me": "Not visited" doesn't list the On Hold "Imaging department refresh" (Baby Memorial Hospital) (D6). —
7. [Simple] Sign in as Nishad K V, "Me". **Expected:** "High priority or 70 %+" 1, ₹2.50 Lakhs: "Test demo lead" (Aster MIMS Calicut), Clinical Evaluation, 55 %. Tick "70 %+ only": 0. Untick: back to 1. The On Hold "New ICU Monitor deal" (Aster DM) appears nowhere. —

## E — Stagnant Deals report changes (D6c)

1. [Simple] As Haroon Sidheeq, open Stagnant Deals. **Expected:** a box to type the number of days instead of the 90/180 choice. —
2. [Simple] Type 30. **Expected:** neither On Hold Opportunity is listed: "Imaging department refresh" (Baby Memorial Hospital), "New ICU Monitor deal" (Aster DM). —
3. [Complex: same figures compared on two screens] With 30, Fahad's rows. **Expected:** the same 4 Opportunities and day counts as Fahad's "Not visited" after C; not "USG M/c - Test Aug 18" (Aster MIMS Calicut) or "Now fastack lead" (Aster MIMS Calicut). —

## F — My hospitals this quarter and landing on My Work (step 5)

1. [Simple] Sign in as Vivek, open My Work. **Expected:** the last card, "My hospitals this quarter (2026-Q3) · 0", says "No approved hospital plan for this quarter." (his Oct–Dec 2026 plan isn't approved yet). —
2. [Complex: save to Dev, cross-role] As Arun Adarsh, approve Vivek's Oct–Dec 2026 plan on the Target Planning screen (Basheer clicks, Claude watches). **Expected:** status Approved. —
3. [Simple] As Vivek, My Work. **Expected:** "My hospitals this quarter (2026-Q3) · 3": KIMS Hospital Trivandrum, Test hospital 2, Test hospital 3. "Last visit" shows "Never" or a date with "N days ago", counting only Vivek's own visits, calls, meetings and emails (D27, D28; Notes and other people's visits don't); "Next action due" shows "—" or his earliest open next action there, Opportunity ones included (D29). Never-visited hospitals come first (values from P4). —
4. [Simple] As Fahad. **Expected:** the card says "No approved hospital plan for this quarter."; no hospital of Vivek's shown. —
5. [Simple] Sign out and sign in as Fahad. **Expected:** the app opens on My Work (D9b). —
6. [Simple] Sign in as Marketing User. **Expected:** the app opens on Marketing Leads, not My Work, and the menu has no "My Work" (D19). —

## G — Phone, tablet and laptop layout

Run this first: the screen has not been seen in a browser yet (see "Read first" at the top).

1. [Complex: phone layout] As Fazal, My Work and the Stagnant Deals box at 390 px, then 768 and 1280 px. **Expected:** at 390 px each row is a card, the six sections (including "My hospitals this quarter") and their counts fit the width with no sideways scroll (no element wider than its card), the top bar wraps, and "Log Activity" and "Done" are reachable; at 768 and 1280 px the rows are a table. The "Not visited for (days)" box and the "Showing" switch each have their name above them (MUI standard rule 7). —
