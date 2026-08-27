# Sales Development Activities — Implementation Plan

**Status:** Draft — planned, not yet built. Decided with Haroon 2026-08-27; full
discussion and reasoning in `docs/Discussion-Sales-Development-Activities-2026-08.md`
(not repeated here). This doc covers the concrete build.

## Context

Reps do things that build long-term capability — attending a conference, an
OEM/product training, getting certified, sales training, a seminar/trade show — with
no hospital/deal attached. Today `Activity.account_id` is `NOT NULL` for every single
activity type, so there's no way to log one of these at all. Haroon approved adding
six new activity types that don't require an account, plus (new, decided 2026-08-27)
including them in the Insights Dashboard's activity count and eventually giving
managers a real annual target for them — the KPI-target half is **out of scope here**,
tracked separately as `docs/Backlog.md`'s "Annual Development-Activity KPI" entry,
sequenced after this feature ships.

## Real gaps found during this pass, not in the original discussion doc

Two mandatory-field rules in `backend/app/domains/activity/schemas.py` apply to
*every* activity type today with no per-type exemption beyond `MANAGER_NOTE`. Both
would silently break these new types if not explicitly handled:

1. **BR-ACT-04 (Mandatory Next Action)** — `ActivityCreate`'s validator requires
   `next_action_text`/`next_action_due_date` unless `activity_type == "MANAGER_NOTE"`.
   Without an exemption, logging a Conference/Expo entry would be blocked unless the
   rep also invents a next-action follow-up, which makes no sense for this kind of
   entry.
2. **BR-ACT-05 (Mandatory Closing Activity)** — `ReminderUpdate`'s validator
   explicitly rejects `MANAGER_NOTE` as a valid closing activity type for completing
   a Reminder. The new types should be rejected the same way — a Reminder ("call this
   hospital by Friday") can't sensibly be closed out by logging a training entry.

Also: `BR-ACT-01`/`BR-ACT-03` currently enforce `account_id NOT NULL` as a blanket
database constraint, not a conditional one. Simply dropping `NOT NULL` (as the
discussion doc sketched informally) would remove that guarantee for *every* activity
type, not just the six new ones. **Corrected approach below: replace the blanket
`NOT NULL` with a `CHECK` constraint**, so every existing activity type keeps the
same database-level guarantee it has today, and only the six new types are exempted.

## Decisions (Basheer's call)

1. **Exempt the six new types from BR-ACT-04 (no mandatory next action) —
   decided 2026-08-27: yes.** Same reasoning as the existing `MANAGER_NOTE`
   exemption: these aren't a customer interaction, so there's no follow-up
   commitment to force.
2. **Exempt the six new types from being a valid BR-ACT-05 closing activity —
   decided 2026-08-27: yes.** A Reminder should only be closed by a real
   customer-facing action.
3. **`account_id` requirement enforced via a `CHECK` constraint, not a blanket
   `NOT NULL` drop — implementation technique, proceeding as proposed** (see gap
   above). Confirms `BR-ACT-01`/`BR-ACT-03` need amending to describe the exception
   precisely, not just loosened.
4. **`outcome_notes` as a new dedicated column, not a reuse of the existing `notes`
   field — implementation technique, proceeding as proposed.** The draft reply to
   Haroon promises two distinct fields ("a short Description, and an Outcome/Learning
   note") — reusing one field for both would lose that distinction. Small, additive
   column.
4a. **`notes` (the description field) required when `activity_type ==
    "OTHER_DEVELOPMENT"` — decided 2026-08-27: yes.** For the other five types, the
    type name itself says what happened ("Certification" means a certification). The
    catch-all type carries no such information — leaving `notes` optional there would
    let a rep log "Other Development" with nothing but an outcome note, no record of
    what was actually done. `notes` stays optional for the other five types (would be
    redundant friction on top of the type label already saying what it was).
5. **Exact `activity_type` enum values — confirmed by Haroon, 2026-08-27:**
   Conference/Expo, OEM/Product Training, Certification, Sales Training,
   Seminar/Trade Show, Other Development — matches what was built exactly, no
   label changes needed.
6. **Migration number — confirmed `0028`.** Decided with Basheer 2026-08-27: this
   feature builds before Referral Credit Part 2, so it takes the next number in
   build order — `Backlog.md`'s reservation for Referral Credit Part 2 bumped to
   `0029` accordingly. Re-check the actual highest migration on disk immediately
   before creating the file regardless — other work may land first.
7. **"Conference" `lead_source` seed row — confirmed missing, 2026-08-27
   (Basheer).** The draft reply promises reps can tag a new Lead's source as
   "Conference" (separate from this activity log entry). Confirmed against the live
   dropdown: not currently one of the options. Add it as a seed-data insert in this
   migration (see below) — no longer a build-time check, a firm step.

## Backend changes

### Migration — `backend/alembic/versions/0028_add_sales_development_activities.py`

```sql
ALTER TABLE activity ALTER COLUMN account_id DROP NOT NULL;

ALTER TABLE activity ADD CONSTRAINT chk_activity_account_required CHECK (
    account_id IS NOT NULL
    OR activity_type IN (
        'CONFERENCE_EXPO', 'OEM_PRODUCT_TRAINING', 'CERTIFICATION',
        'SALES_TRAINING', 'SEMINAR_TRADE_SHOW', 'OTHER_DEVELOPMENT'
    )
);

ALTER TABLE activity ADD COLUMN outcome_notes text;

-- Decision #7: confirmed missing from the live dropdown, 2026-08-27.
-- Naming matches the live table's existing ALL_CAPS_WITH_UNDERSCORES
-- convention (COLD_CALL, WEBSITE, ...), confirmed via a read-only query.
INSERT INTO lead_source (name, description, is_active)
VALUES ('CONFERENCE', 'Contact picked up at a conference/expo/trade show', true);
```

Naming follows the existing precedent for conditional constraints on this table
family — same style as `document`'s `chk_document_context` and
`installed_base_equipment`'s `chk_competitor_equipment` (`Physical-Schema.sql`).

No RLS policy change. `activity_tier_visibility` (`Physical-Schema.sql:2130`) already
branches only on `opportunity_id IS NULL`, not `account_id` — confirmed by reading the
live policy, not assumed. These new types will fall into that already-open bucket
exactly as flagged in `docs/Backlog.md`'s "Activity log privacy hole" entry — that's a
separate, already-tracked item, not fixed here.

### `backend/app/domains/activity/schemas.py`

- Extend `ActivityType` Literal with the six new values.
- Add one shared constant, reused everywhere the exemption applies instead of
  repeating literal comparisons three separate times (avoids the two rules drifting
  out of sync the way `MANAGER_NOTE`'s handling is currently duplicated across
  `schemas.py`/`service.py`/`LogActivityModal.tsx`):
  ```python
  SALES_DEVELOPMENT_ACTIVITY_TYPES = frozenset({
      "CONFERENCE_EXPO", "OEM_PRODUCT_TRAINING", "CERTIFICATION",
      "SALES_TRAINING", "SEMINAR_TRADE_SHOW", "OTHER_DEVELOPMENT",
  })
  ```
- `ActivityCreate`:
  - `account_id: uuid.UUID | None = None` (was required).
  - New `outcome_notes: str | None = None`.
  - `_require_next_action_unless_manager_note` → broaden the exemption check to
    `self.activity_type == "MANAGER_NOTE" or self.activity_type in
    SALES_DEVELOPMENT_ACTIVITY_TYPES`. Rename the validator/method to reflect the
    broader scope.
  - New validator: `account_id` required unless `activity_type in
    SALES_DEVELOPMENT_ACTIVITY_TYPES` (mirrors BR-ACT-01's exception).
  - New validator: `outcome_notes` required when `activity_type in
    SALES_DEVELOPMENT_ACTIVITY_TYPES` (BR-ACT-09).
  - New validator: `notes` required when `activity_type == "OTHER_DEVELOPMENT"`
    specifically (decision #4a) — not the other five Sales Development types.
- `ActivityResponse`, `ActivityReportRow`, `ActivityContextNested`: `account_id`/
  `account: AccountNested` → `AccountNested | None` (all three currently assume
  non-null); add `outcome_notes: str | None` to each.
- `ReminderUpdate._require_closing_activity_when_completing`: extend the
  `activity_type == "MANAGER_NOTE"` rejection to also reject
  `activity_type in SALES_DEVELOPMENT_ACTIVITY_TYPES`.

### `backend/app/domains/activity/models.py`

- `Activity.account_id: Mapped[uuid.UUID | None]` (was non-optional).
- New `Activity.outcome_notes: Mapped[str | None] = mapped_column(Text, nullable=True)`.
- `Activity.account: Mapped["Account | None"]` (was non-optional) — check every
  reader of `activity.account.*` for a null-safety gap, not just the two flagged
  below.

### `backend/app/domains/activity/service.py` / `repository.py`

- Audit for any code that assumes `activity.account_id`/`activity.account` is always
  present (e.g. building an `AccountNested` unconditionally, joins that implicitly
  filter out null-account rows). Full audit at build time — not enumerated here since
  it needs a fresh grep against the code at that point, not this plan's snapshot.
- Reuse `SALES_DEVELOPMENT_ACTIVITY_TYPES` from `schemas.py` in `service.py`
  wherever the Reminder-creation branch checks `activity_type != "MANAGER_NOTE"`
  (BR-ACT-04's realization step) — same constant, not a re-typed literal set.

### `Business-Rules.md`

- **BR-ACT-01 / BR-ACT-03**: amend to describe `account_id` as conditionally
  required — mandatory for every type except the six Sales Development Activity
  types, enforced via `chk_activity_account_required`, not a blanket `NOT NULL`.
- **BR-ACT-04**: amend the exemption list from "except `MANAGER_NOTE`" to "except
  `MANAGER_NOTE` and the Sales Development Activity types."
- **BR-ACT-05**: amend the closing-activity exclusion the same way.
- **New BR-ACT-09: Sales Development Activities.** The primary rule for this
  feature — the six new types, the account-optional exception, the required
  `outcome_notes` field, cross-references to the three amended rules above, and the
  explicit exclusions (no duration/hours field, no HR attendance/leave/payroll link,
  no automatic Lead-attribution link — a Lead's `lead_source` tag is the only
  connection). Confirm `BR-ACT-09` is still the next free number at build time.

### Tests

- New/extended tests in the existing Activity service/schema test files (mirror the
  `MANAGER_NOTE` exemption test pattern already in place for BR-ACT-04):
  - Creating a Sales Development Activity with no `account_id` succeeds.
  - Creating one without `outcome_notes` fails.
  - Creating an `OTHER_DEVELOPMENT` entry without `notes` fails (decision #4a); the
    other five types succeed with `notes` omitted.
  - Creating one does **not** create a Reminder (BR-ACT-04 exemption realized).
  - Creating a normal type (`VISIT`, etc.) with no `account_id` still fails —
    regression check that the `CHECK` constraint/validator still protects existing
    types.
  - A Sales Development Activity with an `account_id` provided still succeeds
    (optional, not forbidden).
  - Attempting to close a Reminder using a Sales Development type as the closing
    `activity_type` is rejected (BR-ACT-05 extension).
  - `ActivityReportRow`/`ActivityContextNested` serialize correctly with
    `account=None`.

## Frontend changes

### `sales-os-app/src/types/api.ts`

Regenerate (`generate:types` script) after the backend schema changes land — standard
step, same as every other backend-schema-touching plan in this repo.

### `sales-os-app/src/utils/activityTypes.ts`

Add six entries to `ACTIVITY_TYPE_CONFIG` (icon/label/bg/color) — this `Record` is
typed exhaustively over `ActivityType`, so `tsc` will fail to compile until all six
are added; that's a useful forcing function, not just a nice-to-have.

### `sales-os-app/src/components/LogActivityModal.tsx`

- Add the six new options to the `ACTIVITY_TYPES` list.
- Broaden the existing `isManagerNote`-gated logic (currently hides the "Next
  Action" tab and skips its validation only for `MANAGER_NOTE`) to a shared check
  covering `MANAGER_NOTE` plus the six new types — same
  `SALES_DEVELOPMENT_ACTIVITY_TYPES` idea as the backend, kept as one local constant
  so the two don't drift.
- `handleSubmit`'s `if (!resolvedAccountId) { ... throw new Error("Account is
  required"); }` (line 111) — skip this check when the selected type is a Sales
  Development type. Leave the account picker itself visible and usable (a rep can
  still optionally tag an account if relevant, e.g. a hospital-hosted training) —
  just stop requiring it.
- Add a required "Outcome/Learning" `TextField`, shown only when a Sales Development
  type is selected, wired to the new `outcome_notes` field.
- The existing `notes` `TextField` (Description) becomes conditionally required —
  required specifically when `activityType === "OTHER_DEVELOPMENT"` (decision #4a),
  optional otherwise, unchanged for every other type.

### `sales-os-app/src/components/CloseReminderModal.tsx` / `ReminderRow.tsx`

Both already have `MANAGER_NOTE`-aware logic (matched the same grep as
`LogActivityModal.tsx`) — check whether either offers activity-type options for
*closing* a Reminder; if so, exclude the six new types there too, so the UI doesn't
let a rep pick an option the backend will reject (BR-ACT-05 extension above).

### `sales-os-app/src/screens/DailyActivityReportScreen.tsx`

Line 59, `{row.account.name}` — will throw on any row with a null `account` once
these entries start flowing through. Real bug to fix as part of this build, not
optional: `{row.account?.name ?? "—"}` (or similar). This is also where these new
entries will appear automatically, with zero other changes needed — confirmed via
`docs/Discussion-Sales-Development-Activities-2026-08.md`'s Reporting & Visibility
section.

**Second real gap, found live on Dev 2026-08-27 (Basheer, during manual E2E):**
`ReportRow` already renders `row.notes` inline when present, but never referenced
`row.outcome_notes` anywhere — meaning the one field BR-ACT-09 actually requires,
the whole point of these entries, was invisible on the only screen these
unattached activities ever appear on. Fixed: a second, labeled box ("Outcome/
Learning:") renders below `notes` when `outcome_notes` is present, color-matched
to the activity type's own badge color (`cfg.color`/`cfg.bg`) so it reads as
belonging to that entry, not as a generic second comment. Verified live —
`Other Development` entries (which always have both `notes` and `outcome_notes`)
now show both, clearly distinguished.

**Follow-on, same session:** Basheer asked for the same explicit labeling on
`notes` itself — added uniformly across all activity types at first, but that
put a "DESCRIPTION:" label on every single entry with a description, even
though 11 of 12 activity types only ever show one box and never needed
disambiguating in the first place. Flagged as clutter and corrected:
**labels only render when both `notes` and `outcome_notes` are present on the
same row** (`Other Development` only, the sole case where two boxes actually
need telling apart) — every other type/entry goes back to a single, unlabeled
box, exactly as it always worked. Verified live: `Call`/`Sales Training`
entries show a plain unlabeled box again; `Other Development` still shows both
"DESCRIPTION:" and "OUTCOME/LEARNING:" clearly distinguished.

No other screen changes, no new nav entry — this rides the existing global "+ Log
Activity" button (`DemoApp.tsx`), which already opens `LogActivityModal` with no
fixed account, exactly the entry point these new types need.

## Out of scope for this pass

- **Annual Development-Activity KPI** (manager-set target, actual-vs-target
  attainment) — separate item, `docs/Backlog.md`, sequenced after this feature and
  Target Planning both ship.
- **Insights Dashboard's `RepActivityLevelResponse` counting these activities** —
  already decided (include them), but that's Insights Dashboard's own build, not
  this one; this plan only needs the data to exist and be queryable, which it will
  be as soon as this ships.
- **Activity log privacy hole** (unattached activities visible company-wide) —
  tracked separately in `docs/Backlog.md`, deliberately not fixed here (see
  Migration section above).
- Attendance/roster proof, hours/duration tracking, HR attendance/leave/payroll
  linkage, automatic Lead-attribution reporting beyond the existing `lead_source`
  tag — all explicitly excluded per the Haroon discussion, not partial builds to
  revisit later without a deliberate decision to do so.

## Verification

- Backend: `pytest` (new/extended tests above), `ruff check app/domains/activity/`.
- Frontend: `tsc --noEmit` (will fail until `ACTIVITY_TYPE_CONFIG` covers all six new
  types — expected, not a bug to work around), `npm run lint`.
- Manual, on Dev: log each of the six new types with no account attached, confirm no
  Reminder is created and the entry appears in Daily Activity Report with a blank
  account cell (not a crash); attempt to log one without `outcome_notes` and confirm
  it's blocked; log a normal type (e.g. `VISIT`) and confirm the account requirement
  is unchanged (regression); attempt to close an existing Reminder using a Sales
  Development type and confirm it's rejected; confirm a Sales Development type
  logged *with* an account attached still works.
