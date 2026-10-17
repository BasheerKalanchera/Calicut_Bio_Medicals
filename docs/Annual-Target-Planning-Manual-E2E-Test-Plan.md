<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Annual Target Planning — Manual E2E Test Plan

**On hold, 2026-10-17:** waiting for the implementation plan's replan
(calendar-year brand targets) to be finished and approved. The steps
below test the old plan and will be rewritten after that; don't run them.

**Covers:** `docs/Annual-Target-Planning-Implementation-Plan.md`, steps 1–5
(one combined run after step 5, as the plan's step 6 says).
**Built:** not yet — commit hashes filled in after the fact.
**Where:** Dev.

## Checked against live data

Checked read-only on Dev, 2026-10-16, as Haroon Sidheeq (General Manager)
with all three RLS settings (user, role, SBU) set and verified — a first
run without them returned too few rows and was discarded. Re-checked just
before the run (these records may change meanwhile), and the hide-checks
in sections A, C, D and E re-run then too.

- **Who sees:** testers are Haroon Sidheeq (General Manager), Fazal (Area
  Manager, Imaging, reports to Haroon), Fahad (Sales Staff, Imaging,
  reports to Fazal), Shruthi (Area Manager, Imaging, reports to Haroon —
  not Fahad's manager), Vivek (Sales Staff, Critical Care, reports to Arun
  Adarsh) and Abdul Latheef P (Admin). Brand Target Tracking is Admin/GM
  only today (`BrandTargetTrackingScreen.tsx:34`, `:87`). Target vs
  Actuals: Admin/GM company-wide, Area Manager their team
  (`TargetVsActualsSection.tsx:227`, `:230`).
- **Who can approve:** Fahad's plan — Fazal (his manager). Haroon has no
  manager, so no one is notified when he submits (plan D18); Admin
  approves his plan.
- **Who can save:** Admin and GM set brand and SBU targets; each rep saves
  their own plan.
- **Existing values:** on Dev, 2026-10-16:
  - Brands: Imaging has one, SonoScape; Critical Care has nine active
    (Aeonmed, AVI Health care, E2E Test Brand, EDAN, ELECTROSCIENCE,
    Kolkatta, Magnamed, Maquet, Medion) and one inactive (Legacy Data).
  - Brand targets: one row in all — EDAN, 2026-Q3, ₹120 L.
  - SBU targets: Critical Care 2026-Q3 ₹150 L, 2026-Q4 ₹120 L; Imaging
    2026-Q3 ₹100 L, 2026-Q4 ₹160 L. No FY 2027-28 figures.
  - FY 2026-27 plans: Arun Adarsh Q3 Approved ₹50 L, Q4 Pending ₹30 L;
    Haroon Q2 Approved ₹80 L (Critical Care) and ₹120 L (Imaging); Nishad
    Q4 Pending ₹10 L; Vivek Q2 Approved ₹65 L, Q3 Pending ₹66 L, Q4
    Rejected ₹45 L; Basheer K Q3 Pending ₹55 L; Rudrappa Q3 Approved
    ₹10 L. No FY 2027-28 plans.
  - Notifications today: only Opportunity, activity and marketing-lead
    kinds; none about plans.

Button labels, messages and the order of checks are taken from the code,
not the design doc. Nothing is built yet, so every label and message
below is a description, not exact wording; each is replaced with the
built code's wording before the run.

## Figures and sources

- Users, roles, SBUs, managers, brands, brand and SBU targets, plans and
  notification kinds above — Dev query, 2026-10-16
- 2026-Q3 = 01 Oct 2026 to 31 Dec 2026; 2027-Q1 = 01 Apr 2027 to 30 Jun
  2027 — `scripts/quarter.py`, 2026-10-16
- Who sees Brand Target Tracking and Target vs Actuals — code, read
  2026-10-16 (lines above)
- SonoScape ₹500 L / ₹480 L / ₹450 L, Imaging own figure ₹500 L, quarters
  ₹120 L / ₹100 L, Fahad's plan ₹20 L, notes "Add one more hospital" and
  "Added Baby Memorial" — made-up example values for this run
- ₹270 L / ₹260 L (FY 2026-27 SBU yearly targets) — the Dev SBU targets
  above added up (150 + 120; 100 + 160)
- Won figures for E2–E4 — not known yet; read from the Quarter view at
  pre-flight P4 and the re-check before the run

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Left on Dev permanently:** SonoScape's FY 2027-28 yearly target;
Imaging's FY 2027-28 quarterly SBU targets (2027-Q1 to Q4); Fahad's
2027-Q1 plan and its history; the plan notifications created below.
Haroon's 2027-Q1 test plan (D8) is deleted at the end; Imaging's own
yearly figure is cleared in B4.

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
- P2. [Simple] Dev's `alembic current` = 0062 (head), and
  `docs/Physical-Schema.sql` regenerated since. —
- P3. [Simple] Testers can sign in: Haroon, Fazal, Fahad, Shruthi, Vivek,
  Abdul Latheef P. —
- P4. [Complex: before-and-after record of other screens] Before testing,
  note on Dev: Target vs Actuals Quarter view for Critical Care 2026-Q3
  and Imaging 2026-Q3 (every figure); Target & Coverage Planning SBU box
  for Critical Care 2026-Q3 (₹150 L); and that one existing activity
  comment notification opens its activity. —

## A — Brand Target Tracking becomes yearly (D12, D12a, D4)

1. [Simple] As Haroon, open Brand Target Tracking, Critical Care.
   **Expected:** a year (FY 2026-27) with year arrows, no quarter arrows;
   EDAN's yearly target ₹120 L (its one quarterly figure, added up); other
   brands show no target; SBU yearly total ₹120 L. —
2. [Simple] Switch to Imaging. **Expected:** SonoScape shows no target;
   SBU total shows none (₹0 or a dash, as the code shows). —
3. [Complex: save, then read back after a reload] Move to FY 2027-28 and
   type SonoScape ₹500 L; save. **Expected:** saved; after a reload
   SonoScape ₹500 L, SBU total ₹500 L. —
4. [Simple] Change SonoScape to ₹480 L and save. **Expected:** SBU total
   ₹480 L. —
5. [Simple] Read SonoScape's Team Committed and Gap for FY 2027-28.
   **Expected:** committed ₹0 (no FY 2027-28 plans yet), gap ₹480 L. —
6. [Simple] Hide-check: as Fazal, look for Brand Target Tracking.
   **Expected:** not offered, as today (Admin/GM only). —

## B — SBU yearly target (D4–D6, D11, D13, D15, D22a)

1. [Simple] As Haroon, Target & Coverage Planning, Annual view, Imaging,
   FY 2027-28. **Expected:** yearly target ₹480 L, shown as the brand
   total (not the GM's own figure). —
2. [Complex: save, then read back] Type the GM's own figure ₹500 L; save.
   **Expected:** ₹500 L as the GM's figure, brand total ₹480 L beside it. —
3. [Complex: cross-screen] On Brand Target Tracking, change SonoScape to
   ₹450 L; back on Target & Coverage Planning. **Expected:** SBU yearly
   target still ₹500 L (D5: once set it stays); brand total ₹450 L. —
4. [Complex: cross-screen] Clear the GM's own figure (D13). **Expected:**
   the yearly target follows the brand total, ₹450 L. Then set SonoScape
   back to ₹480 L on Brand Target Tracking; **Expected:** yearly target
   ₹480 L. —
5. [Complex: four saves and a warning] Type the four quarters by hand:
   2027-Q1 ₹120 L, Q2 ₹120 L, Q3 ₹120 L, Q4 ₹100 L. **Expected:** no
   automatic split anywhere (D11); a warning that the quarters are ₹20 L
   short of ₹480 L. —
6. [Simple] Change Q4 to ₹120 L. **Expected:** the warning goes. —
7. [Simple] Quarterly view, Imaging, 2027-Q1. **Expected:** SBU target box
   ₹120 L, with the year it belongs to (FY 2027-28). —
8. [Simple] Quarterly view, Critical Care, 2026-Q3. **Expected:** SBU
   target box ₹150 L, as at P4 — unchanged. —
9. [Simple] Annual view, Critical Care, FY 2026-27. **Expected:** yearly
   target ₹270 L, its quarterly targets added up (D22a), not the brand
   total ₹120 L. Imaging FY 2026-27: ₹260 L. —

## C — Reps see their SBU's targets (D8, D14)

1. [Simple] As Fahad, Target & Coverage Planning, 2027-Q1. **Expected:** a
   read-only line above "My Plan": Imaging target FY 2027-28 ₹480 L · this
   quarter ₹120 L; nothing to type in. —
2. [Simple] As Fahad, 2026-Q3. **Expected:** the line shows this quarter
   ₹100 L; FY 2026-27 ₹260 L (Imaging's quarterly targets added up,
   D22a). —
3. [Simple] Hide-check: as Vivek, 2026-Q3. **Expected:** Critical Care's
   line (this quarter ₹150 L); no Imaging figure anywhere on the screen. —

## D — Plan notifications (D18–D21)

1. [Complex: save, then check another user's bell] As Fahad, start a
   2027-Q1 plan with one hospital, ₹20 L, and save it as a draft.
   **Expected:** Fazal's bell shows nothing new (a draft isn't
   submitted). —
2. [Complex: cross-role] Fahad submits it. **Expected:** Fazal's bell
   shows Fahad's plan for Apr–Jun 2027 waiting for approval. —
3. [Complex: hide-check across three users] **Expected:** Shruthi's,
   Haroon's and Abdul Latheef P's bells show nothing new for it (D18:
   only the approver). —
4. [Complex: cross-screen] Fazal clicks the notification. **Expected:**
   Target & Coverage Planning opens at 2027-Q1 on Fahad's plan (D21). —
5. [Complex: cross-role] Fazal rejects it with the note "Add one more
   hospital". **Expected:** Fahad's bell shows the rejection with that
   note; clicking it opens his 2027-Q1 plan. —
6. [Complex: cross-role] Fahad revises the plan with the change note
   "Added Baby Memorial" and resubmits. **Expected:** Fazal's bell shows
   a revision, carrying "Added Baby Memorial". —
7. [Complex: cross-role] Fazal approves. **Expected:** Fahad's bell shows
   the approval. —
8. [Complex: cross-role, then clean-up] As Haroon (no manager), submit a
   2027-Q1 plan for Imaging. **Expected:** no one's bell shows anything
   for it (Abdul Latheef P's checked). Then delete that plan. —
9. [Simple] Click the activity comment notification noted at P4.
   **Expected:** it opens its activity, as before. —

## E — Target vs Actuals, Year view (D16, D22, D22a)

1. [Simple] As Haroon, Insights Dashboard → Target vs Actuals, Quarter
   view, Critical Care 2026-Q3 and Imaging 2026-Q3. **Expected:** every
   figure as noted at P4. —
2. [Complex: figures across four quarters] Year view, Critical Care,
   FY 2026-27. **Expected:** SBU target ₹270 L (D22a); each rep's yearly
   plan figure equals the four quarters' "Team plans" figures for that
   rep added up (D22) — e.g. Vivek's, from his Q1–Q4 figures noted at the
   re-check; Won for the year (filled in at the re-check). —
3. [Complex: figures across four quarters] Year view, Imaging, FY 2027-28.
   **Expected:** SBU target ₹480 L; Fahad's plan ₹20 L (his one 2027-Q1
   plan, approved in D7); Brands table SonoScape yearly target ₹480 L against
   Won. —
4. [Simple] Open Fahad's row (▸). **Expected:** his brands and hospitals
   for the year. —
5. [Simple] Hide-check: as Fazal, Year view. **Expected:** only his team
   (Fahad), as the Quarter view shows today. —
