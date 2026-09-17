# Target Planning — Code Review Findings (2026-09-17)

**Prepared for:** the builder agent currently running Target Planning's manual E2E
verification, to fix before continuing that pass.
**Scope reviewed:** commits `1d9d46a` (backend approval-workflow domain + migration
`0044`), `abaf8fa` (frontend `TargetPlanningScreen`), `4927502` (Annual view + test
plan) — i.e. the whole Target Planning feature, backend and frontend.
**Method:** `/code-review high` against these three commits, then every finding below
re-verified directly against the current file contents (not just the review agent's
first pass) before writing this up.

Ordered by severity — fix 1 and 2 first, they block the feature outright.

---

## 1. `sbu_id` sent as `undefined` — breaks creating a target for everyone

**File:** `sales-os-app/src/screens/TargetPlanningScreen.tsx:187`
**Status: a fix is already sitting uncommitted in the working tree — verify it, don't
redo it.**

```diff
       await createTargetPlan({
-        sbu_id: userProfile.sbu_id,
+        sbu_id: userProfile.sbu.id,
```

`userProfile` (from `/auth/me`, `UserMeResponse` in
`backend/app/domains/organization/schemas.py`) nests SBU as `sbu: {id, name} | null`,
not a flat `sbu_id`. The original code read a field that never existed, so
`sbu_id` was always `undefined`. `POST /planning/targets` requires `sbu_id: uuid.UUID`
(`schemas.py:24`), so the request fails Pydantic validation (422) and no target is
ever created — for any role, not just Admin/GM, since this line runs for every
first-time "Set Target" submission.

**Action:** confirm the uncommitted diff above is applied, then also grep the rest of
the file for any other `userProfile.sbu_id` (flat) references before assuming this is
the only spot — see #2, which is the same bug in a second place.

---

## 2. SBU rollup silently empty for SBU Manager / Area Manager

**File:** `sales-os-app/src/screens/TargetPlanningScreen.tsx:111`
**Status: same uncommitted fix already covers this line too — verify it.**

```diff
-  const rollupSbuId = showSbuPicker ? (selectedSbuId ?? sbus[0]?.id ?? null) : userProfile?.sbu_id ?? null;
+  const rollupSbuId = showSbuPicker ? (selectedSbuId ?? sbus[0]?.id ?? null) : userProfile?.sbu?.id ?? null;
```

Same root cause as #1. For roles that shouldn't see an SBU picker (SBU Manager, Area
Manager), `rollupSbuId` fell back to the same nonexistent flat field, so it was always
`null`. Both the rollup query and the team-targets query are gated on
`enabled: showRollup && !!rollupSbuId`, so with `rollupSbuId` always `null` neither
query ever fires — the whole "SBU Target Rollup" section renders with no data for
exactly the roles the Manual E2E Test Plan's Group H (steps 20–23) expects to see it
working for.

**Action:** confirm the uncommitted fix; then when Group H runs, verify the section
actually populates for both SBU Manager and Area Manager logins (not just that it
doesn't crash) — this bug would previously have looked like "an empty section," which
is easy to mistake for "no data yet" rather than a bug, so it's worth an explicit
step.

---

## 3. Approver's rejection/approval note is accepted by the API and then thrown away

**Files:**
- `backend/app/domains/planning/router.py:104-127` (`approve_target_plan`,
  `reject_target_plan`)
- `backend/app/domains/planning/service.py:86-114` (`approve_or_reject_target_plan`)
- `backend/app/domains/planning/models.py:11-37` (`TargetPlan` — no note/comment
  column exists at all)

The frontend is fully built for this already — `TargetPlanningScreen.tsx:95` holds
`noteInput` state, line `202` sends `{ status, note: noteInput.trim() || null }`, and
there's a real text field at line `466` for the manager to type into. The backend
schema even accepts it (`TargetPlanApprovalDecision.note`, `schemas.py:42`). But
`approve_target_plan`/`reject_target_plan` never read `body.note` and never pass it
anywhere — `service.approve_or_reject_target_plan`'s signature has no `note`
parameter, and `TargetPlan` has no column to put it in even if it did.

**Failure scenario:** a manager rejects a subordinate's target and types "Too low for
this territory" (exactly what the Manual E2E Test Plan's Group D, step 10, instructs
the tester to do). It's accepted by the API (schema validation passes), then silently
discarded. The rep sees a bare "Rejected" chip (`REJECTED: "Rejected"` label,
`TargetPlanningScreen.tsx:56`) with zero explanation, and there is no record anywhere
— not the DB, not logs, not an audit trail — of why it was rejected.

**Fix requires three layers, not just a service tweak:**
1. **Migration:** add a nullable column to store it — e.g. `target_plan.decision_note
   text NULL` — since no existing column can hold this.
2. **Backend:** `approve_or_reject_target_plan` takes a `note: str | None` parameter
   and sets it on the row; both router endpoints pass `body.note` through; add the
   field to `TargetPlanResponse` (`schemas.py:52-66`) so it round-trips back to the
   client.
3. **Frontend:** there's currently nowhere in `TargetPlanningScreen.tsx` that displays
   an existing note back to the rep once set — add that display next to the
   "Rejected"/"Approved" status chip, otherwise the note is stored but still
   invisible to the person it's for.

---

## 4. Revising a *rejected* target never returns it to the approval queue

**File:** `backend/app/domains/planning/service.py:66-84` (`update_target_plan`)

```python
target_plan.target_amount_lakhs = data.target_amount_lakhs
if target_plan.status == "APPROVED":          # line 79
    target_plan.status = "PENDING_APPROVAL"
    target_plan.approved_by = None
    target_plan.approved_at = None
```

This only resets status back to `PENDING_APPROVAL` when the *current* status is
`APPROVED`. If a target is `REJECTED` and the owner revises the amount (the "Revise"
button is always available per the docstring's decision #5), the `if` never fires —
`status` stays `REJECTED` even though the number changed.

`list_pending_approval_for_approver` (`repository.py:20-31`) filters strictly on
`TargetPlan.status == "PENDING_APPROVAL"` (line 31), so a revised-but-still-flagged-
REJECTED row never reappears in the manager's approval queue. The rep's corrected
number is permanently stuck showing "Rejected" with no path back to approval.

**Fix:** change the condition at line 79 to reset on either terminal status:

```python
if target_plan.status in ("APPROVED", "REJECTED"):
    target_plan.status = "PENDING_APPROVAL"
    target_plan.approved_by = None
    target_plan.approved_at = None
```

**Test to add/run:** revise a REJECTED target plan, confirm status flips to
`PENDING_APPROVAL` and the row reappears in `list_pending_approval_for_approver` for
the correct manager.

---

## 5. No server-side floor on `target_amount_lakhs`

**Files:** `backend/app/domains/planning/schemas.py:26` (`TargetPlanCreate`) and
`:37` (`TargetPlanUpdate`)

```python
target_amount_lakhs: Decimal
```

No `gt=0` / `ge=0` constraint, unlike the codebase's own convention for equivalent
fields (e.g. `backend/app/domains/opportunity/schemas.py` uses `Field(..., gt=0)` /
`Field(..., ge=0)` for quantity/price). The frontend only checks `amount <= 0`
client-side (`TargetPlanningScreen.tsx`'s `handleSaveTarget`) — a direct API call, or
any future client, can submit a zero or negative target and it will be accepted and
stored, silently corrupting the SBU rollup sum (`get_sbu_rollup`).

**Fix:** add `Field(..., gt=0)` to both fields:

```python
target_amount_lakhs: Decimal = Field(..., gt=0)
```

(needs `from pydantic import Field` added to the existing import line if not already
present — check `schemas.py`'s current import block).

---

## 6. `target_plan_read` RLS grants "direct reports" visibility wider than documented — confirm intent, don't silently "fix"

**File:** `backend/alembic/versions/0044_target_plan_approval_and_rls.py:63-84`

```sql
CREATE POLICY target_plan_read ON target_plan FOR SELECT USING (
    cabio_app_role_name() IN ('Admin', 'General Manager')
    OR (cabio_app_role_name() = 'SBU Manager' AND sbu_id = cabio_app_sbu_id())
    OR (
        cabio_app_role_name() = 'Area Manager'
        AND sbu_id = cabio_app_sbu_id()
        AND user_id IN ( ... zone-descendant subquery ... )
        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())  -- line 79
    )
    OR user_id = cabio_app_uid()
);
```

SQL's `AND` binds tighter than `OR`, so the third parenthesized group parses as
`(Area Manager AND same SBU AND in-zone) OR (user_id's manager_id = caller)` — the
second half is **not** scoped to the Area Manager role at all, despite the
migration's own docstring describing this as "Area Manager zone-scoped + direct
reports" (`0044...py:16`). As written, *any* caller who happens to be someone's
`manager_id` — a Sales-Staff-tier team lead, for instance, not just an Area Manager —
can read that person's `target_plan` row.

This is plausibly **intentional** given the feature's explicit design goal ("resolved
generically via `user_profile.manager_id` — no hardcoded role tiers," per the
migration's own opening comment, line 14) — a first-line manager of any tier arguably
*should* see their own direct reports' targets. But the written description and the
actual grant don't match, which is exactly the kind of RLS gap that's easy to miss in
review later.

**Action, not a fix:** confirm with Basheer/whoever owns the RLS design whether "any
manager, any tier, sees their direct reports' targets" is the intended rule. If yes —
update the migration's comment (line 16) to say so plainly and move on. If no — add
parentheses to scope the direct-reports clause to Area Manager specifically:

```sql
OR (
    cabio_app_role_name() = 'Area Manager'
    AND sbu_id = cabio_app_sbu_id()
    AND (
        user_id IN ( ... zone-descendant subquery ... )
        OR user_id IN (SELECT id FROM user_profile WHERE manager_id = cabio_app_uid())
    )
)
```

Either way this needs a new migration (`0045`) to correct — do **not** hand-edit
`0044` since it's already applied to Dev.

---

## Suggested order

1. Verify + keep the uncommitted fix for #1/#2 (already done, just confirm and
   commit).
2. Fix #4 (one-line condition change, cheap, directly blocks a real workflow path).
3. Fix #5 (one-line `Field(..., gt=0)` each, cheap).
4. Decide and fix #3 (needs a migration — the only one of these that adds schema).
5. Get a decision on #6, then migrate if the answer is "narrow it."

Re-run the backend test suite and `tsc`/`eslint` after each, and re-run the specific
Manual E2E groups these touch (Group D for #3, the revise-flow steps for #4, Group H
for #1/#2) before signing those groups off.
