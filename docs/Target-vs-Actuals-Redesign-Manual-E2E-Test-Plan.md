<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Target vs Actuals Redesign — Manual E2E Test Plan

**Covers:** `docs/Target-vs-Actuals-Redesign-Implementation-Plan.md`
(D2–D6, D10, D11), build steps 1–2. Replaces section I (I1–I16, the old Year
view) of `docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md` (D7).
Also covers `docs/Target-vs-Actuals-Simpler-Table-Implementation-Plan.md`
(D2–D7, D10): sections A–C rewritten 2026-10-31 for the simpler table —
no boxes on the Quarter and Year views, a PO received column, no Likely
finish anywhere, three boxes on a person's own screen.
**Built:** redesign merged 29 Oct (`3bafbc0`); the simpler table `c490eb9`, merged into `main` 1 Nov (`515a2f2`); pre-E2E review fix `03ac0ea`; the person screen's round Back arrow and the two drop-down names, `3937558` (1 Nov), pushed. Fixes found in this E2E, built by `/build` on `worktree-build`, merge into `main` pending: `52e8397` (SBU name, "No approved plan", arrow hover text), `f2b72c6` and `1c1c78c` (person screen at the top, header and Insights tabs hidden), `22e3526` (Overdue tab as a table, inactive accounts), `35e9156` (Sales Report dates line). Expected wording below rewritten 2 Nov from that code (read, not run).
**Where:** Dev (`main`).
**Restart (Simpler table D9):** the run parked at 6 of 40 on 30 Oct
(Progress-Archive 2026-10, 30 Oct). Its results are cleared here and the
whole plan runs again from P1 once the simpler table is merged.

## Checked against live data

Checked read-only on Dev, 2026-10-29, as Haroon Sidheeq (GM), with all
three RLS settings (user, role, SBU) set and verified (GM has no SBU; the
check returned General Manager and his id). Re-run at P3 on 2026-10-30, the same way: Dev data
changes during other E2Es. What moved is marked "30 Oct" below.

- **Who sees:** as Target vs Actuals and the Overdue Actions tab today:
  Admin and GM everyone; an Area Manager their own row and their team;
  a rep their own row. Overdue tab: managers only. Teams: Fazal → Fahad;
  Shruthi → Rudrappa; Arun Adarsh → Vivek; Nishad K V → no one; Fazal,
  Shruthi, Arun Adarsh, Nishad K V and Basheer K report to Haroon.
- **Who can approve:** n/a — nothing in this plan approves anything.
- **Who can save:** n/a — no step saves anything (no change to saved
  data, plan section 1).
- **Existing values:** overdue next actions / Active Opportunities past
  their expected closing date, per person (Dev, 29 Oct):
  - Abdul Latheef P 1 / 0; Basheer K 15 / 0; Shruthi 2 / 0; Vivek 2 / 0;
    Nishad K V 1 / 0; Arun Adarsh 0 / 0; Rudrappa 0 / 0.
  - Fazal 2 / 2, ₹24.0 L: "New USG m/c" (aster medicity) ₹1.0 L, closing
    15 Sep 2026; "New oppotunity fast track" (Aster DM) ₹23.0 L, 1 Oct
    2026.
  - Fahad 2 / 1, ₹20.0 L (30 Oct; was 0 / 1 on 29 Oct): "Test Gate
    override oppotunity (renamed for TC-19/22)" (Maulana), 3 Sep 2026.
    The old tab listed only people with an overdue action; the redesign
    also lists anyone with a late Opportunity (D11).
  - Overdue total as Haroon: 31 (30 Oct; was 29).
  - Haroon Sidheeq 6 / 1, ₹50.0 L: "Activity visibility test" (Aster
    DM), 21 Sep 2026.
  - Targets, Oct–Dec 2026 (Dev, 28 Oct, Annual E2E P8): Imaging ₹280.0 L
    (Fazal ₹160.0 L, Fahad ₹140.0 L, Shruthi ₹120.0 L, Rudrappa
    ₹100.0 L), Won ₹34.0 L, PO received ₹16.0 L, Likely finish
    ₹109.8 L; Critical Care ₹185.0 L (Arun Adarsh ₹100.0 L, Vivek
    ₹90.0 L, Nishad K V ₹85.0 L), Won ₹0; Company ₹465.0 L. Plans:
    Rudrappa ₹10.0 L approved, Basheer K ₹55.0 L pending.
  - Re-checked 30 Oct (the app's own Target vs Actuals code, run as
    Haroon on Dev): every figure above is unchanged (Imaging ₹280.0 L /
    ₹34.0 L / PO ₹16.0 L / Likely finish ₹109.8 L; Company ₹465.0 L,
    7.31 %). Won by person, Oct–Dec: Basheer K ₹23.0 L (41.82 % of his
    ₹55.0 L plan), Fahad ₹11.0 L, everyone else 0; Critical Care Won 0.
    Rudrappa's plan: hospitals — one line, "Not assigned to a hospital",
    ₹10.0 L; brands — SonoScape ₹10.0 L (P5). Critical Care plans, both
    approved: Arun Adarsh ₹50.0 L, Vivek ₹66.0 L (not used by any step).

Button labels, messages and the order of checks are taken from the plan,
since the screens aren't built yet. **Re-check every quoted label
against the built code before the E2E starts** (pre-E2E review).

## Figures and sources

- 2026-Q3 = 01 Oct 2026 to 31 Dec 2026 (today's quarter); FY 2027-28
  starts Apr 2027 — `scripts/quarter.py`, 2026-10-29.
- Overdue and past-closing counts, values and Opportunity names above —
  Dev read-only query, 2026-10-29 (scratchpad `tva_overdue_check.py`),
  re-run 2026-10-30 (scratchpad `tva_p3_check.py`).
- Overdue total as Haroon, 31 — counted with a tool from the 30 Oct run
  (was 29 on 29 Oct).
- Won by person, Rudrappa's plan lines, Critical Care plans — the app's
  own Target vs Actuals code run as Haroon on Dev, 2026-10-30 (scratchpad
  `tva_p3_figures.py`).
- Targets, Won, PO received, Likely finish, plans — Annual Target E2E
  P8, Dev, 2026-10-28.
- Won % 12.14 (Imaging), 7.31 (Company); Likely finish 39.21 % (Imaging) —
  worked out with a tool from the P8 figures; re-worked at P3.
- Teams and managers — Annual Target E2E "Checked against live data",
  Dev, 2026-10-21; confirmed by the 29 Oct query's manager column.
- Overdue tab as built: label "Overdue"; empty text "Nobody on the team
  has overdue next actions or Opportunities past their closing date." —
  `InsightsDashboardScreen.tsx` lines 42 and 272, read 2026-10-30. (The
  old tab, before the redesign: label "Overdue Actions", card title
  "Overdue Actions — {total} total", empty text "Nobody on the team has
  overdue actions." — same file, read 2026-10-29.)
- My Work's small tab "Overdue next actions" (P4) —
  `MyWorkScreen.tsx:275`, read 2026-10-30.
- "FY 2027-28 starts in Apr 2027 — nothing to show yet." — plan D6.
- My Work's "Showing" picker and its Summary tab — `MyWorkScreen.tsx`,
  read 2026-10-29.

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (layout shift, multi-step,
cross-screen/cross-role, or a genuine visual check). Basheer runs Complex
steps too, from exact instructions; a step Claude drives in the browser
says so — `[Complex: Claude — <reason>]` — and only when it can't be judged
by eye (e.g. measuring whether something runs past its card), to save
usage credits (Basheer, 2026-10-29). No step saves to Dev.

**Phone:** this is a phone app (PWA). Every screen, card and pop-up the
feature adds or changes gets its own `[Complex: phone layout]` step: at
phone width, every row, arrow and tab opened, nothing runs past the card
and nothing looks squashed. Basheer runs it at 390, 768 and 1280 px;
nobody checks in a browser before handover (Basheer, 2026-10-29), so this
step is the first look. Claude measures in the browser only if something
looks off.

**Opportunities:** every step that names an Opportunity puts its hospital
beside it in brackets. This plan creates none.

## Pre-flight

- P1. [Simple] Dev backend restarted since the simpler table's server
  change (PO received on the Year view's person rows). **Result 1 Nov —
  Pass (Basheer).** —
- P3b. [Complex: Claude — reading values the screen doesn't show]
  (New 2 Nov.) Re-read before the re-runs. **Result 2 Nov — Pass with
  changes (Claude, Dev read-only, the app's own Target vs Actuals and
  Overdue code run as Haroon and Fazal, all three RLS settings
  verified).** Unchanged: Imaging ₹280.0 L / ₹34.0 L / ₹16.0 L / 12.14 %;
  Company ₹465.0 L / 7.31 %; Critical Care ₹185.0 L / 0; Fahad 44.00 % of
  plan; Basheer K 41.82 %; Fazal's team row ₹160.0 L / ₹11.0 L / 6.88 %;
  Fazal and Shruthi have no counted plan (NOT_STARTED). **Moved:** Overdue
  total 32 (was 30): Fahad 3 (was 2), Vivek 3 (was 2); Fazal's tab total
  is 5 (was 4). —
- P1b. [Simple] (New 2 Nov.) After the `worktree-build` merge, the Dev
  backend is restarted once more: the Overdue tab now gets an
  "inactive account" flag from the server (`22e3526`). One restart covers
  this plan and the Tabs plan. **Result 2 Nov — Pass (as Tabs P1).** —
- P2. [Simple] App running on Dev; Basheer can sign in as Haroon
  Sidheeq, Fazal, Shruthi and Fahad. **Result 1 Nov — Pass (Basheer).** —
- P3. [Complex: Claude — reading values the screen doesn't show] Re-run
  the 30 Oct read-only query and the P8 figures; update "Existing
  values" and the expected figures below if they moved. Also read PO
  received per person for Oct–Dec 2026 and for the year so far (not yet
  checked; A2 and B2 need them), and the number of Opportunities with no
  PO date per person (C3). **Result 1 Nov — Pass with changes (Claude,
  Dev read-only, the app's own Target vs Actuals and Overdue code run as
  Haroon and Fazal, all three RLS settings verified).** Unchanged:
  Imaging ₹280.0 L / Won ₹34.0 L / PO ₹16.0 L / 12.14 %; Company
  ₹465.0 L / ₹34.0 L / ₹16.0 L / 7.31 %; Critical Care ₹185.0 L / 0;
  Rudrappa ₹100.0 L target (P5 as before). **PO received, Oct–Dec 2026
  and the year so far (same):** Basheer K ₹5.0 L, Fahad ₹11.0 L, everyone
  else 0. Fahad's Won % is 44.00 % of his ₹25.0 L plan (quarter) and
  7.86 % of his ₹140.0 L target (year); Basheer K 41.82 % of plan. As
  Fazal: team row ₹160.0 L / ₹11.0 L / ₹11.0 L / 6.88 %, Fazal and Fahad
  only. **Moved:** Overdue total 30 (was 31): Basheer K 11 (was 15),
  Haroon 7 (was 6), and a new row "Test - Area Manager" 2 / 0 — an
  inactive test account (reports to the inactive "Test - General
  Manager"); the Overdue tab lists it, see D9. Fazal's tab total is 4. —
- P4. [Simple] As Fazal: My Work → "Showing" on "Me" → Next actions →
  "Overdue next actions". Note the number of rows. **Expected:** 2 (Dev,
  29 Oct). D2 compares the Overdue tab's count with this one, taken from
  a separate screen. **Result 1 Nov — Pass (Basheer);** the count is 2,
  as the Overdue code returns for Fazal (P3). —
- P5. [Complex: Claude — reading values the screen doesn't show]
  Rudrappa's Oct–Dec 2026 plan, read from Dev at P3. On 30 Oct:
  hospitals — one line, "Not assigned to a hospital", ₹10.0 L; brands —
  SonoScape ₹10.0 L. Used by C2 and F2. **Result 1 Nov — Pass (Claude,
  Dev read-only, with P3):** unchanged. —

## A — Year view (D2, D6; Simpler table D2, D4, D5)

1. [Simple] As Haroon: Insights Dashboard → Target vs Actuals → Year,
   FY 2026-27, the SBU box on its default (Imaging; Haroon's SBU box
   lists only Imaging and Critical Care, there is no "All").
   **Expected:** no boxes above the table (Simpler table D2); the small
   "This year · as of …" line is still there. **Result 1 Nov — Pass
   (Basheer).** —
2. [Simple] Same screen, the table. **Expected:** columns Who, Target so
   far, Won (paid) so far, PO received so far, Won % of target with a
   bar. Rows: Company, then Critical Care and Imaging, then each person
   under their manager. Imaging ₹280.0 L / ₹34.0 L / ₹16.0 L / 12.14 %;
   Company ₹465.0 L / ₹34.0 L / 7.31 %; Company's and each person's PO
   received so far as read at P3. Switching the SBU box to Critical Care changes the SBU
   row to ₹185.0 L / ₹0.0 L / 0.00 % (Dev, 30 Oct). **Expected (added
   2 Nov for `52e8397`):** the second row is named after the SBU —
   "Imaging", then "Critical Care" after the switch — not "SBU".
   **Result 1 Nov — Pass (Basheer) on the old wording.** Found: the rows
   are Company, then one row labelled "SBU" at the time of this run (not
   "Imaging" or "Critical Care"; the plan's wording was wrong, the
   screen only ever shows the chosen SBU's row), then the team
   hierarchy starting with Haroon. Basheer asked for the SBU's name in
   that row; built as `52e8397` (same on the Quarter view, B2). Re-run
   A2 after the merge. **Re-run 2 Nov, after the merge — Pass (Basheer):**
   the second row is named "Imaging", and "Critical Care" after the
   switch. —
3. [Simple] Same screen. **Expected:** none of: Likely finish (as a box,
   a column or in the bar), Team plans, Plans vs target, a
   quarter-by-quarter table, Year's target, Plan for year, Still to win,
   the "haven't submitted a plan" note. **Result 1 Nov — Pass
   (Basheer).** —
4. [Simple] Click a person's name, then a Company or SBU row.
   **Expected:** nothing opens; names aren't links (D2, D4). **Result 1
   Nov — Pass (Basheer).** —
5. [Simple] Arrow forward to FY 2027-28. **Expected:** one line in place
   of the table: "FY 2027-28 starts in Apr 2027 — nothing to show yet."
   (D6; closes the Annual E2E's open I8). **Result 1 Nov — Pass
   (Basheer).** —
6. [Complex: phone layout] Year view at 390, 768 and 1280 px, FY 2026-27
   and FY 2027-28. **Expected (390):** header on three lines (title; SBU
   choice with Quarter/Year; period with arrows); no boxes; Company and
   SBU as shaded blocks, each person a block — name, then one line each
   for Target so far, Won (paid) so far, PO received so far and Won % of
   target;
   each rep's block indented with "reports to <manager>"; 768 and 1280
   as tables. Nothing runs past the card. **Result 1 Nov — Pass
   (Basheer).** —

## B — Quarter view (D3, D5; Simpler table D2, D3, D5, D6)

1. [Simple] As Haroon: Target vs Actuals → Quarter, Oct–Dec 2026, SBU
   "Imaging". **Expected:** no boxes above the table; the small "This
   quarter · as of …" line is still there. **Result 1 Nov — Pass
   (Basheer).** —
2. [Simple] Same screen, the table. **Expected:** Company, Imaging, then
   Fazal (with Fahad under him), Shruthi (with Rudrappa), Basheer K;
   columns Who, Target, Won (paid), PO received, Won % with a bar. Imaging
   ₹280.0 L / ₹34.0 L / ₹16.0 L / 12.14 %; each person's PO received as
   read at P3. The bar is one colour, Won only — no lighter part
   (Simpler table D6). Rudrappa's % is of his ₹10.0 L plan and says "of
   plan" beneath it (Basheer, 2026-10-29: a person's % stays Won ÷
   plan); the Company and Imaging rows say "of target". His own screen
   (C1) shows Won % of his ₹100.0 L target. **Expected (added 2 Nov for
   `52e8397`):** the Imaging row is named "Imaging"; a person with no
   counted plan (Fazal, Shruthi) shows "No approved plan" in place of the
   dash — "approved" because a Draft or Rejected plan also counts as no
   plan (built wording; Basheer asked for "No plan", the built wording
   accepted 2 Nov). **Result 1 Nov — Pass (Basheer) on the old
   wording.** Found: a person with no counted plan (Fazal, Shruthi)
   shows a dash for Won %; Basheer asked for "No plan" there. Quarter
   view only (the Year view's dash means no target, a different case).
   Re-run B2 after the merge. **Re-run 2 Nov — "No approved plan" on
   Shruthi's row: Pass (Basheer, as Shruthi).** **Re-run 2 Nov, as
   Haroon — Pass (Basheer):** the "Imaging" row name and the rest of B2.
   Basheer then raised a possible gap (a person's plan figure is not
   shown beside their Won % of plan) — see the Progress-Archive 2 Nov
   entry. **Expected after the merge (added 3 Nov, Simpler table D13):**
   under each person's Won %, the small line reads "of plan" and that
   person's approved plan amount — Rudrappa "of plan ₹10.0L" (his ₹10.0 L
   plan, P3 re-read 30 Oct; the screen writes amounts without a space
   before L). Fazal and Shruthi still say "No approved plan"; the
   Company and Imaging rows still say "of target"; the Year view has no
   small line under Won % at all (its column is headed "Won % of
   target"). Re-run B2 as Haroon. **Re-run 3 Nov, after the merge — Pass
   (Basheer, as Haroon).** —
3. [Simple] Same screen. **Expected:** none of: Likely finish (as a box,
   a column, a dash or in the bar), Team plans, Expected, Plans vs
   target, plan Status, Rep Plan, the "haven't submitted a plan" note,
   rows that open underneath, the zone table, the brand table. **Result
   1 Nov — Pass (Basheer).** —
4. [Simple] Same screen, Fazal's and Fahad's rows. **Expected:** no red
   "N past closing date" mark (D5), though both have late
   Opportunities. **Result 1 Nov — Pass (Basheer).** —
5. [Complex: phone layout] Quarter view at 390, 768 and 1280 px.
   **Expected (390):** no boxes; Company and SBU shaded blocks; each
   person a block — name, then one line each for Target, Won (paid),
   PO received and Won %; reps indented with "reports to <manager>";
   768 and 1280 as tables. Nothing runs past the card. **Result 1 Nov —
   Pass (Basheer).** **Expected after the merge (added 3 Nov, D13):** at
   390 the longer "of plan ₹…L" line sits under the % inside each
   person's block, on one line, and nothing runs past the card; 768 and
   1280 as tables. Re-run. **Re-run 3 Nov, after the merge — Pass
   (Basheer).** **Expected after the fix (added 3 Nov, D16, commit
   `a1f0147`):** the "Target vs Actuals" card with the SBU / View boxes
   and the period arrows stays fixed under the tab row (a short card) while
   the "This quarter · as of …" line and the table or blocks below scroll;
   the same in the Year view (step 6 of section A) and, in a person's own
   screen, only that screen scrolls under its back-arrow header. Check at
   390, 768 and 1280 px. **Seen 3 Nov — looks good (Basheer, phone).**
   **D16 at 768 and 1280 px — Pass 3 Nov (Basheer).** —
6. [Simple] Same screen, the header. **Expected:** the drop-down that
   holds Quarter / Year shows the name "View" on its box (Frontend
   standards §6.11 rule 7); as Haroon, the SBU drop-down shows "SBU". The
   arrows either side of the period name are chevron icons, not typed
   ◀ ▶ (rule 8). Hover over them: "Previous quarter" and "Next quarter";
   in Year view, "Previous year" and "Next year". **Result 1 Nov — Fail
   on the hover names only (Basheer):** the "View" and "SBU" names and the
   chevron icons pass; hovering the arrows shows nothing. Cause (code
   read): `TargetVsActualsSection.tsx:110,116` give the arrows a screen-
   reader label but no hover text; the Planning screen's arrows have both.
   Small fix, built as `52e8397` (hover text "Previous quarter", "Next
   quarter", "Previous year", "Next year" added); re-check by hovering
   after the merge, on both views. **Re-run 2 Nov, after the merge — Pass
   (Basheer):** hover names show on both views. —

## C — A person's own screen (D4; Simpler table D7, D10)

1. [Simple] As Haroon, Quarter view, Oct–Dec 2026, Imaging: click
   "Rudrappa". **Expected:** a screen of his own, not a row opening
   underneath, with three boxes: Target ₹100.0 L; Won (paid) with "PO
   received …" under it; Won % of target. No Likely finish box.
   **Result 1 Nov — Pass (Basheer).** **Re-run 2 Nov, after the merge —
   Pass (Basheer):** opens at the top; title, drop-downs, arrows and the
   Insights tab row hidden; name row fixed; Back returns everything. —
2. [Simple] Same screen, By hospital and By brand. **Expected:** By
   hospital: one line, "Not assigned to a hospital", Planned ₹10.0 L,
   Won 0, then a Total line; By brand: SonoScape, Planned ₹10.0 L, Won 0,
   then a Total line. Both match P5. **Result 1 Nov — Pass (Basheer).** —
3. [Simple] Same screen, bottom. **Expected:** no note about
   Opportunities with no expected closure date (Simpler table D10). If
   P3 found any of his Won Opportunities with no PO date, the "no PO
   date" note shows (wording as built); otherwise no note at all. P3
   (1 Nov): Rudrappa has 0 with no PO date, so no note at all.
   **Result 1 Nov — Pass (Basheer).** —
4. [Simple] Go back: the control at the top-left, beside his name.
   **Expected:** it is a round button holding only a left arrow, no word
   "Back" (a screen reader says "Back"); clicking it returns to the
   Quarter view, still on Oct–Dec 2026, Imaging (Frontend standards §6.6
   item 7). **Result 1 Nov — Pass (Basheer).** —
5. [Simple] Click the "Imaging" row and the "Company" row.
   **Expected:** nothing opens (no SBU screen, D4). **Result 1 Nov —
   Pass (Basheer).** —
6. [Complex: phone layout] Rudrappa's screen at 390, 768 and 1280 px.
   **Expected (390):** three boxes — Target and Won (paid) side by side,
   Won % of target across the full width; one block per hospital and per
   brand (name, Planned, Won), each list ending in a shaded Total block;
   the "no PO date" note at the bottom if C3 showed one. Nothing runs
   past the card. **Result 1 Nov — Fail on two points, layout otherwise
   passes (Basheer):** (1) the person screen opens scrolled down, with
   the Won % box at the top, instead of at the top of the screen; (2)
   Basheer wants the card's header (the "Target vs Actuals" title, the
   SBU and View drop-downs, the period arrows) and the person's name row
   fixed at the top, with only the detail cards scrolling. (1) is a bug,
   (2) is a new request. **Decided (Basheer, 1 Nov): both apply at all
   three widths, on a person's own screen only** — it opens at the top
   (and returns to the top on Back); the title, SBU and View drop-downs
   and period arrows are hidden there (so nothing can be changed while
   looking at one person); the name row stays fixed; only the detail
   cards scroll. The Quarter and Year tables are unchanged. Built by
   `/build` as `f2b72c6` (the above) and `1c1c78c` (the Insights
   Dashboard's tab row also hides, see E4). **Expected after the merge,
   at 390, 768 and 1280 px:** it opens at the top, and Back returns to
   the top; the title, SBU and View drop-downs and period arrows are
   hidden; the Insights tab row is hidden; the name row stays fixed and
   only the detail cards scroll; on Back everything returns. The card
   may sit close to the top edge (no gap was added) — look at that.
   Re-run C1 and C6. **Re-run 2 Nov, after the merge — Pass (Basheer),
   at 390, 768 and 1280 px.** —

## D — Overdue tab (D5)

1. [Simple] As Fazal: Insights Dashboard. **Expected:** the tab is
   called "Overdue" (not "Overdue Actions"). **Result 1 Nov — Pass
   (Basheer).** —
2. [Simple] Open it. **Expected (P3 re-read 2 Nov):** Fazal — 2 overdue
   next actions; Past closing date 2, ₹24.0 L. Fahad — 3 overdue (was 2
   on 1 Nov); Past closing date 1, ₹20.0 L. Fazal's overdue count is the same as P4 (P4's number was 2: the
   rows in My Work → Next actions → "Overdue next actions"). **Result 1
   Nov — Pass (Basheer).** **Re-run 2 Nov, after the merge — Pass
   (Basheer):** Fazal 2, Fahad 3; the card title reads "Overdue — 5
   overdue next actions", i.e. the total of the rows Fazal can see (2 + 3),
   not the all-team 32 that Haroon sees (D9). —
3. [Simple] Same tab. **Expected:** every count above zero is red and
   can be tapped (Fazal's 2 and 2, Fahad's 3 and 1; Dev 2 Nov). The grey zero is
   checked at step 9, as Haroon. **Result 1 Nov — Pass (Basheer).**
   **Re-run 2 Nov, after the merge — Pass (Basheer).** —
4. [Complex: cross-screen] Click Fahad's past closing date count.
   **Expected:** My Work opens with "Showing" set to Fahad, on the
   Opportunities tab, at "Closing date passed", which lists "Test Gate
   override oppotunity (renamed for TC-19/22)" (Maulana) — 1 (D11). **Result 1 Nov — Pass (Basheer).**
   **Re-run 2 Nov, after the merge — Pass (Basheer).** —
5. [Complex: cross-screen] Back to the Overdue tab; click Fazal's
   overdue count "2". **Expected:** My Work opens with "Showing" set to
   Fazal ("Me"), on the Next actions tab, at "Overdue next actions",
   with 2 rows (D11). **Result 1 Nov — Pass (Basheer).**
   **Re-run 2 Nov, after the merge — Pass (Basheer).** —
6. [Complex: cross-screen] Back to the Overdue tab; click Fazal's past
   closing date "2". **Expected:** Opportunities tab, "Closing date
   passed" lists "New USG m/c" (aster medicity) and "New oppotunity fast
   track" (Aster DM); the count matches the Overdue tab's 2 (D11). **Result 1 Nov — Pass
   (Basheer).** **Re-run 2 Nov, after the merge — Pass (Basheer).** —
7. [Complex: cross-screen] Leave My Work, then open it from the menu.
   **Expected:** "Showing" is back on "Me" and the Summary tab; the
   small tabs are back on "High priority" (Opportunities) and "This week"
   (Next actions) (My Work D6, D33). **Result 1 Nov — Pass (Basheer).** —
8. [Complex: cross-screen] (Reworded 1 Nov: names on the Overdue tab are
   plain text, not links; only the counts open My Work.) From the Overdue
   tab, click Fahad's overdue count "3" (Dev 2 Nov; was 2). **Expected:** My Work opens on
   Fahad's Next actions, "Overdue next actions". His rows have no "Done"
   button; on his Opportunities tab ("Closing date passed") there is no
   "Log Activity" or action button either. View-only, because closing an
   action records a visit or call as if it happened (My Work D15).
   **Result 1 Nov — Pass (Basheer), on the reworded step.**
   **Re-run 2 Nov, after the merge — Pass (Basheer).** Basheer noticed the
   hospital and Opportunity names on Fahad's 3 rows are clickable —
   expected: in the next actions table those names are always links
   (`MyWorkScreen.tsx:698,701`); only the "Done" button depends on whose
   list it is (`canAct`, line 708). —
9. [Simple] As Haroon: Overdue tab. **Expected (P3, 1 Nov):** Abdul
   Latheef P 1 / 0; Basheer K 11 / 0; Fazal 2 / 2, ₹24.0 L; Fahad 2 / 1,
   ₹20.0 L; Haroon Sidheeq 7 / 1, ₹50.0 L; Nishad K V 1 / 0; Shruthi
   2 / 0; Vivek 2 / 0; and "Test - Area Manager" 2 / 0 (an inactive test
   account, see P3). Total overdue 30. Arun Adarsh and Rudrappa (0 / 0)
   are not listed (D11). Shruthi's Past closing date 0 is grey and can't
   be tapped. **Result 1 Nov — Pass (Basheer), with two suggestions:**
   (a) show "Overdue" and "Past closing date" once as column headings,
   with only the numbers on each person's row (today both words repeat
   on every row); (b) show inactive accounts such as "Test - Area
   Manager" in a different colour with "Inactive account" beside the
   name, so Haroon sees that person's pending items and acts on them.
   Cause for (b) (code read): the list has no active/inactive filter and
   the server doesn't send an active flag. Built as `22e3526`.
   **Expected after the merge (added 2 Nov), counts re-read 2 Nov
   (Dev, read-only):** Abdul Latheef P 1 / 0; Basheer K 11 / 0; Fazal 2 /
   2, ₹24.0 L; Fahad 3 / 1, ₹20.0 L; Haroon Sidheeq 7 / 1, ₹50.0 L;
   Nishad K V 1 / 0; Shruthi 2 / 0; Vivek 3 / 0; "Test - Area Manager"
   2 / 0 (inactive). Fahad (was 2) and Vivek (was 2) moved. The card
   title reads "Overdue — 32 overdue next actions" (total from the P3b re-read,
   2 Nov); column headings once — Who, Overdue next actions, Past
   closing date (count), Value; each row only numbers, the value in its
   own column; "Test - Area Manager" greyed with "Inactive account"
   beside the name; the counts unchanged from the list above. Re-run D9
   and, because the counts are rebuilt, D3–D6 and D8. **Re-run 2 Nov,
   after the merge — Pass (Basheer), with one finding:** the rows are not
   in "Who" order. Cause (code read): the server lists the person with
   the most overdue next actions first, then most past-closing, then name
   (`reporting/service.py:284-287`); no screen-side sorting exists. No
   documented decision for that order. **Decided (Basheer, 2 Nov):** keep
   it as the default and add a "Sort by" box (Most overdue first / Name
   A–Z) — Simpler Table plan D14, handed to `/build`. Re-check after it
   is built. **Expected after the merge (added 3 Nov, D14):** a "Sort by"
   box above the table headings, showing "Most overdue first", with the
   rows in this order: Basheer K, Haroon Sidheeq, Fahad, Vivek, Fazal,
   Shruthi, "Test - Area Manager" (greyed), Abdul Latheef P, Nishad K V.
   Choose "Name A–Z": Abdul Latheef P, Basheer K, Fahad, Fazal, Haroon
   Sidheeq, Nishad K V, Shruthi, "Test - Area Manager" (greyed), Vivek.
   Counts, red and grey marks, the card title ("Overdue — 32 overdue next
   actions") and tap-through to My Work are unchanged. Choose "Most
   overdue first" again: the first order returns. As Fazal: the box is
   there, and "Name A–Z" puts Fahad before Fazal. (Orders worked out from
   the 2 Nov counts above and the server's rule, not seen on screen.)
   **Re-run 3 Nov, after the merge — Pass (Basheer).** —
10. [Complex: phone layout] Overdue tab at 390, 768 and 1280 px, as
   Haroon. **Expected (390):** one block per person — overdue next
   actions, then Past closing date count and value side by side; a
   count above zero a red mark that can be tapped; zero grey. Nothing
   runs past the card. **Result 1 Nov — Fail (Basheer):** the rows are
   not one block per person; all rows sit on one card. Cause (code read):
   the Overdue list is hand-built rows (`InsightsDashboardScreen.tsx:
   296-319`), not the shared table-or-cards component the standards
   require. Same fix as D9 (a): rebuild it as a table with column
   headings, one block per person on a phone. Built as `22e3526`.
   **Expected after the merge (added 2 Nov):** at 390 one block per
   person with the same fields and the same red and grey marks (the value
   greyed when the count is 0); at 768 and 1280 a table with the four
   headings. Nothing runs past the card. Re-run. **Re-run 2 Nov, after
   the merge (Basheer):** Pass at 390, 768 and 1280 px, with one
   difference: at 390 the Past closing date count and the Value sit one
   below the other, not side by side. Cause (code read): the shared
   table-or-cards component puts every cell on its own line on a phone
   (`TableOrCards.tsx:253`), as on the Quarter and Year blocks; "side by
   side" was this step's wording, never built. **Decided (Basheer,
   2 Nov): one below the other is right;** wording corrected to "one line
   each". **Expected after the merge (added 3 Nov, D14):** at 390, 768
   and 1280 the "Sort by" box sits on its own line above the list,
   left-aligned, about 200 px wide, and nothing runs past the card; at
   390 the person blocks follow the chosen order. Re-run as Haroon and as
   Fazal. **Re-run 3 Nov, after the merge — Pass (Basheer)** on the box's
   place and size, **with a finding (D15):** on the phone the title
   "Overdue — N overdue next actions" and the "Sort by" box scroll away
   with the list; they should stay fixed and only the person blocks
   should scroll (Frontend standards §6.1). Cause (code read): both sat
   inside the scrolling box (`InsightsDashboardScreen.tsx`, the box at
   line 235). Fixed 3 Nov directly by Build & Test (not `/build`), commit
   `a1f0147`. **D15 check 3 Nov — Pass (Basheer, phone).** **Expected
   after the fix (added 3 Nov, D15):** at 390,
   768 and 1280 the title and the "Sort by" box stay put while the list
   scrolls (they sit in their own card under the tab row); on a laptop
   the column headings stay visible too. Re-run D10 at all three widths,
   as Haroon, and re-run step 11. —
11. [Complex: cross-screen] As Haroon: Insights Dashboard → Overdue,
   choose "Name A–Z". Leave Insights (open My Work from the menu), then
   open Insights → Overdue again. **Expected (after `/build`'s D14 fix,
   added 3 Nov; built as `4744b34`, merged into `main` as `1bf0260`,
   3 Nov — checked in git):** the box shows "Most overdue first" and the
   list is in that order. Before the fix the choice stayed until a page
   reload (`/build`, 3 Nov). Switching between Insights tabs is not
   part of this step. **Result 3 Nov — Pass (Basheer, as Haroon, after
   the merge).** Re-run once after the D15 change (D10). —

## E — Who sees what (hide-checks)

1. [Simple] As Fazal: Target vs Actuals, Quarter, Oct–Dec 2026.
   **Expected:** Fazal and Fahad only; no Shruthi, Rudrappa, Basheer K
   or Critical Care row; ₹280.0 L appears nowhere. **Result 2 Nov —
   Pass (Basheer).** —
2. [Simple] As Fazal: Overdue tab. **Expected:** Fazal and Fahad only;
   no Shruthi (2 overdue) or Haroon (₹50.0 L). **Result 2 Nov — Pass
   (Basheer).** **Re-run 2 Nov, after the merge — Pass (Basheer).** —
3. [Simple] As Fahad: Insights Dashboard. **Expected:** no Overdue tab
   (managers only); Target vs Actuals shows his own row only, Year and
   Quarter. **Result 2 Nov — Pass (Basheer).** —
4. [Simple] As Shruthi: Quarter view, click "Rudrappa". **Expected:** his
   screen opens; Fahad's name is not on her list to click. **Result
   2 Nov — Pass (Basheer).** Found beside it (not an E4 fail): on a
   person's screen the other tabs of the Insights Dashboard stay
   clickable, show the signed-in person's own data, and leaving the
   Target vs Actuals tab closes the person screen (back button gone on
   return). **Decided (Basheer, 2 Nov): hide the other tabs while a
   person's own screen is open** (same rule as the hidden title and
   drop-downs in C6; "view as Rudrappa" is not wanted). Write-up to
   `/build`; built as `1c1c78c`. **Re-check after the merge:** open
   Rudrappa from Shruthi's table — no other Insights tabs shown; Back —
   tabs return. **Re-run result 2 Nov — Pass (Basheer, as Shruthi).** —

## F — Must not change

1. [Simple] As Haroon: Sales Report, Oct–Dec 2026. **Expected:** won
   amounts by zone and by brand as before the build (SonoScape won
   ₹34.0 L). **Result 2 Nov — Pass (Basheer).** Added 2 Nov (`35e9156`,
   built, not yet merged): the period box is named "Period" and a "Group
   by" box is named too; beside the period box the dates it covers
   ("Oct–Dec 2026" for the quarter, "Nov 2026" for the month, "All time").
   Drill-down banners unchanged. **Re-check after the merge, at 390, 768
   and 1280 px** (a header row with the named box at 390). **Re-run
   2 Nov, after the merge — Pass (Basheer), at 390, 768 and 1280 px.** —
2. [Simple] As Shruthi: Target & Coverage Planning → Rudrappa's
   Oct–Dec 2026 plan. **Expected:** status Approved; brands SonoScape
   ₹10.0 L; with the row opened, the message "No hospitals on this plan
   — it was set before hospital-wise planning." (this screen's own
   wording, `TargetPlanDetails.tsx:48`). "Not assigned to a hospital" is
   the Target vs Actuals screen's wording for the same plan (P5, C2),
   not this screen's. **Result 2 Nov — Pass (Basheer).** Expected text
   corrected from "same as P5", which was wrong. **Re-run 2 Nov — Pass
   (Basheer), after the merge.** —
3. [Simple] As Basheer K: Target & Coverage Planning, Oct–Dec 2026.
   **Expected:** his ₹55.0 L plan still pending. **Result 2 Nov — Pass
   (Basheer).** —
4. [Simple] As Fazal: My Work from the menu. **Expected:** opens on "Me"
   and Summary, as before the build. **Result 2 Nov — Pass (Basheer).**
   —
