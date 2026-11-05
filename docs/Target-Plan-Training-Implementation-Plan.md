# Target and Plan Training for Haroon's Team — Implementation Plan

**Status:** Draft, 2026-11-05.
**Traceability rows:** none; training, no app change in this plan. The fixes in step 4 of the order get their own short plan.
**Design / discussion:** `docs/Progress-Archive-2026-11.md`, 5 Nov. Picture: https://claude.ai/artifact/KGBPpfiLUw8n39LTBbqCnd

## Decisions

- Order: dry run, fix blockers, Session 1, build the four fixes, Sessions 2a and 2b, UAT move, Session 3 — Basheer, 2026-11-05
- Before the dry run: one-page step list, and the picture corrected with the changes shown first — Basheer, 2026-11-05
- The dry run follows Critical Care (Haroon → Arun Adarsh → Vivek), because Imaging has one brand on Dev and the brand split can't be shown — proposed
- The dry run uses calendar year 2028 and the quarter Oct–Dec 2028, which hold no Dev data and which no test uses — proposed
- Whether to add Naeem and Gopika pv to Dev is decided after the dry run, before Session 2a — proposed
- The picture carries the label "For Haroon and Latheef Bhai only" — proposed

## Figures and sources

- Dev people, zones, hospital counts, brands, targets and plans — Dev query as Haroon Sidheeq (GM), 2026-11-05, all three settings verified, rolled back
- UAT team list — UAT query with Basheer's go-ahead, 2026-11-05
- Oct–Dec 2028 = 2028-Q3 — `scripts/quarter.py`
- Every amount in the step list, and 15/20/30/35 as the 2028 pattern — made-up example
- Three Chrome profiles — counted from the step list: Haroon, Arun Adarsh, Vivek
- About 45 minutes for the dry run — estimate, not counted
- Irfan possibly leaving — Basheer, 2026-11-05; to be confirmed with Haroon

## 1. In plain terms

The dry run is Basheer doing every step of the chain on Dev, on his laptop, signed in as three people, before anyone else sees it. Claude can't see his screen: Basheer reports what each step shows, Claude checks the code or Dev data and logs each problem. Anything that would stop Session 1 is fixed before it; everything else waits for the four fixes.

**Dev differs from UAT in ways the sessions will show.**
- On UAT, Fazal has two reps, Fahad and Gopika pv. On Dev he has only Fahad.
- Naeem isn't on Dev.
- Basheer K is an SBU Manager on Dev, so Haroon's Imaging list shows Basheer K beside Fazal and Shruthi. UAT has no SBU Manager.
- Imaging has one brand on Dev, SonoScape.

**Irfan.** Irfan reports to no one on UAT, so Haroon's Imaging list on Team Targets will include Irfan until the login is deactivated or given a manager. Basheer is checking with Haroon. This matters only from the UAT move onwards, as Irfan isn't on Dev.

### On a phone

No screen changes.

## 2. Build order

### Before starting
- One Chrome profile each for Haroon, Arun Adarsh and Vivek, all signed in to Dev.
- No test runs on Dev during the dry run. Any login untouched for 60 minutes signs itself out.

### Dry run step list (all amounts made up)

**Haroon — Brand Target Tracking, Critical Care, year 2028**
1. Seasonal pattern for 2028: 15, 20, 30, 35. Save.
2. EDAN, Set target: own figure ₹400 L, stretch 25%. Expected: stretched target ₹500 L; Oct–Dec 2028 ₹175 L.
3. Maquet, Set target: own figure ₹200 L, stretch 50%. Expected: stretched target ₹300 L; Oct–Dec 2028 ₹105 L.

**Haroon — Target & Coverage Planning, Critical Care, Oct–Dec 2028**
4. My Targets. Expected: Critical Care SBU target ₹280 L.
5. Team Targets: Arun Adarsh ₹160 L, Nishad K V ₹120 L. Expected: total ₹280 L, no warning.

**Arun Adarsh — Target & Coverage Planning**
6. My Targets. Expected: ₹160 L.
7. Team Targets: Vivek ₹100 L. Expected today: a warning that it is ₹60 L short (known, fix 1).

**Vivek — Target & Coverage Planning**
8. My Targets. Expected: ₹100 L.
9. My Plans: new plan for Oct–Dec 2028 with two hospitals, ₹60 L and ₹40 L. Brand split: EDAN ₹70 L, Maquet ₹30 L. Submit for approval.

**Arun Adarsh, then Haroon**
10. Arun Adarsh: the bell shows the plan; Needs Your Approval; Reject with a note.
11. Haroon, Brand Target Tracking: EDAN Oct–Dec 2028. Expected today: Team committed still ₹70 L (known, fix 4).

**Vivek, Arun Adarsh, Haroon**
12. Vivek: the bell shows the rejection; change the plan and submit it again.
13. Arun Adarsh: Approve.
14. Haroon: EDAN Oct–Dec 2028. Expected: Team committed ₹70 L, Gap ₹105 L.

**A manager's own share (the proposal, not yet decided)**
15. Arun Adarsh, My Plans: own plan ₹60 L, EDAN ₹40 L, Maquet ₹20 L. Submit for approval.
16. Haroon: Approve. Brand Target Tracking, EDAN: Team committed ₹110 L, Gap ₹65 L.

**Quick checks**
17. Target vs Actuals, Year view, FY 2028-29, as each of the three. Note what each person sees.
18. Vivek and Arun Adarsh: confirm Brand Target Tracking isn't available to them.
19. Haroon, Team Targets, Imaging: confirm Basheer K is listed beside Fazal and Shruthi.

**For every step, note:** a sign-in problem, a figure that differs, wording Haroon wouldn't follow, a missing person.

### After the dry run
Fix what blocks Session 1. Then Session 1, the four fixes, Sessions 2a and 2b, the UAT move, Session 3.

### Picture changes, shown to Basheer 5 Nov, waiting for his yes

"Targets Down, Plans Up" isn't republished until he answers. All figures stay made up. Steps 1, 2 and 7 stay as they are.

| Where | Now | Change to |
|---|---|---|
| Top note | Example only… | Add "For Haroon and Latheef Bhai only." |
| Step 3 sum | Fazal ₹160 L + Shruthi ₹120 L = ₹280 L | Fazal ₹160 L + Shruthi ₹70 L + Naeem ₹50 L = ₹280 L |
| Step 4 heading | Divides his own target among the reps who report to him. | Gives each rep a target and keeps the rest as his own selling share. |
| Step 4 figure | Fahad ₹140 L | Fahad ₹100 L |
| Step 4 sum | ₹20 L short of Fazal's ₹160 L, so the app warns him but still saves. | Fahad ₹100 L + Gopika pv ₹40 L = ₹140 L. Fazal's own share is ₹20 L, to be confirmed in this session. The app shows it as "short" today. |
| Middle line | Fahad now has a target. Next he plans how to reach it. | Fahad now has a target. Next comes the plan to reach it. |
| Step 5 heading | Lists his hospitals, each with an amount and how often he will visit. The amounts add up to the plan total. | Lists the hospitals, each with an amount and a visit frequency. The amounts add up to the plan total. |
| Step 5 figure and sum | Plan ₹140 L; Hospital A ₹80 L + Hospital B ₹60 L | Plan ₹100 L; Hospital A ₹60 L + Hospital B ₹40 L |
| Step 6 figure and sum | SonoScape ₹100 L; + other brands ₹40 L = ₹140 L | SonoScape ₹70 L; + other brands ₹30 L = ₹100 L |
| Step 8 figure and sum | Gap ₹75 L; ₹175 L − ₹100 L | Gap ₹105 L; ₹175 L − ₹70 L |

### The four fixes (built at step 4 of the order, own short plan)

All amounts are made up.
1. **Target & Coverage Planning, Team Targets:** a manager who keeps ₹20 L as their own share sees a warning that they are ₹20 L short. Show "Your own share: ₹20 L" instead.
2. **Target & Coverage Planning, My Targets:** a manager sees only their whole target, which invites a plan for all of it. Also show their own share.
3. **Target vs Actuals, Year view:** a manager's own row measures their own Won against the whole team target. Measure it against their own share.
4. **Brand Target Tracking:** Team committed still counts a rejected plan. Count nothing, or the last approved version if there is one.

Fixes 1–3 depend on Session 1's answer on a manager's own share. Fix 4 stands alone.

### Questions for Session 1 (Haroon's call)

- Does a selling manager's plan cover only their own share? Proposed yes: if Fazal's plan covered the whole team target, Team committed would count the reps' share twice.
- Who gets credit when a manager helps a rep close an Opportunity?

### Sessions after the dry run (proposed)

- **Session 1:** Haroon, Latheef Bhai and Basheer; Dev mock.
- **Session 2a, Imaging:** Haroon, Fazal, Shruthi, Naeem; Dev mock. **Session 2b, Critical Care:** Haroon, Arun Adarsh, Nishad K V; Dev mock. Basheer drives on Google Meet, each login in its own Chrome profile (three in Session 1's example steps, four for 2a, three for 2b).
- **Then** the UAT move and real targets.
- **Session 3:** one per Area Manager's team with a rep (Shruthi, Fazal, Arun Adarsh, Nishad K V), on UAT with real figures and own logins. Whether it's one per team is still Basheer's to confirm. Naeem has no reps on UAT.

## 3. What could be affected

- (a) Dev records stay. Mock targets and plans for 2028 remain on Dev and aren't removed.
- (b) Target vs Actuals, Year view: FY 2027-28 gains no mock target figure from Oct–Dec 2028, but the 2028 brand year also saves Jan–Mar 2028, which falls in FY 2027-28. Section L of the Annual Target E2E, still parked, should be re-read against this.
- (c) UAT: not touched.

## 4. Not in this plan (with reasons)

- The four fixes: they depend on Session 1's answers and get their own short plan.
- The UAT move: planned after Session 2.
- The shorter picture for Area Managers and the session guides: written after the dry run, so they reflect what it finds.

## 5. Business rules and records to update

None until Session 1 answers the question on a manager's own share. Then BR-PL-12 and the fixes' plan.

## 6. Technical addendum

- Dev query: session scratchpad `dev_dry_run_check.py`, tables per `docs/Physical-Schema.sql`.
- Haroon's list: `sbu_top_people`, `backend/app/domains/planning/repository.py:457-479` (reports to no one or to an Admin/GM; roles per line 39, which include SBU Manager).
- Brand year saves four quarters: `brand_year_quarters`, `backend/app/domains/planning/service.py:663`.
- No upper limit on year or quarter arrows: `BrandTargetTrackingScreen.tsx:387`, `TargetPlanningScreen.tsx:590`.
- Team Targets warning: `sales-os-app/src/components/TeamTargetsPanel.tsx:86-92`.
