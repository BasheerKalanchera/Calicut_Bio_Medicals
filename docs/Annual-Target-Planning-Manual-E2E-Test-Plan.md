<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# Annual Target Planning (Part 1) — Manual E2E Test Plan

**Covers:** `docs/Annual-Target-Planning-Implementation-Plan.md`, Part 1
(build steps 1–4). Part 2 gets its own sections later.
**Built:** not yet (filled in after the fact).
**Where:** Dev, after `/build` merges into `main` and migration 0062 is
applied. Replaces the 17 Oct on-hold version, which tested the withdrawn
yearly SBU figure (D4–D15, D22a).

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

Button labels, messages and the order of checks are taken from the code,
not the design doc. Nothing is built yet, so every label and message below
is a description; each is replaced with the built code's wording before
the run.

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

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives). Saves to Dev
are "Basheer clicks, Claude watches"; Claude reads the record back in the
app.

**Opportunities:** none named or created in this plan.

**Left on Dev permanently:** the 2026 brand figures, patterns and saved
brand quarters below (EDAN's ₹120 L replaced); Medion's year starting in
April; the Oct–Dec 2026 person targets. Shruthi's manager is put back to
Haroon in G7.

## Pre-flight

- P1. [Simple] Dev backend restarted since the feature's last backend change. —
- P2. [Simple] Dev's `alembic current` = 0062 (head), and
  `docs/Physical-Schema.sql` regenerated since. —
- P3. [Simple] Testers can sign in: Abdul Latheef P, Haroon Sidheeq,
  Basheer K, Fazal, Shruthi, Arun Adarsh, Nishad K V, Fahad, Rudrappa,
  Vivek. —
- P4. [Complex: read-only Dev query, shown first] Re-run the 21 Oct check
  (managers, roles, brand quarterly targets, plans; person targets
  expected none); update "Checked against live data" if anything moved. —
- P5. [Complex: before-record across two screens] As Haroon, before any
  save, note every figure on Target vs Actuals, Oct–Dec 2026 and Jul–Sep
  2026, Imaging and Critical Care; and on Brand Target Tracking,
  SonoScape's and EDAN's Oct–Dec 2026 committed and gap. **Expected:**
  Imaging Oct–Dec 2026 target not set; Critical Care Oct–Dec 2026 ₹120 L
  (EDAN only — the typed ₹150 L is gone, D55). —

## A — Brand Target Tracking by calendar year (D23–D25, D39–D43, D46, D46a, D48, D50)

1. [Simple] As Haroon, open Brand Target Tracking. **Expected:** moves by
   calendar year ("2026", year arrows, no quarter arrows); quarters read
   "Oct–Dec 2026", never "2026-Q3". —
2. [Complex: save, then read back after a reload] Imaging, 2026: pattern
   Jan–Mar 15, Apr–Jun 20, Jul–Sep 30, Oct–Dec 35; save. **Expected:**
   after a reload, the same four figures. —
3. [Simple] Change Oct–Dec to 25 (adds to 90) and try to save.
   **Expected:** refused, saying it must add to 100; cancel; saved pattern
   unchanged. —
4. [Complex: save, then read back] SonoScape ("SonoScape · Jan–Dec 2026"):
   own figure ₹400 L, stretch 100 %; save. **Expected:** stretched ₹800 L
   beside the own figure; Oct–Dec 2026 ₹280 L; Jan–Mar, Apr–Jun and
   Jul–Sep 2026 show no target (before Oct–Dec 2026, not saved, D46a). —
5. [Simple] SonoScape's Oct–Dec 2026 committed and gap. **Expected:**
   committed as at P5; gap = ₹280 L minus it. —
6. [Complex: save, then read back] Critical Care, 2026: pattern 20 / 20 /
   30 / 30; save. Then EDAN: own ₹200 L, stretch 50 %; save.
   **Expected:** stretched ₹300 L; Oct–Dec 2026 ₹90 L, replacing the
   ₹120 L typed earlier (D48). —
7. [Complex: a brand's own pattern] Maquet: own ₹100 L, stretch 0 %, own
   pattern 25 / 25 / 25 / 25; save. **Expected:** Oct–Dec 2026 ₹25 L;
   Maquet shown as using its own pattern. —
8. [Complex: year-start change, then save] Medion: "year starts in" →
   April; then own ₹100 L, stretch 0 %; save. **Expected:** shown under
   2026 as "Medion · Apr 2026–Mar 2027"; Oct–Dec 2026 ₹30 L, Jan–Mar 2027
   ₹20 L (pattern follows the months, D41); Apr–Jun and Jul–Sep 2026 not
   saved. —
9. [Complex: one save re-works several brands] Change Critical Care's 2026
   pattern to 10 / 20 / 30 / 40; save. **Expected:** EDAN Oct–Dec 2026 →
   ₹120 L; Medion Oct–Dec 2026 → ₹40 L, Jan–Mar 2027 → ₹10 L; Maquet stays
   ₹25 L (own pattern, D50). —
10. [Simple] Move to 2027. **Expected:** no brand has a figure (none sent
    yet, D42); Medion listed as "Apr 2027–Mar 2028". —

## B — SBU target box: the brands' total, read-only (D26, D34, D47, D53, D55)

1. [Simple] As Haroon, Target & Coverage Planning, Imaging, Oct–Dec 2026.
   **Expected:** SBU target ₹280 L; no way to type or edit it. —
2. [Simple] Critical Care, Oct–Dec 2026. **Expected:** ₹185 L (EDAN 120 +
   Maquet 25 + Medion 40). —
3. [Simple] Critical Care, Jan–Mar 2027. **Expected:** ₹10 L (Medion only;
   the typed ₹120 L is gone, D55). —
4. [Simple] Imaging, Jan–Mar 2027. **Expected:** target not set (D42). —
5. [Simple] Imaging, Jul–Sep 2026. **Expected:** as at P5. —
6. [Simple] As Basheer K (SBU Manager), Imaging, Oct–Dec 2026.
   **Expected:** SBU target ₹280 L, read-only (D26). —
7. [Simple] Hide-check: as Basheer K, Critical Care. **Expected:** no
   Critical Care SBU target (Basheer K's SBU is Imaging). —
8. [Simple] Hide-check: as Fazal (Area Manager), Imaging, Oct–Dec 2026.
   **Expected:** no SBU target box; ₹280 L nowhere on the screen (D34). —
9. [Simple] Hide-check: as Fahad (rep), Oct–Dec 2026. **Expected:** no SBU
   target box (D26). —

## C — Haroon divides the SBU target among the Area Managers (D33, D45)

1. [Complex: new panel, first look] As Haroon, Imaging, Oct–Dec 2026, Team
   targets panel. **Expected:** rows for Fazal, Shruthi and Basheer K, all
   blank, totalled against ₹280 L. Basheer K's row stays blank until
   section G: no one reports to Basheer K yet, and a figure there would
   count Shruthi's share twice (D57). —
2. [Complex: save with a warning] Fazal ₹160 L, Shruthi ₹100 L; save.
   **Expected:** saved; warning: ₹20 L short of ₹280 L. —
3. [Simple] Shruthi → ₹120 L; save. **Expected:** the warning goes. —
4. [Complex: save, then read back] Critical Care, Oct–Dec 2026: Arun Adarsh
   ₹100 L, Nishad K V ₹85 L; save. **Expected:** no warning (₹185 L); no
   Imaging people listed. —
5. [Simple] As Abdul Latheef P (Admin), Imaging, Oct–Dec 2026, Team
   targets. **Expected:** Fazal ₹160 L, Shruthi ₹120 L shown and editable
   (D45). No save. —

## D — Area Managers divide among their reps; "Your target" (D30, D33, D35)

1. [Simple] As Fazal, Imaging, Oct–Dec 2026. **Expected:** "Your target
   for Oct–Dec 2026: ₹160 L". —
2. [Complex: save with a warning, then read back] Fazal's Team targets:
   Fahad only; ₹140 L; save. **Expected:** saved; warning ₹20 L short of
   ₹160 L (left as is). —
3. [Complex: save, then read back] As Shruthi: "Your target" ₹120 L; Team
   targets: Rudrappa ₹100 L; save. **Expected:** saved; warning ₹20 L
   short. —
4. [Complex: save, then read back] As Arun Adarsh: "Your target" ₹100 L;
   Team targets: Vivek ₹90 L; save. **Expected:** saved; warning ₹10 L
   short. —
5. [Simple] As Nishad K V: "Your target" ₹85 L. **Expected:** Team targets
   shows no one (no reps report to Nishad K V). —
6. [Simple] As Fahad. **Expected:** "Your target for Oct–Dec 2026:
   ₹140 L"; no Team targets panel. —
7. [Simple] As Rudrappa: ₹100 L. As Vivek: ₹90 L. —

## E — Who must not see what (D23, D26, D34, D35)

1. [Simple] As Fahad: ₹160 L (Fazal's) and ₹280 L (Imaging) appear
   nowhere; no Brand Target Tracking in the menu. —
2. [Simple] As Fazal: Shruthi's ₹120 L and Rudrappa's ₹100 L appear
   nowhere; no Brand Target Tracking in the menu. —
3. [Simple] As Shruthi: Fazal's ₹160 L and Fahad's ₹140 L appear
   nowhere. —
4. [Simple] As Arun Adarsh: nothing from Imaging; Critical Care's ₹185 L
   appears nowhere (D34). —
5. [Complex: look for an edit the screen shouldn't offer] As Fazal: no way
   to change Fazal's own, Shruthi's or Rudrappa's target. —
6. [Simple] As Basheer K: no Brand Target Tracking in the menu (D23). —

## F — Target vs Actuals (Insights Dashboard) (D49, D55)

1. [Complex: every figure against P5] As Haroon, Oct–Dec 2026.
   **Expected:** Imaging target ₹280 L, Critical Care ₹185 L (brand
   totals, D55); Won and plan figures exactly as at P5. —
2. [Simple] Jul–Sep 2026. **Expected:** every figure as at P5. —
3. [Complex: team and rep rows] As Fazal, Oct–Dec 2026. **Expected:**
   "Your team" measured against ₹160 L (Fazal's own target, D49), not the
   SBU target; Fahad's row shows target ₹140 L beside the plan. —
4. [Simple] As Arun Adarsh, Oct–Dec 2026. **Expected:** team row against
   ₹100 L; Vivek's row shows target ₹90 L. —
5. [Simple] Hide-check: as Fazal, no Rudrappa row (as today). —
6. [Simple] Unchanged: as Arun Adarsh, Target & Coverage Planning,
   Critical Care, Oct–Dec 2026: Vivek's ₹66 L plan still waiting for
   approval. No action. —

## G — An SBU Manager sets the target: Shruthi reports to Basheer K (D32, D45, D57)

Dev has one test SBU Manager, Basheer K (Imaging); UAT and Cabio have
none yet. This checks the app is ready for one: Haroon gives Basheer K one
figure, and Basheer K divides it among the Area Managers reporting to
Basheer K (D57). Shruthi goes back to Haroon in G7.

1. [Complex: save on another screen, then read back] As Abdul Latheef P,
   User Directory, Shruthi: "Manager" Haroon Sidheeq → Basheer K; save.
   **Expected:** after a reload, Basheer K. —
2. [Complex: save, then read back] As Haroon, Imaging, Oct–Dec 2026, Team
   targets. **Expected:** Shruthi no longer listed; Fazal ₹160 L, Basheer
   K blank, ₹120 L short. Give Basheer K ₹120 L; save. **Expected:** total
   ₹280 L, no warning. —
3. [Complex: save, then read back as another user] As Basheer K, Team
   targets. **Expected:** "Your target for Oct–Dec 2026: ₹120 L" (D57);
   Shruthi listed with ₹120 L (set by Haroon in C); Fazal not listed.
   Change Shruthi → ₹130 L; save. **Expected:** warning ₹10 L over ₹120 L;
   as Shruthi, "Your target" ₹130 L. —
4. [Complex: cross-role] As Haroon. **Expected:** can still see Shruthi's
   ₹130 L and change it (D32), where the code puts that. No save. —
5. [Simple] Hide-check: as Fazal, Shruthi's ₹130 L and Basheer K's ₹120 L
   nowhere; no way to change either. —
6. [Simple] Hide-check: as Shruthi, Basheer K's ₹120 L and the SBU's
   ₹280 L nowhere. —
7. [Complex: save on another screen, then read back] As Abdul Latheef P,
   Shruthi's "Manager" back to Haroon Sidheeq; save. **Expected:** after a
   reload, Haroon Sidheeq. —
8. [Complex: two saves, then read back] As Haroon, Imaging Team targets.
   **Expected:** Fazal ₹160 L, Shruthi ₹130 L, Basheer K ₹120 L — ₹130 L
   over ₹280 L. Clear Basheer K's figure (or ₹0 if the screen can't clear)
   and set Shruthi → ₹120 L; save. **Expected:** the warning goes. —
9. [Simple] As Basheer K, Team targets. **Expected:** Shruthi no longer
   listed. —

## H — Month labels (D39)

1. [Complex: visual sweep of three screens] As Haroon: Brand Target
   Tracking, Target & Coverage Planning (SBU box, Team targets, "Your
   target", plan dialog, messages), Target vs Actuals. **Expected:**
   quarters read like "Oct–Dec 2026"; no "2026-Q3"-style code anywhere;
   "FY 2026-27" year labels unchanged. —
