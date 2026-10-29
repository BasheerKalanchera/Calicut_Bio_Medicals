# Target vs Actuals Redesign — Implementation Plan

**Status:** Approved — Basheer, 2026-10-29. Split out of
`docs/Annual-Target-Planning-Implementation-Plan.md` (its D82–D87, which
become D1–D6 here) — Basheer, 2026-10-29 (D7).
**Traceability rows:** signed 3.2 ("Real-time actual-vs-target via
role-specific dashboards").
**Design / discussion:** mock-up
https://claude.ai/artifact/XR3ftVbahPshwicQ9Vxsd5 (version 16, agreed
2026-10-28; phone screens added in version 21, agreed 2026-10-29; a copy
of the agreed screens is kept in
`docs/Target-vs-Actuals-Redesign-Mockup-2026-10-29.html`); the 28 Oct discussion is in `docs/Progress-Archive-2026-10.md`
("2026-10-28 — Plan & Chore: Target vs Actuals redesign").
**E2E test plan:** `docs/Target-vs-Actuals-Redesign-Manual-E2E-Test-Plan.md`
(written 2026-10-29).

## Decisions

Still in force from the Annual Target plan, unchanged: D66 (FY 2026-27
counts from Oct–Dec 2026), D76 (people listed as a tree under their
manager; stacked blocks on a phone), D77 (the card's three-line header on
a phone) and D81 (a target so far with a missing quarter is not shown).

- D1 (was Annual Target D82). Target vs Actuals is where people come to
  check how they are doing against their targets, so it is a simple
  dashboard with minimal information. The Year view as built (25 Oct) is
  too cluttered and less clear than the Quarter view; it is redesigned
  from a mock-up before the Part 2 E2E resumes. Reopens Annual Target
  D31, D67 and D78 — Basheer, 2026-10-28.
- D2 (was D83). The Year view is three boxes and one table (mock-up
  "Proposed — simple Year view"). Boxes: Target so far, Won (paid) so
  far, Won % of target with a bar. Table: Company, SBU, then each person
  under their manager, with Target so far, Won (paid) so far and Won % of
  target with a bar. Gone from the Year view: Team plans, PO received,
  Plans vs target, the quarter-by-quarter table, rows that open, Year's
  target, Plan for year, Still to win and the "haven't submitted a plan"
  note. Annual Target D81 still holds for what remains. Replaces Annual
  Target D31, D67 and D78 — Basheer, 2026-10-28.
- D3 (was D84). The Quarter view takes the same shape (mock-up
  "Proposed — simple Quarter view"). Boxes: Target; Won (paid) with "PO
  received ₹X" as a small line under it; Won % of target; Likely finish
  with its % of target. Table: Company, SBU, then each person, with
  Target, Won (paid), Likely finish and a bar (won dark, likely finish
  light). A person's % is of their target, not their plan. Gone from the
  Quarter view: the Team plans, PO received and Expected boxes, the Plans
  vs target column, plan Status and Rep Plan, the "haven't submitted a
  plan" note, rows that open, and the zone and brand tables (the Sales
  Report already groups won amounts by zone and by brand). A person's
  plan and its status stay on Target & Coverage Planning. Changes Annual
  Target D79's "stay in the Quarter view" for the zone and brand tables —
  Basheer, 2026-10-28.
- D4 (was D85). Clicking a person's name in the Quarter view opens a
  screen of their own, not a row that opens underneath (mock-up
  "Proposed — a person's own screen"): the four boxes for that person, a
  By hospital table and a By brand table (Planned against Won), and the
  notes on Opportunities with no closing date or no PO date. No such
  screen for the SBU row. Names in the Year view are not links (D2) —
  Basheer, 2026-10-28.
- D5 (was D86). The red "N past closing date" mark leaves Target vs
  Actuals altogether; Target vs Actuals carries no to-dos. Managers find
  late Opportunities instead in the Insights Dashboard's manager-only
  "Overdue Actions" tab, which gains a "Past closing date" count and
  value per person beside the overdue next actions, and is renamed
  "Overdue". Clicking a person's count opens My Work with that person
  already chosen. Built with the redesign so the mark and its
  replacement change together. Changes Annual Target D80 and BR-OP-16's
  "Where shown" — Basheer, 2026-10-28.
- D6 (was D87). A year that hasn't started (e.g. FY 2027-28 seen in Oct
  2026) shows, in the Year view, one line in place of the boxes and
  table: "FY 2027-28 starts in Apr 2027 — nothing to show yet." Closes
  the Annual Target E2E's open I8 (the design didn't say what an upcoming
  year shows) — Basheer, 2026-10-29.
- D7. The redesign is its own plan with its own E2E test plan, because it
  covers both views of Target vs Actuals plus the Overdue tab, while the
  Annual Target plan is about setting targets. The Annual Target E2E's
  section I (the old Year view) is replaced by this plan's E2E; its
  sections J, K and L (bell, billing, phone look) can resume without
  waiting for this build — Basheer, 2026-10-29.
- D8. Annual Target Part 2 goes to UAT only together with this redesign,
  so users never see the Year view rejected in D1 — Basheer, 2026-10-29.
- D9. Built by the parallel Build session (`/build`) now, while Build &
  Test runs the My Work E2E; then My Work steps 2 and 4 during the Part 2
  E2E; then the hospital next-action rule — Basheer, 2026-10-29.
- D10. On a phone, as the mock-up's "Proposed — on a phone (D10)" row
  (version 21), agreed as the UI for phones — Basheer, 2026-10-29:
  - Header: three lines as today (Annual Target D77) — title; SBU choice
    with the Quarter/Year switch; the period with its arrows.
  - Boxes two to a row. Quarter view: four boxes. Year view: Target so
    far and Won so far side by side, Won % of target with its bar across
    the full width below.
  - The Company, SBU and person rows are stacked blocks as today (Annual
    Target D76): name, then the figures side by side (Quarter: Target,
    Won (paid), Likely finish; Year: Target so far, Won so far), then the
    bar and %. Company and SBU blocks are shaded like the table's summary
    rows; a rep's block is indented and says "reports to <manager>".
    Names can be tapped in the Quarter view only (D4).
  - A person's own screen: the four boxes two to a row; By hospital and
    By brand as one block per hospital or brand (name, Planned, Won),
    each list ending in a shaded Total block; the two notes at the
    bottom.
  - Overdue tab: one block per person — overdue next actions, then "Past
    closing date" count and its value side by side. A count above zero
    is a red mark that can be tapped (opens My Work, D5); zero is grey
    and can't be tapped.
- D11. On the Overdue tab (D5) both of a person's counts open My Work
  with that person chosen in "Showing", straight at the matching list on
  My Work's tabs (My Work D30, D33), as a Summary box does: "Past closing
  date" opens the Opportunities tab at "Closing date passed"; the overdue
  count opens the Next actions tab at "Overdue next actions". The tab
  lists only people with at least one of the two counts above zero;
  someone with nothing overdue and nothing late isn't listed. The late
  count uses the same rule as My Work's "Closing date passed" (Active,
  owner only, My Work D22), so the two numbers match — Basheer,
  2026-10-29.

## Figures and sources

- 2026-Q3 = 01 Oct 2026 to 31 Dec 2026 (the quarter we are in);
  2027-Q1 = 01 Apr 2027 to 30 Jun 2027 (FY 2027-28 starts Apr 2027,
  D6) — `scripts/quarter.py`, 2026-10-29.
- Mock-up version 16 — `docs/Progress-Archive-2026-10.md`, 28 Oct entry;
  phone screens, version 21 (29 Oct). All mock-up figures are made up.
- The Overdue tab's list and body lines (`InsightsDashboardScreen.tsx`
  `:38-43`, `:248-280`) — read 2026-10-28 (Annual Target plan addendum);
  re-read at build.
- "FY 2027-28 shows no SBU or Company row today" — Annual Target E2E I8,
  Dev, 2026-10-28 (Basheer and Claude); `service.py:1232–1235`.
- Annual Target Part 2 is not on UAT (UAT runs `8b2ec8a`) —
  `.claude/session-handover-build.md`, checked against git 2026-10-29.
- ₹ figures in the E2E plan: from Dev at the time, each with its source.

## 1. In plain terms

Target vs Actuals (Insights Dashboard card) becomes a simple dashboard:
how each person, team, SBU and the company are doing against their
targets, nothing else (D1).

- **Year view (D2):** three boxes — Target so far, Won (paid) so far,
  Won % of target — and one table: Company, SBU, then each person under
  their manager, with the same three figures and a bar. For FY 2026-27
  "so far" counts from Oct–Dec 2026 (Annual Target D66). A year that
  hasn't started shows one line saying so (D6). Names are not links.
- **Quarter view (D3):** four boxes — Target; Won (paid), with PO
  received as a small line under it; Won % of target; Likely finish with
  its % of target — and the same table with Target, Won (paid), Likely
  finish and a bar. A person's % is now of their target, not their plan.
- **A person's own screen (D4):** clicking a name in the Quarter view
  opens it: that person's four boxes, By hospital and By brand (Planned
  against Won), and notes on Opportunities with no closing date or no PO
  date.
- **Overdue tab (D5):** the managers' "Overdue Actions" tab is renamed
  "Overdue" and shows, beside each person's overdue next actions, how
  many of their Opportunities are past their closing date and their
  value. Clicking that count opens My Work with that person chosen.
- **What goes:** plans and their status, PO received as a box, Expected,
  the zone and brand tables, rows that open, the quarter-by-quarter
  table and the red "past closing date" mark. Plans stay on Target &
  Coverage Planning; zones and brands are in the Sales Report.

**What doesn't change.** The figures themselves — targets, Won, PO
received, Likely finish — are worked out as today; only what is shown
changes. Who sees which rows is as today. No change to saved data.

**Where it lands.** Built and tested on Dev. It goes to UAT together
with Annual Target Part 2, not before or after (D8).

### On a phone

As D10: boxes two to a row; table rows as stacked blocks
(name, figures, bar); the card's three-line header as today (Annual
Target D77); a person's own screen with its boxes two to a row, then one
block per hospital and per brand; the Overdue tab's new figures on each
person's block.

## 2. Build order

Built by the parallel Build session in its own copy of the code (D9).
Nothing stops working on Dev during the build: Dev keeps today's screens
until the build is merged.

1. **Server.** Year endpoint: drop the fields the new Year view no
   longer shows; return the "hasn't started" state (D6). Quarter
   endpoint: drop the late list and its count (D5). Overdue: add each
   person's count and value of Opportunities past their closing date.
   Tests; checkpoint commit.
2. **Screens.** Year and Quarter views (D2, D3, D6), a person's own
   screen (D4), the Overdue tab and its link to My Work, which accepts a
   starting person (D5). Phone layout (D10). Type check, lint;
   checkpoint commit.
3. **Docs and test.** Business rules, user manual and in-app help notes
   (section 5); pre-E2E review; manual E2E on Dev. Then to UAT with
   Annual Target Part 2 (D8).

## 3. What could be affected

From the Annual Target plan's search (2026-10-16, 2026-10-19) and the
28 Oct reading of the Overdue tab; re-searched at build:
- (a) **Screens that request it directly:** Insights Dashboard → Target
  vs Actuals (both views); Insights Dashboard → Overdue Actions tab.
- (b) **Reports or links that open those screens:** none today. New:
  the Overdue count opens My Work with a person chosen (D5).
- (c) **Other screens that reuse its data:** the person's own screen
  reuses the hospital and brand detail behind today's opening rows. Must
  not change: the Overdue tab's existing overdue-actions count; My Work
  still opens on "Me" from the menu and resets when left (My Work D6);
  the Sales Report; Target & Coverage Planning's plans and their status.

Each gets a check before and after, in the E2E test plan.

## 4. Not in this plan (with reasons)

- **Zones and brands for the SBU in Target vs Actuals** (D3, D4): the
  Sales Report already groups won amounts by zone and by brand.
- **Clickable names in the Year view** (D4).
- **A person's own screen for the SBU row** (D4).
- **Changing how any figure is worked out:** this redesign changes only
  what is shown (section 1).

## 5. Business rules and records to update

- Business-Rules: the Year view's "so far" totals (D2, with Annual
  Target D81); BR-OP-16's "Where shown" — Plan vs Actuals Tracking
  replaced by the Insights Dashboard's Overdue tab (D5), in the same
  commit as the build. Matrix rows in the same commit.
- Traceability row 3.2's plain-language column ("shows each person's
  target, plan, PO received and Won … A year-to-date view is still to be
  added"): updated after the E2E passes.
- `docs/UAT-User-Manual.md` and in-app help for Target vs Actuals and
  the Overdue tab: with the UAT move (D8).
- `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md`: a "replaced
  by" note where it describes the Quarter view's plan columns.

## 6. Technical addendum

File and line numbers re-read at build.
- **Year view** (`TargetVsActualsYear.tsx`; `GET
  /planning/targets/target-vs-actuals/year`): the screen drops the
  quarter-by-quarter table, opening rows, plan, PO received and "haven't
  submitted" parts; the endpoint's unused fields are removed with them.
  Annual Target D81's hiding of an incomplete target stays. A year with
  no counted quarter yet returns a "not started" state the screen shows
  as D6's line (today it builds no SBU or Company row,
  `service.py:1232–1235`).
- **Quarter view** (`TargetVsActualsSection.tsx`,
  `TargetVsActualsParts.tsx`): four boxes and one table as in D3; zone
  and brand tables, plan status and Rep Plan removed; a person's % uses
  `target_lakhs`, not their plan.
- **Person screen** (D4): new, opened from a name in the Quarter view
  for one person and quarter; reuses the hospital and brand detail the
  Quarter view's opening rows use today.
- **Overdue tab** (`InsightsDashboardScreen.tsx`, tab list `:38-43`, tab
  body `:248-280`, read 2026-10-28): renamed "Overdue"; each person's
  row gains the count and ₹ value of their Active Opportunities past
  their expected closing date (BR-OP-16, same rule as My Work's "Closing
  date passed"), from `getOverdueActions()` or a sibling call. A count
  opens `MyWorkScreen.tsx` with that person chosen in "Showing" and at
  its list (D11): the screen accepts a starting person and a starting
  list, reusing `openTab(tabId, listId)` (`"opportunities"`,
  `"closing-date-passed"`; `"next-actions"`, `"overdue"`; read
  2026-10-29). Its reset when left (My Work D6, D33) and view-only rule
  (D15) are unchanged. The overdue query moves from grouping reminders to
  listing scoped people with either count above zero (D11).
- **Late mark:** the red "N past closing date" mark and the late list
  are removed from the Quarter view and its endpoint (D5).
- No migration. Backend tests for the changed endpoints; `api.ts`
  regenerated with the backend commit.
