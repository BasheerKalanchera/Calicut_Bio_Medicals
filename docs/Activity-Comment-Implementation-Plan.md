# Activity Inline Comments — Implementation Plan

**Status:** Proposed, not built. **Raised:** 2026-09-08, Haroon (phone call
to Basheer) — can a manager leave an inline comment on an Activity already
logged by the Opportunity owner?

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

## Decisions needed from Basheer/Haroon — not yet decided

1. **Who can comment** — anyone who can already see the Activity under
   `activity_tier_visibility` (Area/SBU Manager per territory, GM/Admin,
   plus the existing split/reminder carve-out — migration `0039`), or only
   the rep's direct manager (the narrower BR-OP-14-style precedent)?
   Recommend the broader "anyone who can already see it" — it's zero extra
   logic (see RLS design below) and matches how visibility already works
   everywhere else in the app.
2. **One-directional or a real thread?** Haroon's phrasing ("manager
   leave a comment") suggests he may be picturing manager → rep only, but
   a rep being unable to reply back to a comment on their own logged work
   seems like an odd restriction. Recommend a real two-way thread (anyone
   who can see the Activity can post) — no extra gating needed either way,
   the RLS check is identical.
3. **Edit/delete own comment** — allowed, or intentionally never (matching
   Activity's own audit-friendly, nothing-silently-changes posture)?
   Recommend: no edit/delete in v1. Revisit only if actually requested.
4. **Notification on new comment** — recommend yes: notify the Activity's
   `user_id` (its owner) when someone else comments, reusing the
   notification mechanism from the same 2026-09-08 discussion (see
   `docs/Backlog.md`'s Manager Note notification entry) rather than
   building a second, parallel notification path.

## Proposed design (assumes the broad/two-way answer to 1-2 above)

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
  activity.user_id, ...)`, skipped when `author_id == activity.user_id`
  (no self-notify). New `type="ACTIVITY_COMMENT_ADDED"`,
  `entity_type="activity"`, `is_urgent=False` — same reasoning as the other
  awareness-only notification types (`notify_opportunity_assigned`,
  `notify_gate_override_named`).

**Frontend:**
- Customer 360's Activity tab: each timeline entry gets a comment
  count + expandable thread + "Add comment" control — new
  `ActivityCommentThread` component near wherever the Activity Timeline
  currently renders.
- `NotificationBell.tsx`'s `describe()` gets a label for
  `ACTIVITY_COMMENT_ADDED`, same pattern as every other notification type.

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
migration work). Small, self-contained. Blocked only on decisions 1-3
above before implementation starts.
