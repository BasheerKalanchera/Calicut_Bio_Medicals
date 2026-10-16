# Discussion: Annual targets and the yearly planning cycle — 2026-10-15

**Status:** Answered. Q1–Q5 by Basheer 2026-10-15, Q2 and Q4 revised and
Q6–Q7 answered 2026-10-16. Decisions carried into
`docs/Annual-Target-Planning-Implementation-Plan.md` (D1–D10).
**Participants:** Haroon and Latheef Bhai (raised it at the 15 Oct demo),
Basheer (decisions), Claude (options and analysis).
**Origin:** feedback at the demo of 15 Oct 2026 (script:
`docs/Demo-2026-10-Haroon-Latheef.md`), passed on by Basheer the same day.
Traceability: signed row 3.1 ("Target splitting by product category,
quarterly/annual tracking") is marked Done, delivered as brand-wise
splitting; see Q7.

## 1. In plain terms

Cabio plans its year in two layers. At the start of the year, each brand
gives Cabio a yearly target. Cabio adds these up into the company's target
for the year, divides it into four equal quarters, and plans the first
quarter in detail while leaving the other three as single figures. At the
start of each later quarter, they review the quarter just finished and
plan the new one in detail.

The Sales OS today only knows quarters. Brand targets and the SBU target
are entered one quarter at a time, by hand, and are not connected to each
other. There is no yearly figure anywhere, and every quarter's plan is the
same detailed, hospital-by-hospital form.

The proposal adds the yearly layer: a yearly target per brand, an SBU
total that is the sum of its brands, an equal split into four quarters
that the GM can adjust, and reps planning in detail only for the current
quarter.

## 2. What they asked for

From the demo, 15 Oct 2026, as Basheer relayed it:

1. **Show the SBU's yearly total on Brand Target Tracking.** Today only
   the brand figures are entered and shown. The total of the brands is
   "the total Annual Target to chase for the company".
2. **The yearly total flows to Target & Coverage Planning** for the GM
   automatically.
3. **The GM spreads it across the four quarters** on Target & Coverage
   Planning, and managers see the quarterly figures and plan against them.
4. **Support their planning rhythm:** yearly planning at the start of the
   year (brand targets arrive from the vendors, divided into four equal
   quarters, first quarter planned in detail, the rest high level); at the
   start of each later quarter, review the last one and plan the new one
   in detail.

## 3. What exists today

Read from the code on 2026-10-15 (technical addendum has the references).

| Screen | What it holds | Who |
|---|---|---|
| **Brand Target Tracking** | One vendor target per brand **per quarter**, next to what the team has committed for that brand (the brand split of each submitted plan) and the gap. No SBU total, no yearly figure. | Admin, GM |
| **Target & Coverage Planning: SBU target box** | One SBU target **per quarter**, typed in by hand, not linked to the brand targets. Shown in the Quarter view only. | GM and Admin enter it; SBU and Area Managers see their own SBU's, read-only |
| **Target & Coverage Planning: plans** | Each person's plan per quarter, hospital by hospital, with a brand split, approved by their manager. | Everyone except Admin |
| **Target & Coverage Planning: Annual view** | A read-only total of the four quarterly plans. No SBU target. | Managers, GM |
| **Insights Dashboard → Target vs Actuals** | The quarter's SBU target against plans, PO received, Won and likely finish. | Managers, GM |

## 4. The gaps

1. **No yearly brand target.** A brand's yearly figure would have to be
   entered as four quarterly ones.
2. **No SBU yearly total.** Nothing adds the brand targets up.
3. **The SBU target doesn't come from the brands.** The GM types it
   separately each quarter, so the two can disagree.
4. **No split of the year into quarters.** Their equal four-way split, and
   later adjustments, have no home.
5. **Every quarter is planned in full detail.** There is no "high level
   until the quarter arrives".
6. **No link between "review the last quarter" and "plan the next one".**
   Target vs Actuals already shows how a past quarter finished; this may
   be enough without a new screen (section 5e).

## 5. The proposal

### 5a. Yearly brand targets, split into quarters (Q1)

On Brand Target Tracking, the GM enters each brand's yearly target once.
The app splits it into four equal quarterly figures, and the GM can
adjust any quarter. The per-quarter "brand vs committed" comparison keeps
working as today.

### 5b. The SBU yearly total comes from the brands (Q2)

Brand Target Tracking shows the SBU's yearly total, the sum of its brands.
That total becomes the SBU's yearly target on Target & Coverage Planning
automatically, following the brand total until the GM sets his own
figure, higher or lower; the brand total stays visible next to it.

### 5c. The GM spreads the year across quarters (Q3)

On Target & Coverage Planning, the SBU's yearly target starts as four
equal quarters. When the GM changes one quarter, the others don't move on
their own: the screen warns when the four quarters no longer add up to the
year, and the GM places the difference.

### 5d. Detailed plans for the current quarter only (Q4, Q5)

Reps are expected to plan hospital by hospital for the quarter that has
started (or is about to). A rep who already knows a later quarter may
plan it in detail too; nothing is locked. Reps see the SBU's yearly and
quarterly targets, read-only, while making their plan.

### 5e. The quarter review

No new screen proposed. At the start of a quarter, the review of the last
one uses Target vs Actuals (Previous quarter), and the detailed plan for
the new one uses Target & Coverage Planning as today.

## 6. Questions

**Q1. Brand targets: yearly, quarterly, or both?** Example (figures made
up): Mindray gives ₹400 L for the year. Option A: enter ₹400 L once; the
app splits it ₹100 L per quarter, each quarter adjustable. Option B:
yearly only, no per-quarter brand figure. *Answered (Basheer, 2026-10-15,
for now):* A.

**Q2. SBU target: the sum of the brands, or a separate GM figure?**
Example (made up): Imaging's brands add up to ₹1,200 L; may the GM set
₹1,300 L as a stretch? *Answered (Basheer, 2026-10-16):* the brand total
by default; the GM may set it higher (Haroon does mark SBU targets above
the vendors') or lower, the brand total shown next to it. It follows the
brand total until the GM sets his own figure (S2).

**Q3. When the GM changes one quarter, who absorbs the difference?**
Example (made up): Q1 goes from ₹300 L to ₹250 L — spread the ₹50 L over
the other quarters automatically, or the GM places it by hand? *Answered
(Basheer, 2026-10-15, for now):* by hand, with a warning while the
quarters don't add up to the year.

**Q4. What does "high level" mean for future quarters?** Option A: reps
enter one figure per future quarter and add hospital detail later. Option
B: reps do nothing for future quarters; only the GM's quarterly figure
exists until the quarter starts. *Answered (Basheer, 2026-10-16),
settled by S3:* reps are expected to plan the current quarter; detailed
planning of a later quarter stays available when a rep can see it.

**Q5. Do reps see the SBU target?** Managers already see their SBU's
quarterly target. *Answered (Basheer, 2026-10-15, for now):* yes, yearly
and quarterly, read-only.

**Q6. What happens to the current year, which is already half over?**
Today is in the third quarter of FY 2026-27 (Oct–Dec 2026). The next yearly
planning is April 2027, the start of FY 2027-28. Option A: use the yearly
layer from FY 2027-28 only; this year stays quarterly as entered. Option
B: enter this year's yearly brand targets too, so the Annual view shows
the full year. *Answered (Basheer, 2026-10-16):* A — this quarter
(2026-Q3) and next (2026-Q4) stay quarterly; the yearly layer starts FY
2027-28. The year is April–March, as set in the app and demoed on 15 Oct
without objection.

**Q7. Inside the signed contract, or new work?** Signed row 3.1 asks for
"quarterly/annual tracking" and is marked Done. *Answered (Basheer,
2026-10-16):* treat the yearly target layer as completing row 3.1's
"annual" part (Phase 1).

## 7. Size and order

- **Size (estimate, not measured):** a medium feature — database changes,
  Brand Target Tracking, Target & Coverage Planning and the Target vs
  Actuals figures; about the size of the Target vs Actuals build.
- **Existing figures:** quarterly brand and SBU targets already on Dev
  must fit the new yearly shape. Not counted yet (a read-only Dev check,
  shown first). UAT has no SBU targets yet (Target vs Actuals isn't on
  UAT).
- **Order (proposed):** move the six features from the 15 Oct demo to UAT
  first (the quarterly targets keep working), then build this, ready
  before the April 2027 yearly planning.

## 8. Next steps

1. Done 2026-10-16: all questions answered;
   `docs/Annual-Target-Planning-Implementation-Plan.md` drafted with them
   as D1–D10.
2. Next: Basheer answers the plan's proposed D11–D17; then its E2E test
   plan.

## 9. Related

- `docs/Plan-vs-Actuals-Tracking-Implementation-Plan.md` (SBU target, Target
  vs Actuals)
- `docs/Target-Coverage-Roster-Implementation-Plan.md` (quarter roster)
- `docs/Demo-2026-10-Haroon-Latheef.md` (the demo)
- `docs/Signed-Requirements-to-PRD-Traceability.md` row 3.1

## Technical addendum (for the record)

- `brand_vendor_target` and `sbu_target` are unique per (brand / SBU,
  `planning_period`) with a quarter-only check `^\d{4}-Q[1-4]$`
  (`docs/Physical-Schema.sql:427`, `:830`, `:1433`, `:1457`). No
  fiscal-year table exists.
- Brand Target Tracking: `sales-os-app/src/screens/BrandTargetTrackingScreen.tsx`
  — roles Admin and GM (`:34`); saves `planning_period: period` (`:79-83`);
  arrows step one quarter. "Committed" = sum of `target_plan_brand_split`
  over plans not in DRAFT (`backend/app/domains/planning/repository.py`,
  `get_brand_rollups`).
- Target & Coverage Planning: `sales-os-app/src/screens/TargetPlanningScreen.tsx`
  — `SbuTargetBox` rendered only when `!isAnnual` (`:604-607`); edit roles
  Admin and GM, view roles add SBU Manager and Area Manager (`:60-61`); the
  Annual view sums four per-quarter calls (`:305-343`).
- Quarters: `scripts/quarter.py` — 2026-Q3 = 01 Oct 2026 to 31 Dec 2026;
  2027-Q1 = 01 Apr 2027 to 30 Jun 2027.
