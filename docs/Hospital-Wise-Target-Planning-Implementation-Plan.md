# Hospital-Wise Target Planning — Implementation Plan

**Status:** Approved 2026-09-27 (choices in section 3 answered by Basheer
the same day). Unblocked: the main → UAT move, including the Product
Catalog clean-up, was done 2026-09-27 (`docs/UAT-Promotion-2026-09-Plan.md`).
Build not started.
**Design and decisions:** `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`
(Design C; decisions 1–6 in section 4, answers to the open questions in
section 5). This plan doesn't repeat them; it says how to build them.
**Traceability rows:** 6.1 Beat Planning, 3.2 actual-vs-target dashboards,
1.3 Customer Tiering (Business Potential part only).
**Deadline:** in use on UAT around 2 Oct 2026, so Oct–Dec (2026-Q3)
planning happens in the system. Fallback decision point around 29 Sep
(discussion doc, section 6).

## 1. In plain terms

Today a salesperson types one quarterly number and splits it by brand. After
this change, they build the number from their hospitals instead:

1. Open **My Target**, pick the quarter, and add hospitals from their own
   area. Each hospital shows its Business Potential (High / Medium / Low /
   Not rated).
2. For each hospital, choose how often they'll visit and enter the amount they
   expect from it. A short objective can be added but isn't required.
3. The amounts add up to their target, shown live at the bottom. Warnings
   appear, without blocking anything, when a High hospital has ₹0, or when
   a colleague from the same SBU has also planned that hospital.
4. Split that total by brand, exactly as today.
5. Submit. It goes to their manager, who sees the hospitals, the amounts and
   the brand split, and approves or rejects it once.
6. Any later change needs a short note saying why, and goes back to the
   manager for approval again.

Admin and GM rate each hospital's Business Potential on a new **Rate
Hospitals** screen, one row per hospital, with notes that only Admin and GM
can see. Managers keep the team view they have today, which can now also
show each person's hospitals and the totals per zone.

**In two parts:**
- **Part 1, by about 2 Oct:** ratings, the new planning screen and the
  managers' view of plans. This is what's needed to start planning.
- **Part 2, during October:** plan-versus-actual on the Insights Dashboard
  ("won so far", "expected from active deals", "likely finish"). Sales only
  start coming in once the quarter begins, so this isn't needed on day one.

**Environments:** built and tested on Dev first. It reaches UAT in a second
move, after the move already planned for this weekend
(`docs/UAT-Promotion-2026-09-Plan.md`).

## 2. What changes for each person

| Who | What they see and do |
|---|---|
| Sales Staff | Plans their own hospitals, but only ones in their own area. No team view (same as today). |
| Area Manager | Plans their own hospitals from their own area, and approves their team's plans. Team view: their people, each person's hospitals, and totals per zone. |
| SBU Manager, GM | Plan their own hospitals and can pick any hospital (neither has a fixed area). Team view as above; the GM sees every SBU. The GM's own plan is approved by the Admin account, as today. |
| Admin | No personal target (as today). Sees every plan, approves the GM's. Rates hospitals. |
| Everyone | Sees each hospital's rating. Only Admin/GM see the notes behind it. |

## 3. Four choices — answered (Basheer, 2026-09-27)

**Answers:** 1 fuller (Save draft), 2 lighter (fixed list of five),
3 fuller (Rate Hospitals list screen; the rating is stored on the hospital
record, not in a separate table), 4 lighter (no bell for now; a
notification engine can come later). Plan-versus-actual stays in Part 2.
The options as offered:

1. **Saving a half-finished plan.** A plan has 20–40 hospitals, so it may
   not be finished in one sitting.
   - *Lighter:* no drafts. The plan is built in one sitting and submitted.
     Anything not submitted is lost if the window is closed.
   - *Fuller (recommended):* a **Save draft** button. Drafts are visible only
     to their owner and don't reach the manager until **Submit**. It costs one
     extra status and one extra button.
2. **Visit frequency options.** Agreed on 2026-09-11: Weekly, Bi-weekly,
   Monthly, Quarterly, As-needed. At the time, the plan was for Cabio staff
   to be able to edit that list themselves, through a separate settings
   screen that was never built.
   - *Lighter (recommended for the deadline):* a fixed list of those five.
     Changing it later takes a small code release.
   - *Fuller:* build the editable list now. That adds a day of work and puts
     the 2 Oct date at risk.
3. **Rating 100–300 hospitals.**
   - *Lighter:* rate each hospital from its own page, which means visiting
     every hospital's page one at a time.
   - *Fuller (recommended):* a **Rate Hospitals** table for Admin/GM. One
     row per hospital, with the rating and notes editable in place and a
     filter for "Not rated yet".
4. **Telling the manager a plan is waiting.** Today's target approvals send no
   notification; the manager sees them in "Needs Your Approval" on the Target
   Planning screen.
   - *Lighter (recommended for the deadline):* same as today. Plans, and
     re-submissions with their change note, show up in that section.
   - *Fuller:* a bell notification when a plan is submitted or re-submitted,
     and back to the salesperson when it's approved or rejected. About half a
     day; can be added in October without redoing anything.

**Also settled by this plan, unless Basheer objects:**
- **Hospital amounts can be ₹0.** A hospital may be on the plan for visits
  only. The total must still be above ₹0.
- **Existing Dev test targets** (6 rows, no hospitals) remain readable.
  Revising one requires adding hospitals. UAT has no targets yet.
- **The old, never-used coverage-plan tables are removed.** They're empty on
  Dev (checked 2026-09-27), and no screen or API ever used them. UAT will be
  checked for emptiness before the move.

## 4. Build order (Part 1)

1. Migration and models (Business Potential on hospitals, plan-hospital
   table, change note, draft status if chosen, old tables removed). Apply to
   Dev, regenerate `docs/Physical-Schema.sql`.
2. Backend: rating endpoints, plan endpoints taking hospitals, rules and
   warnings, team/zone roll-ups. Tests. Checkpoint commit (backend only).
3. Frontend: Rate Hospitals screen, new plan dialog, approver view,
   team/zone view, rating chip on the hospital page.
4. Business Rules / ADR updates (section 7).
5. `/code-review` at **high** (approval workflow plus RLS), fix findings.
6. Written manual E2E test plan, checked against live Dev data; run it.
7. Commit, post-commit checklist, then the second UAT move.

**Honest timing:** steps 1–3 are about 2½–3 working days, and steps 5–6
about one more. That puts it ready on Dev around 30 Sep–1 Oct, and on UAT
around 1–2 Oct, with no slack. If step 3 isn't well under way by 29 Sep,
use the fallback in the discussion doc.

## 5. Part 2 (October): plan versus actual

On the Insights Dashboard, for each person (and rolled up to zone, SBU and
company), per hospital:

> Planned ₹X · **Won so far ₹Y** · Expected from active deals ₹Z → **Likely
> finish ₹Y+Z**

Plus one "Unplanned" line for deals won at hospitals outside the plan
(decision 3). A short plan of its own will be written once Part 1 is on UAT.

## 6. Not in this plan (with reasons)

- **Splitting each hospital's amount by brand** (Design B). Rejected in the
  discussion as too much data entry.
- **Hospital groups and size classes** (Customer Tiering open questions 1
  and 3). Still with Latheef Bhai and Haroon; none of Part 1 depends on them.
- **Split-shared deals in actuals.** Part 2 credits the deal owner, as the
  Sales Report does. Changes only if the Backlog entry "Reports never
  implement split-weighted attribution" is decided otherwise.
- **A history of every change note.** Part 1 keeps the latest note on the
  plan, shown to the approver. Keeping every past version belongs with the
  general audit-trail item (BR-AUD-01).

## 7. Business rules and records to update (same commit as the build)

- `docs/Business-Rules.md`: rewrite BR-PL-02 and BR-PL-03. There's no longer a
  separate coverage plan that must follow an approved target; the hospitals
  are part of the one target plan. Add the rules: target = sum of hospitals,
  territory restriction, change note required on revision, same-SBU overlap
  warning, rating and notes Admin/GM only.
- `docs/ADR.md`: a dated note on ADR-013 (planning hierarchy). Target and
  Coverage are now one approved plan per person per SBU per quarter. The
  Target → Coverage → Opportunity → Revenue chain is unchanged in meaning.
- Traceability rows 6.1 and 1.3; the Customer Tiering and Coverage Planning
  plans' status lines; the Reference-Data plan if choice 2 stays "fixed list".

## 8. Technical addendum

### Migration `0055`
- `account`: `business_potential varchar(20) NOT NULL DEFAULT
  'NOT_CLASSIFIED'` with CHECK in (`HIGH`, `MEDIUM`, `LOW`,
  `NOT_CLASSIFIED`); `business_potential_notes text NULL`;
  `business_potential_set_by uuid NULL` FK `user_profile`;
  `business_potential_set_at timestamptz NULL`. `account` has no RLS; note
  visibility is enforced in the response schema (below).
- `target_plan`: `change_note text NULL`. If choice 1 = drafts: extend
  `ck_target_plan_status` with `DRAFT`.
- New `target_plan_account` (AuditMixin): `target_plan_id` FK CASCADE,
  `account_id` FK, `planned_amount_lakhs NUMERIC(15,2) NOT NULL CHECK >= 0`,
  `visit_frequency varchar(20) NOT NULL` with CHECK in (`WEEKLY`, `BI_WEEKLY`,
  `MONTHLY`, `QUARTERLY`, `AS_NEEDED`) if choice 2 = fixed list,
  `strategic_objective text NULL`. Unique `(target_plan_id, account_id)`.
  RLS: mirror `target_plan_brand_split` exactly as fixed in `0054` (read
  follows the parent `target_plan`'s visibility; write only via the owner).
- Drop `coverage_plan_entry`, then `coverage_plan`. Before writing the
  drop, query `pg_constraint` for every FK into both tables (skill rule).
  Downgrade recreates them empty.
- Overlap lookup: a narrow `SECURITY DEFINER` function
  `cabio_plan_overlap(p_account_ids uuid[], p_sbu_id uuid, p_period text)`
  returning `(account_id, display_name)` for other users' non-draft plans in
  the same SBU and period. It's needed because `target_plan` RLS hides
  colleagues' plans from a Sales Staff caller. It exposes only the
  colleague's name per hospital, which is the warning's whole point.

### Backend
- **Models:** `TargetPlanAccount`; `TargetPlan.accounts` relationship
  (`cascade="all, delete-orphan"`); `Account` gains the four columns; remove
  `CoveragePlan`/`CoveragePlanEntry`, `Account.coverage_plan_entries` and
  the five `noload(Account.coverage_plan_entries)` calls in
  `account/repository.py`; `TargetPlan.coverage_plans` goes too.
- **Schemas:** `TargetPlanCreate`/`TargetPlanUpdate` take
  `accounts: list[PlanAccountEntry]` (min 1) instead of
  `target_amount_lakhs`; `TargetPlanUpdate.change_note` required unless
  the plan is still a draft; response adds `accounts`, `change_note`
  and `overlap_warnings`. `AccountResponse`/`AccountListResponse`
  add `business_potential`; `business_potential_notes` is populated only
  when the caller is Admin/GM (built in the router from `current_user`,
  never from a client flag).
- **Service** (`TargetPlanService`): `_apply_accounts()` replaces rows
  wholesale (same pattern as `_apply_brand_splits`). Checks: no duplicate
  hospital; territory, meaning `account.zone_id` must be in the `zone_closure`
  descendants of the caller's `user_zone` rows, while callers with no
  `user_zone` rows (GM, SBU Manager today; checked on Dev 2026-09-27) may
  pick any hospital; sets `target_amount_lakhs = SUM(planned_amount_lakhs)`,
  must be > 0; then `_apply_brand_splits` validates against that total,
  unchanged. `update_target_plan` keeps its existing reset-to-pending
  behaviour and stores `change_note`. Drafts: `create`/`update` with
  `submit=false` keep `DRAFT`; the approval queue and roll-ups exclude
  `DRAFT`; approve/reject refuse a `DRAFT`.
- **Account rating:** `PATCH /accounts/{id}/business-potential` (Admin/GM
  only, service-layer check like `_require_admin_or_gm`), stamps set-by and
  set-at. List endpoint gains a `business_potential` filter for the
  Rate Hospitals screen.
- **Roll-ups:** `GET /planning/targets/zone-rollup?sbu_id&planning_period`,
  meaning the sum of `planned_amount_lakhs` grouped by each account's
  `ZONE`-level ancestor (same walk-up as
  `AccountRepository.find_similar_by_name`), under the caller's RLS. The
  existing per-person `/team` endpoint returns `accounts` too.
- **Tests:** service rules (territory, sum, zero-total, duplicate, change
  note, draft transitions, self-approval still blocked), RLS on
  `target_plan_account` (Sales Staff can't read a peer's rows; Area Manager
  can read their reports'), overlap function, notes hidden from non-Admin/GM.

### Frontend
- `TargetPlanningScreen.tsx`: the Set/Revise dialog becomes a full-width
  dialog: hospital table (search limited server-side to the caller's
  territory; columns Hospital, Zone, Potential chip, Visit frequency,
  Amount, Objective), live total, non-blocking warnings, the existing brand
  split section validated against the live total, change note (shown
  when revising), Save draft / Submit. "Needs Your Approval" rows expand
  to show hospitals and the change note. Team section: expandable rows per
  person, plus a By Zone table.
- New `RateHospitalsScreen.tsx` (Admin/GM only, if choice 3 = fuller):
  MUI table, zone and "Not rated" filters, inline rating select and notes.
- `Customer360Screen.tsx`: a rating chip in the header; notes shown only
  for Admin/GM.
- MUI only (ADR-031), React Query per ADR-032, service functions per
  Frontend Standards section 7.

### Mirroring check (CLAUDE.md "Mirroring an existing feature")
Modelled on Target Planning. Surfaces it touches: My Target, Needs Your
Approval, team roll-up, Brand Target Tracking (unchanged: it reads brand
splits, which are still there). No notification bell today, so none is added
unless choice 4 says otherwise. No list-view badges exist for targets.

### Process
Migration applied to Dev with `alembic current` recorded;
`Physical-Schema.sql` regenerated; `/code-review` high; written E2E plan
checked read-only against live Dev data (territories, which hospitals each
test user can pick); pytest, ruff, tsc and lint reported before E2E; then
Traceability and the scorecard.
