# Next Actions Module — Implementation Plan

**Status:** Approved, not yet implemented
**Date:** July 3, 2026
**Sprint:** Sprint 2 (Opportunities & Activities), July 13 demo checkpoint (`docs/implementation_plan.md`)

Makes Next Action / Due Date / Owner mandatory on every logged customer-facing
Activity (PRD §4.3, Basheer's explicit product decision, not up for
revisiting) — with `MANAGER_NOTE` exempt, since a Manager Note is internal
manager-to-rep guidance, not a customer interaction, and does not represent a
follow-up commitment (Basheer, 2026-07-03) — and ships the missing "Next
Actions" frontend screen against the already-spec-complete Reminder API.

All verified signatures below were re-read directly from source on 2026-07-03.

---

## Design decisions (resolved, not options)

### Q1 — Mandatory Next Action without breaking one-request-one-transaction

**Revised 2026-07-03 per Basheer:** Next Action is mandatory for every
`activity_type` **except `MANAGER_NOTE`**. A Manager Note is internal
manager-to-rep guidance, not a customer interaction — it does not represent
a follow-up commitment, so forcing a due date on it would be meaningless
noise. See Q2 (updated) for the full rationale.

Because the requirement is now conditional on `activity_type`, the fields
cannot be plain-required Pydantic fields (`Field(..., min_length=1)` always
fires regardless of type). They become optional at the field level, enforced
by a `model_validator`, matching the existing conditional-requirement pattern
in this codebase (`OpportunityCreate`/status-transition validators: e.g.
`competitor_name` required only when `loss_reason_code == COMPETITOR_WON` —
`backend/app/domains/opportunity/validators.py`).

```python
class ActivityCreate(BaseModel):
    account_id: uuid.UUID
    opportunity_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    activity_type: ActivityType
    activity_date: datetime
    notes: str | None = None
    next_action_text: str | None = Field(default=None, min_length=1)
    next_action_due_date: datetime | None = None
    next_action_owner_id: uuid.UUID | None = None  # defaults to Activity.user_id

    @model_validator(mode="after")
    def _require_next_action_unless_manager_note(self) -> "ActivityCreate":
        # BR-ACT-04: every customer interaction must capture a Next Action.
        # MANAGER_NOTE is internal manager-to-rep guidance, not a customer
        # interaction, and is exempt.
        if self.activity_type != "MANAGER_NOTE":
            if not self.next_action_text:
                raise ValueError("Next Action is required to log this activity.")
            if not self.next_action_due_date:
                raise ValueError("Next Action Due Date is required to log this activity.")
        return self
```

`ActivityService` gets a second constructor dependency, mirroring
`OpportunityService(repository, split_repository, ...)`:

```python
class ActivityService:
    def __init__(self, repository: ActivityRepository, reminder_repository: ReminderRepository):
        self.repository = repository
        self.reminder_repository = reminder_repository
```

`log_activity()` becomes (still one DB session/one commit — `get_db` commits
once after the router returns, services never call commit/rollback):

```python
def log_activity(self, data: ActivityCreate, *, created_by: uuid.UUID) -> tuple[Activity, Reminder | None]:
    # BR-ACT-01 checks unchanged (account required, opportunity optional-if-present)
    activity = Activity(..., created_by=created_by)
    activity = self.repository.create(activity)  # add() + flush() -> activity.id populated

    # BR-ACT-04: MANAGER_NOTE is exempt (schema validator already guarantees
    # next_action_text/next_action_due_date are populated for every other
    # activity_type, so a plain truthiness check here is sufficient - no
    # duplicate activity_type branch needed).
    reminder = None
    if data.next_action_text and data.next_action_due_date:
        resolved_owner = data.next_action_owner_id or activity.user_id
        reminder = Reminder(
            activity_id=activity.id,
            assigned_to_user_id=resolved_owner,
            due_date=data.next_action_due_date,
            reminder_text=data.next_action_text,
            is_completed=False,
            created_by=created_by,
            updated_by=created_by,
        )
        reminder = self.reminder_repository.create(reminder)  # add() + flush()
    return activity, reminder
```

No FK-existence check is added for `next_action_owner_id` beyond the Pydantic
UUID type and the DB FK constraint — matching how `Activity.user_id` /
`Reminder.assigned_to_user_id` are handled today (no explicit user-exists
check exists in the codebase for either field currently).

Router wiring (`backend/app/domains/activity/router.py`):

```python
def _get_activity_service(db: Session = Depends(get_db)) -> ActivityService:
    return ActivityService(
        repository=ActivityRepository(db),
        reminder_repository=ReminderRepository(db),
    )
```

`ActivityResponse` should expose the created reminder's id so the frontend
doesn't need a second round trip. Add:

```python
class ActivityResponse(BaseModel):
    ...
    next_action_reminder_id: uuid.UUID | None = None
```

### Q2 — MANAGER_NOTE / other activity_types exempt from mandatory Next Action?

**Revised 2026-07-03 — overridden by Basheer.** `MANAGER_NOTE` IS exempt from
mandatory Next Action capture. Rationale, per Basheer: a Manager Note is
internal manager-to-rep guidance (BR-ACT-02) — it is not a customer
interaction and does not represent a follow-up commitment to a hospital or
account. Forcing a due date on internal notes would be meaningless friction,
not a real business need.

All other `activity_type` values (`VISIT`, `CALL`, `EMAIL`, `MEETING`,
`NOTE`) still require `next_action_text` + `next_action_due_date`, matching
PRD §4.3 literally for genuine customer interactions. Enforcement moves from
"always required" to "required unless `activity_type == MANAGER_NOTE`" via
the `model_validator` shown in Q1 above — this is a schema-layer conditional
requirement, not a service-layer branch, so a malformed request is rejected
with a 422 before any DB write happens.

The frontend `LogActivityModal.tsx` must mirror this at the UI layer: when
`activityType === "MANAGER_NOTE"`, hide (not just disable) the Next
Action/Due Date/Owner fields and omit the client-side required-field guards
for them — see §9 below.

### Q3 — ReminderResponse enrichment: nested Activity/Account/Opportunity context

Confirmed zero new queries needed. Evidence from the existing codebase
(`backend/app/domains/account/repository.py` lines 30–42): SQLAlchemy applies
each relationship's mapper-level `lazy=` strategy on every query of that
entity by default, cascading transitively through chained relationships that
are also `lazy="joined"`, unless explicitly suppressed with
`.options(noload(...))`. The codebase relies on this exact mechanism today
(`AccountRepository.list_accounts` explicitly `noload()`s 8
`lazy="selectin"` relationships specifically to avoid the automatic cascade —
proving the automatic cascade is real and is the default, not an opt-in).
Chain for reminders: `Reminder.activity` (`lazy="joined"`) →
`Activity.account` / `Activity.opportunity` / `Activity.user` (all
`lazy="joined"`) all resolve as one SQL statement with chained LEFT OUTER
JOINs. `Reminder.assigned_to_user` is already `lazy="joined"` too. No
`.options(joinedload(...))` chain is required in
`ReminderRepository.list_for_user`. This is a to-one chain (not a
fan-out/selectin case like Account's), so there is no N+1 or
row-multiplication risk for the ≤100-row paginated `GET /reminders` list.

One caveat to flag: `Activity.reminders` is `lazy="select"` (correct — do not
touch it) so there is no risk of the join looping back into a reminder list.

New nested schema (`backend/app/domains/activity/schemas.py`):

```python
class AccountNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str

class OpportunityNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str

class ActivityContextNested(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    activity_type: str
    activity_date: datetime
    account: AccountNested
    opportunity: OpportunityNested | None

class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    activity_id: uuid.UUID
    assigned_to_user_id: uuid.UUID
    due_date: datetime
    reminder_text: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    assigned_to_user: UserNested
    activity: ActivityContextNested   # NEW - replaces bare activity_id-only context
```

Check the `Account` model / `Opportunity` model for the exact `name`
attribute before implementing (confirmed: `Account.name` at
`backend/app/domains/account/models.py:26`, `Opportunity.name` at
`backend/app/domains/opportunity/models.py:36`).

### Q4 — Frontend data-fetching approach for NextActionsScreen.tsx

**Definitive: React Query (`@tanstack/react-query`)**, matching
`OpportunityPipelineScreen.tsx` (`useQuery({ queryKey: ["pipeline", ...], ... })`,
`staleTime: Infinity` for reference data). The SWR-module-cache pattern in
`docs/Frontend-Implementation-Standards.md` §4.1 predates the React
Query/MUI/TS migration (per git log "Step 1 — MUI + React Query +
TypeScript infrastructure") and is superseded for any new TypeScript screen.
Do not mix patterns.

Because Next Actions is reached via a primary nav item (not a tab nested
inside a detail screen), and the §6.3 "swallow tab fetch errors into an
empty state" guidance is scoped to tabs-within-a-detail-screen, use judgment
here: show a real error state (MUI `Alert severity="error"` + retry) on fetch
failure rather than a bare empty state, since a silent empty list on a
primary "what do I need to do today" screen is actively misleading (a rep
would believe they have zero follow-ups when the request actually failed).
Empty state (no error) still applies for the genuine "0 pending reminders"
case.

Data flow:

```typescript
const [includeCompleted, setIncludeCompleted] = useState(false);
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ["reminders", includeCompleted],
  queryFn: () => listReminders(includeCompleted),
});
```

Overdue visual treatment: `new Date(r.due_date) < new Date() && !r.is_completed`
→ red/amber badge, matching existing badge patterns in
`OpportunityPipelineScreen.tsx`'s `StatusBadge`.

"Mark Complete": use a `useMutation` wrapping `patchReminder(id, true)`, then
`queryClient.invalidateQueries({ queryKey: ["reminders"] })` in `onSuccess`
(invalidates both `includeCompleted` variants) — this mirrors
`LogActivityModal.tsx`'s existing `queryClient.invalidateQueries({ queryKey: ["activities", ...] })`
call pattern (manual `invalidateQueries` after a service call there, not
wrapped in `useMutation`; either is acceptable — recommend `useMutation` here
since it gives `isPending` for a per-row "Completing..." disabled state
without extra local state wiring).

---

## File-by-file plan, in implementation order

### 1. Backend schema — `backend/app/domains/activity/schemas.py`
- Add `AccountNested`, `OpportunityNested`, `ActivityContextNested` (new).
- Extend `ActivityCreate` with `next_action_text: str | None = Field(default=None, min_length=1)`,
  `next_action_due_date: datetime | None = None`, `next_action_owner_id: uuid.UUID | None = None`,
  plus the `@model_validator(mode="after")` from Q1 that requires
  `next_action_text`/`next_action_due_date` unless `activity_type == "MANAGER_NOTE"`.
- Add `next_action_reminder_id: uuid.UUID | None = None` to `ActivityResponse`
  (stays `None` for Manager Notes — no Reminder is created for them).
- Keep `ReminderResponse.activity_id` as-is (flat FK still useful), add new
  `activity: ActivityContextNested` field.

### 2. Backend models — no changes
`Activity` / `Reminder` models are correct as-is; confirmed no new columns —
next-action data lives entirely in the existing `reminder` table. No Alembic
migration.

### 3. Backend service — `backend/app/domains/activity/service.py`
- `ActivityService.__init__` gains `reminder_repository: ReminderRepository` param.
- `log_activity()` return type changes to `tuple[Activity, Reminder | None]`
  per Q1/Q2; creates and flushes the linked Reminder inside the same method,
  same DB session, same transaction (one commit, in `get_db`, after router
  returns) — no new commit boundaries introduced. Reminder creation is
  skipped (returns `None`) when `next_action_text`/`next_action_due_date`
  are absent, which the schema validator guarantees only happens for
  `MANAGER_NOTE`.
- `ReminderService` — unchanged.

### 4. Backend router — `backend/app/domains/activity/router.py`
- `_get_activity_service` passes `reminder_repository=ReminderRepository(db)`.
- `log_activity` endpoint: unpack `activity, reminder = service.log_activity(...)`,
  build `ActivityResponse.model_validate(activity)`, then set
  `.next_action_reminder_id = reminder.id if reminder else None` before
  returning (will be `None` for Manager Notes).
- No other router changes — `GET /reminders`, `POST /reminders`,
  `PATCH /reminders/{id}` endpoints unchanged (schema enrichment in
  `ReminderResponse` is transparent to them).

### 5. Backend repository — `backend/app/domains/activity/repository.py`
- No changes required. `ReminderRepository.list_for_user` already does a bare
  `select(Reminder)` — the new nested `ActivityContextNested` field is
  populated automatically via the `lazy="joined"` cascade (Q3). Do NOT add
  `.options(joinedload(...))` — it would be redundant with the mapper
  defaults and inconsistent with how the rest of the codebase relies on
  defaults (only `noload()` is used to override, never additive `joinedload()`
  for already-`lazy="joined"` relationships — see `opportunity/repository.py`
  "Re-query so relationship is loaded" comments, which apply only after
  bulk-delete+insert, not to plain `select()`).

### 6. Backend tests — `backend/tests/domains/activity/test_activity_service.py`
This is the only existing test file (no separate `test_reminder_service.py`
exists — both services are tested here today).
- Update `TestLogActivity._data()` helper: add
  `next_action_text="Follow up next week"`, `next_action_due_date=NOW`,
  `next_action_owner_id=None` to the `defaults` dict so all 7 existing
  `TestLogActivity` tests keep constructing valid `ActivityCreate` instances.
- Every `ActivityService(repository=repo)` call site in `TestLogActivity`
  needs to become `ActivityService(repository=activity_repo, reminder_repository=reminder_repo)`;
  add a `reminder_repo = _make_reminder_repo()` with
  `reminder_repo.create.return_value = _make_reminder()` alongside each
  `activity_repo` setup in that class.
- Update `test_returns_activity_from_repo`: return value changes from
  `Activity` to `tuple[Activity, Reminder]` — adjust assertion to
  `assert result[0] is activity`.
- New tests to add (new `TestLogActivityReminderCreation` class):
  - `test_creates_linked_reminder_with_activity_id`: assert
    `reminder_repo.create.call_args[0][0].activity_id == activity.id`
    (confirm `_make_activity()` already sets `.id` — it does).
  - `test_reminder_owner_defaults_to_activity_user_id_when_omitted`.
  - `test_reminder_owner_uses_explicit_next_action_owner_id_when_provided`.
  - `test_reminder_fields_from_next_action_data` (text, due_date passthrough).
  - `test_reminder_created_by_set_to_actor`.
  - `test_manager_note_creates_no_reminder`: `ActivityCreate(activity_type="MANAGER_NOTE", next_action_text=None, next_action_due_date=None, ...)`,
    assert `reminder_repo.create.assert_not_called()` and `result[1] is None`
    (BR-ACT-04 exemption).
- New schema-level tests (add near top or a new `TestActivityCreateValidation`
  class):
  - `ActivityCreate(activity_type="VISIT", ...)` (or any non-MANAGER_NOTE
    type) without `next_action_text` / `next_action_due_date` raises
    `pydantic.ValidationError` — confirms mandatory-field enforcement per
    PRD §4.3 for genuine customer interactions.
  - `ActivityCreate(activity_type="MANAGER_NOTE", ...)` **without**
    `next_action_text` / `next_action_due_date` constructs successfully (no
    `ValidationError`) — confirms the BR-ACT-04 exemption at the schema layer.
  - `ActivityCreate(activity_type="MANAGER_NOTE", next_action_text="...", next_action_due_date=NOW)`
    also constructs successfully — providing next-action fields on a
    Manager Note is allowed, just not required (the validator only enforces
    a floor, it doesn't forbid the fields being set).
- Consider a new `backend/tests/domains/activity/test_reminder_response_schema.py`
  (or extend the existing file) asserting `ReminderResponse.model_validate()`
  on a `MagicMock(spec=Reminder)`-with-loaded-activity-and-assigned_to_user
  tree produces the nested `activity.account` / `activity.opportunity` shape —
  a plain unit test, not a DB integration test, consistent with this file's
  fully-mocked-repository style.

### 7. Frontend types regeneration
Run `npm run generate:types` from `sales-os-app/` (exact script confirmed:
`"generate:types": "openapi-typescript http://localhost:8000/api/v1/openapi.json -o src/types/api.ts"`
in `sales-os-app/package.json`). Requires the backend running locally first
(`http://localhost:8000`). Do this after steps 1–4 are implemented and the
backend is running, before touching frontend files that reference the new
fields — this regenerates `sales-os-app/src/types/api.ts` (`ActivityResponse`,
`ReminderResponse` interfaces) so TypeScript compilation catches any
frontend/backend drift immediately. Do not hand-edit `api.ts`.

### 8. Frontend service — `sales-os-app/src/services/activities.ts`
- Extend `LogActivityPayload` interface with:
  `next_action_text: string; next_action_due_date: string; next_action_owner_id?: string;`
- `logActivity()` body unchanged (already forwards the whole payload object).
- No other function signatures change — `listReminders`, `createReminder`,
  `patchReminder` untouched.

### 9. Frontend modal — `sales-os-app/src/components/LogActivityModal.tsx`
Add three fields + state, following the exact existing patterns in this file.
**These three fields are conditional on `activityType !== "MANAGER_NOTE"`**
(BR-ACT-04 exemption) — this is a new UI branch, not present in the file today:
- `nextActionText` state (text input).
- `nextActionDueDate` state, reuse the existing `nowLocal()` helper pattern —
  consider defaulting to +1 day instead of "now" since a next-action due
  "now" is an odd default (e.g. a new `nowPlusDaysLocal(1)` helper mirroring
  `nowLocal()`); use judgment, not load-bearing.
- `nextActionOwnerId` state, defaulting to `currentUserId` — reuse the same
  `users` state / `listUsers()` fetch already wired for "Assigned To"; do not
  add a second user-fetch call.
- Reset these three in the `useEffect` `isOpen` reset block alongside the
  existing resets (reset regardless of type, so switching from another type
  to MANAGER_NOTE and back doesn't leak stale values).
- `handleSubmit()` guards, matching the existing `throw new Error(...)`
  pattern, **gated on activity type**:
  ```ts
  if (activityType !== "MANAGER_NOTE") {
    if (!nextActionText.trim()) throw new Error("Next Action is required");
    if (!nextActionDueDate) throw new Error("Next Action Due Date is required");
  }
  ```
  For `MANAGER_NOTE`, skip these checks entirely — no error, no fields sent.
- Pass through in the `logActivity({...})` call: when `activityType !== "MANAGER_NOTE"`,
  send `next_action_text` (trimmed), `next_action_due_date` (ISO string),
  `next_action_owner_id` (or undefined); when `activityType === "MANAGER_NOTE"`,
  omit all three (send `undefined`) so the backend's schema validator sees
  them as absent, matching the exemption in Q1/Q2.
- JSX: render the 3 next-action fields inside
  `{activityType !== "MANAGER_NOTE" && ( ... )}` — hide them entirely for
  Manager Notes rather than disabling/greying them out, so the form doesn't
  visually imply a requirement that doesn't apply. Mirror the existing
  `cls`/`lbl` styling constants; grouped logically near "Assigned To"/before
  Notes when visible.
- New invalidation: after `logActivity()` succeeds, also
  `queryClient.invalidateQueries({ queryKey: ["reminders"] })` — safe to call
  unconditionally even for Manager Notes (a no-op if no reminder query is
  mounted / no new reminder was created) so an already-mounted
  `NextActionsScreen` picks up any newly auto-created reminder without a
  manual refresh.

### 10. Frontend screen — `sales-os-app/src/screens/NextActionsScreen.tsx` (NEW)
Structure mirrors `OpportunityPipelineScreen.tsx`:
- Props: none required (reads `assigned_to_user_id == current_user`
  server-side via existing `GET /reminders` auth-scoped filter — no
  `accountId`/`userId` prop needed, matches `listReminders()`'s existing signature).
- Local state: `includeCompleted` toggle (pending/completed tab or checkbox).
- `useQuery({ queryKey: ["reminders", includeCompleted], queryFn: () => listReminders(includeCompleted) })`.
- `useMutation` wrapping `patchReminder(id, true)` → `onSuccess`:
  `queryClient.invalidateQueries({ queryKey: ["reminders"] })`.
- Row rendering: due date, overdue badge
  (`due_date < now && !is_completed`), `reminder_text`, nested context line from
  `reminder.activity` — e.g. `reminder.activity.account.name` plus (if present)
  `reminder.activity.opportunity.name`, `activity_type`/`activity_date` as
  secondary metadata — this is exactly the human-readable context ADR-023 +
  the `ActivityContextNested` schema addition unlock; without it the list
  would show nothing but a bare `reminder_text` string.
- Error state per Q4: `isError` → `Alert severity="error"` + retry button
  calling `refetch()`. Loading state: skeleton/spinner consistent with
  `OpportunityPipelineScreen.tsx`'s `isLoading` block. Empty state (0 items, no
  error): friendly "all caught up" message.
- No "create reminder standalone" UI in Phase 1 — reminders are only
  created as a side effect of `LogActivityModal` per the mandatory-next-action
  design; `POST /reminders` remains available as a raw API but is not exposed
  via a dedicated frontend form (out of scope — PRD does not call for a
  reminder-only creation flow).

### 11. Frontend nav wiring — `sales-os-app/src/DemoApp.tsx`
- Import `NextActionsScreen` from `"./screens/NextActionsScreen"`.
- `NAV_SECTIONS`: add to the "SALES EXECUTION" section (daily-use screen, same
  tier as Account Management/Pipeline, not Administration):
  `{ id: "nextActions", label: "Next Actions", icon: "✅" }`
- Always-mounted container, same pattern as catalog/opportunities (placed
  near those two, after the Product Catalog block):
  ```tsx
  <div className={`flex-1 overflow-hidden flex flex-col ${view === "nextActions" ? "" : "hidden"}`}>
    <NextActionsScreen />
  </div>
  ```
- Pending-count badge on the nav item: nice-to-have, not blocking for the
  July 13 demo — note as a fast-follow, would need a lightweight
  `useQuery(["reminders", false])` at the `DemoApp` level or a shared count
  endpoint; skip for Phase 1 to keep scope tight.

---

## Documentation deliverables

Explicit, required per the repo's authoritative-references policy — conflicts
must be resolved by updating docs, not diverging silently.

### `docs/Business-Rules.md` — new BR-ACT-04, inserted after BR-ACT-03 (before the closing `---` at line 218)

```markdown
### BR-ACT-04: Mandatory Next Action Capture (PRD §4.3)
* **Rule:** Every logged Activity must capture a Next Action (free text),
  a Due Date, and an Owner, EXCEPT when `activity_type == MANAGER_NOTE`.
  The interaction cannot be saved without these fields for any other
  activity_type.
* **Implementation:** Enforced at the Pydantic schema layer via a
  conditional validator (`ActivityCreate.next_action_text` /
  `.next_action_due_date` are required unless `activity_type` is
  `MANAGER_NOTE`) and realized as a Reminder record auto-created in the
  same transaction as the Activity it belongs to (see ADR-023 — Reminders
  are Activity-linked, not a separate user-initiated entity in this flow).
  No Reminder is created when the exemption applies.
* **Owner default:** If no explicit owner is provided, the Next Action Owner
  defaults to the Activity's `user_id` (the person the interaction is
  logged against).
* **Scope / exemption:** Applies to all activity_type values EXCEPT
  MANAGER_NOTE. A Manager Note is internal manager-to-rep guidance
  (BR-ACT-02), not a customer interaction — it carries no follow-up
  commitment to an account, so mandatory next-action capture does not
  apply to it.
* **Purpose:** Ensures every genuine customer interaction produces a
  trackable, assigned follow-up, closing the loop between activity logging
  and the Reminders/Tasks system (§7.2 of `docs/API-Catalog.md`), without
  forcing meaningless due dates onto internal notes.
```

### `docs/API-Catalog.md` §7.1 — update the `POST /activities` description

Change the current "7.1 Activities" block (Purpose / Endpoints /
Justification) to:
- **Purpose:** add a sentence noting every Activity mandatorily captures a
  linked Next Action (BR-ACT-04) and that `POST /activities` atomically
  creates the Activity and its follow-up Reminder in one request/transaction.
- **Endpoints:** add the already-shipped but currently undocumented
  `GET /opportunities/{id}/activities` line (pre-existing drift, not
  introduced by this plan — fix while touching this section), and annotate
  `POST /activities` with "(request body includes `next_action_text`,
  `next_action_due_date`, optional `next_action_owner_id` — BR-ACT-04)".
- **Justification:** append "Mandatory next-action fields enforce BR-ACT-04
  (PRD §4.3) at the API boundary."

### `docs/ADR.md` — no new ADR needed
ADR-023 already covers Reminder-to-Activity context traversal; the
`ActivityContextNested` response enrichment is a Pydantic-layer realization of
ADR-023, not a new architectural decision. No edit to `ADR.md` required.

### `docs/Physical-Schema.sql` — no changes
Confirmed by direct read (activity table lines 270–282, reminder table lines
284–295): no new columns, no Alembic migration. Next-action data is fully
representable in the existing `reminder` table's `due_date`, `reminder_text`,
`assigned_to_user_id` columns.

---

## Implementation order (summary)

1. `backend/app/domains/activity/schemas.py` — new/extended schemas
2. `backend/app/domains/activity/service.py` — `ActivityService` constructor + `log_activity()`
3. `backend/app/domains/activity/router.py` — DI wiring + response assembly
4. `backend/tests/domains/activity/test_activity_service.py` — update existing
   + add new tests; run `pytest backend/tests/domains/activity/`
5. `docs/Business-Rules.md` (BR-ACT-04) and `docs/API-Catalog.md` (§7.1) updates
6. Start backend locally, run `npm run generate:types` in `sales-os-app/` to
   regenerate `src/types/api.ts`
7. `sales-os-app/src/services/activities.ts` — `LogActivityPayload` extension
8. `sales-os-app/src/components/LogActivityModal.tsx` — new fields +
   validation + invalidation
9. `sales-os-app/src/screens/NextActionsScreen.tsx` — new screen (React Query)
10. `sales-os-app/src/DemoApp.tsx` — nav entry + always-mounted container + import
11. Manual verification: log an activity end-to-end, confirm a Reminder
    appears in `NextActionsScreen`, mark it complete, confirm it disappears
    from the pending view and appears under "include completed."

---

## Critical files for implementation
- `backend/app/domains/activity/schemas.py`
- `backend/app/domains/activity/service.py`
- `backend/app/domains/activity/router.py`
- `backend/tests/domains/activity/test_activity_service.py`
- `sales-os-app/src/components/LogActivityModal.tsx`
- `sales-os-app/src/screens/NextActionsScreen.tsx` (new)
- `sales-os-app/src/DemoApp.tsx`
