# Target vs Actuals: Simpler Table — Implementation Plan

**Status:** Approved, 2026-10-31 — Basheer agreed the mock-up.
**Traceability rows:** signed 3.2 ("Real-time actual-vs-target via
role-specific dashboards").
**Design / discussion:** follows `docs/Target-vs-Actuals-Redesign-Implementation-Plan.md`
(built and merged 29 Oct, `3bafbc0`); its E2E was parked by Basheer at 6
of 40 on 30 Oct ("not simple and intuitive enough") — Progress-Archive
2026-10, "2026-10-30 — Target vs Actuals E2E parked". Mock-up:
https://claude.ai/artifact/XR3ftVbahPshwicQ9Vxsd5 version 26, boards
under "31 Oct — simpler table" — agreed by Basheer, 2026-10-31.

## Decisions

- D1. Two plans, decided in one round: this one (Target vs Actuals), and
  `docs/Target-Coverage-Planning-Tabs-Implementation-Plan.md`. This one is
  built first, because Annual Target Part 2 goes to UAT only with the
  Target vs Actuals redesign (Redesign D8) — Basheer, 2026-10-31.
- D2. The boxes at the top go from both the Quarter and the Year view;
  the table's Company, SBU and team rows already show the same figures.
  The small "This quarter · as of …" line stays. A person's own screen
  (Redesign D4) keeps its boxes, since it has no summary row to repeat
  them. Changes Redesign D2 and D3 — Basheer, 2026-10-31.
- D3. Quarter view table: Who, Target, Won (paid), PO received, Won %.
  PO received moves from under the Won box into its own column. No Likely
  finish column; the server keeps working Likely finish out and sending
  it, so it can come back without server work. Changes Redesign D3 —
  Basheer, 2026-10-31.
- D4. Year view table: Who, Target so far, Won (paid) so far, PO received
  so far, Won % of target. Changes Redesign D2 — Basheer, 2026-10-31.
- D5. No Likely finish anywhere in the Quarter or Year view for now,
  including the Company, SBU and team rows (which show a dash today). It
  comes back only if Cabio's leadership team asks for it — Basheer,
  2026-10-31.
- D6. With the Likely finish column gone, the light "likely finish" part
  of a person's Won % bar goes too; the bar shows Won only — Basheer,
  2026-10-31.
- D7. A person's own screen (Redesign D4) drops its Likely finish box,
  leaving three boxes (Target, Won (paid) with PO received under it, Won
  % of target), so no screen in the card shows Likely finish (D5) —
  Basheer, 2026-10-31.
- D8. Redesign D8 extends to this plan: Annual Target Part 2, the
  redesign and this plan go to UAT together — Basheer, 2026-10-31.
- D9. Built by the parallel Build session (`/build`); the redesign's E2E
  plan is updated for it (sections A–C) and the E2E restarts from the top
  once this is merged — Basheer, 2026-10-31.
- D10. A person's own screen also drops its note "N open Opportunities
  have no expected closure date, so they aren't counted in Likely
  finish", since Likely finish isn't shown (D5, D7) — it is the card's
  only Likely finish note; the "no PO date" note stays — Basheer,
  2026-10-31.

## Figures and sources

- "Imaging SBU Manager sees Target in a box and again in the SBU row" —
  read from `TargetVsActualsSection.tsx`, 2026-10-31 (no figures quoted).
- Today's Company, SBU and team rows show a dash for Likely finish —
  `TargetVsActualsSection.tsx`, read 2026-10-31.
- The Year endpoint's summary rows already carry PO received; its person
  rows don't — `backend/app/domains/planning/schemas.py:298–361`, read
  2026-10-31.
- E2E parked at 6 of 40 — Progress-Archive 2026-10, 30 Oct Build & Test
  entry.

## 1. In plain terms

Target vs Actuals (Insights Dashboard card) loses its row of boxes and
becomes one table, so each figure appears once.

- **Quarter view:** the table shows Company, SBU (or "Your team"), then
  each person under their manager, with Target, Won (paid), PO received
  and Won %. Names still open that person's own screen.
- **Year view:** the same table, "so far" — Target so far, Won (paid) so
  far, PO received so far, Won % of target.
- **Likely finish** leaves the card for now (D5). The server still works
  it out, so it can return quickly if the leadership team asks.
- **A person's own screen:** as today, minus the Likely finish box (D7).

**What doesn't change.** How each figure is worked out; who sees which
rows; the Overdue tab; no change to saved data.

**Where it lands.** Built and tested on Dev; goes to UAT with Annual
Target Part 2 and the redesign (D8).

### On a phone

No boxes at the top. Each row is a stacked block as today (Annual Target
D76): name (a rep's indented, "reports to <manager>"), then Target, Won
(paid) and PO received side by side, then the bar and %. Company and SBU
blocks shaded. A person's own screen: three boxes, two to a row, the third
across the full width.

## 2. Build order

1. **Server.** Year endpoint: add PO received so far to each person row.
   Tests. Nothing on Dev changes until step 2.
2. **Screens.** Remove the boxes (D2); Quarter and Year table columns (D3,
   D4); bar without Likely finish (D6); person screen's three boxes (D7);
   phone layout. Type check, lint; commit.
3. **Docs and test.** Business-Rules wording; pre-E2E review; E2E on
   Dev. The redesign E2E plan's sections A–C were rewritten ahead of the
   build, 2026-10-31.

## 3. What could be affected

- (a) Screens that request it: Insights Dashboard → Target vs Actuals
  (Quarter and Year views, a person's own screen). The Overdue tab uses a
  different request and is untouched.
- (b) Reports or links that open it: none.
- (c) Other screens reusing its data: Target & Coverage Planning's
  "Team Plans" total uses the roster request, not this one — unaffected.

## 4. Not in this plan (with reasons)

- Likely finish for the Company, SBU and team rows, and a Company Likely
  finish as the two SBUs added up: not wanted for now (D5).
- Likely finish for a year: no such figure exists, and D5 removes Likely
  finish from the card.

## 5. Business rules and records to update

- Business-Rules: where Likely finish is shown (no longer on Target vs
  Actuals); the Year view's columns.
- `docs/Target-vs-Actuals-Redesign-Implementation-Plan.md`: a "changed
  by" note on D2, D3 and D10.
- `docs/Target-vs-Actuals-Redesign-Manual-E2E-Test-Plan.md`: sections
  A–C and the phone steps.
- User manual and in-app help: with the UAT move.

## 6. Technical addendum

File and line numbers re-read at build.
- `TargetVsActualsSection.tsx`: remove the `TileGrid` (four tiles) and
  `headline`/`wonPct`/`likelyPct`; table columns Target, Won (paid), PO
  received (`po_received_lakhs`, present on summary rows and people),
  Won %; `WonBar` without `likelyPct`.
- `TargetVsActualsYear.tsx`: remove the `TileGrid` (three tiles); add PO
  received so far (summary rows already have `po_received_lakhs`).
- `TargetVsActualsPerson.tsx`: drop the Likely finish tile;
  `TileGrid columns={3}`, third tile `wide` on a phone; drop the
  `undated_opportunity_count` note (D10), keep `NoPoDateNote`.
- Server: `TargetVsActualYearPerson` gains `po_received_lakhs`, filled by
  the year service for counted quarters; `api.ts` regenerated. Likely
  finish stays in `TargetVsActualResponse` and `TargetVsActualPerson`.
- `WonBar`'s `likelyPct` prop may become unused; remove it if so.
- The uncommitted two-decimal percentage change in
  `utils/targetVsActuals.ts` (Build & Test, 30 Oct) is settled in that
  session's `fix:` commit first.
- No migration.
