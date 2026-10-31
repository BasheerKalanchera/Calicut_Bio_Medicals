<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Weekly Follow-up (My Work) — Manual E2E Test Plan

**Covers:** `docs/Weekly-Follow-up-Daily-Hub-Implementation-Plan.md`, steps
2–5 (step 1 passed its Dev check 2026-10-19 and is on UAT).
**Built:** steps 2, 4 and 5 on branch `worktree-build` (`42bd5f8`,
`8d4bdac`, `d4a8df4`; code-review fixes `8c0e0c9`), merged after the
Annual Target Planning Part 2 E2E (D18). Fixes during the run: `048c741`,
`4deb68c`, `c7977f2`, `676a05d`.
**Where:** Dev.

**Read first (Build & Test, 29 Oct):** before the run, My Work moved from
six lists one under the other to four tabs — Summary, My hospitals,
Opportunities, Next actions — with a Summary box per list that opens its
list (D30–D33). Steps below say which tab each list is on; section H
tests the tabs and the Summary. Section G was passed on the old layout
(28 Oct) and is run again on the tabs.

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

**Re-checked 29 Oct (P4)**, read-only on Dev, through the screen's own
report request, as Fahad, Fazal, Basheer K, Nishad K V and Vivek (raw
output in the session scratchpad: `p4_summary.txt`). Every figure above is
unchanged, all five lists for Fahad, Fazal and Nishad K V; Basheer K still
sees only "New Cath Lab Equipment" (Aster MIMS Calicut) as High priority
and not "New USG m/c" (aster medicity). Only the day counts have moved on
(e.g. "Test Gate override oppotunity" 56 days past closing, was 52). Every
planned-hospital list is still empty (Vivek's plan is awaiting approval, F2).

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
- Tabs, their order, the Summary boxes and where the days box and tick sit
  — D30–D33 (Basheer, 2026-10-29); tab and box labels from
  `MyWorkScreen.tsx`. Small tabs on Opportunities, bare-number "Days ..."
  columns and the "Oct–Dec 2026" label — D34–D36 (Basheer, 2026-10-29,
  after G1 on a tablet).
- "zz E2E MyWork …" texts — made-up test data.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (layout shift, multi-step,
cross-screen/cross-role, or a genuine visual check). Basheer runs Complex
steps too, from exact instructions; Claude uses the browser only when a
step can't be judged by eye (Basheer, 2026-10-29). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Opportunities:** every step that names an Opportunity puts its hospital
beside it in brackets, e.g. "usg m/c" (aster medicity). An Opportunity the
test creates has its hospital fixed in this plan, never "any hospital".

## Pre-flight

- P1. [Simple] Basheer restarts the Dev backend after the feature's last backend change and confirms it's running. — 29 Oct: **Pass** (Basheer).
- P2. [Simple] Frontend running; a normal window plus a private window, so a manager and a rep can be signed in at once. The run is on a Monday to Saturday (on a Sunday nothing can be "due this week" after today, D17). — 29 Oct (Thursday): **Pass** (Basheer).
- P3. [Complex: compares this plan with the built code] Claude replaces every screen label, section name, empty-list message and button name below with the exact words in the built code. — 29 Oct: **Pass** (Claude; every label checked against `MyWorkScreen.tsx` after D34–D36; only the shorthand "Due this week" for "Next actions due this week" remains in C).
- P4. [Complex: read-only database check] Claude re-runs the 25 Oct data checks (announced first) and updates every "(25 Oct)" figure, and re-runs the team check for the hide-checks in D. — 29 Oct: **Pass** (Claude; all figures unchanged, see "Re-checked 29 Oct").
- P5. [Simple] The code review, backend tests, type check and lint passed (testing checklist). — 29 Oct: **Pass** (Claude; D34–D36 diff read through, no findings; tsc and lint 0 errors; backend untouched since `4deb68c`, pytest 1434 pass then).

## A — Menu and first look (Fahad)

1. [Simple] Sign in as Fahad. Open the menu. **Expected:** "My Work" is the first item, above Account Management; not under Reports (D19). — 29 Oct: **Pass** (Basheer).
2. [Simple] Open My Work. **Expected:** it opens on the Summary tab (D33). Under "My hospitals": "My hospitals this quarter (Oct–Dec 2026)" (D36). Under "Opportunities": "High priority or 70 %+", "Closing date passed", "Not visited in 30+ days", each with count and ₹ total. Under "Next actions": "Overdue next actions", "Next actions due this week", count only (D21). No grand total across boxes (D32). — 29 Oct: **Pass** (Basheer).
3. [Simple] Hide-check. **Expected:** no "Showing:" switch (Fahad is a rep); Fazal's "New oppotunity fast track" (Aster DM) appears nowhere. — 29 Oct: **Pass** (Basheer).

## B — The lists, as a rep (Fahad)

Steps 1–8 are on the Opportunities tab, where each list is its own small tab (D34) — open the one named in the step; step 9 on the Next actions tab. In C and D, "Not visited", "Closing date passed" and "High priority or 70 %+" are those small tabs too.

1. [Simple] Open the Opportunities tab. "High priority or 70 %+". **Expected (25 Oct):** 5, ₹78 Lakhs: "New Fastrack deal direct to Order" (Al Shifa Hospital Perinthalmanna) Order 90 % ₹30; "Test Gate override oppotunity (renamed for TC-19/22)" (Maulana) Negotiation 70 % ₹20; "Now fastack lead" (Aster MIMS Calicut) Negotiation 70 % ₹20; "Test fast track deal from customer 360" (Al Shifa Hospital Perinthalmanna) Negotiation 70 % ₹5; "Test one more direct Opportunity" (EMS Hospital) Negotiation 70 % ₹3. In that order: highest chance first, then highest value (the screen's order; the earlier list here was not). Not "USG M/c - Test Aug 18" (Aster MIMS Calicut) — Demo, 35 %. — 29 Oct: **Pass** (Basheer); the plan's list order was wrong, fixed above.
2. [Simple] Each row shows Opportunity, hospital, stage, chance, value and days since visit, with "Log Activity" (D3). **Expected:** all columns on every row; no owner column, since the screen shows one person's rows. "Days since visit" holds the bare number (48, not "48 days", D35). — 29 Oct: **Pass** (Basheer).
3. [Simple] On the "High priority or 70 %+" small tab, tick "70 %+ only" (shown only there, D34). **Expected:** still the same 5 (all are 70 % or more). Untick. — 29 Oct: **Pass** (Basheer).
4. [Simple] "Closing date passed". **Expected (25 Oct):** 1, ₹20 Lakhs: "Test Gate override oppotunity (renamed for TC-19/22)" (Maulana), closing date 3 Sep, "Days past closing" 56 on 29 Oct (it grows by one each day; it is the days from 3 Sep to the day of the run). — 29 Oct: **Pass** (Basheer).
5. [Simple] "Not visited in 30+ days", box shows 30. **Expected (29 Oct):** 6, ₹95 Lakhs — all six of Fahad's Opportunities, longest first: idle 70 ("USG M/c - Test Aug 18"), 63, 62, 62, 62, 60 ("Now fastack lead") days (P4; each grows by one a day). — 29 Oct: **Pass** (Basheer).
6. [Simple] Type the idle-day count of "Now fastack lead" (Aster MIMS Calicut) (60 on 29 Oct). **Expected:** it stays on the list (N days or more, D20); typing one more drops it. — 29 Oct: **Pass** (Basheer).
7. [Simple] Type 65. **Expected (29 Oct):** 1, ₹17 Lakhs: "USG M/c - Test Aug 18" (Aster MIMS Calicut), 70 days. — 29 Oct: **Pass** (Basheer).
8. [Simple] Open another screen, come back to My Work. **Expected:** it opens on Summary (D33); on the Opportunities tab the box shows 30 again and the list is back to 6 (D6). — 29 Oct: **Pass** (Basheer).
9. [Simple] Next actions tab: "Overdue next actions" and "Next actions due this week". **Expected:** both say "Nothing here.", with no ₹ total on either (D21). — 29 Oct: **Pass** (Basheer).

## C — Acting from My Work (Fahad; Basheer clicks, Claude watches)

After each save, read the counts on the Summary tab; open the list's tab
only to see which rows moved.

1. [Complex: save to Dev, then three lists checked] On "USG M/c - Test Aug 18" (Aster MIMS Calicut) in "Not visited", click "Log Activity". Log a Note "zz E2E MyWork C1 note", next action "zz E2E MyWork C1 due today", and **change the date in the form to today** (it starts at tomorrow). **Expected:** form opens with the Opportunity filled in; after saving, "Overdue next actions" 1 (due today counts as overdue, D17; its "Days overdue" cell reads 0, D35), "Due this week" still empty, and the Opportunity is still in "Not visited" (a Note doesn't count, D6d). — 29 Oct: **Pass** (Basheer), with a gap: the form's due date starts at tomorrow and was left as it was, so the action was saved as due 30 Oct and showed under "Due this week" 1, "Overdue" 0 — correct for that date. "Due today counts as overdue" (D17) was not exercised: see C5. Step reworded to say "change the date to today".
2. [Complex: save to Dev, then three lists checked] On "zz E2E MyWork C1 due today", click "Done". Close it as a Call "zz E2E MyWork C2 call", follow-up "zz E2E MyWork C2 follow-up" due tomorrow. **Expected:** the existing close form with its pre-fill (D8); after saving, "Overdue next actions" empty, "Due this week" 1 (the follow-up), "Not visited" 5, ₹78 Lakhs ("USG M/c - Test Aug 18" (Aster MIMS Calicut) gone). — 29 Oct: **Pass** (Basheer).
3. [Complex: save to Dev, then three lists checked] On "Now fastack lead" (Aster MIMS Calicut), click "Log Activity". Log a Visit "zz E2E MyWork C3 visit", next action "zz E2E MyWork C3 next Monday", due next Monday. **Expected:** "Not visited" 4, ₹58 Lakhs; "Due this week" still 1 (next Monday is next week, D7); "Overdue" still empty; "Now fastack lead" (Aster MIMS Calicut) still in "High priority or 70 %+" (a visit doesn't change that). — 29 Oct: **Pass** (Basheer), with a deviation: Basheer did not use next Monday as the due date (he used a date close to today), so "next Monday is next week" (D7) was not exercised: see C6. Dev check after C5 (read-only, 29 Oct): "Now fastack lead" (Aster MIMS Calicut) has an open action "due today counts as overdue" due 30 Oct, not "zz E2E MyWork C3 next Monday".
4. [Simple] Open the Opportunity "USG M/c - Test Aug 18" (Aster MIMS Calicut), Activities tab. It is no longer on the Opportunities tab (the Call took it out of "Not visited"), so open it from the "zz E2E MyWork C2 follow-up" row on the Next actions tab, or from the main Opportunities screen. **Expected:** the Note and the Call from C1–C2, newest first. — 29 Oct: Basheer found it on the Next actions tab and not on the Opportunities tab (as expected); the Note and the Call show on its Activities tab: **Pass** (Basheer).
5. [Complex: save to Dev, then lists checked] Added 29 Oct after C1 (D17 was not exercised there). On "Test one more direct Opportunity" (EMS Hospital), click "Log Activity", log a Note "zz E2E MyWork C5 note", next action "zz E2E MyWork C5 due today", and **change the date to today**. **Expected:** "Overdue next actions" 1; on the Next actions tab it sits under "Days overdue" with 0, and "Next actions due this week" is unchanged. Then click "Done" on it and close it as a Call "zz E2E MyWork C5 call" with no follow-up (if the form allows): "Overdue next actions" is back to 0. — 29 Oct: **Pass** (Basheer): Overdue read 2, and 1 on both the Summary and the Next actions tab after "Done" (Basheer). Dev check afterwards (read-only, 29 Oct): the 1 left is "zz E2E MyWork C5 due today" (EMS Hospital, due today), so the "Done" was pressed on the other overdue action, not on C5's. Counts and the "Days overdue" 0 cell are right either way. The "Days overdue" cell read 0 (Basheer).
6. [Complex: save to Dev, then lists checked] Added 29 Oct (D7 was not exercised at C3). **Starting point (Dev, read-only, 29 Oct, Fahad):** "Overdue next actions" 1 ("zz E2E MyWork C5 due today", EMS Hospital, "Test one more direct Opportunity"); "Next actions due this week" 2 ("zz E2E MyWork C2 follow-up", "USG M/c - Test Aug 18", and "due today counts as overdue", "Now fastack lead", both due 30 Oct). Read these on the Summary first; if they differ, stop and tell Claude. "Log Activity" is refused on an Opportunity that has an open next action ("You have an open next action on this Opportunity. Close it, saying what happened, instead of logging a new activity." — Basheer saw this on EMS Hospital, 29 Oct), so close the open action instead: on the Next actions tab, click "Done" on "zz E2E MyWork C5 due today" (EMS Hospital), close it as a Call "zz E2E MyWork C6 call", follow-up "zz E2E MyWork C6 next Monday", and set the follow-up date to **Monday 2 Nov** (not today or tomorrow). **Expected:** "Overdue next actions" 0 (C5's action is closed) and "Next actions due this week" still 2; the new follow-up is on neither list (next Monday is next week, D7). Also: "Test one more direct Opportunity" (EMS Hospital) leaves "Not visited" (a Call counts, D6d): Not visited 3, ₹55 Lakhs. — 29 Oct: **Pass** (Basheer) on the due-date counts. Basheer saw "Test one more direct Opportunity" still on "Not visited" after saving, but Dev (read-only, same day) already had it out (days since visit 0, Not visited 3, ₹55 Lakhs); on re-check the screen shows 3 rows, matching Dev (it had 4 before C6): **Pass**. E3 updated from 4 to 3 rows.

## D — Manager views and hide-checks

1. [Simple] Sign in as Fazal, open My Work. **Expected:** opens on "Showing: Me"; the switch offers "Me" and "Fahad" only (no "My team", D1) — not Rudrappa, Vivek or any Critical Care person. — 29 Oct: **Pass** (Basheer).
2. [Simple] As Fazal, "Me". **Expected (25 Oct):** "High priority or 70 %+" 2, ₹24 Lakhs; "Closing date passed" 2, ₹24 Lakhs: "New oppotunity fast track" (Aster DM) 1 Oct and "New USG m/c" (aster medicity) 15 Sep; "Not visited" 8, ₹139 Lakhs; "Overdue next actions" 2. Buttons on every row. — 29 Oct: **Pass** (Basheer).
3. [Simple] As Fazal, pick "Fahad". **Expected:** exactly the lists Fahad saw at the end of C (after C6: "Overdue" 0; "Due this week" 2, "zz E2E MyWork C2 follow-up" and "due today counts as overdue" — figures from the 29 Oct Dev check, which C6 does not change), with no "Done" or "Log Activity" button on any row (D15). Switch back to "Me": the buttons are back. — 29 Oct: **Pass** (Basheer).
4. [Simple] Sign in as Basheer K, "Me". **Expected:** "Closing date passed" does not list "New USG m/c" (aster medicity) — Basheer K holds 50 % but Fazal owns it (D16); nor is it on "High priority or 70 %+" or "Not visited" (D22). "High priority or 70 %+" lists "New Cath Lab Equipment" (Aster MIMS Calicut), Lead, 75 % (raised by hand). A different "New USG m/c" at KIMS Hospital Trivandrum (Qualified, 20 %, ₹19 Lakhs, Basheer K's own, 117 days) is rightly on his "Not visited" (Dev, 29 Oct) — same name, other hospital; check the hospital. — 29 Oct: **Pass** (Basheer): the one listed is the KIMS Hospital Trivandrum one; the aster medicity one is on none of the three lists. The step lacked the hospital beside the name; reworded here.
5. [Simple] Hide-check as Basheer K. **Expected:** the switch offers "Me", Fahad, Fazal, Rudrappa, Shruthi — not Arun Adarsh, Nishad K V or Vivek; Nishad K V's "Test demo lead" (Aster MIMS Calicut) appears under none of the people he can pick. — 29 Oct: **Pass** (Basheer).
6. [Simple] As Basheer K, "Me": "Not visited" doesn't list the On Hold "Imaging department refresh" (Baby Memorial Hospital) (D6). — 29 Oct: **Pass** (Basheer).
7. [Simple] Sign in as Nishad K V, "Me". **Expected:** "High priority or 70 %+" 1, ₹2.50 Lakhs: "Test demo lead" (Aster MIMS Calicut), Clinical Evaluation, 55 %. Tick "70 %+ only": 0. Untick: back to 1. The On Hold "New ICU Monitor deal" (Aster DM) appears nowhere. — 29 Oct: **Pass** (Basheer).

## E — Stagnant Opportunities report changes (D6c)

1. [Simple] As Haroon Sidheeq, open Stagnant Opportunities (the menu item's name; the plan said "Stagnant Deals" until 29 Oct). **Expected:** a box to type the number of days instead of the 90/180 choice. — 29 Oct: **Pass** (Basheer).
2. [Simple] Type 30. **Expected:** neither On Hold Opportunity is listed: "Imaging department refresh" (Baby Memorial Hospital), "New ICU Monitor deal" (Aster DM). — 29 Oct: **Pass** (Basheer).
3. [Complex: same figures compared on two screens] With 30, Fahad's rows. **Expected:** the same 3 Opportunities and day counts as Fahad's "Not visited" after C ("Test Gate override oppotunity (renamed for TC-19/22)" (Maulana), "Test fast track deal from customer 360" (Al Shifa Hospital Perinthalmanna), "New Fastrack deal direct to Order" (Al Shifa Hospital Perinthalmanna); Dev check 29 Oct); not "USG M/c - Test Aug 18" (Aster MIMS Calicut), "Now fastack lead" (Aster MIMS Calicut) or "Test one more direct Opportunity" (EMS Hospital). — 29 Oct: **Pass** (Basheer). Basheer's note: the report needs a filter by rep (it only shows the owner's name on each row); to Backlog if he confirms. —

4. [Simple] Added 29 Oct (D37). As Haroon Sidheeq, Stagnant Opportunities, days 30. **Expected:** a "Rep" dropdown beside the days box, reading "All reps". Pick "Fahad": exactly his 3 rows from E3. Pick "All reps": the full list is back. — 29 Oct: **Pass** (Basheer).
5. [Simple] Hide-check (D37). Sign in as Fazal, open Stagnant Opportunities. **Expected:** the "Rep" dropdown offers "All reps", Fazal himself and Fahad; not Rudrappa, Vivek or any Critical Care person. — 29 Oct: **Pass** (Basheer).

## F — My hospitals this quarter and landing on My Work (step 5)

1. [Simple] Sign in as Vivek, open My Work. **Expected:** the Summary's hospital box reads 0 and "No approved hospital plan for this quarter."; the My hospitals tab, "My hospitals this quarter (Oct–Dec 2026) · 0", says the same (his Oct–Dec 2026 plan isn't approved yet). — 29 Oct: **Pass** (Basheer).
2. [Complex: save to Dev, cross-role] As Arun Adarsh, approve Vivek's Oct–Dec 2026 plan on the Target Planning screen (Basheer clicks, Claude watches). **Expected:** status Approved. — 29 Oct: **Pass** (Basheer).
3. [Simple] As Vivek, My Work, My hospitals tab. **Expected:** "My hospitals this quarter (Oct–Dec 2026) · 3": KIMS Hospital Trivandrum, Test hospital 2, Test hospital 3. "Last visit" shows "Never" or a date with "N days ago", counting only Vivek's own visits, calls, meetings and emails (D27, D28; Notes and other people's visits don't); "Next action due" shows "—" or his earliest open next action there, Opportunity ones included (D29). Never-visited hospitals come first (values from P4). — 29 Oct: **Pass** (Basheer). Dev check afterwards (read-only, Vivek, 29 Oct): 3 hospitals, all with no visit (last visit "Never") and no open next action ("—"); so the Summary's "never visited" is 3 and "overdue" 0. Includes the "never visited" figure Basheer asked to see with real data.
4. [Simple] As Fahad, My hospitals tab. **Expected:** "No approved hospital plan for this quarter."; no hospital of Vivek's shown. — 29 Oct: **Pass** (Basheer).
5. [Simple] Sign out and sign in as Fahad. **Expected:** the app opens on My Work, Summary tab (D9b, D33). — 29 Oct: **Pass** (Basheer).
6. [Simple] Sign in as Marketing User. **Expected:** the app opens on Marketing Leads, not My Work, and the menu has no "My Work" (D19). — 29 Oct: **Pass** (Basheer).
7. [Complex: save to Dev, then Summary and tab checked] Added 29 Oct (Basheer): F3 had only never-visited hospitals, so the "N days ago" display, the next-action date and the ordering were not exercised. As Vivek, My hospitals tab, on "Test hospital 2" click "Log Activity". Log a Visit "zz E2E MyWork F7 visit" with next action "zz E2E MyWork F7 next Monday", and set the date to **Monday 2 Nov** (if the form asks for an Opportunity, say so and stop). **Expected:** "Test hospital 2" now reads "Last visit" "29 Oct · 0 days ago" and "Next action due" "Mon 2 Nov"; it moves below the two still-never-visited hospitals (KIMS Hospital Trivandrum, Test hospital 3); the Summary's hospital box reads 3, "2 never visited · 0 overdue next action". — 29 Oct: **Pass** (Basheer).

## G — Phone, tablet and laptop layout

1. [Complex: phone layout] As Fazal, My Work (every tab) and the Stagnant Deals box at 390 px, then 768 and 1280 px. **Expected:** at 390 px the tab row scrolls sideways with the open tab brought to the middle; the Summary boxes wrap and fit the width; on the list tabs each row is a card, with no sideways scroll of the page and nothing wider than its card; "Log Activity" and "Done" are reachable; at 768 and 1280 px the rows are a table. On a tablet, no "Days ..." cell wraps onto two lines (Opportunities and Next actions tabs; D35). The "Not visited for (days)" box (Opportunities tab, "Not visited" small tab) and the "Showing" switch (above the tabs) each have their name above them (MUI standard rule 7). — 28 Oct: Pass on the old six-list layout (Claude, as Fazal, measured; Progress-Archive 28 Oct). 29 Oct: Basheer looked at the tabs layout — "looks very good"; asked for My hospitals first, done. 29 Oct: tablet showed "48 days" wrapping; fixed with D34–D36 (small tabs, bare numbers, "Oct–Dec 2026"). **Pass** (Basheer, 390/768/1280 px, after the fix).

## H — Tabs and Summary (D30–D36)

1. [Simple] As Fahad, open My Work. **Expected:** tabs in order Summary, My hospitals, Opportunities, Next actions, with Summary open; Summary headings in the same order. Each box's figure equals the count (and ₹ total) at the top of its list on the other tabs. — 29 Oct: **Pass** (Basheer).
2. [Simple] On Summary, click "Closing date passed". **Expected:** the Opportunities tab opens with its "Closing date passed" small tab selected (D34), not "High priority or 70 %+". Back to Summary, click "Overdue next actions": the Next actions tab opens with its "Overdue next actions" small tab selected (D38). Back to Summary, click "Next actions due this week": the same tab opens on "Next actions due this week". Back to Summary, click the hospital box: the My hospitals tab opens. — 29 Oct: **Pass** (Basheer).
3. [Simple] The days box appears only on Opportunities, "Not visited" small tab; the "70 %+ only" tick only on Opportunities, "High priority or 70 %+" small tab (D34); no other tab or small tab shows them. — 29 Oct: **Pass** (Basheer).
4. [Simple] On Opportunities, "Not visited" small tab, type 60, then open Summary. **Expected:** the box reads "Not visited in 60+ days" with the same count as the list. On the "High priority" small tab tick "70 %+ only", open Summary: the first Opportunities box reads "70 %+ chance" (and that small tab is now headed "70 %+ chance"). — 29 Oct: **Pass** (Basheer).
5. [Simple] Leave My Work and come back. **Expected:** Summary open; on Opportunities the "High priority" small tab is selected, the days box shows 30 and the tick is off (D6, D33, D34). On Next actions the "Next actions due this week" small tab is selected, even if you left on "Overdue next actions" (D38). — 29 Oct: **Pass** (Basheer).
6. [Simple] As Fazal, pick "Fahad" in "Showing" (above the tabs). **Expected:** the Summary boxes change to Fahad's figures; the Opportunities and Next actions tabs show his rows with no buttons (D15). — 29 Oct: **Pass** (Basheer).
7. [Simple] As Vivek after F2 and F7 (29 Oct: 3 hospitals, 2 never visited, 0 overdue), Summary. **Expected:** hospital box "3" and "N never visited · N overdue next action", where N never visited = rows saying "Never" under "Last visit" on the My hospitals tab, and N overdue = rows with a red "N days overdue" badge under "Next action due" (D35). — 29 Oct: **Pass** (Basheer). The red "N days overdue" badge itself was not exercised: Vivek has no overdue next action (0 overdue), so only the "0 overdue" figure was checked.
8. [Simple] As Fazal, Next actions tab (open the "Overdue next actions" small tab, then "Next actions due this week"). **Expected:** "Overdue next actions" has the column heading "Days overdue" and a bare red number in each row (48, not "48 days"; 0 for one due earlier today); "Next actions due this week" keeps "Due" with a date or "Today ...". At 768 px no cell wraps onto two lines (D35). — 29 Oct: **Pass** (Basheer, as Fazal). Fahad has no rows under "Overdue next actions" but has rows under "Next actions due this week"; Fazal has rows under both.
9. [Simple] As Fazal, Opportunities tab. **Expected:** three small tabs, "High priority or 70 %+" selected on opening; clicking each shows only that list, with its own count and ₹ total; at 390 px all three small tabs stay on one row, equal widths, a long label wrapping onto two lines inside its own button, nothing running off the screen (D34, D39). — 29 Oct: **Pass** (Basheer).
10. [Simple] Added 29 Oct (Basheer). As Fazal, Next actions tab, at 390 px. **Expected:** two small tabs on one row, "Next actions due this week" (selected on opening) and "Overdue next actions", no counts in the labels; clicking each shows only that list, and a long label may wrap onto two lines. Then as Fahad, Summary, click "Next actions due this week": the Next actions tab opens on that small tab (D38, D39). — 29 Oct: **Pass** (Basheer; both the Fahad and Fazal halves).
11. [Simple] Added 29 Oct (Basheer). As Fazal at 390 px, Opportunities tab, "Not visited" small tab; scroll the list down. **Expected:** the small tabs and the "Not visited for (days)" box stay in place at the top while the rows scroll under them; the small tabs are tall enough to press easily (about 44 px). Same on the Next actions tab (D40). — 29 Oct: **Pass** (Basheer).
12. [Simple] Added 29 Oct (Basheer). As Fahad, Summary, at 390, 768 and 1280 px. **Expected:** a section heading over each group (My hospitals, Opportunities, Next actions) with the side menu's colour icon (🏥, 📈, ✅), large, with no box behind it; each box has a coloured left edge and a large figure with an arrow on the right, the ₹ total as a small pill under the label; High priority and the hospital box blue, Closing date passed red, Not visited amber, Next actions due this week green; Overdue next actions shows 0 in grey. One box per row at 390 px; at 768 and 1280 px the three Opportunities boxes share one row, the Next actions pair sits side by side. Every box still opens the list it opened before (D41). — 29 Oct: **Pass** (Basheer, 390/768/1280 px). Box text colours left as they are (Basheer, 29 Oct).
13. [Simple] Added 31 Oct (Basheer). As Fazal, Insights, Overdue tab, click a count so My Work opens. **Expected:** a bar "← Back to Insights" under the "My Work" heading; clicking it returns to Insights on the Overdue tab (not Target vs Actuals); tapping Insights in the side menu afterwards still opens Target vs Actuals. Open My Work the same way again, open a hospital from the list, press Back: the bar is still there. Open My Work the same way, then tap "My Work" (or any other) in the side menu: the bar is gone and stays gone when opening My Work from the menu (D43). — 31 Oct: **Pass** for the bar and the return to the Overdue tab (Basheer, after a fix: it first returned to Target vs Actuals). The "stays after opening a hospital" and "gone after a menu tap" halves were not separately reported.
