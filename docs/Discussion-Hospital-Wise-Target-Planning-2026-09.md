# Discussion: Hospital-Wise Target Planning — 2026-09-25

**Status:** Design direction decided (Design C, below). Some questions are
still open (section 5). Not yet a build plan: once section 5 is settled, this
becomes `docs/Hospital-Wise-Target-Planning-Implementation-Plan.md`.
**Participants:** Basheer (decisions), Claude (options and analysis).
**Origin:** the 2026-09-24 demo to Latheef Bhai and Haroon (Progress-Archive
entry "2026-09-25 — Demo follow-up: leadership requests recorded").
**Traceability rows:** 6.1 Beat Planning (Not started), 3.2 actual-vs-target
dashboards (Partial), 1.2 Account Segmentation and 1.3 Customer Tiering (Not
started). See `docs/Signed-Requirements-to-PRD-Traceability.md`.

## 1. Summary

Today each salesperson types one quarterly target (say ₹100 lakhs) and splits
it by brand. Leadership wants that number to come from real customers instead:
the salesperson lists the hospitals in their area, rates how much business each
can bring (**Business Potential: High / Medium / Low**), and plans an amount and
a visit frequency for each. **The hospital amounts add up to become the quarterly
target.** The brand split stays as it is, on top of that total. The manager
approves the whole plan once.

Hospital targets roll up to Zone, SBU and company level. During the quarter,
each salesperson's actual sales are tracked against the hospital-wise plan on
the Insights Dashboard.

The goal is to start Oct–Dec quarter planning in the system within about a
week. That deadline shapes the phasing in section 6.

## 2. What leadership asked for (2026-09-24 demo)

- During coverage planning, record each hospital's revenue potential, in
  addition to visit frequency. Named **Business Potential**, High / Medium /
  Low. It replaces "Tier" (see `docs/Customer-Tiering-Implementation-Plan.md`).
- Divide each salesperson's quarterly target among the hospitals in their
  coverage area according to that potential, so the target is realistic
  rather than "a hypothetical number handed down by their manager".
- Roll hospital-wise targets up to Zone, SBU and company level.
- Show each salesperson's actuals against the target they planned, on the
  Insights Dashboard (Haroon).

## 3. The options considered

The core question: a person's quarterly target is already split **by brand**
(built and tested 2026-09-23). It will now also be split **by hospital**. How
do the two relate?

| | Design | What the salesperson does | Gives | Costs |
|---|---|---|---|---|
| A. Light | Two independent splits of the same total | Lists hospitals with an amount each. Separately splits the same total by brand. | Hospital-wise and brand-wise targets, both rolled up, each with actuals | Can't answer "how much GE business do we expect from Aster?" |
| B. Heavy | One hospital × brand grid | Enters an amount for every hospital-and-brand pair (10 hospitals × 3 brands = 30 numbers a quarter) | Every combination | Heavy data entry each quarter, mostly wasted in Imaging (one main brand). Adoption risk. |
| **C. Chosen** | Design A, built from the hospitals up, on one screen | One quarterly plan: pick hospitals from own territory (Business Potential shown), enter visit frequency and expected amount for each. The amounts **add up to the quarterly target**. Then split that total by brand, as today. One manager approval. | What leadership described: target built from real customers | Target Planning and Coverage Planning merge into one screen; the Target Planning already built is reshaped |

## 4. Decisions (Basheer, 2026-09-25)

1. **Design C.** One quarterly plan per person per SBU. The hospital amounts
   add up to the target, the brand split sits on top, and there is one
   approval.
2. **Business Potential guides; it doesn't dictate.** The rating is shown
   beside each hospital while planning, with a gentle warning when a High
   hospital has ₹0 planned. There is no hard rule (e.g. "High hospitals get at
   least X%").
3. **Deals won at hospitals outside the plan still count.** They add to the
   salesperson's actuals and appear on their own "unplanned" line, so nobody
   is penalised for a surprise win, and managers can see how much business
   came from outside the plan.
4. **No existing plans to migrate.** Brand-level Target Planning hasn't been
   rolled out to UAT, so no one has planned a quarter in the system yet.
   Design C can replace the current screen outright; no old plans need
   converting.
5. **One Business Potential rating per hospital**, not one per SBU. Revisit if
   hospitals turn up whose potential differs a lot between Imaging and
   Critical Care. (This answers open question 2 in the Customer Tiering plan.)
6. **Target date:** roll out Target and Coverage Planning to the team within
   about a week (around 2 Oct 2026), so Oct–Dec (FY quarter 2026-Q3) planning
   happens in the system.

## 5. Still open

Each of these changes what gets built, so they should be answered together:

1. **Who rates Business Potential, and who can see the notes?** The Customer
   Tiering plan assumed Latheef Bhai sets it. But under Design C a salesperson
   needs a rating on every hospital before planning, and there are 100–300
   hospitals to rate within the week. Options: (a) Latheef Bhai/management
   only; (b) the salesperson proposes, management confirms; (c) anyone in that
   zone can set it. Also: can salespeople read the notes? They may contain
   sensitive remarks. *Suggestion:* (b), with Not Classified hospitals still
   plannable, so planning isn't blocked while ratings are pending.
2. **People without their own hospitals.** Admin and GM set per-SBU targets
   today, and SBU and Area Managers may not personally cover hospitals. Do
   they keep a typed target, or is theirs simply the roll-up of their team's
   plans? *Suggestion:* managers and above see a roll-up and don't type a
   number. Anyone who also sells personally plans their own hospitals like a
   salesperson.
3. **The same hospital in two plans.** Two people can plan the same hospital:
   one Imaging and one Critical Care rep (fine), or two reps of the same SBU
   (e.g. a shared account). Does the roll-up double-count, or should the
   second person be blocked or warned? *Suggestion:* allow it with a warning
   for the same SBU, since the existing rule already allows several reps to
   own separate deals at one hospital.
4. **What counts as "actuals" for a hospital.** Suggested: the value of deals
   won at that hospital during the quarter, credited to the deal owner, the
   same way the current Sales Report counts. A deal whose revenue is split
   between people follows whatever the reports settle on (Backlog entry
   "Reports never implement split-weighted attribution").
5. **Is the strategic objective per hospital still required?** The 2026-09-11
   Coverage Planning design requires a written objective for every hospital.
   With 20–40 hospitals per person, that's a lot of writing in week one.
   *Suggestion:* optional.
6. **Can a plan change mid-quarter?** For example, adding a hospital after a
   surprise enquiry. *Suggestion:* yes, and any change sends the plan back
   for re-approval, the same as Target Planning today.

## 6. Delivering within a week — suggested phasing

The one-week window is tight. Beyond the new build, rolling out to UAT
depends on promoting a large backlog of already-built work (`origin/uat` was
83 commits behind `main` on 2026-09-24, on hold waiting for leadership's list
of features to park — `docs/Backlog.md`, "main → UAT promotion").

**Needed by about 2 Oct, so planning can start:**
- A Business Potential rating and notes on each hospital record.
- The merged quarterly plan screen: pick hospitals, see each one's
  potential, enter frequency and amount; the total becomes the target; split
  it by brand; one approval.
- Managers' roll-up of their team's plans (plan figures only).
- Promotion of the pending work to UAT, including this.

**Can follow in October, while the quarter runs:**
- Actual-vs-plan on the Insights Dashboard, by hospital, person, Zone, SBU
  and company. Sales only start coming in once the quarter begins, so this
  isn't needed on day one.

**Fallback if the week slips:** roll out the current Target Planning with the
brand split as-is for Oct–Dec, and add the hospital layer later in the
quarter. The catch: people would type a total first and then have to make
their hospital amounts match it, which is the opposite of Design C's
"hospitals first". Decide this by around 29 Sep if the build isn't on track.

**Environments:** everything is built and tested on Dev first. Only the
finished feature goes to UAT, where the team does real planning.

## 7. What this changes in existing work

- **Target Planning** (built, in Dev): the typed total becomes the sum of
  the hospital amounts for anyone with a hospital list. The approval flow is
  kept as it is.
- **Brand-Level Target Planning** (built, in Dev): kept as it is. It still
  must add up to the total; the total now comes from the hospitals.
- **Coverage Planning plan (2026-09-11):** superseded by this design. Kept
  from it: territory-restricted hospital picking, visit frequency and the
  quarterly cadence. Dropped: a separate coverage approval.
- **Customer Tiering plan:** narrows to the Business Potential rating plus
  notes, one per hospital (decision 5). Its other open questions (size vs
  A/B/C/D, hospital groups, who sets and sees it) remain; the last is
  question 1 above.
- **Business rules:** BR-PL-02 and BR-PL-03 need rewording once this is
  final (a coverage plan no longer follows an approved target; they're one
  plan).

## 8. Technical addendum

- **Existing tables** (`docs/Physical-Schema.sql`): `target_plan`
  (user, SBU, period, `target_amount_lakhs`, status/approval),
  `target_plan_brand_split`, `coverage_plan` (user, `target_plan_id`,
  period; no RLS, no status) and `coverage_plan_entry` (`account_id`,
  `strategic_objective` NOT NULL, `target_revenue_lakhs`,
  `coverage_frequency` varchar(50); the planned reference table was never
  built). Unique `(coverage_plan_id, account_id)`.
- **Design C shape:** keep `target_plan` as the single approved aggregate.
  Either hang entries directly off it (a `target_plan_account` child table)
  or keep `coverage_plan` strictly 1:1 with `target_plan` (a unique FK) and
  drop its independent lifecycle. For users with entries,
  `target_amount_lakhs` = `SUM(entry.target_revenue_lakhs)`, maintained by the
  service with a DB trigger/constraint as backstop. Brand-split validation is
  unchanged: it sums to `target_amount_lakhs`. Choose between the two at
  implementation-plan time; the first is simpler with no users on it yet.
- **Business Potential:** columns on `account`, `business_potential`
  (HIGH/MEDIUM/LOW/NOT_CLASSIFIED, CHECK constraint) and
  `business_potential_notes`, plus set-by/set-at. One per account
  (decision 5). `account` has no RLS today; note visibility is handled in
  the response schema if restricted (question 1).
- **Territory restriction:** the account's `zone_id` must fall within the
  planner's `user_zone` descendants via `zone_closure` (decided 2026-09-11),
  checked in the service.
- **Actuals:** won opportunities by `account_id` within the quarter's
  `closed_at` range, owner-attributed. Unplanned accounts are grouped
  separately (decision 3).
- **Process:** migration applied to Dev with `alembic current` recorded,
  `Physical-Schema.sql` regenerated, `/code-review` at high (approval
  workflow + RLS), a written manual E2E plan checked against live Dev data,
  then Traceability and the scorecard.
