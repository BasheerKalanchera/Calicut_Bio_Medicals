# Annual Target Planning — Implementation Plan

**Status:** Approved — Basheer, 2026-10-20 (D1–D56; D57 added
2026-10-21). Replanned
2026-10-17 to 2026-10-20 (calendar-year brand targets, Haroon and
Latheef Bhai via Basheer; D23 onwards; incentive year settled
2026-10-19, D29; Part 1 / Part 2, D44–D49; review 2026-10-20, D50–D56).
First approved 2026-10-16. E2E test plan:
`docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md` (Part 1, written
2026-10-21). Build: Part 1 aimed at next week,
so the Oct–Dec 2026 targets can be entered (D38, D44); it reaches the
team with the full UAT move (D52).
**Traceability rows:** signed 3.1 ("Target splitting by product category,
quarterly/annual tracking") — this plan finishes its "annual" part (D10).
**Design / discussion:** `docs/Discussion-Annual-Target-Planning-2026-10.md`
(raised by Haroon and Latheef Bhai at the 15 Oct 2026 demo).

## Decisions

- D1. The year runs April to March, as the app already does (the 15 Oct
  demo showed it; no objection) — Basheer, 2026-10-16.
- D2. ~~The app splits a brand's yearly target into four quarters~~ —
  withdrawn 2026-10-16: brand targets are yearly only (D12).
- D3. ~~Warning while a brand's quarters don't add up to its year~~ —
  withdrawn 2026-10-16: brands have no quarters (D12).
- D4. ~~The SBU's yearly target is the total of its brands by default. The
  GM may set a different figure, higher or lower; the brand total is
  always shown next to it (discussion Q2) — Basheer, 2026-10-16~~ —
  withdrawn 2026-10-19 (D47; the quarter-level version is D36).
- D5. ~~Until the GM sets a figure, the SBU's yearly target follows the brand
  total whenever a brand target changes; once set, it stays as set
  (discussion S2) — Basheer, 2026-10-16~~ — withdrawn 2026-10-19 (D47).
- D6. ~~The GM spreads the SBU's year across the four quarters by hand; the
  screen warns while the quarters don't add up to the year (discussion
  Q3) — Basheer, 2026-10-15~~ — withdrawn 2026-10-19 (D47).
- D7. Reps are expected to plan only the quarter in progress, but may plan
  any later quarter in detail; nothing is locked (discussion S3, Q4) —
  Basheer, 2026-10-16.
- D8. ~~Reps see their SBU's yearly and quarterly targets, read-only
  (discussion Q5) — Basheer, 2026-10-15~~ — withdrawn 2026-10-17 (D26).
- D9. The rest of FY 2026-27 (2026-Q3, 2026-Q4) stays quarter by quarter
  for the SBU target; the yearly layer is first used for FY 2027-28
  (discussion Q6) — Basheer, 2026-10-16. For brands, see D12a; for the
  FY 2026-27 yearly SBU figure, D22a. Changed by D38 (new targets from
  Oct–Dec 2026).
- D10. This finishes the "annual" part of signed row 3.1 (Phase 1), not
  new work (discussion Q7) — Basheer, 2026-10-16.
- D11. ~~No automatic split anywhere: the GM types each quarter's portion of
  the SBU's yearly target by hand (D6). Applies to the SBU target only —
  Basheer, 2026-10-16~~ — withdrawn 2026-10-19 (D47; the seasonal
  pattern now splits, D25).
- D12. ~~Brand targets are **yearly only**, because vendors give annual
  figures: Brand Target Tracking shows and takes one yearly figure per
  brand, with no quarters. The yearly figures (brand and SBU) go in two new
  tables, not as a "yearly" row inside today's quarterly tables —
  Basheer, 2026-10-16~~ — withdrawn 2026-10-17 (D23–D25).
- D12a. ~~FY 2026-27: Brand Target Tracking shows each brand's existing four
  quarterly figures added up into one yearly figure. From FY 2027-28
  (April 2027) Haroon types the yearly figure directly — Basheer,
  2026-10-16~~ — withdrawn 2026-10-17 (D23–D25).
- D13. ~~The GM can clear the SBU's own yearly figure, which makes it follow
  the brand total again — Basheer, 2026-10-16~~ — withdrawn 2026-10-19
  (D47; the quarter-level version is D36).
- D14. ~~Where reps see the SBU targets (D8): a read-only line above "My
  Plan" on Target & Coverage Planning, e.g. "Imaging target FY 2027-28:
  ₹1,300 L · this quarter: ₹325 L" — Basheer, 2026-10-16~~ — withdrawn
  2026-10-17 (D26, D27).
- D15. ~~The app does not stop a GM entering a yearly figure for FY 2026-27;
  D9 is followed by simply not entering one — Basheer, 2026-10-16~~ —
  withdrawn 2026-10-19 (D47: no SBU yearly figure is entered).
- D16. Target vs Actuals on the Insights Dashboard gets a **yearly view**
  beside the quarterly one — Basheer, 2026-10-16. How it reads: D22.
- D17. Built, tested and moved to UAT **with the next full UAT move** —
  it must land before that move — Basheer, 2026-10-16. Changed by D44,
  then D52.
- D18. When a rep submits or revises a plan, the person who approves it
  (their own manager) gets a bell notification; a revision's message
  carries the rep's change note. Not the GM or Admin as well. A rep with
  no manager above them notifies no one (15 Oct demo ask) — Basheer,
  2026-10-16.
- D19. When a plan is approved or rejected, the rep gets a bell
  notification with the manager's note — Basheer, 2026-10-16.
- D20. Plan notifications go to the in-app bell only, like every other
  notification; no email or WhatsApp — Basheer, 2026-10-16.
- D21. Clicking a plan notification opens Target & Coverage Planning at
  that quarter, showing that rep's plan — Basheer, 2026-10-16.
- D22. The yearly Target vs Actuals view: the year's SBU target (the GM's
  figure, else the brand total) against Won revenue for the whole year;
  each rep's yearly figure is the four quarters added up, each quarter
  counted as the Quarter view's "Team plans" counts it (pending or
  approved; a rejected plan falls back to its last approved figure), so
  the two views always agree; brands show their yearly target against
  Won — Basheer, 2026-10-16 (wants to see how it looks: a mock-up is
  shown before build step 5). Changed by D31 (running total at each
  quarter) and D47 (the SBU's year is its four quarters added up).
- D22a. ~~FY 2026-27 only: the SBU's yearly target is its quarterly SBU
  targets added up, on Target & Coverage Planning and in the Year view —
  that year was planned quarter by quarter (D9), and its brand total is
  incomplete (on Dev, 2026-10-16: Critical Care brand total ₹120 L
  against ₹270 L of quarterly targets; Imaging no brand target against
  ₹260 L). From FY 2027-28, D4/D5 apply — Basheer, 2026-10-16~~ —
  withdrawn 2026-10-19 (D38, D47: every year's SBU figure is now its
  quarters added up).

**Replan, 2026-10-17** (Haroon and Latheef Bhai, via Basheer). Brands set
targets January–December and bill Cabio a quarter of it each quarter;
Jan–Mar is lean, Jul–Sep (monsoon) and Oct–Dec (year-end) are strong.
Calendar quarters and the app's quarters share the same months, so each
brand calendar quarter is exactly one app quarter (Jan–Mar 2027 = 2026-Q4,
Apr–Jun 2027 = 2027-Q1 — `scripts/quarter.py`, 2026-10-17). Withdrawn by
this replan: D8, D12, D12a, D14.

- D23. The GM enters each brand's own January–December figure as the
  brand sends it; only Admin and GM see it — Basheer, 2026-10-17.
- D24. Haroon sets a stretch per brand as a percentage (up to about
  100 %); the stretched figure is worked out and shown beside the brand's
  own figure — Basheer, 2026-10-17.
- D25. The stretched year is spread across the four calendar quarters by
  one seasonal pattern per SBU per year (e.g. 15/20/30/30 %, made-up),
  which the GM may change for a single brand — Basheer, 2026-10-17.
- D26. Only the SBU Manager (besides Admin and GM) sees the SBU target,
  and only the stretched figures. Reps do not see the SBU target
  (withdraws D8, D14) — Basheer, 2026-10-17.
- D27. The stretched SBU target is broken up into Area Manager targets.
  Reps see only their own Area Manager's target — Basheer, 2026-10-17.
  How it is broken up: answered by D32, D33 and D45; the last sentence
  is changed by D35.
- D28. The GM enters a calendar year's brand figures when the brands send
  them (January). Until then, next Jan–Mar has no target; its detailed
  planning waits, as planning is quarter by quarter anyway — Basheer,
  2026-10-17. "January" changed by D42 (each brand when it sends).
- D29. Team targets and incentives follow Option 3 of "Target and
  Incentive Year Options": each rep has a target for each quarter; each
  quarter's result is checked against the running total for the
  April–March year so far, so a shortfall can be made up later; part of
  the incentive is paid each quarter and the rest settled at year-end.
  Managers see April–March totals. How much is held back is HR's
  decision, beside today's half at order, half at full payment. The app
  does not calculate incentive amounts (PRD: outside Phase 1; Finance's
  incentive file parked for Phase 2), but Option 3 needs two things it
  lacks today: a target per rep per quarter (D30) and a year-so-far
  view (D31) — Haroon and Latheef Bhai, via
  Basheer, 2026-10-19. The options doc (revised 2026-10-19 after an
  outside review; PDF of it made the same day):
  https://claude.ai/code/artifact/c6122999-2af4-4fbc-b113-049959648e25.
  Rejected: yearly April–March (full-year target known only in January)
  and yearly January–December (bridging period, managers would see
  January–December). A provisional Jan–Mar target set in April was left
  out, as it would reverse D28.
- D30. Each rep gets a target for each quarter, set by their Area Manager
  by dividing up the Area Manager's own target (D27). The rep sees it;
  their plan is how they mean to reach it. Not the approved plan used as
  the target, because a rep would then set the target their own
  incentive is paid on. Today the app holds only brand and SBU targets
  (`docs/Physical-Schema.sql`). Answered together with the Area Manager
  split (D27, A1–A3) — Basheer, 2026-10-19.
- D31. Target vs Actuals' Year view shows the running total at each
  quarter: won from April up to that quarter against the targets added
  up from April (e.g. by September, Apr–Sep won against the Apr–Jun and
  Jul–Sep targets), so each quarterly payout and the year-end settlement
  can be read from it. Changes D22, which showed the whole year only —
  Basheer, 2026-10-19.
- D32. The SBU Manager divides the SBU's stretched target among its Area
  Managers; the GM can see and change it (D27's "who splits") —
  Basheer, 2026-10-19.
- D33. One total per Area Manager per quarter, not per brand, typed by
  hand, with a warning while they don't add up to the SBU's quarter. The
  same for reps under D30: one total per rep per quarter, with a warning
  while they don't add up to the Area Manager's target — Basheer,
  2026-10-19.
- D34. Area Managers no longer see the SBU target, only their own (D26);
  they have seen it since 16 Oct (migration 0061) — Basheer, 2026-10-19.
- D35. Reps see their own quarterly target (D30) only, not their Area
  Manager's; changes D27's last sentence — Basheer, 2026-10-19.
- D36. ~~The GM may set an SBU quarter different from its brands' total;
  the brand total is the default, always shown beside it, and clearing
  the GM's figure returns to it (as D4, D13 for the year) — Basheer,
  2026-10-19~~ — withdrawn 2026-10-20 (D53).
- D37. Brand Target Tracking shows each brand's quarterly billing beside
  Cabio's seasonal split, Admin and GM only; the app does not record
  purchases from brands, so nothing checks it — Basheer, 2026-10-19.
  Changed by D54 (name, and the GM may change each quarter).
- D38. The new targets start from Oct–Dec 2026 (2026-Q3): Haroon enters
  the brands' 2026 figures, stretched and spread, and the Oct–Dec share
  is divided down to Area Managers and reps. Target setting for that
  quarter is in progress outside the app, done by next week; the team
  enters those figures once this build is live. Reps see them after the
  quarter has begun; FY 2026-27's running total (D31) starts at Oct–Dec.
  Changes D9 and D22a, which kept the rest of FY 2026-27 quarterly as
  entered — Basheer, 2026-10-19 ("as soon this build goes live next
  week").
- D39. Screens show quarters as months and year (e.g. "Oct–Dec 2026"),
  not codes like "2026-Q3", which reads as July–September in calendar
  terms; the stored period stays `YYYY-Qn`. Year labels like "FY 2026-27"
  stay. Done in Part 1, as it rebuilds the same screens — Basheer
  (raised it), 2026-10-19.
- D40. Not every brand's year runs January–December. Each brand has a
  "year starts in" setting: January, April, July or October only, so
  each brand quarter is still exactly one Cabio quarter. Changes D23's
  "January–December figure" to the brand's own year — Basheer,
  2026-10-19.
- D41. The seasonal pattern (D25) is tied to the months (Jan–Mar lean,
  Jul–Sep and Oct–Dec strong), not to a brand's first quarter; an
  April–March brand uses the same pattern starting from Apr–Jun —
  Basheer, 2026-10-19.
- D42. The GM enters a brand's yearly figure whenever that brand sends
  it, ahead of the brand's year; until then that brand's coming quarters
  have no target. Changes D28's "January" — Basheer, 2026-10-19.
- D43. Brand Target Tracking moves by calendar year (e.g. "2027"); each
  brand shows its year that starts in it, with its months beside its
  name (e.g. "SonoScape · Jan–Dec 2027", "Brand X · Apr 2027–Mar 2028",
  made-up), and its four quarters by month (D39) — Basheer, 2026-10-19.
- D44. Built in two parts. Part 1: entering targets — brand yearly
  figures, stretch and seasonal split, SBU Manager's split to Area
  Managers, Area Managers' split to reps, each person seeing only their
  own target, and the month labels (D39). Part 2: the rest (Year view
  running totals, plan notifications, brand billing line, etc.). Changes
  D17: each part goes to UAT when it is finished; if Part 2 is finished
  by Wednesday 21 Oct 2026, both go with the full UAT move and the other
  items set for it — Basheer, 2026-10-19. When each part reaches UAT:
  changed by D52.
- D45. Each person's target is set by the person they report to in the
  app (the same reporting line plan approvals use); Admin and GM may set
  or change any. No one holds the SBU Manager role today (Backlog, "SBU
  Manager" called a currently-empty tier), and Area Managers report
  straight to Haroon (`docs/Zone-Hierarchy-Territory-Data-2026-08.md`), so
  for now Haroon divides each SBU's target among the Area Managers; once
  an SBU Manager is appointed it passes to them, as D32 says. A rep with
  no Area Manager above them gets their target from whoever they report
  to. Refines D30 and D32 — Basheer, 2026-10-19 (Q-A).
- D46. Brand quarters are saved, not worked out each time: when the GM
  saves a brand's yearly figure, stretch or seasonal split, the app works
  out its four quarters and saves them into the brand quarterly targets
  it already keeps, so Brand Target Tracking's "committed / gap" and the
  SBU quarter's brand total keep working unchanged — Basheer, 2026-10-19
  (Q-B).
- D46a. When a brand's year began before Oct–Dec 2026 (e.g. a
  January–December 2026 brand), only its quarters from Oct–Dec 2026 on
  are saved; earlier quarters keep the figures already entered, so past
  quarters' targets don't change (follows D38) — Basheer, 2026-10-19.
- D47. No separate SBU yearly figure: the SBU's quarter is its brands'
  quarterly total, ~~or the GM's own figure (D36)~~ (D53), and its year
  is simply its four quarters added up. Withdraws D4, D5, D6, D11, D13,
  D15 and D22a — Basheer, 2026-10-19 (Q-C).
- D48. Oct–Dec 2026 figures already typed in by hand: a brand's is
  replaced when the GM enters that brand's yearly figure; ~~an SBU's
  counts as the GM's own figure (D36) until he clears it, and the SBU box
  shows it beside the brand total~~ (an SBU's is removed: D53, D55). A read-only
  Dev count of these figures is shown before the build (UAT not checked;
  asked separately) — Basheer, 2026-10-19 (Q-D).
- D49. In Part 1, Target vs Actuals measures an Area Manager's "Your
  team" row against the Area Manager's own target (not the SBU target,
  which they no longer see, D34), and shows each rep's target beside
  their plan — Basheer, 2026-10-19 (Q-E).
- D50. When the GM changes an SBU's seasonal pattern, every brand that
  follows it has its quarters worked out and saved again; a brand with
  its own pattern (D25) is left alone. Quarters already ended don't
  change (D51) — Basheer, 2026-10-20 (Q-F).
- D51. When a brand's yearly figure, stretch or pattern changes, only the
  quarter in progress and later ones are saved again; quarters already
  ended keep their figures, so past Target vs Actuals results stay as
  reported (same reasoning as D46a) — Basheer, 2026-10-20 (Q-G).
- D52. Part 1 goes to UAT with the full UAT move; Part 2 follows in a
  later move. Part 1 can't go alone: UAT's code lacks migrations
  0055–0061, which come before Part 1's 0062. If the move can't happen
  next week, the team keeps its Oct–Dec 2026 targets outside the app
  until it does. Changes D44's "Wednesday 21 Oct" condition — Basheer,
  2026-10-20 (Q-H).
- D53. The SBU's quarterly target is its brands' quarterly total only;
  the GM cannot type his own SBU figure. Added later if a need appears.
  Withdraws D36 — Basheer, 2026-10-20.
- D54. The brand billing line is called **"Brands Billing to Cabio"**:
  the brand's own yearly figure split evenly across its four quarters,
  shown only, not editable. The GM changing a quarter when a brand
  changes its billing is left for later, if needed. Changes D37 —
  Basheer, 2026-10-20 (per-quarter editing considered, then dropped the
  same day).
- D55. The SBU target is the brands' total for every quarter, no
  exception for earlier quarters. The table holding the GM's typed SBU
  figures (migration 0060) is removed, with its Dev test figures, and so
  is the box's way to type them. Safe because 0060 never reached UAT, so
  no real results depend on it; on Dev, earlier quarters then show the
  brand total (often blank) — Basheer, 2026-10-20 (Q-I).
- D56. ~~"Brands Billing to Cabio": quarters need not add up; hand-changed
  quarters kept on a re-split (Q-J)~~ — withdrawn 2026-10-20: no
  per-quarter editing (D54).
- D57. An SBU Manager gets one quarterly figure from the person they
  report to (today Haroon) and divides it among the Area Managers who
  report to them; their Team targets warning compares against that
  figure, not the SBU target. They still see the SBU target (D26).
  Refines D32 and D45 — Basheer, 2026-10-21.
- D58. Build steps 1 (database) and 2 (server) are built together, with
  one checkpoint commit. Reason: removing the typed SBU target table
  while the server still reads it would break the SBU target box and
  Target vs Actuals on Dev between the two steps; no one uses those
  screens on Dev meanwhile — Basheer, 2026-10-21.
- D59. Once a brand has a yearly figure, its "year starts in" month
  can't be changed; the saved quarters were worked out from the old
  month — Basheer, 2026-10-21.
- D60. A brand's yearly figure can't be saved while neither the brand
  nor its SBU has a seasonal pattern for that year; the app asks for
  the SBU's pattern first rather than splitting the year evenly —
  Basheer, 2026-10-21.
- D61. No one sets their own quarterly target; only the person they
  report to, Admin or GM can — Basheer, 2026-10-21.
- D62. Admin/GM's Team targets panel lists the SBU's people who report
  to no one or straight to Admin/GM (today the Area Managers), and
  compares their total with the SBU target — Basheer, 2026-10-21.
- D63. A brand made inactive still counts in its SBU's target for any
  quarter it has a saved figure, so a quarter's total doesn't drop when
  a brand is switched off — Basheer, 2026-10-21.
- D64. Brand Target Tracking shows one line per brand (own figure,
  stretch, stretched); its four quarters, each with target, committed
  and gap, open under the line. Not four quarter columns: twelve figures
  don't fit, and brands whose year starts in another month wouldn't line
  up under month headings — Basheer, 2026-10-21.
- D65. Step 4's docs leave out two items: the in-app help for these
  screens is written in step 3 of
  `docs/User-Manual-And-Help-Catchup-Implementation-Plan.md`, which
  already covers them; Traceability row 3.1's note is added once, after
  Part 2, since the Year view finishes the "annual" part — Basheer,
  2026-10-21.

## Figures and sources

- SonoScape ₹400 L, a second brand ₹500 L, other brands ₹300 L, Imaging total
  ₹1,200 L, GM's figure ₹1,300 L, ₹325 L a quarter — made-up examples.
- 2026-Q3 = 01 Oct 2026 to 31 Dec 2026; 2026-Q4 = 01 Jan 2027 to 31 Mar
  2027; 2027-Q1 = 01 Apr 2027 to 30 Jun 2027 — `scripts/quarter.py`,
  2026-10-16.
- Latest migration `0061_sbu_target_area_manager_read.py` —
  `backend/alembic/versions`, listed 2026-10-16.
- Who sees the SBU target today (Admin, GM; SBU and Area Managers their
  own SBU's) — `docs/Physical-Schema.sql` policy `sbu_target_read`, and
  `TargetPlanningScreen.tsx:60-61`, read 2026-10-16.
- A rep may plan any quarter today; only a second plan for the same
  quarter is refused — `backend/app/domains/planning/service.py`
  `create_target_plan`, read 2026-10-16.
- No notification is sent for plans today — no `notify_*` call in
  `backend/app/domains/planning/`, searched 2026-10-16.
- Adydev reports to Nishad (D18 example) —
  `docs/Zone-Hierarchy-Territory-Data-2026-08.md`.
- Existing quarterly brand and SBU targets on Dev: not counted (a
  read-only Dev check, shown first, at build step 1).
- 2025-Q4 = Jan–Mar 2026, 2026-Q1 = Apr–Jun 2026, 2026-Q2 = Jul–Sep 2026,
  2026-Q3 = Oct–Dec 2026, 2026-Q4 = Jan–Mar 2027 — `scripts/quarter.py`,
  2026-10-19.
- "SBU Manager" is a currently-empty role tier — `docs/Backlog.md:1548`,
  read 2026-10-19 (D45); a September note, so re-checked on Dev in build
  step 1's read-only count. Dev, 2026-10-21: one test SBU Manager,
  Basheer K (Imaging, reports to Haroon); none on UAT or at Cabio yet —
  Dev query and Basheer, 2026-10-21 (D57).
- UAT's code lacks migrations 0055–0061 — `docs/Progress-Archive-2026-10.md:2206`;
  the `uat` branch's newest migration is `0054_fix_target_plan_brand_split_read_rls.py`
  (`git ls-tree uat`, 2026-10-20) (D52).
- Only Brand Target Tracking reads brand targets in the app —
  `services/targetPlanning.ts` callers and `planning/repository.py`
  searched 2026-10-19.
- An Area Manager's "Your team" row in Target vs Actuals is measured
  against the SBU target today — `TargetVsActualsSection.tsx:179-195`,
  `:230`, read 2026-10-19 (D49).
- SonoScape ₹400 L, 100 % stretch, 15/20/30/35 split, Oct–Dec ₹280 L —
  made-up example.

## 1. In plain terms

Built in two parts (D44). Part 1 lets the team enter the Oct–Dec 2026
targets as soon as it is live (D38); Part 2 adds the rest.

**Part 1 — entering targets.**
- **Brand Target Tracking** (Admin and GM only, D23) moves by calendar
  year (D43). Each brand has a "year starts in" month: January, April,
  July or October (D40). The GM types the brand's own yearly figure when
  the brand sends it (D42) and a stretch percentage; the screen shows the
  stretched figure beside it (D24). The stretched figure is spread over
  the brand's four quarters by its SBU's seasonal pattern, which the GM
  sets once per SBU per year and may change for one brand (D25, D41). The
  four quarters are saved as that brand's quarterly targets (D46); a
  later change re-saves only the quarter in progress and later ones
  (D51); changing the SBU's pattern re-saves the brands that follow it
  (D50). Quarters are shown
  by month, e.g. "Oct–Dec 2026" (D39), each with the team's committed
  figure and the gap, as today.
- **Target & Coverage Planning:**
  - The SBU target box shows the quarter's brand total, which is the SBU
    target, for every quarter; it can no longer be typed (D53, D55).
    Only Admin, GM and an SBU Manager see it
    (D26, D34).
  - A new **Team targets** panel lets each manager divide their own
    quarterly target among the people who report to them: one figure per
    person, with a warning while they don't add up (D33). Today that
    means Haroon divides each SBU's target among the Area Managers, and
    each Area Manager divides theirs among their reps (D45).
  - Everyone with a target sees **"Your target for Oct–Dec 2026"**: their
    own figure only (D35).
- **Target vs Actuals** (Insights Dashboard): an Area Manager's "Your
  team" row is measured against their own target, and each rep's target
  shows beside their plan (D49).
- **Month labels** replace codes like "2026-Q3" on these three screens
  (D39).
- **Stops being visible:** Area Managers no longer see the SBU target
  (D34); only Admin and GM see brand figures (D23).

**Part 2 — the rest.**
- Target vs Actuals gets a **Year view**: at each quarter, what was won
  from April up to that quarter against the targets added up from April
  (D16, D31).
- **Plan notifications** on the bell: submitted or revised → the
  approver; approved or rejected → the rep; clicking opens the plan
  (D18–D21).
- Brand Target Tracking shows each brand's **even quarterly billing**
  beside Cabio's seasonal split, as **"Brands Billing to Cabio"**: the
  brand's year split evenly, shown only (D37, D54).

**What doesn't change.** Plans, their approval, and the quarterly Target
vs Actuals for Admin, GM and reps' own plans work as today. The stored
quarter stays in the same form; only its label changes (D39).

**Where it lands.** Each part is built and tested on Dev. Part 1 goes to
UAT with the full UAT move; Part 2 follows in a later move (D52).

## 2. Build order

**Part 1** (steps 1 and 2 built together, one checkpoint commit; D58 —
`f2f5edd`, 0062 applied to Dev 21 Oct)
1. **Database** (migration 0062). Brand "year starts in" month; brand
   yearly figure and stretch; SBU seasonal pattern with a per-brand
   change; a quarterly target per person; brand figures readable by
   Admin and GM only; the typed SBU target table removed (D55).
   Before writing it: a read-only Dev count of the existing brand and
   SBU quarterly targets, and of who holds the SBU Manager role (D45),
   shown first (D48). Apply to Dev, regenerate
   `docs/Physical-Schema.sql`, checkpoint commit.
   *Stops working on Dev until steps 2–3:* Area Managers see "Target not
   set" in the SBU box and in Target vs Actuals' team row.
2. **Server.** Save a brand's year and work out its quarters (D46,
   D46a, D51), and re-save brands when their SBU's pattern changes
   (D50); the SBU quarter's brand total as its target (D47, D53, D55); per-person targets — set by the person's manager, Admin or GM,
   seen by the person, those above them, Admin and GM (D45); the Area
   Manager's team row against their own target (D49). Tests, checkpoint
   commit. *Stops working:* the Area Manager gap from step 1 remains until
   step 3.
3. **Screens.** Brand Target Tracking by calendar year; Target & Coverage
   Planning's SBU box, Team targets panel and "Your target" line; Target
   vs Actuals' team and rep rows; month labels. Type check, lint,
   checkpoint commit. *Stops working:* nothing.
4. **Docs and test for Part 1.** Business rules and the rule matrix,
   ADR-019 addendum, user manual and in-app help; pre-E2E review; manual
   E2E on Dev (test plan rewritten for Part 1 after this plan's approval).

**Part 2**
5. **Target vs Actuals: Year view** with running totals (D31); a mock-up
   is shown before building. Checkpoint commit.
6. **Plan notifications** (D18–D21) and **Brands Billing to Cabio**
   (D37, D54).
   Checkpoint commit.
7. **Docs and test for Part 2**, as step 4.

## 3. What could be affected

Found by a code search on 2026-10-16 and 2026-10-19 for the brand and SBU
target tables, their screens and the notification bell:
- (a) **Screens that request it directly:** Brand Target Tracking (brand
  targets, committed totals, edit dialog); Target & Coverage Planning
  (SBU target box, plans, approve and reject).
- (b) **Reports or links that open those screens:** none; both are menu
  screens. Part 2 adds the bell opening Target & Coverage Planning (D21).
- (c) **Other screens that reuse its data:** Insights Dashboard → Target
  vs Actuals reads the SBU target; its SBU and Company rows for Admin and
  GM take the brand total for every quarter (D53, D55), and its team row
  changes on purpose (D49); the rest of those rows (Won, plans) must not
  change. The plan
  form's brand split doesn't read brand targets (only Brand Target
  Tracking does). Part 2: the bell's existing destinations (Opportunity,
  lead, activity) must still open as today.
- Not affected: the old SBU-target figures in `App.jsx` (the legacy
  dashboard) are kept in the browser only, never in these tables.

Each gets a check before and after, in the E2E test plan.

## 4. Not in this plan (with reasons)

- **Incentive amounts:** outside Phase 1 (PRD; D29).
- **Brand years starting in other months** than January, April, July or
  October (D40).
- **A planning lock on future quarters** (D7).
- **Recording purchases from brands:** Brands Billing to Cabio (D37,
  D54) is shown, not checked against purchases.
- **Changing a quarter of Brands Billing to Cabio** (D54): added later
  if needed.
- **The GM's own SBU figure** (D53): added later if a need appears.
- **A quarter-review screen:** Target vs Actuals with "Previous quarter"
  already covers it (discussion section 5e).
- **Email or WhatsApp notifications** (D20): the app has neither today.

## 5. Business rules and records to update

- Business-Rules (Part 1): new BR-PL-10 (brand yearly target: year start
  month, own figure, stretch, seasonal split, saved quarters; Admin and
  GM only), BR-PL-11 (SBU quarterly target: the brands' total, not typed;
  who sees it), BR-PL-12 (per-person quarterly targets: who sets,
  who sees, the warning). Part 2: BR-PL-13 (plan notifications) and the
  Year view's running total. Matrix rows in the same commits.
- ADR-019 (Planning Calendar Model): addendum — brand years start in any
  calendar quarter; screens label quarters by month; storage unchanged.
- Traceability row 3.1: note that the annual part is built by this plan
  (D10) — after Part 2 (D65).
- `docs/UAT-User-Manual.md` for the three screens; its "Set the
  quarter's SBU target" section goes (D55). In-app help: the Help
  Catch-up plan's step 3 (D65).
- Where the typed SBU target is described as current (D55):
  `docs/Target-Coverage-Roster-Implementation-Plan.md` and
  `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` (a "replaced by"
  note), `docs/Frontend-Implementation-Standards.md:307` ("the GM's SBU
  target" wording) — searched 2026-10-20.
- `docs/Discussion-Annual-Target-Planning-2026-10.md`: Status → answered,
  pointing here.

## 6. Technical addendum

**Part 1**
- **Migration 0062:**
  - `brand.year_start_month` smallint NOT NULL DEFAULT 1, CHECK in
    (1, 4, 7, 10) (D40).
  - `brand_annual_target` (`brand_id` FK, `start_year` int = calendar year
    the brand's year starts in, `vendor_amount_lakhs` NUMERIC(15,2) ≥ 0,
    `stretch_pct` NUMERIC(5,2) ≥ 0, four nullable per-brand pattern
    columns `pct_jan_mar` / `pct_apr_jun` / `pct_jul_sep` / `pct_oct_dec`
    (all set or all null, adding to 100), audit columns); unique
    (`brand_id`, `start_year`).
  - `sbu_seasonal_pattern` (`sbu_id` FK, `year` int, the same four `pct_*`
    columns NOT NULL, CHECK sum = 100, audit columns); unique (`sbu_id`,
    `year`). A brand uses the pattern of the year its own year starts in
    (D41).
  - `person_quarter_target` (`user_id` FK `user_profile`, `sbu_id` FK,
    `planning_period` 'YYYY-Qn', `target_amount_lakhs` NUMERIC(15,2) ≥ 0,
    `set_by`, audit columns); unique (`user_id`, `sbu_id`,
    `planning_period`). Holds both Area Manager and rep targets (D30,
    D32, D45).
  - RLS: `brand_vendor_target_read` narrowed from `USING (true)` to Admin
    and GM (D23); same for the two new brand/pattern tables, with
    insert/update Admin and GM. `DROP TABLE sbu_target` (with its audit
    trigger and the `sbu_target_read` policy from 0060/0061; D55), so
    D34 holds by itself. `person_quarter_target` read: own row,
    rows of anyone below the caller on the `manager_id` line, Admin, GM;
    write: the row owner's direct manager, Admin, GM — via a new helper
    `cabio_app_is_above(p_user_id)` (recursive on
    `user_profile.manager_id`).
- **Server** (`backend/app/domains/planning/`):
  - `PUT /planning/brands/{id}/year-start`;
    `GET/PUT /planning/brand-annual-targets?calendar_year=`;
    `GET/PUT /planning/seasonal-patterns?year=`. Saving a brand's year
    computes `vendor × (1 + stretch/100) × pct` per quarter, rounded to
    2 decimals with the last quarter taking the remainder, and upserts
    `brand_vendor_target` for each period from 2026-Q3 on whose end date
    has not passed (D46, D46a, D51). Saving an SBU pattern repeats this
    for every brand of that SBU and year with null per-brand `pct_*`
    columns (D50).
    Admin/GM via `_require_admin_or_gm` (`service.py:71`).
  - SBU target = sum of `brand_vendor_target` for the SBU and period,
    every period (D53, D55); `SbuTarget` model, `SbuTargetRepository`
    and the SBU-target PUT route removed. Same in
    `TargetVsActualRepository.active_sbu_targets` (`repository.py:689`,
    read 2026-10-20), so Target vs Actuals' SBU and Company rows follow.
    Brand rows are Admin/GM-only under RLS (D23), so the sum is returned
    by a `SECURITY DEFINER` function that gives only the total, and only
    to callers allowed the SBU target (Admin, GM, that SBU's SBU
    Manager; D26).
  - `GET/PUT /planning/person-targets?period=`: the caller's own target,
    plus their direct reports' targets and their total against the
    caller's target (D33). Setter check: `get_approver_id(user_id)`
    (`service.py:81-93`) equals the caller, or Admin/GM (D45).
  - `TargetVsActualRepository`: the team row's target becomes the Area
    Manager's `person_quarter_target`; rep rows gain `target_lakhs` (D49).
- **Frontend:** `BrandTargetTrackingScreen.tsx` (quarter arrows at
  `:94-98` become calendar-year arrows; per-brand year start, own figure,
  stretch, stretched, four quarters; SBU pattern box; edit dialog at
  `:170`); `SbuTargetBox.tsx` (brand total, read-only from 2026-Q3; hidden for
  Area Managers and reps); new `TeamTargetsPanel.tsx` and "Your target"
  line on `TargetPlanningScreen.tsx`; `TargetVsActualsSection.tsx` team
  and rep rows (`:179-195`, `:230`); `services/targetPlanning.ts`,
  `types/targetPlanning.ts`. Month labels: new `formatPlanningPeriod`
  in `utils/formatter.ts` ("2026-Q3" → "Oct–Dec 2026"), used at
  `SbuTargetBox.tsx:49`, `TargetPlanDialog.tsx:206`,
  `TargetVsActualsSection.tsx:270`, `BrandTargetTrackingScreen.tsx:97`,
  `:170`, and `TargetPlanningScreen.tsx:228`, `:396`, `:552`, `:765` and
  its messages near `:454`, `:683`, `:731` (line numbers read
  2026-10-19).
- **Tests:** quarter computation and rounding; D46a (no write before
  2026-Q3); D51 (no write to an ended quarter); D50 (pattern change
  re-saves following brands, skips own-pattern brands); pattern sum; RLS reads — brand figures refused for non
  Admin/GM, SBU target refused for an Area Manager, person targets seen
  by self and those above only; setter check (direct manager only, plus
  Admin/GM); team row against the Area Manager's target; frontend type
  check and lint.

**Part 2**
- **Year view (D31):** `get_target_vs_actual` gains a fiscal-year mode
  returning, per quarter, Won from April to that quarter's end and
  targets summed from April; reuses the Quarter view's per-quarter logic.
- **Notifications (D18–D21):** `NotificationService.notify_plan_submitted`
  (recipient `get_approver_id(owner)`; skipped when None) and
  `notify_plan_decided` (recipient `target_plan.user_id`),
  `entity_type="target_plan"`; called where a plan becomes
  `PENDING_APPROVAL` in `create_target_plan` / `update_target_plan` and
  from `approve_or_reject_target_plan` (line numbers re-read at build).
  No migration: `notification.type` and `entity_type` are free
  varchar(50). `NotificationBell.tsx` gains a `target_plan` route to
  `TargetPlanningScreen` with period and rep.
- **Brands Billing to Cabio (D37, D54):** `vendor_amount_lakhs / 4` per
  quarter (last quarter takes the rounding remainder), shown beside the
  saved seasonal quarters; nothing stored, no migration.
