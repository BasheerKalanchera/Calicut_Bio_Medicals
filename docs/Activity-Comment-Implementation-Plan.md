# Activity Inline Comments — Implementation Plan

**Status:** Approved, ready to build. **Raised:** 2026-09-08, Haroon (phone
call to Basheer) — can a manager leave an inline comment on an Activity
already logged by the Opportunity owner? **Decisions confirmed** (Basheer,
2026-09-08): anyone who can already see the Activity can comment; it's a
real two-way thread (the rep can reply too); no edit/delete in v1.

## Problem

Activity is create-only — no update/edit endpoint exists in
`backend/app/domains/activity/service.py` (only `patch_reminder`, for the
Reminder attached to an Activity). A manager reviewing a rep's logged
Activity has no way to react against that specific entry today. The nearest
existing tool, `MANAGER_NOTE` (BR-ACT-02), logs a *new*, separate Activity
against the Opportunity/Account — it isn't tied to the specific entry the
manager is reacting to, and becomes just another item in the timeline,
indistinguishable from what it's commenting on.

## Why a new table, not a change to Activity

Activity immutability is a deliberate, explicit invariant (CLAUDE.md's own
safety note: "`Activity` rows are immutable (no DELETE endpoint)"; no
UPDATE endpoint either). A comment thread has different cardinality (many
comments per Activity, growing over time) and a different mutability
profile (editing/deleting your own comment is a reasonable future ask) —
belongs in its own table, not a field bolted onto `activity`.

## Decisions (confirmed 2026-09-08)

1. **Who can comment:** anyone who can already see the Activity under
   `activity_tier_visibility` (Area/SBU Manager per territory, GM/Admin,
   plus the existing split/reminder carve-out — migration `0039`). No new
   role logic — RLS on the new table just checks the parent Activity's
   own visibility.
2. **Two-way thread:** anyone who can see the Activity can post, including
   the rep replying back — not manager-only.
3. **No edit/delete in v1.** Post-only, matching Activity's own
   audit-friendly, nothing-silently-changes posture. Revisit only if
   actually requested.
4. **Notification on new comment:** yes — notify the Activity's `user_id`
   (its owner) when someone else comments. Non-urgent (this feature has no
   urgent variant, unlike the Manager Note notification). Shares the same
   `entity_type="activity"` notification-repository join as
   `docs/Manager-Note-Notification-Implementation-Plan.md`'s
   `MANAGER_NOTE_ADDED` — build that join once, both notification types
   use it.

## Proposed design

**Backend:**
- New table `activity_comment`: `id`, `activity_id` (FK → `activity`,
  NOT NULL, indexed), `author_id` (FK → `user_profile`, NOT NULL), `body`
  (text, NOT NULL), `created_at`. No `updated_at`/edited flag unless
  decision 3 changes.
- RLS: gate reads/writes on `activity_id IN (SELECT id FROM activity)` —
  the same compose-through-parent-table pattern already used elsewhere in
  this schema (e.g. `opportunity_item_via_opportunity`,
  `reminder_via_activity`). Since Postgres RLS on the referenced `activity`
  table is already applied when evaluating that subquery, a comment
  automatically inherits the Activity's own visibility rules — including
  the Opportunity Notes Privacy hierarchy-hide (migration `0039`) — with no
  new role logic to write or keep in sync.
- New `activity_comment` domain (model/repository/service/router), mirroring
  the existing `reminder` domain's shape: `POST /activities/{id}/comments`,
  `GET /activities/{id}/comments`.
- Notification: on create, call a new
  `NotificationService.notify_activity_comment_added(recipient_user_id=
  activity.user_id, activity_id=activity.id, actor_id=author_id)`, skipped
  when `author_id == activity.user_id` (no self-notify — the rep replying
  to a comment on their own Activity doesn't notify themselves). New
  `type="ACTIVITY_COMMENT_ADDED"`, `entity_type="activity"`,
  `entity_id=activity.id` (not the comment's own id — matches
  `MANAGER_NOTE_ADDED`'s convention, and both need the same "which account
  does this Activity belong to" resolution), `is_urgent=False` — same
  reasoning as the other awareness-only notification types
  (`notify_opportunity_assigned`, `notify_gate_override_named`).
- Reuses the `entity_type="activity"` join in
  `NotificationRepository._enriched_select` and the `account_id`/
  `opportunity_id` fields on `NotificationResponse`, both introduced by
  `docs/Manager-Note-Notification-Implementation-Plan.md` — build once, no
  duplicate work if both features ship together. Same click-through logic
  applies: a comment on an Opportunity-tied Activity opens that
  Opportunity's Activity tab; a comment on an Account-only Activity opens
  Customer 360's Activity tab instead.

**Frontend:**
- Customer 360's Activity tab: each timeline entry gets a comment
  count + expandable thread + "Add comment" control — new
  `ActivityCommentThread` component near wherever the Activity Timeline
  currently renders.
- `NotificationBell.tsx`'s `describe()` gets a label for
  `ACTIVITY_COMMENT_ADDED`, same pattern as every other notification type;
  `handleSelect()` reuses the same account-navigation branch added for
  `MANAGER_NOTE_ADDED` (both are `entity_type="activity"`).

## Migration

One new table, one new index (`activity_id`), one RLS policy referencing
`activity`'s own visibility (no new SECURITY DEFINER function needed —
unlike migration `0039`, this doesn't need to resolve *another* user's
role, just check the current user can already see the row).

## Deferred, not part of this plan

Edit/delete, @mentions, read receipts on comments — none raised, not
scoped here.

## Sequencing

Independent of everything currently in flight (Current task 0b, UAT
migration work). Small, self-contained. Shares notification-repository
changes with `docs/Manager-Note-Notification-Implementation-Plan.md` —
building both in the same pass avoids touching `_enriched_select` and
`NotificationBell.tsx` twice, but neither blocks the other; either can
ship alone.
