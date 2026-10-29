<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Annual Target Planning (Parts 1 and 2) — Manual E2E Test Plan

**Covers:** `docs/Annual-Target-Planning-Implementation-Plan.md`, Part 1
(build steps 1–4: sections A–H) and Part 2 (build steps 5–7: Pre-flight
P6–P8, sections I–K).
**Built:** Part 1 — `f2f5edd` (migration 0062, server), `642f04c`
(screens), `ed669e7` (review fixes), `be27712` (seasonal pattern save
greyed out until 100 %), 21–22 Oct 2026; fixes during the E2E
`6016e6a`, `dd9cdb9`, `c2f025d`, `8d232c1`, `48e737b`, 22–24 Oct.
Part 1 E2E passed 65 of 65, 2026-10-24. Part 2 — step 5 (Year view,
D77) `f5d30d5`; step 6 (notifications, billing, hand-typed quarters,
migration 0064) `99c64ad`; pre-E2E review fixes (D81) `51d4fe8`; all
25 Oct. E2E not yet.
**Where:** Dev, after `/build` merges into `main` and migration 0062 is
applied. Replaces the 17 Oct on-hold version, which tested the withdrawn
yearly SBU figure (D4–D15, D22a). Part 2 runs after Part 1's E2E has
passed, on the figures Part 1 leaves behind, in the order I, J, K (J and
K change figures I reads).

## Checked against live data

Checked read-only on Dev, 2026-10-21, as Haroon Sidheeq (GM), with all
three RLS settings (user, role, SBU) set and verified. Re-run just before
the E2E (P4): the build changes these tables.

- **Who sees:** Brand Target Tracking: Admin and GM only, as today —
  Abdul Latheef P, Haroon Sidheeq. SBU target after the build (D26):
  Admin, GM and the one SBU Manager, Basheer K (Imaging). Area Managers
  (Arun Adarsh, Nishad K V, Fazal, Shruthi) and reps (Vivek, Fahad,
  Rudrappa) don't.
- **Who can approve:** plan approvals unchanged, checked passively only:
  Fahad → Fazal, Rudrappa → Shruthi, Vivek → Arun Adarsh; the four Area
  Managers and Basheer K → Haroon Sidheeq.
- **Who can save:** person targets, each by the person's manager (D45,
  D57): Haroon → Arun Adarsh, Nishad K V, Fazal, Shruthi, Basheer K;
  Fazal → Fahad; Shruthi → Rudrappa; Arun Adarsh → Vivek; Nishad K V → no
  one (no reps). Admin and GM any. Brand figures and seasonal patterns:
  Admin and GM. Shruthi's manager: Admin, on User Directory's "Manager"
  picker.
- **Existing values:** brand quarterly targets: only EDAN Oct–Dec 2026
  ₹120 L. Typed SBU targets (removed by 0062, D55): Critical Care Oct–Dec
  2026 ₹150 L, Jan–Mar 2027 ₹120 L; Imaging ₹100 L, ₹160 L. Person
  targets: none (table arrives with 0062). Brands: Imaging — SonoScape
  only; Critical Care — Aeonmed, AVI Health care, E2E Test Brand, EDAN,
  ELECTROSCIENCE, Kolkatta, Magnamed, Maquet, Medion (Legacy Data
  inactive). Plans: Oct–Dec 2026 — Arun Adarsh approved ₹50 L, Basheer K
  pending ₹55 L, Rudrappa approved ₹10 L, Vivek pending ₹66 L; Jan–Mar
  2027 and Apr–Jun 2027 — Arun Adarsh pending ₹30 L, Nishad K V pending
  ₹10 L, Vivek rejected ₹45 L.

**Part 2** — checked read-only on Dev, 2026-10-22, as each tester, all
three RLS settings verified. Re-run at P7.

- **Who sees:** Year view: as Target vs Actuals today (Admin and GM
  everything; an Area Manager their team; a rep their own row).
  Notifications: each person only their own. Billing: Admin and GM only.
- **Who can approve:** each plan by the person's manager (as above);
  Admin and GM any plan but their own. Haroon and Abdul Latheef P have no
  manager, so Haroon's submit notifies no one (D18, D69).
- **Who can save:** plans by their owner; plan decisions by the approver;
  brand figures and hand-typed brand quarters by Admin and GM (D70).
- **Existing values:** plans as above, plus Jul–Sep 2026 — Haroon ₹80 L
  (Critical Care) and ₹120 L (Imaging), Vivek ₹65 L, all approved; Vivek's
  Oct–Dec 2026 ₹66 L has last approved ₹60 L, Basheer K's ₹55 L ₹20 L,
  Vivek's rejected Jan–Mar 2027 ₹45 L ₹30 L. Plan notifications: none
  (not built). Older notifications per tester: Abdul Latheef P 2, Haroon
  8, Basheer K 6, Fazal 33, Shruthi 19, Arun Adarsh 1, Nishad K V 6,
  Fahad 12, Rudrappa 20, Vivek 4. No person targets or brand yearly
  figures yet (Part 1's E2E not run).

Button labels, messages and the order of checks are taken from the code,
not the design doc. Part 1 (sections A–H) checked against the built code,
2026-10-22. Part 2 (sections I–K) checked against the built code,
2026-10-25 (`TargetVsActualsSection.tsx`, `TargetVsActualsYear.tsx`,
`notificationDescribe.ts`, `TargetPlanningScreen.tsx`,
`TargetPlanDialog.tsx`, `BrandTargetTrackingScreen.tsx`). Amounts on screen read like "₹280.0L"; this plan writes "₹280 L".

## Figures and sources

- Users, roles, managers, SBUs, brands, brand and SBU quarterly targets,
  plans — Dev query as Haroon, 2026-10-21
- Oct–Dec 2026 = 2026-Q3, Jan–Mar 2027 = 2026-Q4, Apr–Jun 2027 = 2027-Q1
  — `scripts/quarter.py`, 2026-10-21; Jul–Sep 2026 = 2026-Q2 —
  `scripts/quarter.py`, 2026-10-19 (implementation plan)
- 21 Oct 2026 falls in Oct–Dec 2026, the quarter in progress (D51) —
  `scripts/quarter.py`, 2026-10-21
- Basheer K is SBU Manager on Dev; none on UAT or at Cabio yet — Basheer,
  2026-10-21
- Brand Target Tracking Admin/GM only — `BrandTargetTrackingScreen.tsx:34`,
  read 2026-10-21
- User Directory "Manager" picker — `UserDirectoryScreen.tsx:374-391`
- Patterns: Imaging 2026 15/20/30/35; Critical Care 2026 20/20/30/30, then
  10/20/30/40; Maquet's own 25/25/25/25 — made-up
- SonoScape ₹400 L + 100 %; EDAN ₹200 L + 50 %; Maquet ₹100 L + 0 %;
  Medion ₹100 L + 0 %, year starting April — made-up
- SonoScape Oct–Dec ₹280 L; EDAN ₹90 L then ₹120 L; Maquet ₹25 L; Medion
  ₹30 L / ₹20 L then ₹40 L / ₹10 L; Critical Care ₹145 L then ₹185 L —
  worked out from the made-up figures above
- Fazal ₹160 L, Shruthi ₹100 L → ₹120 L → ₹130 L → ₹120 L, Basheer K
  ₹120 L, Arun Adarsh ₹100 L, Nishad K V ₹85 L, Fahad ₹140 L, Rudrappa
  ₹100 L, Vivek ₹90 L — made-up
- Won and committed figures — not known yet; read at P5
- Part 2: managers, plans, last approved figures, notification counts —
  Dev query as each tester, 2026-10-22
- FY 2026-27 counted from Oct–Dec 2026, FY 2027-28 from April (D66, D31);
  target and plan as running totals per person (D67) — Basheer, 2026-10-22;
  changed by D78: the person row shows the whole year, the running
  totals move into the opened row — Basheer, 2026-10-25
- Year view running targets (Imaging ₹280 L / ₹280 L, Critical Care
  ₹185 L / ₹195 L, Company ₹465 L / ₹475 L) — added up from Part 1's
  figures above
- Billing: SonoScape ₹100 L, EDAN ₹50 L, Medion ₹25 L a quarter — the
  brand's own figure split evenly (D68)
- Fahad's ₹20 L / ₹25 L plan, Nishad K V's ₹12 L, Haroon's ₹30 L, Medion
  Jan–Mar ₹20 L and own ₹120 L, every note text — made-up
- Medion Oct–Dec at ₹120 L = ₹48 L (Critical Care's 40 % for Oct–Dec) —
  worked out

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives). Saves to Dev
are "Basheer clicks, Claude watches"; Claude reads the record back in the
app.

**Opportunities:** none created. Part 2 names one existing Opportunity,
with its hospital, at P7 (J11).

**Left on Dev permanently:** the 2026 brand figures, patterns and saved
brand quarters below (EDAN's ₹120 L replaced); Medion's year starting in
April; the Oct–Dec 2026 person targets. Shruthi's manager is put back to
Haroon in G7. Part 2: Fahad's and Haroon's Oct–Dec 2026 plans, Nishad K
V's Jan–Mar 2027 ₹12 L, Vivek's ₹66 L approved, every plan notification,
and Medion's Jan–Mar 2027 ₹10 L marked "changed by hand" (no way to
remove the mark, D73).

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. — Pass, 2026-10-22 (Basheer restarted it; runs with hot reload)
- P2. [Simple] Dev's `alembic current` = 0062 (head), and
  `docs/Physical-Schema.sql` regenerated since. — Pass, 2026-10-22 (`alembic current` = 0062 (head); schema regenerated in `f2f5edd`, same commit as 0062)
- P3. [Simple] Testers can sign in: Abdul Latheef P, Haroon Sidheeq,
  Basheer K, Fazal, Shruthi, Arun Adarsh, Nishad K V, Fahad, Rudrappa,
  Vivek. — Pass, 2026-10-22: accounts confirmed active at P4; sign-in checked at each tester's first step (Basheer)
- P4. [Complex: read-only Dev query, shown first] Re-run the 21 Oct check
  (managers, roles, brand quarterly targets, plans; person targets
  expected none); update "Checked against live data" if anything moved. — Pass, 2026-10-22: Dev query as Haroon (user and role set and verified; SBU setting empty, as Haroon has no SBU). All ten testers active; roles, SBUs and managers as listed; brands as listed, every year starting January; brand quarterly targets only EDAN Oct–Dec 2026 ₹120 L; no brand yearly figures, seasonal patterns or person targets; 13 plans, every amount, status and last approved figure as listed. Nothing moved.
- P5. [Complex: before-record across two screens] As Haroon, before any
  save, note every figure on Target vs Actuals, Oct–Dec 2026 and Jul–Sep
  2026, Imaging and Critical Care; and on Brand Target Tracking,
  SonoScape's and EDAN's Oct–Dec 2026 committed and gap. **Expected:**
  Imaging Oct–Dec 2026 target not set; Critical Care Oct–Dec 2026 ₹120 L
  (EDAN only — the typed ₹150 L is gone, D55). — Pass, 2026-10-22 (Claude, as Haroon, read only). Target vs Actuals:
  - Imaging Oct–Dec 2026: SBU target not set; team plans ₹65.0L; PO ₹16.0L; Won ₹34.0L (52%); Expected ₹75.8L; Likely finish ₹109.8L; Company row "Waits for every SBU's target", plans ₹181.0L. People: Basheer K Pending ₹55.0L (was ₹20.0L), Won ₹23.0L; Fahad —, Won ₹11.0L; Fazal —; Haroon —; Rudrappa Approved ₹10.0L; Shruthi —. Brand SonoScape planned ₹65.0L, Won ₹34.0L.
  - Critical Care Oct–Dec 2026: SBU target ₹120.0L; team plans ₹116.0L (97%); PO, Won, Expected all ₹0.0L. People: Arun Adarsh Approved ₹50.0L; Haroon —; Nishad K V —; Vivek Pending ₹66.0L (was ₹60.0L). Brands planned: Aeonmed ₹10.0L, EDAN ₹45.0L, ELECTROSCIENCE ₹31.0L, Magnamed ₹25.0L, Maquet ₹5.0L.
  - Imaging Jul–Sep 2026: target not set; team plans ₹120.0L (Haroon Approved); Won ₹0.0L; Company plans ₹265.0L.
  - Critical Care Jul–Sep 2026: target not set; team plans ₹145.0L (Haroon ₹80.0L, Vivek ₹65.0L, both Approved); Won ₹0.0L.

  Brand Target Tracking, 2026 (no seasonal pattern, no yearly figures):
  - SonoScape Oct–Dec: target "Not set", committed ₹65.0L, gap —. Jul–Sep committed ₹120.0L.
  - EDAN Oct–Dec: target ₹120.0L, committed ₹45.0L, gap ₹75.0L. Jul–Sep committed ₹85.0L.

**Part 2 pre-flight** (before section I):

- P6. [Simple] Part 1's E2E passed and its figures are still on Dev
  (person targets, brand figures, patterns; Maquet ₹100 L). — Pass,
  2026-10-25 (Basheer, as Haroon, on a phone after the layout fix):
  SonoScape ₹400 L / 100 % / ₹800 L; EDAN ₹200 L / 50 % / ₹300 L;
  Maquet ₹100 L / 0 %, own pattern; Medion ₹100 L / 0 %, Apr 2026–Mar
  2027; SBU pattern for 2026 shown. Person targets checked at P7. Dev
  backend restarted before the run (Basheer); `alembic current` = 0064.
- P7. [Complex: read-only Dev query, shown first] Re-run the 22 Oct check.
  Note each tester's unread bell count. Name one hospital in Fahad's area
  and one in Imaging for Haroon. Name one Opportunity notification
  (Haroon), one lead notification (Nishad K V) and one comment
  notification (Basheer K), each Opportunity with its hospital. — Done,
  2026-10-28 (Claude, read-only Dev query as each of the 10 testers, RLS
  settings verified; Basheer approved). Totals, managers and plans match
  22 Oct. Unread bell: Abdul Latheef P 1, Haroon 2, Basheer K 1, Fazal 0,
  Shruthi 2, Arun Adarsh 1, Nishad K V 2, Fahad 5, Rudrappa 1, Vivek 2.
  Hospital (Fahad's area; Haroon sees all): "new customer" (Mangalore) —
  the only one not in any Oct–Dec 2026 plan. Opportunity (Haroon):
  "New USG m/c" (aster medicity), unread. Lead (Nishad K V): comment on a
  converted lead, Aster DM, unread, 10 Oct. Comment (Basheer K): call
  activity on "Test Aug 18 opportunity" (Aster DM), read, 10 Sep. Basheer K
  has no person target, as expected: Part 1 left it unset on purpose (no
  one reported to him; section C step 10, section G).
- P8. [Complex: before-record] As Haroon, Target vs Actuals, Quarter view,
  Imaging and Critical Care, Oct–Dec 2026 and Jan–Mar 2027: note every
  target, Team plans and Won (paid) figure. — Done, 2026-10-28 (Claude,
  read only, as Haroon, Dev). **Imaging Oct–Dec 2026:** SBU target ₹280.0L,
  Team plans ₹65.0L (23 %), PO ₹16.0L, Won ₹34.0L (12 % of target; 52 % of
  plans), Expected ₹75.8L, Likely finish ₹109.8L; Company target ₹465.0L,
  plans ₹181.0L, Won ₹34.0L; people: Basheer K ₹55.0L pending (was ₹20.0L),
  Fazal target ₹160.0L, Fahad ₹140.0L, Shruthi ₹120.0L, Rudrappa ₹100.0L /
  plan ₹10.0L approved; SonoScape planned ₹65.0L, won ₹34.0L. **Imaging
  Jan–Mar 2027:** SBU target not set; Team plans ₹0.0L; Won ₹0.0L; Company
  "Waits for every SBU's target", plans ₹70.0L. **Critical Care Oct–Dec
  2026:** SBU target ₹185.0L, Team plans ₹116.0L (63 %), PO and Won ₹0.0L;
  people: Arun Adarsh ₹100.0L / plan ₹50.0L approved, Vivek ₹90.0L / plan
  ₹66.0L pending (was ₹60.0L), Nishad K V ₹85.0L not started; brands
  Aeonmed ₹10.0L, EDAN ₹45.0L, ELECTROSCIENCE ₹31.0L, Magnamed ₹25.0L,
  Maquet ₹5.0L, Won ₹0.0L. **Critical Care Jan–Mar 2027:** SBU target
  ₹10.0L, Team plans ₹70.0L (700 %), Won ₹0.0L; Arun Adarsh ₹30.0L pending,
  Vivek ₹30.0L (rejected, approved still counts), Nishad K V ₹10.0L
  pending; EDAN ₹40.0L. Year view (I) must give the same Oct–Dec and
  Jan–Mar figures.

## A — Brand Target Tracking by calendar year (D23–D25, D39–D43, D46, D46a, D48, D50)

1. [Simple] As Haroon, open Brand Target Tracking. **Expected:** moves by
   calendar year ("2026", year arrows, no quarter arrows); quarters read
   "Oct–Dec 2026", never "2026-Q3". — Pass, 2026-10-22 (observed by Claude during P5)
2. [Complex: save, then read back after a reload] "SBU" picker → Imaging,
   2026, "Seasonal pattern for 2026": Jan–Mar % 15, Apr–Jun % 20, Jul–Sep %
   30, Oct–Dec % 35; "Save pattern". **Expected:** after a reload, the
   same four figures. — Pass, 2026-10-22: Basheer saved; Claude reloaded and read back 15 / 20 / 30 / 35, "Total 100%"
3. [Simple] Change Oct–Dec to 25 (adds to 90). **Expected:** "Save
   pattern" greyed out; the total reads "Total 90% — must add up to
   100%". Type 35 back. **Expected:** "Total 100%"; nothing was saved. — Pass, 2026-10-22 (Basheer)
4. [Complex: save, then read back] SonoScape ("SonoScape · Jan–Dec 2026"):
   "Set target" → box "SonoScape · year starting 2026": "Brand's own
   yearly figure (₹ Lakhs)" 400, "Stretch (%)" 100; "Save". **Expected:**
   "Stretched target" ₹800 L beside the own figure. Open the line with its
   arrow: Oct–Dec 2026 ₹280 L; Jan–Mar, Apr–Jun and Jul–Sep 2026 "Not set"
   (before Oct–Dec 2026, not saved, D46a). — Pass, 2026-10-22: Basheer saved; Claude reloaded (phone width, so the own-figure column is hidden by the phone layout fix) and read Stretched target ₹800.0L, "Revise"; Oct–Dec 2026 ₹280.0L; Jan–Mar, Apr–Jun, Jul–Sep "Not set"; caption "Spread by the SBU's seasonal pattern for 2026."
5. [Simple] SonoScape's Oct–Dec 2026 committed and gap. **Expected:**
   committed as at P5; gap = ₹280 L minus it. — Pass, 2026-10-22 (observed by Claude at A4): committed ₹65.0L (as at P5), gap ₹215.0L
6. [Complex: save, then read back] Critical Care, 2026: pattern 20 / 20 /
   30 / 30; save. Then EDAN: own ₹200 L, stretch 50 %; save.
   **Expected:** stretched ₹300 L; Oct–Dec 2026 ₹90 L, replacing the
   ₹120 L typed earlier (D48). — Pass, 2026-10-22: Basheer saved both; Claude reloaded and read pattern 20 / 20 / 30 / 30, EDAN Stretched target ₹300.0L, Oct–Dec 2026 ₹90.0L (committed ₹45.0L, gap ₹45.0L); earlier quarters "Not set"
7. [Complex: a brand's own pattern] Maquet: own ₹100 L, stretch 0 %, tick
   "This brand has its own seasonal pattern", 25 / 25 / 25 / 25; save.
   **Expected:** Oct–Dec 2026 ₹25 L; the open line reads "Spread by this
   brand's own seasonal pattern." — Pass, 2026-10-22: Basheer saved; Claude reloaded and read Maquet Stretched target ₹100.0L, Oct–Dec 2026 ₹25.0L (committed ₹5.0L, gap ₹20.0L), caption "Spread by this brand's own seasonal pattern."
8. [Complex: year-start change, then save] Medion: "Year starts in" →
   April (hint "This brand's year: Apr 2026–Mar 2027"); then own ₹100 L,
   stretch 0 %; save. **Expected:** shown under
   2026 as "Medion · Apr 2026–Mar 2027"; Oct–Dec 2026 ₹30 L, Jan–Mar 2027
   ₹20 L (pattern follows the months, D41); Apr–Jun and Jul–Sep 2026 not
   saved. — Pass, 2026-10-22 (hint wording: awaiting Basheer's confirmation): Claude reloaded and read "Medion · Apr 2026–Mar 2027" under 2026, ₹100.0L; Apr–Jun and Jul–Sep 2026 "Not set", Oct–Dec 2026 ₹30.0L, Jan–Mar 2027 ₹20.0L
9. [Complex: one save re-works several brands] Change Critical Care's 2026
   pattern to 10 / 20 / 30 / 40; save. **Expected:** EDAN Oct–Dec 2026 →
   ₹120 L; Medion Oct–Dec 2026 → ₹40 L, Jan–Mar 2027 → ₹10 L; Maquet stays
   ₹25 L (own pattern, D50). — Pass, 2026-10-22: Basheer saved; Claude reloaded and read EDAN Oct–Dec 2026 ₹120.0L (gap ₹75.0L); Medion Oct–Dec 2026 ₹40.0L, Jan–Mar 2027 ₹10.0L; Maquet Oct–Dec 2026 ₹25.0L
10. [Simple] Move to 2027. **Expected:** no brand has a figure (none sent
    yet, D42); Medion listed as "Apr 2027–Mar 2028". — Pass, 2026-10-22 (Basheer)
11. [Simple] (phone layout, `c2f025d`) As Haroon on a phone, open Brand
    Target Tracking, SBU Imaging, 2026. **Expected:** each brand row shows
    its "Set target" or "Revise" button in full, with no sideways
    scrolling; the "Brand's own figure" and "Stretch" columns are hidden.
    On a laptop both columns show again. — Pass, 2026-10-24 (Basheer)

## B — SBU target box: the brands' total, read-only (D26, D34, D47, D53, D55)

1. [Simple] As Haroon, Target & Coverage Planning, Imaging, Oct–Dec 2026.
   **Expected:** SBU target ₹280 L; no way to type or edit it. — Pass, 2026-10-22 (Basheer)
2. [Simple] Critical Care, Oct–Dec 2026. **Expected:** ₹185 L (EDAN 120 +
   Maquet 25 + Medion 40). — Pass, 2026-10-22 (Basheer)
3. [Simple] Critical Care, Jan–Mar 2027. **Expected:** ₹10 L (Medion only;
   the typed ₹120 L is gone, D55). — Pass, 2026-10-22 (Basheer)
4. [Simple] Imaging, Jan–Mar 2027. **Expected:** target not set (D42). — Pass, 2026-10-22 (Basheer)
5. [Simple] Imaging, Jul–Sep 2026. **Expected:** as at P5. — Pass, 2026-10-22 (Basheer)
6. [Simple] As Basheer K (SBU Manager), Imaging, Oct–Dec 2026.
   **Expected:** SBU target ₹280 L, read-only (D26). — Pass, 2026-10-22 (Basheer)
7. [Simple] Hide-check: as Basheer K, Critical Care. **Expected:** no
   Critical Care SBU target (Basheer K's SBU is Imaging). — Pass, 2026-10-22 (Basheer)
8. [Simple] Hide-check: as Fazal (Area Manager), Imaging, Oct–Dec 2026.
   **Expected:** the section heading reads "Team Plans", not "SBU Target
   & Plans"; no SBU target box; ₹280 L nowhere on the screen (D34). — Pass, 2026-10-22 (Basheer)
9. [Simple] Hide-check: as Fahad (rep), Oct–Dec 2026. **Expected:** no SBU
   target box (D26). — Pass, 2026-10-22 (Basheer)
10. [Simple] (D75) As Basheer K (SBU Manager), Imaging, before section G
   (no one reports to Basheer K yet). **Expected:** Quarterly, Oct–Dec
   2026: "SBU Target" card ₹280.0L, no "Team Targets" card, then "Team
   Plans". Annual, FY 2026-27: "SBU Target" card with "FY 2026-27 —
   Annual Total ₹280.0L" and the four quarters; no "Team Targets"
   card. Hide-check: no SBU picker. — Pass, 2026-10-24 (Basheer)

## C — Haroon divides the SBU target among the Area Managers (D33, D45)

1. [Complex: new panel, first look] As Haroon, Imaging, Oct–Dec 2026, Team
   targets panel. **Expected:** rows for Fazal, Shruthi and Basheer K, all
   blank, totalled against ₹280 L. Basheer K's row stays blank until
   section G: no one reports to Basheer K yet, and a figure there would
   count Shruthi's share twice (D57). — Pass, 2026-10-22 (Claude): rows Basheer K (SBU Manager), Fazal, Shruthi, all "Not set"; Total ₹0.0L against SBU target ₹280.0L. Finding: the short-by warning already shows with nothing set ("₹280.0L short") — Basheer: hide it until someone has a target; fixed (uncommitted, small-fixes batch) and checked on Critical Care's empty panel: no warning
2. [Complex: save with a warning] "Set target" on each row, then "Save":
   Fazal ₹160 L, Shruthi ₹100 L. **Expected:** saved; warning "These add
   up to ₹260.0L, ₹20.0L short of the SBU target (₹280.0L)." — Pass, 2026-10-22: Basheer saved; Claude reloaded and read Fazal ₹160.0L, Shruthi ₹100.0L, Basheer K Not set, total ₹260.0L and that exact warning
3. [Simple] Shruthi → ₹120 L; save. **Expected:** the warning goes. — Pass, 2026-10-23 (Basheer)
3a. [Complex: remove, then read back] (D74) "Remove" on Shruthi's row.
   **Expected:** no confirmation box; Shruthi shows "Not set", total
   ₹160.0L, warning "These add up to ₹160.0L, ₹120.0L short of the SBU
   target (₹280.0L)." Then "Set target" on Shruthi, ₹120 L, save:
   **Expected:** ₹120.0L, total ₹280.0L, no warning. — Pass, 2026-10-23 (Basheer)
4. [Complex: save, then read back] Critical Care, Oct–Dec 2026: Arun Adarsh
   ₹100 L, Nishad K V ₹85 L; save. **Expected:** no warning (₹185 L); no
   Imaging people listed. — Pass, 2026-10-22 (Basheer); Claude saw only Arun Adarsh and Nishad K V listed. Afterwards Basheer tried to take Arun's target off to see the empty panel: there is no way to, so he set ₹0 — finding raised with Basheer. Basheer then put both back; Claude reloaded and read Arun Adarsh ₹100.0L, Nishad K V ₹85.0L, total ₹185.0L, no warning
5. [Simple] As Abdul Latheef P (Admin), Imaging, Oct–Dec 2026, Team
   targets. **Expected:** Fazal ₹160 L, Shruthi ₹120 L shown and editable
   (D45). No save. — Pass, 2026-10-23 (Basheer)
6. [Simple] (D75) As Haroon, Oct–Dec 2026, Quarterly. **Expected:** top
   to bottom: SBU picker, "SBU Target" card (₹280.0L), "Team Targets"
   card, "Team Plans" card (no longer "SBU Target & Plans"). The Team
   Targets "Total" row shows ₹280.0L with no "SBU target: …" beside it
   (the SBU Target card above has it). Switching
   the picker to Critical Care changes all three cards (Team Targets:
   Arun Adarsh ₹100.0L, Nishad K V ₹85.0L), then back to Imaging. Then
   "Annual", FY 2026-27: an "SBU Target" card with "FY 2026-27 — Annual
   Total" and the four quarters (Oct–Dec 2026 ₹280.0L; the total is the
   quarters added up); below it a "Team Targets" card above "Team
   Plans", view-only (no Set/Change/Remove),
   "Switch to Quarterly to change a target"; Fazal ₹160.0L and Shruthi
   ₹120.0L under Oct–Dec 2026, "Not set" in any quarter without a
   target; Basheer K "Not set"; "Team total for FY 2026-27 ₹280.0L" with
   nothing beside it (no "SBU target for the year"), no warning. Switch
   Quarterly ↔ Annual three times: still one of each card. — Pass, 2026-10-24 (Basheer)
7. [Simple] (D75) As Abdul Latheef P (Admin), Imaging. **Expected:** the
   same as C6 — Quarterly: SBU picker, "SBU Target" card ₹280.0L, "Team
   Targets" (Total ₹280.0L, no "SBU target: …" beside it), "Team Plans".
   Annual, FY 2026-27: "SBU Target" card (Annual Total ₹280.0L); "Team
   total for FY 2026-27 ₹280.0L" with nothing beside it. No save. — Pass, 2026-10-24 (Basheer). Finding: the "SBU" label on the picker is cut off at the top (Admin and GM) — small fix proposed

## D — Area Managers divide among their reps; "Your target" (D30, D33, D35)

1. [Simple] As Fazal, Imaging, Oct–Dec 2026. **Expected:** "Your target
   for Oct–Dec 2026: ₹160 L". — Pass, 2026-10-23 (Basheer)
2. [Complex: save with a warning, then read back] Fazal's Team targets:
   Fahad only; ₹140 L; save. **Expected:** saved; warning "These add up
   to ₹140.0L, ₹20.0L short of your own target (₹160.0L)." (left as is). — Pass, 2026-10-23 (Basheer)
3. [Complex: save, then read back] As Shruthi: "Your target" ₹120 L; Team
   targets: Rudrappa ₹100 L; save. **Expected:** saved; warning ₹20 L
   short. — Pass, 2026-10-23 (Basheer)
4. [Complex: save, then read back] As Arun Adarsh: "Your target" ₹100 L;
   Team targets: Vivek ₹90 L; save. **Expected:** saved; warning ₹10 L
   short. — Pass, 2026-10-23 (Basheer)
5. [Simple] As Nishad K V: "Your target" ₹85 L. **Expected:** Team targets
   shows no one (no reps report to Nishad K V). — Pass, 2026-10-23 (Basheer): panel not shown at all
6. [Simple] As Fahad. **Expected:** "Your target for Oct–Dec 2026:
   ₹140 L"; no Team targets panel. — Pass, 2026-10-23 (Basheer)
7. [Simple] As Rudrappa: ₹100 L. As Vivek: ₹90 L. — Pass, 2026-10-23 (Basheer)
8. [Simple] (D75) As Fazal, Quarterly, Oct–Dec 2026. **Expected:** no
   SBU Target card (D34); Team Targets "Total" row ₹140.0L with "Your
   target: ₹160.0L" beside it (kept: his own target, not the SBU's).
   Then "Annual", FY 2026-27. **Expected:** no SBU Target card; "Team
   Targets" card above "Team Plans", view-only; Fahad ₹140.0L under
   Oct–Dec 2026; "Team total for FY 2026-27" ₹140.0L with "Your target
   for the year" beside it (₹160.0L if Oct–Dec is Fazal's only quarter
   with a target); no warning. As Fahad, "Annual": no Team Targets card. — Pass, 2026-10-24 (Basheer)

## E — Who must not see what (D23, D26, D34, D35)

1. [Simple] As Fahad: ₹160 L (Fazal's) and ₹280 L (Imaging) appear
   nowhere; no Brand Target Tracking in the menu. — Pass, 2026-10-23 (Basheer)
2. [Simple] As Fazal: Shruthi's ₹120 L and Rudrappa's ₹100 L appear
   nowhere; no Brand Target Tracking in the menu. — Pass, 2026-10-23 (Basheer)
3. [Simple] As Shruthi: Fazal's ₹160 L and Fahad's ₹140 L appear
   nowhere. — Pass, 2026-10-23 (Basheer). Basheer noticed Team targets isn't in the Annual view — question raised with him
4. [Simple] As Arun Adarsh: nothing from Imaging; Critical Care's ₹185 L
   appears nowhere (D34). — Pass, 2026-10-24 (Basheer)
5. [Complex: look for an edit the screen shouldn't offer] As Fazal: no way
   to change Fazal's own, Shruthi's or Rudrappa's target. — Pass, 2026-10-24 (Claude, read-only, Basheer signed in as Fazal): Quarterly Oct–Dec 2026 — "Your target for Oct–Dec 2026: ₹160.0L" plain text; Team Targets lists only Fahad ₹140.0L with Change/Remove; Total row "Your target: ₹160.0L" plain text; Shruthi and Rudrappa not listed. Annual FY 2026-27 — Team Targets view-only ("Switch to Quarterly to change a target"), no Set/Change/Remove; "Your target for the year: ₹160.0L" plain text. The only other buttons are "Plan" on My Plan (his own plan, not a target)
6. [Simple] As Basheer K: no Brand Target Tracking in the menu (D23). — Pass, 2026-10-24 (Basheer)

## F — Target vs Actuals (Insights Dashboard) (D49, D55)

1. [Complex: every figure against P5] As Haroon, Oct–Dec 2026.
   **Expected:** Imaging target ₹280 L, Critical Care ₹185 L (brand
   totals, D55); Won and plan figures exactly as at P5. — Pass, 2026-10-24 (Claude, read only, as Haroon). Imaging: SBU target ₹280.0L (was not set), Company ₹465.0L (280 + 185); team plans ₹65.0L, PO ₹16.0L, Won ₹34.0L (52%), Expected ₹75.8L, Likely finish ₹109.8L, Company plans ₹181.0L; people rows as at P5 (Basheer K Pending ₹55.0L was ₹20.0L, Won ₹23.0L; Fahad Won ₹11.0L; Rudrappa Approved ₹10.0L), Target column now shows the targets set in B–D (Fahad ₹140.0L, Fazal ₹160.0L, Rudrappa ₹100.0L, Shruthi ₹120.0L); SonoScape planned ₹65.0L, Won ₹34.0L. Critical Care: SBU target ₹185.0L (was ₹120.0L); team plans ₹116.0L, PO/Won/Expected ₹0.0L; Arun Adarsh Approved ₹50.0L (target ₹100.0L), Nishad K V target ₹85.0L, Vivek Pending ₹66.0L was ₹60.0L (target ₹90.0L); brands as at P5.
2. [Simple] Jul–Sep 2026. **Expected:** every figure as at P5. — Pass, 2026-10-24 (Basheer)
3. [Complex: team and rep rows] As Fazal, Oct–Dec 2026. **Expected:**
   "Your team" measured against ₹160 L (Fazal's own target, D49), not the
   SBU target; Fahad's row shows target ₹140 L beside the plan. — Pass, 2026-10-24 (Claude, read only, as Fazal): "Your team" row target ₹160.0L, team plans ₹0.0L, PO ₹11.0L, Won ₹11.0L (7%); no SBU or Company row. Fahad: Not started, target ₹140.0L, plan —, Won ₹11.0L; Fazal: target ₹160.0L, plan —.
4. [Simple] As Arun Adarsh, Oct–Dec 2026. **Expected:** team row against
   ₹100 L; Vivek's row shows target ₹90 L. — Pass, 2026-10-24 (Basheer)
5. [Simple] Hide-check: as Fazal, no Rudrappa row (as today). — Pass, 2026-10-24 (Claude, read only, during F3: only Fahad and Fazal listed; Basheer agreed)
6. [Simple] Unchanged: as Arun Adarsh, Target & Coverage Planning,
   Critical Care, Oct–Dec 2026: Vivek's ₹66 L plan still waiting for
   approval. No action. — Pass, 2026-10-24 (Basheer). Finding: on a phone the Needs Your Approval card's Actions column and the Team Plans card's "Pending Approval" chip run past the card's right edge — fixed 24 Oct (Hospitals column hidden on a phone, Approve/Reject stacked, chips wrap; uncommitted, small-fixes batch; Frontend Standards 6.6 #10).

## G — An SBU Manager sets the target: Shruthi reports to Basheer K (D32, D45, D57)

Dev has one test SBU Manager, Basheer K (Imaging); UAT and Cabio have
none yet. This checks the app is ready for one: Haroon gives Basheer K one
figure, and Basheer K divides it among the Area Managers reporting to
Basheer K (D57). Shruthi goes back to Haroon in G7.

1. [Complex: save on another screen, then read back] As Abdul Latheef P,
   User Directory, Shruthi: "Manager" Haroon Sidheeq → Basheer K; save.
   **Expected:** after a reload, Basheer K. — Pass, 2026-10-24 (Basheer saved and read back)
2. [Complex: save, then read back] As Haroon, Imaging, Oct–Dec 2026, Team
   targets. **Expected:** Shruthi no longer listed; Fazal ₹160 L, Basheer
   K blank, ₹120 L short. Give Basheer K ₹120 L; save. **Expected:** total
   ₹280 L, no warning. — Pass, 2026-10-24 (Basheer saved and read back)
3. [Complex: save, then read back as another user] As Basheer K, Team
   targets. **Expected:** "Your target for Oct–Dec 2026: ₹120 L" (D57);
   Shruthi listed with ₹120 L (set by Haroon in C); Fazal not listed.
   Change Shruthi → ₹130 L; save. **Expected:** warning "These add up to
   ₹130.0L, ₹10.0L over your own target (₹120.0L).";
   as Shruthi, "Your target" ₹130 L. — Pass, 2026-10-24 (Basheer saved and read back)
3a. [Simple] (D75, D57) As Basheer K, Quarterly, Oct–Dec 2026.
   **Expected:** "SBU Target" card ₹280.0L, then "Team Targets": Total
   ₹130.0L with "Your target: ₹120.0L" beside it — his own figure from
   Haroon, not the SBU's ₹280.0L. Annual, FY 2026-27: "SBU Target" card
   Annual Total ₹280.0L; "Team Targets" card with Shruthi ₹130.0L under
   Oct–Dec 2026; "Team total for FY 2026-27 ₹130.0L · Your target for
   the year: ₹120.0L" (if Oct–Dec is his only quarter with a target);
   no warning. — Pass, 2026-10-24 (Basheer)
4. [Complex: cross-role] As Haroon. **Expected:** can still see Shruthi's
   ₹130 L and change it (D32), where the code puts that. No save. — Pass on "see", 2026-10-24 (Claude, read only, as Haroon): Insights Dashboard, Target vs Actuals, Imaging Oct–Dec 2026 shows Shruthi target ₹130.0L (and Basheer K ₹120.0L). "Change": no screen — Haroon's Team Targets card lists only the people at the top of the SBU, so Shruthi (now under Basheer K) isn't there; the server would allow it. Basheer: leave it for now — Backlog "Target Planning: GM can't change a target set below them on screen", plan D45 note.
5. [Simple] Hide-check: as Fazal, Shruthi's ₹130 L and Basheer K's ₹120 L
   nowhere; no way to change either. — Pass, 2026-10-24 (Basheer: Target & Coverage Planning, Quarterly and Annual, and Target vs Actuals)
6. [Simple] Hide-check: as Shruthi, Basheer K's ₹120 L and the SBU's
   ₹280 L nowhere. — Pass, 2026-10-24 (Basheer: Target & Coverage Planning, Quarterly and Annual, and Target vs Actuals)
7. [Complex: save on another screen, then read back] As Abdul Latheef P,
   Shruthi's "Manager" back to Haroon Sidheeq; save. **Expected:** after a
   reload, Haroon Sidheeq. — Pass, 2026-10-24 (Basheer saved and read back)
8. [Complex: two saves, then read back] As Haroon, Imaging Team targets.
   **Expected:** Fazal ₹160 L, Shruthi ₹130 L, Basheer K ₹120 L — ₹130 L
   over ₹280 L. Clear Basheer K's figure (or ₹0 if the screen can't clear)
   and set Shruthi → ₹120 L; save. **Expected:** the warning goes. — Pass, 2026-10-24 (Basheer removed Basheer K's figure, set Shruthi ₹120 L, saved and read back: Fazal ₹160 L, Shruthi ₹120 L, Basheer K Not set, total ₹280 L, no warning)
9. [Simple] As Basheer K, Team targets. **Expected:** Shruthi no longer
   listed. — Pass, 2026-10-24 (Basheer): no Team Targets card at all (no one reports to Basheer K). Team Plans still lists Shruthi with Fazal, Fahad and Rudrappa — expected: an SBU Manager's Team Plans shows the whole SBU, as Target vs Actuals does

## H — Month labels (D39)

1. [Complex: visual sweep of three screens] As Haroon: Brand Target
   Tracking, Target & Coverage Planning (SBU box, Team targets, "Your
   target", plan dialog, messages), Target vs Actuals. **Expected:**
   quarters read like "Oct–Dec 2026"; no "2026-Q3"-style code anywhere;
   "FY 2026-27" year labels unchanged. — Pass, 2026-10-24 (Claude, read only, as Haroon, phone width; page text searched for "2026-Q3"-style and "Q1"–"Q4" codes on every view — none). Brand Target Tracking, 2026: Imaging and Critical Care with every brand opened — "Jan–Mar 2026" … "Oct–Dec 2026", "Jan–Mar 2027", "SonoScape · Jan–Dec 2026", "Medion · Apr 2026–Mar 2027". Target & Coverage Planning, Quarterly Oct–Dec 2026: SBU Target card "SBU target for Oct–Dec 2026", Team Targets "Divide the SBU target for Oct–Dec 2026 …", My Plan, Needs Your Approval ("Oct–Dec 2026", "Jan–Mar 2027", "Apr–Jun 2027"), plan box "Plan & Coverage — Oct–Dec 2026" (closed with Cancel, nothing saved); Annual "FY 2026-27" with "Apr–Jun 2026" … "Jan–Mar 2027". Target vs Actuals: Imaging and Critical Care Oct–Dec 2026, Critical Care Jan–Mar 2027. "Your target" not shown to Haroon (no target of his own); its label was read as Fazal at D1 ("Your target for Oct–Dec 2026")

## I — Target vs Actuals: Year view (D16, D22, D31, D66, D77–D80)

**Replaced — not to be resumed.** The Year view tested here is redesigned
(`docs/Target-vs-Actuals-Redesign-Implementation-Plan.md` D1, D2, D6;
Basheer, 2026-10-28/29). Its test is
`docs/Target-vs-Actuals-Redesign-Manual-E2E-Test-Plan.md` section A,
which also answers the open I8. The Part 2 E2E resumes at J (redesign
plan D7). Results below kept as a record.

1. [Simple] As Haroon, Insights Dashboard → Target vs Actuals card → the
   "Quarter" box → "Year". **Expected:** "FY 2026-27" between the arrows;
   the note under it starts "This year · as of …" and says "counted from
   Oct–Dec 2026, when this year's targets start"; the quarter-by-quarter
   table reads Apr–Jun 2026 … Jan–Mar 2027, never "2026-Q1". — Pass, 2026-10-28 (Basheer)
2. [Complex: running totals against P8] Imaging. **Expected:** Apr–Jun and
   Jul–Sep 2026 read "No target that quarter, so not counted" (D66);
   Oct–Dec 2026 is marked "This quarter", Jan–Mar 2027 "Upcoming".
   Oct–Dec 2026: target ₹280 L, Won = P8's
   Oct–Dec. Jan–Mar 2027: target still ₹280 L (no Jan–Mar target); Won reads "—" for Jan–Mar,
   because that quarter hasn't started. — Pass, 2026-10-28 (Claude, read only, as Haroon, Dev). Year view, FY 2026-27, Imaging: Apr–Jun and Jul–Sep 2026 "No target that quarter, so not counted"; Oct–Dec 2026 "This quarter", target ₹280.0L, Won ₹34.0L (12 %) = P8; Jan–Mar 2027 "Upcoming", target "Not set", target so far ₹280.0L. Difference from the wording: Won and Won so far for the upcoming Jan–Mar quarter read "—", not P8's sum — by design (service.py:1296 gives none for a quarter still to come; schema comment "None for a quarter still to come"). Plan wording fixed (Basheer, 2026-10-28)
3. [Complex: running totals against P8] Critical Care. **Expected:** target
   ₹185 L at Oct–Dec, ₹195 L at Jan–Mar (₹185 L + Medion's ₹10 L); Won reads
   "—" for Jan–Mar, because that quarter hasn't started. — Pass, 2026-10-28 (Claude, read only, as Haroon, Dev). Critical Care: Oct–Dec 2026 "This quarter", target ₹185.0L, Won ₹0.0L; Jan–Mar 2027 "Upcoming", target ₹10.0L, target so far ₹195.0L; Won "—" for the upcoming quarter (same wording point as I2)
4. [Complex: Year view against Quarter view] For target and Team plans,
   in both SBUs: the Jan–Mar figure minus the Oct–Dec figure = P8's
   Jan–Mar Quarter view figure (D22). Target comes from "Target so far" in
   the quarter-by-quarter table; Team plans from each person's opened row
   ("Rep Plan so far"), added up at each quarter. Won reads "—" for
   Jan–Mar, because that quarter hasn't started, so there is nothing to
   subtract (P8's Jan–Mar Won is ₹0.0L in both SBUs). — Pass, 2026-10-28 (Claude, read only, as Haroon, Dev, every person row opened). Target: Imaging ₹280.0L at both quarters (difference ₹0, P8 "not set"); Critical Care ₹185.0L → ₹195.0L (difference ₹10.0L = P8). Team plans (people rows added up): Imaging ₹65.0L → ₹65.0L (difference ₹0 = P8's ₹0.0L; Basheer K ₹55.0L and Rudrappa ₹10.0L at both quarters); Critical Care ₹116.0L (Arun Adarsh 50, Vivek 66) → ₹186.0L (Arun Adarsh 80, Vivek 96, Nishad K V 10), difference ₹70.0L = P8. Won "—" at Jan–Mar in every row, as reworded
5. [Complex: person rows, D78] Critical Care rows, columns "Year's
   target" / "Plan for year". **Expected:** Vivek ₹90 L / ₹96 L (the rejected ₹45 L
   counts as its last approved ₹30 L); Arun Adarsh ₹100 L / ₹80 L;
   Nishad K V ₹85 L / ₹10 L. Opening each row (the arrow, "Show
   details") shows "Target so far" / "Rep Plan so far" by quarter:
   Vivek ₹90 L / ₹66 L by Oct–Dec, ₹90 L / ₹96 L by Jan–Mar; Arun Adarsh
   ₹100 L / ₹50 L, then ₹100 L / ₹80 L; Nishad K V ₹85 L / ₹0 L, then
   ₹85 L / ₹10 L. — Pass, 2026-10-28 (Claude, read only, as Haroon, Dev). Row figures ("Year's target" / "Plan for year"): Vivek ₹90.0L / ₹96.0L, Arun Adarsh ₹100.0L / ₹80.0L, Nishad K V ₹85.0L / ₹10.0L; Haroon — / ₹0.0L. Opened rows as expected; Nishad K V's Oct–Dec "Rep Plan so far" reads ₹0.0L (plan said "none"; reworded, Basheer 2026-10-28)
6. [Simple] **Expected:** the Jul–Sep 2026 plans (Haroon ₹80 L and ₹120 L,
   Vivek ₹65 L) are in no FY 2026-27 total (D66). — Pass, 2026-10-28 (Basheer; Claude had read the totals: Critical Care ₹116.0L, Imaging ₹65.0L, Haroon ₹0.0L in both)
7. [Simple] Company row. **Expected:** one row, not one per quarter.
   Target ₹465 L (Imaging ₹280 L + Critical Care ₹185 L), Team plans
   ₹181 L, PO ₹16 L, Won ₹34 L, as in P8's Oct–Dec Company row. — Pass,
   2026-10-28 (Claude, read only, as Haroon, Dev): Year view Company row
   ₹465.0L / ₹181.0L (39 %) / PO ₹16.0L / Won ₹34.0L (7 %), same under
   Imaging and Critical Care. Reworded (Basheer, 2026-10-28): the old
   wording expected ₹475 L at Jan–Mar, but the Year view has one Company
   row, not one per quarter
8. [Simple] Move to FY 2027-28. **Expected:** counts from April (D31);
   Apr–Jun 2027 plans Arun Adarsh ₹30 L, Nishad K V ₹10 L, Vivek ₹30 L;
   targets "Not set" in the quarter-by-quarter table and "Target not set"
   in the SBU row; nothing from FY 2026-27 carried over. — Open, 2026-10-28 (Basheer and Claude, Critical Care, Dev): plans Arun Adarsh ₹30.0L, Vivek ₹30.0L, Nishad K V ₹10.0L; every quarter's Target "Not set", other columns "—"; every person's Year's target "—", nothing carried over. No SBU or Company row appears in FY 2027-28 (code builds them only from counted quarters, service.py:1232–1235; the design doesn't say what an upcoming year shows). Left open until Plan & Chore decides: keep as is (proposed wording: "no SBU or Company row in an upcoming year") or show an SBU row "Target not set" (Basheer, 2026-10-28)
9. [Complex: team row as an Area Manager] As Fazal, Year view.
   **Expected:** "Your team" against ₹160 L at both quarters; Fahad's row
   shows target ₹140 L; no SBU or Company row. —
10. [Simple] Hide-check: as Fazal, no Shruthi or Rudrappa row; ₹280 L
    nowhere. —
11. [Simple] As Fahad (rep), Year view. **Expected:** his own row only,
    target ₹140 L. —
12. [Simple] As Haroon, back to the Quarter view. **Expected:** every
    figure as at P8. —
13. [Simple] As Haroon, Year view, Imaging (D79). **Expected:** no
    "Expected" or "Likely finish" figure, no zone table and no brand
    table; switching to the Quarter view shows all four again. —
14. [Simple] Same screen (D80). **Expected:** no red "past closing date"
    note beside any name in the Year view, even for a person whose row
    shows one in the Quarter view for Oct–Dec 2026. —
15. [Simple] Year view arrows. **Expected:** right arrow → "FY 2027-28",
    left arrow twice → "FY 2025-26" with the note "Targets start in
    Oct–Dec 2026, so this year has nothing to count"; switching back to
    the Quarter view then shows Oct–Dec 2025 (the same quarter, in the
    year being looked at). —
16. [Complex: phone layout, D77] Phone width, as Haroon, Target vs
    Actuals card header, in both views. **Expected:** three lines — the
    title; the SBU and Quarter/Year boxes; the period with its two arrows
    across the card's full width; nothing runs past the card's edge. On a
    computer the header stays on one line. —

## J — Plan notifications on the bell (D18–D21, D69)

Saves are "Basheer clicks, Claude watches". Bell counts are compared with
P7.

1. [Complex: save, then check another user's bell] As Fahad, Target &
   Coverage Planning, Imaging, Oct–Dec 2026: "Plan", the P7 hospital
   ₹20 L, SonoScape ₹20 L → "Save draft". **Expected:** Fazal's bell
   unchanged (a draft isn't submitted). —
2. [Complex: cross-user] Fahad: "Continue" → "Submit for approval".
   **Expected:** Fazal's bell +1: "Fahad submitted a plan for Oct–Dec
   2026". Haroon's and Abdul Latheef P's bells unchanged (D18). —
3. [Complex: click-through] As Fazal, click it. **Expected:** Target &
   Coverage Planning opens on Oct–Dec 2026 at Fahad's plan, with "Approve"
   and "Reject"; the badge drops by one (D21). —
4. [Complex: cross-user] Fazal: "Reject" → pop-up "Reject Fahad's plan?",
   "Note (optional)" "Add one more hospital" → "Reject". **Expected:**
   Fahad's bell +1: "Fazal rejected your plan for Oct–Dec 2026", no note
   in the bell (D19); clicking opens his Oct–Dec 2026 plan, which shows
   the note. —
5. [Complex: cross-user] As Fahad: "Revise", ₹25 L, "Why did the plan
   change?" "Added a second hospital" → "Submit for approval".
   **Expected:** Fazal's bell +1: "Fahad submitted a plan for Oct–Dec
   2026", no note in the bell (D18). —
6. [Complex: cross-user] Fazal: "Approve" → pop-up "Approve Fahad's
   plan?", note "OK" → "Approve". **Expected:** Fahad's bell +1: "Fazal
   approved your plan for Oct–Dec 2026", no note in the bell (D19). —
7. [Complex: an Area Manager's plan goes to the GM] As Nishad K V: revise
   the Jan–Mar 2027 ₹10 L plan to ₹12 L, note "Second hospital added".
   **Expected:** Haroon's bell +1. Haroon approves. **Expected:** Nishad K
   V's bell +1. —
8. [Complex: no manager, D18, D69] As Haroon: Imaging, Oct–Dec 2026, a
   plan for the P7 hospital, ₹30 L; submit. **Expected:** no one's bell
   changes, Abdul Latheef P's included. As Abdul Latheef P, approve it
   from the approval list. **Expected:** Haroon's bell +1 (D19). —
9. [Simple] As Haroon (not Vivek's manager), approve Vivek's Oct–Dec 2026
   ₹66 L plan. **Expected:** Vivek's bell +1; Arun Adarsh's unchanged. —
10. [Simple] Every plan notification reads quarters as months ("Oct–Dec
    2026"), never "2026-Q3". —
11. [Complex: three old destinations] Haroon clicks the P7 Opportunity
    notification; Nishad K V the lead one; Basheer K the comment one.
    **Expected:** each opens as today (the Opportunity, the lead queue,
    the comment). —
12. [Simple] Hide-check: as Rudrappa and as Shruthi, none of Fahad's plan
    notifications. —

## K — Brand Target Tracking: billing and hand-typed quarters (D37, D54, D68, D70–D73)

1. [Simple] As Haroon, 2026, open SonoScape's line. **Expected:** "Brands
   Billing to Cabio" ₹100 L in each of Jan–Mar, Apr–Jun, Jul–Sep and
   Oct–Dec 2026 (D68), beside the seasonal targets: ₹280 L in Oct–Dec,
   none before (D46a). —
2. [Simple] EDAN. **Expected:** billing ₹50 L a quarter (its own ₹200 L,
   not the stretched ₹300 L). —
3. [Simple] Medion ("Apr 2026–Mar 2027"). **Expected:** billing ₹25 L in
   each of Apr–Jun 2026 … Jan–Mar 2027. —
4. [Complex: look for an edit the screen shouldn't offer] **Expected:** no
   way to type or change a billing figure (D54, D70). —
5. [Complex: save, read back, put back] Maquet's line → "Revise" →
   "Brand's own yearly figure (₹ Lakhs)" ₹100.01 L → "Save". **Expected:** billing ₹25.00, ₹25.00, ₹25.00, ₹25.01. Put it back
   to ₹100 L; save. **Expected:** ₹25 L each; Oct–Dec target back to
   ₹25 L. —
6. [Complex: save, then check another screen] Medion, Jan–Mar 2027 →
   "Change" → pop-up "Medion · Jan–Mar 2027", "Target for this quarter
   (₹ Lakhs)" ₹20 L → "Save". **Expected:** Jan–Mar ₹20 L marked "changed by
   hand"; Medion's line still ₹100 L / 0 % / ₹100 L, nothing extra (D72);
   Target & Coverage Planning, Critical Care, Jan–Mar 2027 target ₹20 L. —
7. [Simple] **Expected:** quarters before Oct–Dec 2026 have no "Change"
   button; Oct–Dec 2026 and later do (D70). —
8. [Complex: save, read back] Medion's own figure → ₹120 L; save.
   **Expected:** Oct–Dec 2026 ₹48 L; Jan–Mar 2027 stays ₹20 L, still
   marked (D71); billing ₹30 L a quarter. Put it back to ₹100 L; save.
   **Expected:** Oct–Dec ₹40 L, Jan–Mar still ₹20 L. Type Jan–Mar back to
   ₹10 L; save. **Expected:** ₹10 L, still marked (D73). —
9. [Simple] Hide-check: as Basheer K and as Fazal, no Brand Target
   Tracking in the menu; "Brands Billing to Cabio" nowhere. —
10. [Complex: phone layout] Phone width, as Haroon, Brand Target
    Tracking, 2026, Critical Care. **Expected:** each brand is a card
    titled with its name and year (e.g. "Maquet · Jan–Dec 2026", "Medion ·
    Apr 2026–Mar 2027"), with lines "Own figure: ₹100.0L", "Stretch: 0%",
    "Stretched target: …" and a "Revise" (or "Set target") button; opening
    Medion shows each quarter as its own block (Target, Brands Billing to
    Cabio, Team committed, Gap), with "Change" beside Oct–Dec 2026 and
    Jan–Mar 2027; nothing runs past the card's edge. On a laptop the
    brands and quarters stay tables. (Found by Basheer at P6, 2026-10-25;
    re-worded 2026-10-28 for the MUI card layout, read from
    `BrandTargetTrackingScreen.tsx`.) —

## L — Phone, tablet and laptop look of the redone screens (Part 2 screens plan D5, D7)

Basheer runs these by eye, at 390, 768 and 1280 px (phone, tablet,
laptop). Claude measures in the browser only if Basheer sees something
wrong, or for a step that can't be judged by eye (step 10's widths) —
Basheer, 2026-10-29, to save usage credits. When Claude measures, any
element inside a card with `scrollWidth > clientWidth` runs past it. No
step saves anything. Screen names and wording read from the code on
2026-10-28; the Part 2 screens plan (D3) lists what is in scope.

1. [Complex: all three widths] Target & Coverage Planning, as Haroon: SBU
   Target box, Team Targets (quarter and annual), Team Plans.
   **Expected:** on a phone each person is a card, pushed in under their
   manager; on tablet and laptop tables, with the row under the mouse lit
   on a laptop. —
2. [Complex: phone] Open a plan from Team Plans. **Expected:** its
   hospitals show as lines inside the person's card, not cards inside a
   card. —
3. [Complex: pop-ups, all widths] Open the plan pop-up and the
   approve/reject pop-up (no save). **Expected:** each fills the phone
   screen; the laptop shows a normal pop-up. —
4. [Complex: all three widths] Rate Hospitals. **Expected:** on a phone
   the search is on its own line with 🔍 and an ✕ once typed in, "Zone"
   and "Rating" are on line 2, and each hospital is a card with its notes
   and Save. —
5. [Complex: all three widths] The zone picker in Rate Hospitals, in
   Opportunity Pipeline's filter, in Customer Directory's filter and in
   the Add Hospital pop-up (no save). **Expected:** the same look
   everywhere, name above and "All Zones" inside the filters. —
6. [Complex: pop-ups, all widths] Brand Target Tracking: the "Revise"
   pop-up and a quarter's "Change" pop-up (no save). **Expected:** full
   screen on a phone. —
7. [Complex: all three widths] Target vs Actuals card, Quarter view then
   Year view. **Expected:** each person is a card on a phone; the "SBU
   total" card is bold on a phone. —
8. [Complex: all three widths] The five report screens that share the
   report display pieces — On Hold, Pipeline Report, Product Performance,
   Sales Report, Stagnant Opportunities — and Insights Dashboard.
   **Expected:** each looks right, nothing past the edge. —
9. [Simple] **Expected:** the side menu entry and page title read
   "Stagnant Opportunities"; no "deal" on the Sales Report, Pipeline
   Report, Stagnant Opportunities or Insights Dashboard (D11). —
10. [Complex: all three widths] The notification bell. **Expected:** on a
    phone the list is 358 px wide at 390 with even 16 px edges; 320 px on
    tablet and laptop; the red dot sits on the bell's top-right corner. —
11. [Complex: a pop-up from outside these screens] Customer 360's edit
    hospital pop-up (no save). **Expected:** full screen on a phone. —
