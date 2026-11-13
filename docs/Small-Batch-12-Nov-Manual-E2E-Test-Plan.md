<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Small Batch 12 Nov — Manual E2E Test Plan

**Covers:** four small fixes, no implementation plan (Basheer's requests of
10–12 Nov, filed in `docs/Backlog.md`; detail in `docs/Progress-Archive-2026-11.md`
"Build & Test: small batch built").
**Built:** checkpoint commit `b4f6a3b` (My Work speed fix, zone box, Pipeline
card order, Sales Report fixed header); one-line fix to the zone box message
found in the pre-E2E review, commit `4a5e767` (13 Nov, pushed).
**Where:** Dev.

## Checked against live data

Checked read-only on Dev, 13 Nov 2026, with all three RLS settings (user,
role, SBU) set and verified, impersonating the first active Admin in the
user list. The Admin's SBU setting is empty by design (Admin has no SBU),
and the check showed role and user set.

- **Who sees:** Admin sees all 57 Active Opportunities (Lead 37, Qualified 5,
  Demo 6, Clinical Evaluation 1, Negotiation 7, Order 1). Basheer K
  (SBU Manager) owns 25 of them, the most of any owner, so his My Work has
  real lists. Fahad (Sales Staff) owns 6.
- **Who can approve:** n/a — nothing in this batch is approved or rejected.
- **Who can save:** n/a — nothing in this batch saves a record. The zone
  box steps pick a zone in a filter and a pop-up; the pop-ups are closed
  without saving.
- **Existing values:** Lead column has 31 Opportunities all at 5 % chance and
  not High Priority — the biggest group of ties, so the best place to see the
  card order. Qualified has 5 tied at 20 %. Negotiation has 7 tied at 70 %
  (High Priority). Won this quarter (closed 1 Oct – 31 Dec 2026): 5 in total
  — Basheer K 3, Fahad 2. Dev has 6 Won and 5 Lost in all.

Button labels, messages and the order of checks are taken from the code,
not the design doc.

## Figures and sources

- 57 Active Opportunities, and the per-stage counts above — Dev query, 13 Nov 2026.
- 31 Lead cards at 5 %, 5 Qualified at 20 %, 7 Negotiation at 70 % — Dev query, 13 Nov 2026.
- Basheer K 25 Active, Fahad 6 Active — Dev query, 13 Nov 2026.
- 5 Won this quarter (Basheer K 3, Fahad 2); 6 Won and 5 Lost all time — Dev query, 13 Nov 2026.
- Current fiscal quarter Oct–Dec 2026 (1 Oct – 31 Dec) — `scripts/quarter.py`, 13 Nov 2026.
- Zones starting "ka": Kannur, Karnataka, Kasaragod — Dev query, 13 Nov 2026.
- Opportunity names with hospitals in brackets (Lead column: "USG m/c" (another hospital), "New USG msg" (Aster MIMS Calicut), "ICU Monitor" (Al Shifa Hospital Perinthalmanna); Qualified column: "USG" (Elite Diagnostics), "Sonoscape S80 interest" (Baby Memorial Hospital)) — Dev query, 13 Nov 2026.
- "9999" as a text that matches no zone — made-up example; checked against the zone search on Dev, 13 Nov 2026 (no zone returned). "zzzz" was the first choice and was wrong: it matches "Test Zone" and "child zone".
- Kannur has 1 Active Opportunity ("New marketing lead from Cochin Conference", Critical Care, owner Nishad K V); Basheer K is Imaging; North Kerala 38 Active for Admin — Dev query, 13 Nov 2026.
- Button and message texts ("Type 2 letters to search zones", "No options", "Showing", "Not visited for (days)", "Revenue Won", "Opportunities Won", "Win Rate", "Avg Opportunity Size", "Period", "Group by") — `ZonePicker.tsx`, `MyWorkScreen.tsx`, `StagnantDealsReportScreen.tsx`, `SalesReportScreen.tsx`.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (layout shift, multi-step,
cross-screen/cross-role, or a genuine visual check). Basheer runs Complex
steps too, from exact instructions; nobody drives a browser unless a step
says `[Complex: Claude — <reason>]`. Nothing here saves to Dev.

**Phone:** every screen this batch changes gets a `[Complex: phone layout]`
step at 390, 768 and 1280 px: the Sales Report (the one with a real risk —
see C6) and the zone box on the Pipeline screen. Nobody checks in a browser
before this run; Claude measures only if something looks off.

**Opportunities:** every step that names an Opportunity puts its hospital
beside it in brackets.

## Pre-flight

- P1. [Simple] Dev backend restarted since `b4f6a3b` (the My Work speed fix
  and the Pipeline card order are backend changes; without a restart Dev runs
  the old code). — Pass (Basheer restarted it, 13 Nov).
- P2. [Simple] Signed in as Basheer K (SBU Manager). The Dev frontend is
  running, so the zone box message and Sales Report change are live. — Pass (Basheer, 13 Nov).

## A — Zone box (shown on 8 screens; full check on Pipeline)

1. [Simple] Pipeline → open the **Zone** filter (placeholder "All Zones"),
   click into it without typing. **Expected:** the list says "Type 2 letters
   to search zones". — Pass (Basheer, 13 Nov).
2. [Simple] Type "k" (one letter). **Expected:** still "Type 2 letters to
   search zones". — Pass (Basheer, 13 Nov).
3. [Complex: timing — a flash lasting a fraction of a second] Clear the box,
   then type "ka" at normal speed and watch the list the whole time.
   **Expected:** the hint stays, then a loading state, then the zones list
   with Kannur, Karnataka and Kasaragod among the results. "No options" must
   never show in between (this is what the review fix changed). Repeat three
   times. — Pass (Basheer, 13 Nov).
4. [Simple] Clear it, type "9999". **Expected:** after a short pause "No
   options". — First run 13 Nov with "zzzz": showed "Test Zone" and "child
   zone" (plan error: zone search is a fuzzy match, unchanged by this
   batch; a Dev query showed "zzzz" matches those two zones and "9999"
   matches none). Re-run with "9999": Pass (Basheer, 13 Nov).
5. [Simple] Pick North Kerala. **Expected:** the Pipeline narrows to
   Opportunities of hospitals in North Kerala (fewer than before, not
   empty) and the Zone box shows North Kerala; clear it with the ✕ and the
   full pipeline returns (57 Active across the columns for Admin; Basheer K
   sees his Imaging share). — First run 13 Nov with Kannur: "no
   Opportunities found", then ✕ restored the full list (✕ part Pass). Plan
   error, not a bug: Kannur's only Active Opportunity is Critical Care and
   Basheer K is Imaging, so he can't see it (Dev query, 13 Nov). Re-run
   with North Kerala: Pass (Basheer, 13 Nov).
6. [Complex: seven screens, one look each] On each screen below, open the
   zone box without typing and read the message. **Expected:** "Type 2
   letters to search zones" each time; typing "9999" gives "No options".
   a. Account Management → Zone filter.
   b. Rate Hospitals → Zone filter.
   c. Customer with No Activity → Zone filter.
   d. Account Management → open New Customer → **Zone \*** (close without saving).
   e. A Customer 360 page → Edit Customer → **Zone \*** (close without saving).
   f. Territory Map → Add Zone → **Parent Zone** (close without saving).
   g. User Directory → Add User → **Zone** and **Add zone** (close without saving). — Pass, a to g (Basheer, 13 Nov).
7. [Complex: phone layout] Phone width (390, 768, 1280 px), Pipeline → Zone
   box, open it with nothing typed. **Expected:** the message fits on one
   or two lines inside the list, nothing runs past the box or off the
   screen. — Pass (Basheer, 13 Nov).

## B — Pipeline card order (Kanban)

8. [Complex: repeat loads — compare three orders] Pipeline, Lead column (31
   cards at 5 % chance). Write down the first 10 names in order (hospital in
   brackets, e.g. "USG m/c" (another hospital)). Reload the page, write the
   first 10 again; reload once more. **Expected:** the same 10 cards in the
   same order all three times. — **Pass** (13 Nov, Claude drove it in the browser
   at Basheer's request, signed in as Haroon: three loads, whole board text
   identical, 4,799 characters, same checksum each time, so every column held
   the same order, not only the first 10. The board lists Won, Lost and On Hold
   cards too: Lead showed 44, not the 31/37 Active figures above.)
9. [Simple] Do the same for the Qualified column (5 cards at 20 %: "USG"
   (Elite Diagnostics), "Sonoscape S80 interest" (Baby Memorial Hospital) and
   three others). **Expected:** same order after each reload. — **Pass** (13 Nov,
   same three loads as step 8; Qualified showed 5 cards.)
10. [Simple] Negotiation column (7 cards at 70 %, all High Priority).
    **Expected:** same order after a reload. — **Pass** (13 Nov, same three loads
    as step 8; Negotiation showed 8 cards, one of them On Hold.)
11. [Simple] Regression, from the Kanban Priority Sort plan: in any column
    with a High Priority card and a non-High-Priority card, the High
    Priority card is on top; higher chance is above lower chance within the
    same group. **Expected:** as before this batch. — **Not run, skipped by
    Basheer** (13 Nov: on
    Dev no column holds both kinds: Lead, Demo and Qualified have no High
    Priority card, Negotiation, Order and Payment Pending have only High
    Priority ones, so there is nothing to compare. The chance % isn't shown on
    the cards either. This rule is covered by the automated tests.)
12. [Simple] Regression: Owner filter set to Basheer K, then Zone filter set
    to Kannur. **Expected:** each narrows the cards and the order within what
    is left follows the same rule; no card is missing that was there before
    filtering. — **Pass** (13 Nov, Claude drove it in the browser, signed in as
    Haroon: Owner = Basheer K left 35 cards (Lead 24, Qualified 4, Demo 4,
    Payment Pending 3), all Basheer K's, the same number he owns on the full
    board; Owner = Basheer K plus Zone = Kannur left an empty board, correct
    because Kannur's only Opportunity belongs to Nishad K V; Zone = Kannur
    alone showed 1 card, "New marketing lead from Cochin Conference" (New
    Marketing Customer), matching the Dev query.)
13. [Complex: phone layout] Phone width (390, 768, 1280 px), Pipeline stage
    pills and one column. **Expected:** the cards look and scroll as before;
    nothing runs past the card. — **Pass** (13 Nov, Basheer, all three widths.)

## C — Sales Report fixed header

14. [Simple] Reports → Sales Report. **Expected:** the period box opens on
    "This Quarter" with the dates "Oct–Dec 2026" beside it; four tiles show
    Revenue Won, Opportunities Won (5), Win Rate, Avg Opportunity Size; a
    title "Revenue Won by Rep" with the **Group by** dropdown sits below the
    tiles; two bars below it (Basheer K, Fahad). — **Pass** (13 Nov, Basheer.
    Starting look only; the pinned header is checked in step 15.)
15. [Complex: scrolling] Switch **Group by** to Product, then Brand, scroll
    the bar list down and up. **Expected:** the period box, tiles and the
    title with its dropdown stay in place; only the bars scroll. The tiles are
    smaller than before. — **Pass, with a stand-in** (13 Nov. Basheer: Dev has
    only 3 Product rows and 1 Brand row, so the list never overflows. Claude
    then copied one bar row 12 times on screen only, nothing saved, in a
    500 px wide, 757 px tall window as Haroon: the bars box scrolled by 471 px
    while the tiles and title stayed at the same spot, and the page itself did
    not scroll. Not checked with real rows or at the plan's own widths.)
16. [Complex: phone layout — the risk step] Phone width at 390 px, Sales
    Report. **Expected:** the period box, tiles and title still leave room
    for the bars, which scroll underneath. If the top block fills the screen
    so the bars can't be reached or scrolled to, **fail** this step — that
    is the risk the code review raised. Then 768 and 1280 px: tiles in one
    row or two, bars scroll. — **Pass** (13 Nov, Basheer, 390, 768 and 1280 px.)
17. [Simple] Switch **Period** to This Month and All Time. **Expected:**
    tiles and bars change; the date text beside the box changes ("Nov 2026",
    "All time"); the layout stays pinned. — **Pass** (13 Nov, Claude drove it in
    the browser as Haroon: This Month "Nov 2026", all zeros, "No Opportunities
    won in this period"; This Quarter "Oct–Dec 2026", ₹34.0L, 5 won; All Time
    "All time", ₹38.0L, 6 won, 60.0 % win rate. The title stayed at the same
    place on every period.)
18. [Simple] Click a bar (e.g. Fahad). **Expected:** opens Pipeline filtered
    to his Won Opportunities, labelled "Fahad, Won, This Quarter" (or "…, Won"
    on All Time). Go back to Sales Report. **Expected:** the report is still
    there, with the pinned top. — **Pass** (13 Nov, Claude drove it in the
    browser as Haroon, This Quarter: the Fahad bar opened Pipeline in the List
    view with "Showing: Fahad, Won, This Quarter · 2 Opportunities": "Test new
    fastrack opportunity from Project 360" (Aster MIMS Calicut) and "Test
    opportunity" (EMS Hospital). The back arrow returned to Sales Report with
    the same period, figures and pinned top. The All Time wording ("Fahad,
    Won") was not run.)
19. [Simple] Regression, Sales-And-Pipeline plan steps 6–8: This Month,
    This Quarter, All Time headline figures move the way that plan says
    (This Month ≤ This Quarter ≤ All Time for revenue; All Time includes
    Won Opportunities with no close date). — **Pass** (13 Nov, Claude drove it
    in the browser as Haroon: revenue ₹0.0L This Month ≤ ₹34.0L This Quarter ≤
    ₹38.0L All Time. Read-only Dev query, 13 Nov: the sixth Won, "USG 2"
    (another hospital, ₹4.0L, Basheer K), has no close date, so it is in All
    Time only; the other five Won add up to ₹34.0L. The Lost gap is explained:
    Dev holds 5 Lost, but "zz NA E2E – top bar" (Baby Memorial Hospital) has no
    product lines, and the Sales Report headline only counts Opportunities
    with at least one line, so it shows 4. Not caused by this batch; filed in
    the Backlog.)
20. [Simple] Regression, Sales plan step 10: Group by shows Rep, Zone, SBU,
    Product, Brand and no Stage. — **Pass** (13 Nov, Claude drove it in the
    browser as Haroon: the list shows Rep, Zone, SBU, Product, Brand.)
21. [Simple] Sign in as Fahad (Sales Staff), open Sales Report. **Expected:**
    his own figures only (2 Won this quarter), no other rep's bar. Sign back
    in as Basheer K. — **Pass** (13 Nov, Basheer, signed in as Fahad.)
22. [Simple] Opportunities On Hold is unchanged (Basheer: it stays as it
    is). **Expected:** it scrolls as one page like before. — **Pass** (13 Nov, Basheer.)

## D — My Work speed fix (My Work shows the same numbers, only quicker)

23. [Simple] My Work as Basheer K ("Showing: Me"). **Expected:** loads without
    an error and clearly faster than before the fix (Dev has not been timed
    for this batch; UAT read-only run on 12 Nov: median 875 → 434 ms, same
    answers — Progress-Archive 12 Nov). — **Pass for "loads without an error"
    only** (13 Nov, Basheer, signed in as Haroon: My Work Summary loaded fast
    and without an error. Speed is not judged on Dev: a small database proves
    nothing. The real check is UAT, after the deploy: Basheer times
    `weekly-followup` in F12 Network, to compare with the 12 Nov read-only
    run.)
24. [Complex: cross-screen comparison] Open the **Not visited in N+ days**
    tile. Pick any two Opportunities from the list and note their days
    figures. Then Reports → Stagnant Opportunities, set **Not visited for
    (days)** low enough that the same two Opportunities appear (e.g. 1), and
    compare. **Expected:** the same Opportunity shows the same number of days
    on both screens (both read the same last-contact calculation; the plain
    version is the one that did not change). — **Pass** (13 Nov, Claude drove it
    in the browser, signed in as Haroon with **Showing: Basheer K**, because
    Haroon's own tile holds only 1 Opportunity: all 11 Opportunities on the
    "Not visited in 30+ days" tile show the same days figure on Stagnant
    Opportunities at 30 days (140, 140, 137, 137, 137, 132, 132, 114, 104, 93,
    86), same name, hospital and owner.)
25. [Simple] On My Work check the other tiles still open their lists: "High
    priority or 70 %+", "Closing date passed", "Overdue next actions",
    "Next actions due this week". **Expected:** each opens, counts match
    the tile figure. — **Pass** (13 Nov, Claude drove it in the browser,
    signed in as Haroon with Showing: Basheer K): High priority or 70 %+ 1
    tile / 1 card; Closing date passed 0 / "Nothing here"; Not visited in 30+
    days 11 / 11 (step 24); Overdue next actions 13 / 13 cards; Next actions
    due this week 0 / "Nothing here".
26. [Simple] As Basheer K, change **Showing** to another person (e.g.
    Fahad) and back to Me. **Expected:** the figures change per person; no
    error. — **Pass** (13 Nov, Claude drove it in the browser, signed in as
    Haroon, not Basheer K, so Showing started at Me = Haroon). Figures by
    person, tiles High priority / Closing date passed / Not visited / Overdue
    next actions / due this week: Basheer K 1 / 0 / 11 / 13 / 0; Fahad 5 / 1 /
    3 / 3 / 0; Me (Haroon) 1 / 1 / 1 / 7 / 0. No error shown at any switch.
27. [Complex: phone layout] My Work at 390, 768 and 1280 px.
    **Expected:** unchanged from before the batch (no frontend change here);
    nothing runs past the card. — **Pass** (13 Nov, Basheer).

## Sign-off

Run on Dev, 13 Nov 2026 (Basheer, with Claude driving the read-only
browser checks he asked for): **28 of 29 steps passed** (27 steps plus
pre-flight P1 and P2); **step 11 not run, skipped by Basheer**. No step
failed. No fix was needed beyond the zone box line found in the pre-E2E
review. Step 19 passed with a finding that is not caused by this batch:
the Sales Report headline leaves out Won/Lost Opportunities without a
product line (UAT 13 Nov: Lost 25 real, 19 shown); filed in the Backlog.
The My Work speed itself cannot be shown on Dev; it is checked on UAT after
deploy.

Checks before the fix commit, 13 Nov: full backend tests 1,565 passed, ruff
clean, tsc 0 errors, lint 0 errors (135 old warnings).
