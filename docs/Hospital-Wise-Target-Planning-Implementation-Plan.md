# Hospital-Wise Target Planning — Implementation Plan

**Status:** Approved 2026-09-27 (choices in section 3 answered by Basheer
the same day). Unblocked: the main → UAT move, including the Product
Catalog clean-up, was done 2026-09-27 (`docs/UAT-Promotion-2026-09-Plan.md`).
Steps 1–3 built: `e55c112` (schema), `04c5e87` (backend), 3a `72564dc`, 3b `467dee8`, 3c + 3d `70e41e1` (migration `0056`, applied to Dev), ₹0-warning follow-up `bfeef46` (BR-PL-06). Step 4 (rules and records) done 2026-09-29. Step 5 done: `/code-review` high ran 2026-09-29; fix list built `1a4843a`; a medium `/code-review` of that commit found one race, fixed with a row lock `3907b88` (2026-09-30). Step 6: E2E plan written 2026-09-30 (`docs/Hospital-Wise-Target-Planning-Manual-E2E-Test-Plan.md`), not yet run.
**Changes 2026-09-29 (Basheer):** (1) the 29 Sep checkpoint found the build
on track, so the fallback wasn't needed; (2) **no UAT move until Part 2 is
also finished** — meanwhile the team sets Oct–Dec targets in the brand-wise
Target Planning screen already on UAT, then revises them with hospitals once
this reaches UAT; (3) the **By Zone table moves to Part 2** — earlier "totals
per zone" wording in Part 1 was Claude's addition, never put to Basheer as a
choice; its backend (`/zone-rollup`, `04c5e87`) is already built and counts
as Part 2 work done early; (4) new rule **BR-PL-05**: a revised plan below
its last approved total gets a warning and the approver sees both totals
(step 3d).
**Design and decisions:** `docs/Discussion-Hospital-Wise-Target-Planning-2026-09.md`
(Design C; decisions 1–6 in section 4, answers to the open questions in
section 5). This plan doesn't repeat them; it says how to build them.
**Traceability rows:** 6.1 Beat Planning, 3.2 actual-vs-target dashboards,
1.3 Customer Tiering (Business Potential part only).
**Deadline:** ~~in use on UAT around 2 Oct 2026~~ — changed 2026-09-29:
Parts 1 and 2 go to UAT together, once Part 2 is finished (during October).
The fallback decision (29 Sep) found the build on track.

## Decisions

- Save draft button (plans can be finished over several sittings) — Basheer, 2026-09-27
- Visit frequency is a fixed list of five — Basheer, 2026-09-27
- Rate Hospitals table for Admin/GM; rating stored on the hospital record — Basheer, 2026-09-27
- No bell notification for plan submit/approve for now — Basheer, 2026-09-27
- Balanced brand split and total > ₹0 enforced on Submit only, not Save draft — Basheer, 2026-09-28
- Screen renamed "Target & Coverage Planning" — Basheer, 2026-09-28
- No UAT move until Part 2 is also finished; By Zone table moves to Part 2 — Basheer, 2026-09-29
- Keep the "Revised" label and live hospital count — Basheer, 2026-09-29
- BR-PL-05: warn when a revised plan is below its last approved total — Basheer, 2026-09-29
- Hospital amounts can be ₹0; High at ₹0 gets a red warning, Medium/Low a yellow one, Not rated none; none block Submit — Basheer, 2026-09-29
- Old Dev test targets stay readable; revising one requires hospitals — Basheer, 2026-09-29
- Old coverage-plan tables removed (Dev done in 0055; UAT checked empty before the move) — Basheer, 2026-09-29
- "Was ₹X L" figure: cleared when a revision is approved, kept when rejected — Basheer, 2026-09-29
- Approve/Reject refused if the plan changed since the manager opened it, and allowed only while waiting for approval (no "being edited" lock) — Basheer, 2026-09-30
- Rate Hospitals: a Save button per row saves rating and note together — Basheer, 2026-09-30
- Change note shown as "Why it changed" while waiting for approval, "Last change (approved)" after — Basheer, 2026-09-30
- Own-SBU plans only (except Admin/GM), overlap check limited to own territory, 2-decimal amounts, faster plan lists — Basheer, 2026-09-30
- No lock on the overlap helper for now (it already returns nothing outside the app); Backlog note instead — Basheer, 2026-09-30

## 1. In plain terms

Today a salesperson types one quarterly number and splits it by brand. After
this change, they build the number from their hospitals instead:

1. Open **My Target**, pick the quarter, and add hospitals from their own
   area. Each hospital shows its Business Potential (High / Medium / Low /
   Not rated).
2. For each hospital, choose how often they'll visit and enter the amount they
   expect from it. A short objective can be added but isn't required.
3. The amounts add up to their target, shown live at the bottom. Warnings
   appear, without blocking anything, when a rated hospital has ₹0 (red
   for High, yellow for Medium/Low — BR-PL-06), or when
   a colleague from the same SBU has also planned that hospital.
4. Split that total by brand, exactly as today.
5. Submit. It goes to their manager, who sees the hospitals, the amounts and
   the brand split, and approves or rejects it once.
6. Any later change needs a short note saying why, and goes back to the
   manager for approval again.

Admin and GM rate each hospital's Business Potential on a new **Rate
Hospitals** screen, one row per hospital, with notes that only Admin and GM
can see. Managers keep the team view they have today, which can now also
show each person's hospitals. (Totals per zone come in Part 2 — changed
2026-09-29.)

If someone revises an approved plan and their hospitals add up to less than
the approved target, they see how far short they are, and the manager sees
the old and new totals before re-approving (BR-PL-05). The expected fix is
more hospitals, not a lower target.

**In two parts:**
- **Part 1:** ratings, the new planning screen and the managers' view of
  plans.
- **Part 2, during October:** plan-versus-actual on the Insights Dashboard
  ("won so far", "expected from active deals", "likely finish"), and the
  totals per zone.

**Environments:** built and tested on Dev first. Parts 1 and 2 reach UAT
together in one move, once Part 2 is finished (Basheer, 2026-09-29). Until
then, Oct–Dec targets are set in the brand-wise Target Planning screen
already on UAT; people add hospitals by revising those plans after the move.

## 2. What changes for each person

| Who | What they see and do |
|---|---|
| Sales Staff | Plans their own hospitals, but only ones in their own area. No team view (same as today). |
| Area Manager | Plans their own hospitals from their own area, and approves their team's plans. Team view: their people and each person's hospitals (totals per zone in Part 2). |
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

**Also settled (Basheer, 2026-09-29):**
- **Hospital amounts can be ₹0.** A hospital may be on the plan for visits
  only. The total must still be above ₹0. A rated hospital at ₹0 gets a
  warning (red for High, yellow for Medium/Low); neither blocks Submit.
- **Existing Dev test targets** (6 rows, no hospitals) remain readable.
  Revising one requires adding hospitals. UAT had no targets at the time of
  writing; the brand-wise Oct–Dec targets set there before the move
  (2026-09-29 change) follow the same rule, and BR-PL-05 applies.
- **The old, never-used coverage-plan tables are removed.** They're empty on
  Dev (checked 2026-09-27), and no screen or API ever used them. UAT will be
  checked for emptiness before the move.

## 4. Build order (Part 1)

1. Migration and models (Business Potential on hospitals, plan-hospital
   table, change note, draft status if chosen, old tables removed). Apply to
   Dev, regenerate `docs/Physical-Schema.sql`.
2. Backend: rating endpoints, plan endpoints taking hospitals, rules and
   warnings, team/zone roll-ups (the zone roll-up is Part 2 work, built
   early). Tests. Checkpoint commit (backend only).
3. Frontend: Rate Hospitals screen, new plan dialog, approver view,
   team view, rating chip on the hospital page. Part (c) = expandable
   approval and team rows, with a "Revised" label and a live hospital count
   (no By Zone table — Part 2).
   **3d (added 2026-09-29):** BR-PL-05 — store the last approved total when
   an approved plan is revised (migration `0056`), warn in the dialog when
   the hospital total is below it, show both totals to the approver.
4. Business Rules / ADR updates (section 7).
5. `/code-review` at **high** (approval workflow plus RLS), fix findings.
   **Fix list agreed 2026-09-30, built `1a4843a` (no database change);
   follow-up row lock `3907b88`:**
   - **Stale approval:** `TargetPlanApprovalDecision` gets required
     `expected_updated_at`; `approve_or_reject_target_plan` requires
     `PENDING_APPROVAL` and raises `ConflictError` (409) on a mismatch —
     "The rep changed this plan while you were reviewing it. Here is the
     latest version. Please review again." Frontend sends the value, and on
     409 shows the message, closes the dialog and refetches.
     `update_target_plan` sets `updated_at = func.now()` so a
     hospital-only or split-only edit still changes it, then refreshes.
   - **Rate Hospitals:** per-row Save (rating + note together); no save
     on pick or on blur.
   - **`TargetPlanDetails`:** "Why it changed" while PENDING_APPROVAL,
     "Last change (approved): …" after.
   - **Own SBU:** `create_target_plan` refuses another SBU unless Admin/GM.
   - **Overlaps:** `check_overlaps` drops hospitals outside
     `_territory_zone_ids`. No `REVOKE` migration (see Backlog).
   - **Amounts:** `decimal_places=2` on `planned_amount_lakhs` and
     `split_amount_lakhs` (the dialog already rounds, so no UI change).
   - **Lists:** `selectinload` of `accounts` and `brand_splits` on the
     three list queries.
   - Tests for each; BR-PL-08 gains "the approver decides only on the
     latest version, and only while it's waiting for approval".
   - Not now: `BaseRepository.update` stale `updated_at` for all domains,
     duplicated `_ACCOUNT_NOLOADS`/IST helpers (Backlog); `/zone-rollup`
     kept for Part 2.
6. Written manual E2E test plan, checked against live Dev data; run it.
7. Commit, post-commit checklist. The UAT move waits for Part 2
   (2026-09-29); its first step is a check of how UAT hospitals are filed
   (Part 2 plan, step 5).

**Honest timing:** steps 1–3 are about 2½–3 working days, and steps 5–6
about one more. ~~On UAT around 1–2 Oct; fallback if step 3 isn't well
under way by 29 Sep.~~ Checkpoint 29 Sep: on track, fallback not needed.
UAT date now follows Part 2.

## 5. Part 2 (October): plan versus actual

On the Insights Dashboard, for each person (and rolled up to zone, SBU and
company), per hospital:

> Planned ₹X · **Won so far ₹Y** · Expected from active deals ₹Z → **Likely
> finish ₹Y+Z**

Plus one "Unplanned" line for deals won at hospitals outside the plan
(decision 3). **Part 2's own plan, approved 2026-09-29:**
`docs/Hospital-Wise-Target-Planning-Part2-Implementation-Plan.md` (Parts 1
and 2 go to UAT together).

**Already done for Part 2:** the zone roll-up backend,
`GET /planning/targets/zone-rollup` (`04c5e87`, 2026-09-27) — planned
amounts, hospital and person counts per zone, submitted plans only. It
groups by the **hospital's** zone, which Part 2 keeps (Basheer,
2026-09-29). Left for Part 2: the By Zone screen, then actuals beside it.

**Quarter date range (note from the reporting session, 2026-09-27):** a
quarter must start at midnight Indian time, not 5:30 am (the database runs
on UTC). Don't build a date range from "YYYY-Qn" by hand. Turn the quarter
into its first and last calendar dates, then reuse `_period_bounds(period_start,
period_end)` in `backend/app/domains/reporting/router.py` (fixed in `22eb298`).
It returns IST-aware start/end datetimes, the end being midnight of the day
after, for `closed_at >= start AND closed_at < end`. Verified on Dev: a deal
Won at 02:00 IST on 1 July falls in Jul–Sep.

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

- `docs/Business-Rules.md`: BR-PL-02 and BR-PL-03 marked "Replaced by
  Hospital-wise planning (2026-09)" with a pointer here (Basheer,
  2026-09-29 — marked, not rewritten; also in the rule-implementation
  matrix). There's no longer a separate coverage plan that must follow an
  approved target; the hospitals are part of the one target plan. Still to
  add (step 4): the rules target = sum of hospitals,
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
  `cabio_app_plan_overlap(p_account_ids uuid[], p_sbu_id uuid, p_period text)`
  (built with the `cabio_app_` prefix, matching the existing functions)
  returning `(account_id, display_name)` for other users' non-draft plans in
  the same SBU and period. As built, it also answers only for the caller's
  own session SBU unless the caller is Admin/GM. It's needed because `target_plan` RLS hides
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
  and `warnings` (kinds: `HIGH_POTENTIAL_ZERO`, `RATED_POTENTIAL_ZERO` for
  Medium/Low at ₹0 — added 2026-09-29, BR-PL-06 — and same-SBU overlap;
  filled on create/update responses only). `AccountResponse`/`AccountListResponse`
  add `business_potential`; `business_potential_notes` is populated only
  when the caller is Admin/GM (built in the router from `current_user`,
  never from a client flag).
- **Service** (`TargetPlanService`): `_apply_accounts()` replaces rows
  wholesale (same pattern as `_apply_brand_splits`). Checks: no duplicate
  hospital; territory, meaning `account.zone_id` must be in the `zone_closure`
  descendants of the caller's `user_zone` rows. As built (2026-09-27), the
  exemption is by role, not by "has no `user_zone` rows": Admin, GM and
  SBU Manager may pick any hospital (the same role set as
  `_ZONE_ASSIGNMENT_EXEMPT_ROLES` and `_ZONE_SEARCH_UNRESTRICTED_ROLES`);
  anyone else with no zones can't plan any hospital, so an unassigned
  salesperson never gets the whole list; sets `target_amount_lakhs = SUM(planned_amount_lakhs)`,
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
  `AccountRepository.find_similar_by_name`), under the caller's RLS.
  Built `04c5e87`; unused until Part 2 (2026-09-29). The
  existing per-person `/team` endpoint returns `accounts` too, and hides
  other people's drafts.
- **Also built for the plan dialog:** `GET /planning/targets/eligible-accounts?search=`
  (the territory-limited hospital picker, with each rating) and
  `GET /planning/targets/overlaps?sbu_id&planning_period&account_ids=`
  (a live overlap check before saving).
- **Tests:** service rules (territory, sum, zero-total, duplicate, change
  note, draft transitions, self-approval still blocked), overlap function,
  notes hidden from non-Admin/GM. The test suite is mock-based and has no
  RLS tests, so RLS on `target_plan_account` (Sales Staff can't read a
  peer's rows; Area Manager can read their reports') is checked against
  live Dev in the E2E plan instead. Every new query was also run read-only
  on Dev under real RLS as Sales Staff, Area Manager and GM (2026-09-27).

### Frontend
- `TargetPlanningScreen.tsx`: the Set/Revise dialog becomes a full-width
  dialog: hospital table (search limited server-side to the caller's
  territory; columns Hospital, Zone, Potential chip, Visit frequency,
  Amount, Objective), live total, non-blocking warnings, the existing brand
  split section validated against the live total, change note (shown
  when revising), Save draft / Submit. "Needs Your Approval" rows expand
  to show hospitals and the change note, with a "Revised" label when a
  change note is present and a hospital count computed on screen
  (`accounts.length`, nothing stored). Team section: expandable rows per
  person. (By Zone table moved to Part 2, 2026-09-29.)
- **Step 3d (BR-PL-05):** migration `0056` adds
  `target_plan.previous_approved_total_lakhs NUMERIC(15,2) NULL`, set when
  an APPROVED plan is first edited, cleared on approve. Needed because the
  total is overwritten in place and `target_plan*` has no audit-trail
  trigger (BR-AUD-01). Dialog warns when the live total is below it;
  approver rows show both totals.
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
