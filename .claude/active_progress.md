# Active Progress — Cabio Sales OS
_Session: 2026-07-30_

## Current task — STOP HERE FIRST

**Phase 2E (Tasks 1-10) is fully complete, committed, and documented** —
full checklist and detail archived in `docs/Progress-Archive-2026-07.md`.

**BR-ACT-05 built this session (uncommitted): Reminder completion now
requires documenting what was done to close it out**, mirroring BR-ACT-04
(Activity → mandatory Next Action) in reverse. Hard requirement, enforced at
the API/schema layer, not just the UI (Basheer's explicit call) — completing
a reminder without an Activity Type, Date, and Notes is rejected.

- **Data model:** `reminder` gains nullable `closing_activity_id` (migration
  `0013`), distinct from the existing `activity_id` (the *creating*
  activity, BR-ACT-04). `Reminder` model needed explicit `foreign_keys=`
  on both relationships once it had two FKs to `activity`.
- **Backend:** `ReminderUpdate` gains a conditional validator (`activity_type`/
  `activity_date`/`notes` required when `is_completed=True`; `MANAGER_NOTE`
  rejected as a closing type — internal guidance, not a customer
  interaction). `ReminderService.patch_reminder` atomically creates the
  closing Activity (inheriting account/opportunity/project from the
  reminder's own creating activity) and sets `closing_activity_id`, gated on
  a new `ActivityRepository` dependency mirroring `ActivityService`'s own
  constructor shape. `ReminderResponse`/`ActivityContextNested` gained
  fields to expose it (`notes` was missing from the latter). New migration
  bumped the `test_persistence.py` relationship-count canary 88 → 89.
  375/375 backend tests passing, ruff clean.
- **Frontend:** new `CloseReminderModal.tsx` (type/date/notes form, reuses
  `FormModal`). `NextActionsScreen.tsx`'s "Mark to complete" now opens it
  instead of firing the completion call directly — `patchReminder()`
  replaced with `completeReminder()`. `ReminderRow.tsx`'s `onComplete` now
  passes the full reminder (was just the id) and shows a "Closed via X on
  Y: notes" line when `closing_activity` is present — same shared component
  used by the Opportunity Detail Next Actions tab, so it gets this for
  free. The closing Activity is a normal Activity record, so it belongs in
  the Activity tab automatically, same reasoning as before — but the tab's
  React Query cache had no way to know a new one had landed, same shape as
  the Task 9 Pipeline-cache regression. **Found during Basheer's manual E2E,
  fixed same session:** `CloseReminderModal.tsx` now invalidates
  `["activities", "account", ...]` and (when opportunity-linked)
  `["activities", "opportunity", ...]` after `completeReminder()` succeeds,
  using `reminder.activity.account`/`.opportunity` (already in hand from the
  reminder response) — mirrors `LogActivityModal.tsx`'s own self-contained
  invalidation exactly. `tsc --noEmit`/`npm run lint` clean. `types/api.ts`
  regenerated; hand-written alias block re-appended (regeneration wipes it
  every time — see the comment at the top of that block in the file itself).
- **Docs:** new `BR-ACT-05` in `Business-Rules.md`, matching `BR-ACT-04`'s
  style. Resolved entry removed from `Backlog.md` (also fixed a stale
  "folds into the already-pending Task 10" cross-reference in the
  neighboring sbu_id-nullable entry, since Task 10 is done now).

**Migration `0013` applied to the live dev DB 2026-07-30** — `alembic upgrade
head` ran clean (`0012` → `0013`); directly verified via `ADMIN_DATABASE_URL`
that `reminder.closing_activity_id` (nullable uuid), its index, and its FK
constraint all exist exactly as expected.

**Follow-up during Basheer's manual E2E: closing a reminder had no way to
capture a new follow-up discovered mid-interaction — added same session,
optional (not mandatory, Basheer's explicit call).** Reuses BR-ACT-04's own
mechanism (an Activity may optionally carry a Reminder) rather than
inventing a new one:
- Extracted `_maybe_create_next_action_reminder()` (module-level in
  `service.py`) out of `ActivityService.log_activity`'s inline block, now
  shared by both `log_activity` and `ReminderService.patch_reminder` — same
  logic either way, was about to be duplicated otherwise.
- `ReminderUpdate` gains optional `next_action_text`/`next_action_due_date`/
  `next_action_owner_id`; a validator rejects one-without-the-other but
  neither is required. `patch_reminder` attaches the new Reminder to the
  *closing* Activity (not the original one) when both are given.
- `CloseReminderModal.tsx` gained a Details/Follow-up **tabbed** layout,
  matching `LogActivityModal`'s own Details/Next Action tabs exactly (same
  tab-button styling) rather than a checkbox that expanded fields inline —
  Basheer's explicit UI call, changed after the first pass. Follow-up
  fields reuse `LogActivityModal`'s exact `["users", "assignable"]` /
  `scope=all` picker (BR-ACT-06 — any active user, no restriction). Since
  the follow-up is optional (unlike `LogActivityModal`'s own mandatory Next
  Action tab), "did the user actually want one" is derived from whether the
  Follow-up tab's fields are filled in (`hasFollowUp`), not from which tab
  is active when Complete is clicked — both fields start genuinely blank
  (not pre-filled with a "tomorrow" default the way `LogActivityModal`'s
  mandatory one is) so an untouched tab reads as "no follow-up," not
  accidentally-always-true. Follow-up tab label shows a "•" when filled in,
  so it's not silently missed on submit.
- No migration needed — reuses the existing `reminder`/`activity` shape.
  383/383 backend tests passing, ruff clean, `tsc --noEmit`/`npm run lint`
  clean. `types/api.ts` regenerated again (same alias-restore routine).
- `Business-Rules.md`'s `BR-ACT-05` entry updated with an "Optional
  follow-up" bullet rather than opening a new BR number — this is that same
  rule's existing mechanism, not a new one.

**Two small UI fixes found during Basheer's re-test of the Follow-up tab,
same session:**
- **Label/value overlap on "Assign To"** — every other `select` + `label` +
  `displayEmpty` combo in this codebase also passes
  `slotProps={{ inputLabel: { shrink: true } }}`; this field was missing
  it (copied from `LogActivityModal.tsx`'s "Assign Next Action To", which
  had the same pre-existing bug — fixed there too, same session, same
  one-line change, per Basheer's call).
- **Native `datetime-local` picker needs a click-away to confirm a
  selection** — browser-controlled popup, nothing to fix from React/CSS.
  Real fix: swapped the Follow-up tab's Due Date field to
  `@mui/x-date-pickers`' `DateTimePicker` (package + `dayjs` were already
  dependencies, `^9.7.0`, but neither was wired up anywhere in the app
  before this). Its popper has an explicit OK/Cancel action bar, solving
  both the click-away friction and directly answering Basheer's ask for "a
  button to close the picker." **Scoped to this one field only, Basheer's
  explicit choice** over doing it app-wide or leaving the native input with
  a hint — `LocalizationProvider`/`AdapterDayjs` wrapped locally around just
  this field, not lifted to the app root. If this expands to other
  date/time fields later, lift the provider up then, don't duplicate it
  per-field.
- `tsc --noEmit`/`npm run lint` both clean after each fix.

**Not yet committed** — Basheer to commit himself, same as usual.

**Next session starts here:** confirm the BR-ACT-05 commit landed, then the
Critical Care/Imaging manager hierarchy build-out is the one open thread —
blocked on Basheer creating 3 new Supabase Auth accounts (or providing a
service-role key so it can be done directly); see
`docs/Progress-Archive-2026-07.md`'s Phase 2E section for the confirmed plan.
