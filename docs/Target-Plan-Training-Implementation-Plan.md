# Target and Plan Training for Haroon's Team — Implementation Plan

**Status:** Draft, 2026-11-05.
**Traceability rows:** none; training, no app change in this plan. The fixes in step 4 of the order get their own short plan.
**Design / discussion:** `docs/Progress-Archive-2026-11.md`, 5 Nov. Session 1 deck (picture, guide, decisions waiting on Haroon): https://claude.ai/artifact/QrpyAogcd8fFc9uMs1Xf32. Earlier picture and guide: https://claude.ai/artifact/KGBPpfiLUw8n39LTBbqCnd

## Decisions

- Order: dry run, fix blockers, Session 1 with the app as it is, build the four fixes together with any changes Haroon suggests, Sessions 2a and 2b, UAT move, Session 3 — Basheer, 2026-11-05 and 2026-11-06
- Before the dry run: one-page step list, and the picture corrected with the changes shown first — Basheer, 2026-11-05
- The dry run follows Critical Care (Haroon → Arun Adarsh → Vivek), because Imaging has one brand on Dev and the brand split can't be shown — Basheer, 2026-11-06
- The dry run uses calendar year 2028 and the quarter Oct–Dec 2028, which hold no Dev data and which no test uses — Basheer, 2026-11-06
- Whether to add Naeem and Gopika pv to Dev is decided after the dry run, before Session 2a — Basheer, 2026-11-06
- The picture carries the label "For Haroon and Latheef Bhai only" — Basheer, 2026-11-06
- The Customer with No Activity E2E pauses for the dry run and Session 1, so no test runs on Dev during them; it no longer has to finish first, because Session 1 is the morning of 7 Nov — Basheer, 2026-11-06
- The mock 2028 figures are removed from Dev after the dry run and again after each mock session, by a script shown first — Basheer, 2026-11-06
- For training, the app header shows the signed-in person's name beside Sign Out at every window size; temporary, removed before the UAT move (Backlog "Temporary: name in app header for training") — Basheer, 2026-11-07
- Each mock login gets its own browser window: normal Edge, Chrome Incognito, normal Chrome, and Edge InPrivate when a fourth is needed. Chrome profiles dropped, because a new profile asked Basheer to sign in — Basheer, 2026-11-06
- A manager commits one figure for their whole target. A manager who sells lists their own hospitals plus one "My team" figure with a brand split; a manager who doesn't sell has only the figure and split. Reps plan their hospitals as today, and the manager approves them. Haroon approves each manager's figure, and Team committed counts those figures (Option 2, lighter form). Haroon also wants to see each rep's target and plan detail — Basheer, and Haroon by phone via Basheer, 2026-11-06. Confirmed again by Haroon at Session 1, with the example: Fazal commits one ₹160 L figure, his own hospitals for ₹20 L plus one "My team" line for the reps' ₹140 L, and Haroon approves that one figure — Basheer, 2026-11-07
- A manager commits first, then sets their reps' targets. This is the expected order, not a lock: the manager's approval by Haroon and the reps' target setting and plan approval by the manager run independently, and neither waits for the other. If Haroon rejects or changes a manager's figure later, reps' plans already approved stay approved; the manager sees any mismatch and decides whether to revise them — Basheer, 2026-11-06. Confirmed after Session 1: no lock, for now — Basheer, 2026-11-07
- A manager's figure below their target is allowed with a warning, and Haroon decides whether to approve it — Basheer, 2026-11-06. Changed at Session 1: a plan, a manager's or a rep's, can be below or above the target, and the approver decides. Haroon's case: a rep who missed the target in one quarter can plan above target in the next to make up the shortfall — Haroon via Basheer, 2026-11-07. The app says when a plan is above or below target, worded neutrally, not as a warning — Basheer, 2026-11-07
- When reps' plans don't match a manager's commitment, the manager sees it at once and Haroon sees it when he opens that manager's team — Basheer, 2026-11-06. Confirmed at Session 1: Haroon wants to see it too — Haroon via Basheer, 2026-11-07. It also shows on Haroon's list of managers (e.g. "Fazal: reps ₹10 L below"), so he needn't open each team; no bell alert — Basheer, 2026-11-07
- Moving an amount between reps with the team total unchanged needs no approval from Haroon. A change to the manager's total or brand split needs a note and his approval — Basheer, 2026-11-06. Confirmed by Haroon at Session 1 — Haroon via Basheer, 2026-11-07
- Target vs Actuals judges a manager mainly on the team's Won against their target, with their own Won shown separately — Basheer, 2026-11-06. Confirmed after Session 1 — Basheer, 2026-11-07
- When a manager helps a rep close an Opportunity, the credit stays with the rep unless they agree to split it; either way it counts towards the manager's team — Basheer, 2026-11-06. Confirmed after Session 1 — Basheer, 2026-11-07
- Haroon's own plan counts in Team committed alongside his managers' figures. Latheef Bhai, Admin in the system, approves it — Basheer, 2026-11-06. Confirmed after Session 1, where the approval step worked live — Basheer, 2026-11-07
- Team Plans gets a Target column, so Haroon sees each rep's target beside their plan — Basheer, 2026-11-06. Confirmed after Session 1; with decision 2, the row also says when a plan is above or below target — Basheer, 2026-11-07
- No commit date for now: nothing in the app and nothing in this plan, because it is over-engineering — Basheer, 2026-11-06
- No alert to Latheef Bhai for now: when Haroon submits a plan nobody gets the bell, as today (Annual Target plan D18, D69), and Latheef Bhai finds it in Needs Your Approval — Basheer, 2026-11-06

## Figures and sources

- Dev people, zones, hospital counts, brands, targets and plans — Dev query as Haroon Sidheeq (GM), 2026-11-05, all three settings verified, rolled back
- UAT team list — UAT query with Basheer's go-ahead, 2026-11-05
- Oct–Dec 2028 = 2028-Q3 — `scripts/quarter.py`
- Every amount in the step list, and 15/20/30/35 as the 2028 pattern — made-up example
- Three browser windows — counted from the step list: Haroon, Arun Adarsh, Vivek
- About 45 minutes for the dry run — estimate, not counted
- Irfan possibly leaving — Basheer, 2026-11-05; to be confirmed with Haroon
- Haroon has no manager; Abdul Latheef P is the only active Admin — Dev query as Abdul Latheef P (Admin), 2026-11-06, settings verified, rolled back. Not checked on UAT

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
- Normal Edge signed in to Dev as Haroon, Chrome Incognito as Arun Adarsh, normal Chrome as Vivek (signed in by Basheer, 6 Nov). Test first: refresh each window and check it still shows the right person. Closing the Incognito window signs that person out, so keep it open.
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

**A manager's own plan (how the app works today, before the fixes)**
15. Arun Adarsh, My Plans: own plan ₹60 L, EDAN ₹40 L, Maquet ₹20 L. Submit for approval.
16. Haroon: Approve. Brand Target Tracking, EDAN: Team committed ₹110 L, Gap ₹65 L.

**Quick checks**
17. Target vs Actuals, Year view, FY 2028-29, as each of the three. Note what each person sees.
18. Vivek and Arun Adarsh: confirm Brand Target Tracking isn't available to them.
19. Haroon, Team Targets, Imaging: confirm Basheer K is listed beside Fazal and Shruthi.

**For every step, note:** a sign-in problem, a figure that differs, wording Haroon wouldn't follow, a missing person.

### After the dry run
Dry run result: steps 1–19 passed, nothing blocks Session 1 (Basheer, 6 Nov); mock data removed the same day, counts in Progress-Archive 6 Nov. Next: Session 1, the four fixes, Sessions 2a and 2b, the UAT move, Session 3.

### The picture is now one slide (Basheer, 6 Nov)

Later on 6 Nov Basheer asked for a minimalist slide showing targets set top down and plans coming bottom up, so the eight steps below were replaced at the same link. The slide shows four levels with bars to one scale: SonoScape ₹280 L, which is also the Imaging target because Imaging sells only SonoScape (Basheer, 6 Nov); Fazal ₹160 L + Shruthi ₹70 L + Naeem ₹50 L = ₹280 L; Fahad ₹100 L + Gopika pv ₹40 L + Fazal's own share ₹20 L = ₹160 L. It follows the Option 2 decision: Fazal commits ₹160 L, and with every figure in there is no gap. All figures are made up. The table records the earlier version.

### Picture changes, approved by Basheer and published 6 Nov (earlier version)

"Targets Down, Plans Up" carried these changes. All figures stay made up. Steps 1, 2 and 7 stay as they are.

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
1. **Target & Coverage Planning, Team Targets:** a manager who passes on less than their target sees a warning that they are ₹20 L short. Show "₹20 L not passed on" instead.
2. **Target & Coverage Planning, My Plans:** a manager's plan gets one "My team" figure with a brand split, beside any hospitals of their own. **My Work, My hospitals** gets a message for a manager with no hospitals of their own.
3. **Brand Target Tracking, Target vs Actuals and Team Plans:** Team committed and the plan totals count each manager's figure and leave out their reps' plans, which stay visible. A manager's plan is measured against the team's Won. The manager's screen compares reps' plans with the commitment, brand by brand. Team Plans also gets the Target column.
4. **Brand Target Tracking:** Team committed still counts a rejected plan. Count nothing, or the last approved version if there is one. The app keeps only a plan's last approved total, not its last approved brand split (read in the code, 6 Nov), so counting the last approved version by brand needs the old split kept; the fixes' plan decides this.

Fixes 1–3 follow the Option 2 decision above. They are larger than first drafted. Fix 4 stands alone.

### Questions for Session 1 (Haroon's call)

None left: decided above, Basheer, 2026-11-06. Session 1 walks Haroon through those decisions.

### Sessions after the dry run (proposed)

- **Session 1:** morning of 7 Nov, ready by end of 6 Nov (Basheer, 6 Nov). Haroon, Latheef Bhai and Basheer (Basheer, 7 Nov). Dev mock. Sequence ends with Haroon submitting an own plan and Latheef Bhai approving it, live, in a fourth window (Edge InPrivate); these two steps weren't in the dry run (Basheer, 7 Nov). Picture, guide and the decisions waiting on Haroon: four-slide deck, https://claude.ai/artifact/QrpyAogcd8fFc9uMs1Xf32 (Basheer, 7 Nov).
- **Session 2a, Imaging:** Haroon, Fazal, Shruthi, Naeem; Dev mock. **Session 2b, Critical Care:** Haroon, Arun Adarsh, Nishad K V; Dev mock. Basheer drives on Google Meet, each login in its own browser window (three in Session 1's example steps, four for 2a, three for 2b).
- **Then** the UAT move and real targets.
- **Session 3:** one per Area Manager's team with a rep (Shruthi, Fazal, Arun Adarsh, Nishad K V), on UAT with real figures and own logins. Whether it's one per team is still Basheer's to confirm. Naeem has no reps on UAT.

## 3. What could be affected

- (a) Mock targets and plans for 2028 go onto Dev and are removed after the dry run and after Sessions 1, 2a and 2b. Dev's change history keeps a record of the deleted plans, targets and pattern. The dry run also added a 2028 seasonal pattern for Imaging by mistake (Basheer, 6 Nov); it goes in the same cleanup, so the first removal should count 2 patterns.
- (b) Target vs Actuals, Year view: FY 2027-28 gains no mock target figure from Oct–Dec 2028, but the 2028 brand year also saves Jan–Mar 2028, which falls in FY 2027-28. Section L of the Annual Target E2E, still parked, should be re-read against this.
- (c) UAT: not touched.

## 4. Not in this plan (with reasons)

- The four fixes: they get their own short plan.
- The UAT move: planned after Session 2.
- The shorter picture for Area Managers and the guides for Sessions 2a and 2b: written later. Session 1's guide is done (section 2).

## 5. Business rules and records to update

BR-PL-07, BR-PL-08, BR-PL-09, BR-PL-12 and the fixes' plan change with the Option 2 decision, when that plan is written.
## 6. Technical addendum

- Dev query: session scratchpad `dev_dry_run_check.py`, tables per `docs/Physical-Schema.sql`.
- Haroon's list: `sbu_top_people`, `backend/app/domains/planning/repository.py:457-479` (reports to no one or to an Admin/GM; roles per line 39, which include SBU Manager).
- Brand year saves four quarters: `brand_year_quarters`, `backend/app/domains/planning/service.py:663`.
- No upper limit on year or quarter arrows: `BrandTargetTrackingScreen.tsx:387`, `TargetPlanningScreen.tsx:590`.
- Team Targets warning: `sales-os-app/src/components/TeamTargetsPanel.tsx:86-92`.
- Haroon's submit alerts nobody: `_notify_submitted`, `backend/app/domains/planning/service.py:106-115`. The approval queue already includes no-manager plans for Admin/GM (`include_orphaned`, `repository.py:101-114`).
