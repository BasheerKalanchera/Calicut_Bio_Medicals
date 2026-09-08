# Manager Note Notification — Implementation Plan

**Status:** Approved, ready to build. **Raised:** 2026-09-08, Haroon (phone
call to Basheer) — the rep a `MANAGER_NOTE` is about gets no notification
today. **Decisions confirmed** (Basheer, 2026-09-08): both passive and
urgent notifications are needed — the manager ticks an "Urgent" flag at
note-creation time; ticked → urgent (pops `UrgentNotificationDialog`)
and shows in the bell; unticked → passive (bell only), same as every
other awareness-only notification type today.

## Problem

`MANAGER_NOTE` (BR-ACT-02) is an Activity type carrying internal
manager-to-rep guidance, logged against the rep via Activity's own
`user_id` ("the person the interaction is logged against," BR-ACT-04).
Nothing tells that rep it was written. The `notification` table already
exists and was deliberately built generic
(`backend/app/domains/notification/models.py:17-19`) for exactly this
kind of extension — no migration needed for the notification row itself.

## What this needs beyond the existing notification pattern

Every existing `notify_*` method hardcodes `is_urgent=False` — urgency has
never before been a per-call, caller-supplied choice (see
`notification/service.py`'s `notify_opportunity_assigned` and
`notify_gate_override_named` comments on why they're always non-urgent).
This is the first notification type where urgency is a real per-instance
decision made by the person triggering it, not baked into the type.

**Not persisted on `activity` itself.** `Notification.is_urgent` is
already documented as "frozen at creation — a point-in-time event, not a
live view" (`notification/models.py:29-31`). The manager's urgent tick
only needs to seed that one frozen value on the `Notification` row; there
is no need to also add a column to the immutable `activity` table. (If a
later need arises to show "this note was flagged urgent" directly on the
Activity Timeline itself, that's a separate, deferred ask — see below.)

## Backend

1. **`backend/app/domains/activity/schemas.py`** — `ActivityCreate` gains
   `is_urgent: bool = False`. New validator: reject `is_urgent=True` when
   `activity_type != "MANAGER_NOTE"` (urgency only makes sense for the one
   type this exists for).
2. **`backend/app/domains/activity/service.py`** — `ActivityService`
   gains a `notification_service: NotificationService` constructor
   dependency, same shape as `OpportunityService`
   (`opportunity/router.py:40-43`). At the end of `log_activity`, when
   `activity.activity_type == "MANAGER_NOTE"` and `activity.user_id !=
   created_by` (skip self-notify — a manager logging a note against
   their own name, if that ever happens), call
   `notification_service.notify_manager_note_added(recipient_user_id=
   activity.user_id, activity_id=activity.id, actor_id=created_by,
   is_urgent=data.is_urgent)`.
3. **`backend/app/domains/activity/router.py`** — `_get_service` (or
   equivalent DI function) wires in `NotificationService(repository=
   NotificationRepository(db))`, same one-line pattern as
   `opportunity/router.py:37-43`.
4. **`backend/app/domains/notification/service.py`** — new
   `notify_manager_note_added(*, recipient_user_id, activity_id, actor_id,
   is_urgent)`: creates `Notification(type="MANAGER_NOTE_ADDED",
   entity_type="activity", entity_id=activity_id, is_urgent=is_urgent,
   created_by=actor_id)`. Unlike every existing `notify_*` method,
   `is_urgent` is a real parameter here, not a hardcoded `False`.
5. **`backend/app/domains/notification/repository.py`** —
   `_enriched_select` needs a new case: outer-join `Activity` where
   `Notification.entity_type == "activity" AND Activity.id ==
   Notification.entity_id`, then resolve `Account.name` via
   `Activity.account_id` (MANAGER_NOTE requires an account per BR-ACT-01,
   so this is never null in practice) — same `case()` pattern already
   used for `opportunity`/`marketing_lead`. **Also select
   `Activity.opportunity_id` and `Activity.account_id` directly** — both
   already live on the `activity` row itself, so no extra join is needed
   for these two (unlike `account_name`, which requires the join to
   resolve a display string).
6. **`backend/app/domains/notification/schemas.py`** — `NotificationResponse`
   needs two new fields: `account_id: uuid.UUID | None = None` and
   `opportunity_id: uuid.UUID | None = None`. **This is a genuine gap in
   the existing schema, not just an addition**: every current notification
   type's `entity_id` already *is* the id the frontend navigates to
   (`entity_id` = opportunity id for
   `OPPORTUNITY_ASSIGNED`/`GATE_OVERRIDE_NAMED`). For `MANAGER_NOTE_ADDED`,
   `entity_id` is the *activity* id, which has no detail screen of its own
   — the frontend needs to know **which** screen to open. A Manager Note
   can be logged against just an Account, or against a specific
   Opportunity within that account (confirmed 2026-09-08: already possible
   today via `OpportunityDetailScreen`'s own Activity tab, which passes a
   fixed `opportunityId` — no separate fix needed there). So the
   click-through target genuinely differs per note, not just per type.

## Frontend

1. **`sales-os-app/src/components/LogActivityModal.tsx`** — when
   `isManagerNote` (already an existing local flag, line 93), show an
   "Urgent" checkbox; include `is_urgent` in the create-activity request
   body. Hidden entirely for every other activity type.
2. **`sales-os-app/src/components/NotificationBell.tsx`** — `describe()`
   gets a case for `MANAGER_NOTE_ADDED` (e.g. `"${who} left you a manager
   note"`, `${who} left you an urgent manager note` when `is_urgent`).
   `handleSelect()` gets a branch, and it must check `opportunity_id`
   first: **if the note is tied to an Opportunity, open that
   Opportunity's own screen** (`onSelectOpportunity`, same callback
   `OPPORTUNITY_ASSIGNED` already uses, with `initialTab: "activity"` —
   `OpportunityDetailScreen.tsx:76` already supports this prop) so the
   recipient lands directly on that deal's Activity tab. **Only when
   `opportunity_id` is null** (an Account-only note) does it fall back to
   opening Customer 360 via `account_id` with `initialTab: "activity"`
   (`Customer360Screen.tsx:96` already supports this too) — same
   `onSelectAccount`-style callback prop the screen's other callers
   already use. Both screens already support jumping straight to their
   Activity tab; no new navigation plumbing needed, just picking the right
   existing callback based on which id is present.
3. **`UrgentNotificationDialog.tsx`** — no changes needed; it already
   pops for any unread row where `is_urgent = true`, regardless of type
   (confirmed by reading `notify_gate_override_named`'s own comment on
   this same mechanism).

## Deferred, not part of this plan

**Persisting the urgent flag on the Activity itself** (e.g. a badge in
the Activity Timeline showing "this note was flagged urgent"). Not asked
for; the frozen `Notification.is_urgent` value already satisfies "flash
an urgent message" per Basheer's own framing of the request. Revisit only
if someone specifically wants urgency visible on the historical Activity
record itself, not just at notification time.

## Sequencing

Small, self-contained. No overlap with Current task 0b (Audit Trail
Extension) or anything else in flight. Touches the same
`notification` domain as `docs/Activity-Comment-Implementation-Plan.md`
(both add a `notify_*` method and a new `entity_type` case to the same
repository join) — no shared code conflict, just worth building/testing
them in the same pass if both are picked up together, since both change
`_enriched_select` and `NotificationBell.tsx`'s `describe()`/`handleSelect()`.
