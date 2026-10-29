<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Target vs Actuals Redesign — Manual E2E Test Plan

**Covers:** `docs/Target-vs-Actuals-Redesign-Implementation-Plan.md`
(D2–D6, D10, D11), build steps 1–2. Replaces section I (I1–I16, the old Year
view) of `docs/Annual-Target-Planning-Manual-E2E-Test-Plan.md` (D7).
**Built:** not yet — commit hashes filled in after the build.
**Where:** Dev, after `/build` merges into `main`. Runs after the Annual
Target Part 2 E2E (sections J, K, L), per D9.

## Checked against live data

Checked read-only on Dev, 2026-10-29, as Haroon Sidheeq (GM), with all
three RLS settings (user, role, SBU) set and verified (GM has no SBU; the
check returned General Manager and his id). Re-run at P3: Dev data
changes during other E2Es.

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
  - Fahad 0 / 1, ₹20.0 L: "Test Gate override oppotunity (renamed for
    TC-19/22)" (Maulana), 3 Sep 2026. **Today's tab leaves Fahad out**
    (it lists only people with an overdue action); the redesign must
    show him.
  - Haroon Sidheeq 6 / 1, ₹50.0 L: "Activity visibility test" (Aster
    DM), 21 Sep 2026.
  - Targets, Oct–Dec 2026 (Dev, 28 Oct, Annual E2E P8): Imaging ₹280.0 L
    (Fazal ₹160.0 L, Fahad ₹140.0 L, Shruthi ₹120.0 L, Rudrappa
    ₹100.0 L), Won ₹34.0 L, PO received ₹16.0 L, Likely finish
    ₹109.8 L; Critical Care ₹185.0 L (Arun Adarsh ₹100.0 L, Vivek
    ₹90.0 L, Nishad K V ₹85.0 L), Won ₹0; Company ₹465.0 L. Plans:
    Rudrappa ₹10.0 L approved, Basheer K ₹55.0 L pending.

Button labels, messages and the order of checks are taken from the plan,
since the screens aren't built yet. **Re-check every quoted label
against the built code before the E2E starts** (pre-E2E review).

## Figures and sources

- 2026-Q3 = 01 Oct 2026 to 31 Dec 2026 (today's quarter); FY 2027-28
  starts Apr 2027 — `scripts/quarter.py`, 2026-10-29.
- Overdue and past-closing counts, values and Opportunity names above —
  Dev read-only query, 2026-10-29 (scratchpad `tva_overdue_check.py`).
- Overdue total as Haroon, 29 — counted with a tool from that query.
- Targets, Won, PO received, Likely finish, plans — Annual Target E2E
  P8, Dev, 2026-10-28.
- Won % 12.1 (Imaging), 7.3 (Company); Likely finish 39.2 % (Imaging) —
  worked out with a tool from the P8 figures; re-worked at P3.
- Teams and managers — Annual Target E2E "Checked against live data",
  Dev, 2026-10-21; confirmed by the 29 Oct query's manager column.
- Today's tab: label "Overdue Actions", card title "Overdue Actions —
  {total} total", empty text "Nobody on the team has overdue actions."
  — `InsightsDashboardScreen.tsx`, read 2026-10-29.
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

- P1. [Simple] Dev backend restarted since the build's last backend
  change. —
- P2. [Simple] App running on Dev; Basheer can sign in as Haroon
  Sidheeq, Fazal, Shruthi and Fahad. —
- P3. [Complex: Claude — reading values the screen doesn't show] Re-run
  the 29 Oct read-only query and the P8 figures; update "Existing
  values" and the expected figures below if they moved. —
- P4. [Simple] Before the build is merged (old screens), as Fazal:
  Insights Dashboard → "Overdue Actions" tab. Note each person and
  count. **Expected:** Fazal, 2 overdue; Fahad not listed. —
- P5. [Simple] Before the build is merged, as Shruthi: Target & Coverage
  Planning → Rudrappa's Oct–Dec 2026 plan. Note each hospital and brand
  with its planned amount (used in D5–D6). —

## A — Year view (D2, D6)

1. [Simple] As Haroon: Insights Dashboard → Target vs Actuals → Year,
   FY 2026-27, SBU "All". **Expected:** three boxes — Target so far
   ₹465.0 L, Won (paid) so far ₹34.0 L, Won % of target 7.3 % with a
   bar. —
2. [Simple] Same screen, the table. **Expected:** Company, then
   Critical Care and Imaging, then each person under their manager, each
   with Target so far, Won (paid) so far and Won % with a bar; Imaging
   ₹280.0 L / ₹34.0 L / 12.1 %. —
3. [Simple] Same screen. **Expected:** none of: Team plans, PO received,
   Plans vs target, a quarter-by-quarter table, Year's target, Plan for
   year, Still to win, the "haven't submitted a plan" note. —
4. [Simple] Click a person's name, then a Company or SBU row.
   **Expected:** nothing opens; names aren't links (D2, D4). —
5. [Simple] Arrow forward to FY 2027-28. **Expected:** one line in place
   of the boxes and table: "FY 2027-28 starts in Apr 2027 — nothing to
   show yet." (D6; closes the Annual E2E's open I8). —
6. [Complex: phone layout] Year view at 390, 768 and 1280 px, FY 2026-27
   and FY 2027-28. **Expected (390):** header on three lines (title; SBU
   choice with Quarter/Year; period with arrows); Target so far and Won
   so far side by side, Won % full width with its bar below; Company and
   SBU as shaded blocks, each rep's block indented with "reports to
   <manager>"; 768 and 1280 as tables. Nothing runs past the card. —

## B — Quarter view (D3, D5)

1. [Simple] As Haroon: Target vs Actuals → Quarter, Oct–Dec 2026, SBU
   "Imaging". **Expected:** four boxes — Target ₹280.0 L; Won (paid)
   ₹34.0 L with "PO received ₹16.0 L" as a small line under it; Won %
   of target 12.1 %; Likely finish ₹109.8 L, 39.2 % of target. —
2. [Simple] Same screen, the table. **Expected:** Company, Imaging, then
   Fazal (with Fahad under him), Shruthi (with Rudrappa), Basheer K;
   columns Target, Won (paid), Likely finish and a bar (won dark, likely
   finish light). Rudrappa's % is of his ₹10.0 L plan and says "of plan"
   beneath it (Basheer, 2026-10-29: a person's % stays Won ÷ plan); the
   Company and Imaging rows say "of target" and show a dash for Likely
   finish. His own screen (C1) shows Won % of his ₹100.0 L target. —
3. [Simple] Same screen. **Expected:** none of: Team plans, PO received
   or Expected boxes, Plans vs target, plan Status, Rep Plan, the
   "haven't submitted a plan" note, rows that open underneath, the zone
   table, the brand table. —
4. [Simple] Same screen, Fazal's and Fahad's rows. **Expected:** no red
   "N past closing date" mark (D5), though both have late
   Opportunities. —
5. [Complex: phone layout] Quarter view at 390, 768 and 1280 px.
   **Expected (390):** four boxes two to a row; Company and SBU shaded
   blocks; each person a block — name, then Target, Won (paid), Likely
   finish side by side, then the bar and %; reps indented with "reports
   to <manager>"; 768 and 1280 as tables. Nothing runs past the card. —

## C — A person's own screen (D4)

1. [Simple] As Haroon, Quarter view, Oct–Dec 2026, Imaging: click
   "Rudrappa". **Expected:** a screen of his own, not a row opening
   underneath: his four boxes (Target ₹100.0 L, Won (paid), Won %,
   Likely finish). —
2. [Simple] Same screen, By hospital and By brand. **Expected:**
   Planned against Won; each Planned figure matches P5. —
3. [Simple] Same screen, bottom. **Expected:** the notes on
   Opportunities with no closing date or no PO date (wording as built).
   —
4. [Simple] Go back. **Expected:** the Quarter view, still on
   Oct–Dec 2026, Imaging. —
5. [Simple] Click the "Imaging" row and the "Company" row.
   **Expected:** nothing opens (no SBU screen, D4). —
6. [Complex: phone layout] Rudrappa's screen at 390, 768 and 1280 px.
   **Expected (390):** four boxes two to a row; one block per hospital
   and per brand (name, Planned, Won), each list ending in a shaded
   Total block; the two notes at the bottom. Nothing runs past the
   card. —

## D — Overdue tab (D5)

1. [Simple] As Fazal: Insights Dashboard. **Expected:** the tab is
   called "Overdue" (not "Overdue Actions"). —
2. [Simple] Open it. **Expected:** Fazal — 2 overdue next actions; Past
   closing date 2, ₹24.0 L. Fahad — 0 overdue; Past closing date 1,
   ₹20.0 L. Fazal's overdue count is the same as P4. —
3. [Simple] Same tab. **Expected:** Fahad's 0 is grey and can't be
   clicked; Fazal's "2" past closing date is red. —
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
   **Expected:** "Showing" is back on "Me" and the Summary tab (My Work
   D6, D33). —
8. [Complex: cross-screen] From the Overdue tab, open Fahad in My Work
   again. **Expected:** view-only, as today when a manager picks a rep
   (My Work D15). —
9. [Simple] As Haroon: Overdue tab. **Expected:** Abdul Latheef P 1 / 0;
   Basheer K 15 / 0; Fazal 2 / 2, ₹24.0 L; Fahad 0 / 1, ₹20.0 L; Haroon
   Sidheeq 6 / 1, ₹50.0 L; Nishad K V 1 / 0; Shruthi 2 / 0; Vivek
   2 / 0. Total overdue 29. Arun Adarsh and Rudrappa (0 / 0) are not
   listed (D11). —
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
