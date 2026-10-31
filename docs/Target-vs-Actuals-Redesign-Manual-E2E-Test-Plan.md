<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Target vs Actuals Redesign — Manual E2E Test Plan

**Covers:** `docs/Target-vs-Actuals-Redesign-Implementation-Plan.md`
(D2–D6, D10, D11), build steps 1–2. Replaces section I (I1–I16, the old Year
view) of `docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md` (D7).
Also covers `docs/Target-vs-Actuals-Simpler-Table-Implementation-Plan.md`
(D2–D7, D10): sections A–C rewritten 2026-10-31 for the simpler table —
no boxes on the Quarter and Year views, a PO received column, no Likely
finish anywhere, three boxes on a person's own screen.
**Built:** redesign merged 29 Oct (`3bafbc0`); the simpler table `c490eb9` on `worktree-build`, pushed, not yet merged.
**Where:** Dev, after `/build` merges the simpler table into `main`.
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
  change (PO received on the Year view's person rows). —
- P2. [Simple] App running on Dev; Basheer can sign in as Haroon
  Sidheeq, Fazal, Shruthi and Fahad. —
- P3. [Complex: Claude — reading values the screen doesn't show] Re-run
  the 30 Oct read-only query and the P8 figures; update "Existing
  values" and the expected figures below if they moved. Also read PO
  received per person for Oct–Dec 2026 and for the year so far (not yet
  checked; A2 and B2 need them), and the number of Opportunities with no
  PO date per person (C3). —
- P4. [Simple] As Fazal: My Work → "Showing" on "Me" → Next actions →
  "Overdue next actions". Note the number of rows. **Expected:** 2 (Dev,
  29 Oct). D2 compares the Overdue tab's count with this one, taken from
  a separate screen. —
- P5. [Complex: Claude — reading values the screen doesn't show]
  Rudrappa's Oct–Dec 2026 plan, read from Dev at P3. On 30 Oct:
  hospitals — one line, "Not assigned to a hospital", ₹10.0 L; brands —
  SonoScape ₹10.0 L. Used by C2 and F2. —

## A — Year view (D2, D6; Simpler table D2, D4, D5)

1. [Simple] As Haroon: Insights Dashboard → Target vs Actuals → Year,
   FY 2026-27, the SBU box on its default (Imaging; Haroon's SBU box
   lists only Imaging and Critical Care, there is no "All").
   **Expected:** no boxes above the table (Simpler table D2); the small
   "This year · as of …" line is still there. —
2. [Simple] Same screen, the table. **Expected:** columns Who, Target so
   far, Won (paid) so far, PO received so far, Won % of target with a
   bar. Rows: Company, then Critical Care and Imaging, then each person
   under their manager. Imaging ₹280.0 L / ₹34.0 L / ₹16.0 L / 12.14 %;
   Company ₹465.0 L / ₹34.0 L / 7.31 %; Company's and each person's PO
   received so far as read at P3. Switching the SBU box to Critical Care changes the SBU
   row to ₹185.0 L / ₹0.0 L / 0.00 % (Dev, 30 Oct). —
3. [Simple] Same screen. **Expected:** none of: Likely finish (as a box,
   a column or in the bar), Team plans, Plans vs target, a
   quarter-by-quarter table, Year's target, Plan for year, Still to win,
   the "haven't submitted a plan" note. —
4. [Simple] Click a person's name, then a Company or SBU row.
   **Expected:** nothing opens; names aren't links (D2, D4). —
5. [Simple] Arrow forward to FY 2027-28. **Expected:** one line in place
   of the table: "FY 2027-28 starts in Apr 2027 — nothing to show yet."
   (D6; closes the Annual E2E's open I8). —
6. [Complex: phone layout] Year view at 390, 768 and 1280 px, FY 2026-27
   and FY 2027-28. **Expected (390):** header on three lines (title; SBU
   choice with Quarter/Year; period with arrows); no boxes; Company and
   SBU as shaded blocks, each person a block — name, then one line each
   for Target so far, Won (paid) so far, PO received so far and Won % of
   target;
   each rep's block indented with "reports to <manager>"; 768 and 1280
   as tables. Nothing runs past the card. —

## B — Quarter view (D3, D5; Simpler table D2, D3, D5, D6)

1. [Simple] As Haroon: Target vs Actuals → Quarter, Oct–Dec 2026, SBU
   "Imaging". **Expected:** no boxes above the table; the small "This
   quarter · as of …" line is still there. —
2. [Simple] Same screen, the table. **Expected:** Company, Imaging, then
   Fazal (with Fahad under him), Shruthi (with Rudrappa), Basheer K;
   columns Who, Target, Won (paid), PO received, Won % with a bar. Imaging
   ₹280.0 L / ₹34.0 L / ₹16.0 L / 12.14 %; each person's PO received as
   read at P3. The bar is one colour, Won only — no lighter part
   (Simpler table D6). Rudrappa's % is of his ₹10.0 L plan and says "of
   plan" beneath it (Basheer, 2026-10-29: a person's % stays Won ÷
   plan); the Company and Imaging rows say "of target". His own screen
   (C1) shows Won % of his ₹100.0 L target. —
3. [Simple] Same screen. **Expected:** none of: Likely finish (as a box,
   a column, a dash or in the bar), Team plans, Expected, Plans vs
   target, plan Status, Rep Plan, the "haven't submitted a plan" note,
   rows that open underneath, the zone table, the brand table. —
4. [Simple] Same screen, Fazal's and Fahad's rows. **Expected:** no red
   "N past closing date" mark (D5), though both have late
   Opportunities. —
5. [Complex: phone layout] Quarter view at 390, 768 and 1280 px.
   **Expected (390):** no boxes; Company and SBU shaded blocks; each
   person a block — name, then one line each for Target, Won (paid),
   PO received and Won %; reps indented with "reports to <manager>";
   768 and 1280 as tables. Nothing runs past the card. —

## C — A person's own screen (D4; Simpler table D7, D10)

1. [Simple] As Haroon, Quarter view, Oct–Dec 2026, Imaging: click
   "Rudrappa". **Expected:** a screen of his own, not a row opening
   underneath, with three boxes: Target ₹100.0 L; Won (paid) with "PO
   received …" under it; Won % of target. No Likely finish box. —
2. [Simple] Same screen, By hospital and By brand. **Expected:** By
   hospital: one line, "Not assigned to a hospital", Planned ₹10.0 L,
   Won 0, then a Total line; By brand: SonoScape, Planned ₹10.0 L, Won 0,
   then a Total line. Both match P5. —
3. [Simple] Same screen, bottom. **Expected:** no note about
   Opportunities with no expected closure date (Simpler table D10). If
   P3 found any of his Won Opportunities with no PO date, the "no PO
   date" note shows (wording as built); otherwise no note at all. —
4. [Simple] Go back. **Expected:** the Quarter view, still on
   Oct–Dec 2026, Imaging. —
5. [Simple] Click the "Imaging" row and the "Company" row.
   **Expected:** nothing opens (no SBU screen, D4). —
6. [Complex: phone layout] Rudrappa's screen at 390, 768 and 1280 px.
   **Expected (390):** three boxes — Target and Won (paid) side by side,
   Won % of target across the full width; one block per hospital and per
   brand (name, Planned, Won), each list ending in a shaded Total block;
   the "no PO date" note at the bottom if C3 showed one. Nothing runs
   past the card. —

## D — Overdue tab (D5)

1. [Simple] As Fazal: Insights Dashboard. **Expected:** the tab is
   called "Overdue" (not "Overdue Actions"). —
2. [Simple] Open it. **Expected:** Fazal — 2 overdue next actions; Past
   closing date 2, ₹24.0 L. Fahad — 2 overdue; Past closing date 1,
   ₹20.0 L. Fazal's overdue count is the same as P4. —
3. [Simple] Same tab. **Expected:** every count above zero is red and
   can be tapped (Fazal's 2 and 2, Fahad's 2 and 1). The grey zero is
   checked at step 9, as Haroon. —
4. [Complex: cross-screen] Click Fahad's past closing date count.
   **Expected:** My Work opens with "Showing" set to Fahad, on the
   Opportunities tab, at "Closing date passed", which lists "Test Gate
   override oppotunity (renamed for TC-19/22)" (Maulana) — 1 (D11). —
5. [Complex: cross-screen] Back to the Overdue tab; click Fazal's
   overdue count "2". **Expected:** My Work opens with "Showing" set to
   Fazal ("Me"), on the Next actions tab, at "Overdue next actions",
   with 2 rows (D11). —
6. [Complex: cross-screen] Back to the Overdue tab; click Fazal's past
   closing date "2". **Expected:** Opportunities tab, "Closing date
   passed" lists "New USG m/c" (aster medicity) and "New oppotunity fast
   track" (Aster DM); the count matches the Overdue tab's 2 (D11). —
7. [Complex: cross-screen] Leave My Work, then open it from the menu.
   **Expected:** "Showing" is back on "Me" and the Summary tab; the
   small tabs are back on "High priority" (Opportunities) and "This week"
   (Next actions) (My Work D6, D33). —
8. [Complex: cross-screen] From the Overdue tab, open Fahad in My Work
   again. **Expected:** view-only, as today when a manager picks a rep
   (My Work D15). —
9. [Simple] As Haroon: Overdue tab. **Expected:** Abdul Latheef P 1 / 0;
   Basheer K 15 / 0; Fazal 2 / 2, ₹24.0 L; Fahad 2 / 1, ₹20.0 L; Haroon
   Sidheeq 6 / 1, ₹50.0 L; Nishad K V 1 / 0; Shruthi 2 / 0; Vivek
   2 / 0. Total overdue 31. Arun Adarsh and Rudrappa (0 / 0) are not
   listed (D11). Shruthi's Past closing date 0 is grey and can't be
   tapped. —
10. [Complex: phone layout] Overdue tab at 390, 768 and 1280 px, as
   Haroon. **Expected (390):** one block per person — overdue next
   actions, then Past closing date count and value side by side; a
   count above zero a red mark that can be tapped; zero grey. Nothing
   runs past the card. —

## E — Who sees what (hide-checks)

1. [Simple] As Fazal: Target vs Actuals, Quarter, Oct–Dec 2026.
   **Expected:** Fazal and Fahad only; no Shruthi, Rudrappa, Basheer K
   or Critical Care row; ₹280.0 L appears nowhere. —
2. [Simple] As Fazal: Overdue tab. **Expected:** Fazal and Fahad only;
   no Shruthi (2 overdue) or Haroon (₹50.0 L). —
3. [Simple] As Fahad: Insights Dashboard. **Expected:** no Overdue tab
   (managers only); Target vs Actuals shows his own row only, Year and
   Quarter. —
4. [Simple] As Shruthi: Quarter view, click "Rudrappa". **Expected:** his
   screen opens; Fahad's name is not on her list to click. —

## F — Must not change

1. [Simple] As Haroon: Sales Report, Oct–Dec 2026. **Expected:** won
   amounts by zone and by brand as before the build (SonoScape won
   ₹34.0 L). —
2. [Simple] As Shruthi: Target & Coverage Planning → Rudrappa's
   Oct–Dec 2026 plan. **Expected:** same as P5, status Approved. —
3. [Simple] As Basheer K: Target & Coverage Planning, Oct–Dec 2026.
   **Expected:** his ₹55.0 L plan still pending. —
4. [Simple] As Fazal: My Work from the menu. **Expected:** opens on "Me"
   and Summary, as before the build. —
