# Activity Inline Comments — Implementation Plan

**Status:** **Phase 1 built, migrated (`0040`), full 12-case E2E pass
2026-09-09** — `docs/Activity-Comment-Phase1-Manual-E2E-Test-Plan.md`.
**Phase 2 (notifications) built and full 11-case E2E pass 2026-09-09** —
`docs/Activity-Comment-Phase2-Notifications-Manual-E2E-Test-Plan.md`.
Both phases split apart mid-review after two real gaps were found in
this plan's original notification design (see Decision 4 below).
**Raised:**
2026-09-08, Haroon (phone call to Basheer) — can a manager leave an
inline comment on an Activity already logged by the Opportunity owner?
**Decisions confirmed** (Basheer, 2026-09-08): anyone who can already see
the Activity can comment; it's a real two-way thread (the rep can reply
too); no edit/delete in v1.

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

## Decisions (confirmed 2026-09-08, Decision 4 revised 2026-09-09)

1. **Who can comment:** anyone who can already see the Activity under
   `activity_tier_visibility` (Area/SBU Manager per territory, GM/Admin,
   plus the existing split/reminder carve-out — migration `0039`). No new
   role logic — RLS on the new table just checks the parent Activity's
   own visibility.
2. **Two-way thread:** anyone who can see the Activity can post, including
   the rep replying back — not manager-only.
3. **No edit/delete in v1.** Post-only, matching Activity's own
   audit-friendly, nothing-silently-changes posture. Revisit only if
   actually requested. Built stricter than originally scoped — see Phase
   1 design below.
4. **Notification on new comment (revised 2026-09-09):** the original
   design ("always notify `activity.user_id`, skip if the author is that
   same person") breaks for a real two-way thread — if the Activity's
   owner is the one replying, the self-notify skip fires and the person
   they're replying to hears nothing. Found during a review pass before
   Phase 2 was started, alongside a second gap: `ACTIVITY_COMMENT_ADDED`
   and `MANAGER_NOTE_ADDED` would share the same `(entity_type,
   entity_id)` pair once a comment lands on a Manager Note, and
   `mark_read_for_entity` has no `type` filter — opening either would
   silently mark both read.
   **Resolved (Basheer, 2026-09-09):**
   - **Recipients:** the Activity's owner (`user_id`) plus everyone who
     has already commented on it, minus whoever is posting right now.
     Considered narrower alternatives (notify only the immediately
     previous commenter, WhatsApp-reply-style) but Basheer's call: real
     threads here are small in practice (rep, immediate manager, a split
     participant, GM, someone who gave Relationship Support — rarely
     more than a handful of people), so "everyone already in the
     conversation hears about it" is both the simpler rule to reason
     about and cheap enough to test properly (one clean 3-person pass
     covers it, not one test per possible group size).
   - **Read-receipt collision:** no code change needed. Since the
     comment thread renders directly under its Activity's own note in
     the same card (Phase 1's own design), opening either one puts both
     in front of the viewer — so treating the whole Activity's
     notifications as "read" together actually matches what was seen on
     screen, not a bug to fix.
   - Still non-urgent (this feature has no urgent variant, unlike the
     Manager Note notification). Shares the same `entity_type="activity"`
     notification-repository join `docs/Manager-Note-Notification-
     Implementation-Plan.md`'s `MANAGER_NOTE_ADDED` already built.

## Phase 1 — built, migrated, E2E-verified (2026-09-09)

**Backend**, added within the existing `activity` domain (mirrors how
`Reminder` lives there too, not a new domain folder):
- `ActivityComment` model: `id`, `activity_id` (FK → `activity`, NOT
  NULL, indexed), `body` (text, NOT NULL), `created_at`, `created_by`
  (FK → `user_profile`, NOT NULL) — aliased to an `author` relationship
  in the ORM (no separate `author_id` column; a comment has no "who it's
  about" distinction the way `MANAGER_NOTE` does, so `created_by` alone
  is the author, same pattern `Notification.actor` already uses over its
  own `created_by`).
- `ActivityCommentRepository`/`ActivityCommentService`, mirroring
  `ReminderRepository`/`ReminderService`'s shape.
- `GET`/`POST /activities/{activity_id}/comments` — activity_id in the
  URL path, not the request body the way `Reminder`'s own sibling
  endpoint (`POST /reminders`) does it. Deliberate, small inconsistency
  with `Reminder`'s exact shape: removes a class of mismatched-id bug.
- **RLS, built stricter than this plan originally proposed:** the plan
  cited `reminder_via_activity`'s single blanket policy (relies only on
  no PATCH/DELETE endpoint existing for immutability, same as `activity`
  itself). Basheer chose to go further — two separate policies instead
  of one:
  - `activity_comment_select` (`FOR SELECT`): `activity_id IN (SELECT id
    FROM activity)` — the same compose-through-parent-table pattern as
    `reminder_via_activity`/`opportunity_item_via_opportunity`. Postgres
    evaluates `activity`'s own RLS (including the migration `0039`
    hierarchy-hide) when resolving the subquery, so a comment is
    automatically only as visible as its parent Activity.
  - `activity_comment_insert` (`FOR INSERT`): same parent-visibility
    check, plus `created_by = cabio_app_uid()` so no one can post a
    comment as someone else.
  - **No UPDATE/DELETE policy at all** — with RLS enabled, the absence
    of a matching policy is a default deny for those commands regardless
    of role. Edit/delete is blocked at the database level, not just by
    omitting a PATCH/DELETE endpoint.

**Frontend:**
- `ActivityCommentThread.tsx`, rendered directly inside `ActivityItem`
  (`ActivityTimeline.tsx`) — a comment count/expand toggle + chronological
  thread + "Add a comment…" box, sitting under the Activity's own card so
  it visually reads as part of it, not a separate screen. Lazy-loaded
  (`enabled: expanded`) so a timeline with many entries doesn't fire one
  query per entry on load.
- `services/activities.ts` gained `listActivityComments`/
  `createActivityComment` (same file `Reminder`'s functions already live
  in).

**Verification:** 710/710 backend tests pass (12 new), `tsc`/`eslint`/
`npm run build` all clean. Full 12-case manual E2E pass against Dev —
`docs/Activity-Comment-Phase1-Manual-E2E-Test-Plan.md`. Migration `0040`
applied to Dev, `Physical-Schema.sql` regenerated same day.

## Phase 2 — notifications, built and E2E-verified (2026-09-09)

- Backend: `NotificationService.notify_activity_comment_added`, called
  once per recipient per Decision 4's resolved rule above (Activity
  owner ∪ distinct prior commenters, minus the current poster) — a small
  repository query (distinct `created_by` values for the activity) plus
  a loop calling the same single-recipient `notify_*` shape every other
  type already uses. `type="ACTIVITY_COMMENT_ADDED"`,
  `entity_type="activity"`, `entity_id=activity.id` (matches
  `MANAGER_NOTE_ADDED`'s convention), `is_urgent=False`.
- Reuses the `entity_type="activity"` join in
  `NotificationRepository._enriched_select` and the `account_id`/
  `opportunity_id` fields on `NotificationResponse`, both already built
  for `MANAGER_NOTE_ADDED` — no repository changes needed for this part.
- Frontend: `NotificationBell.tsx`'s `describe()` gained a label for
  `ACTIVITY_COMMENT_ADDED`. `handleSelect()`'s account-navigation branch
  was refactored from `n.type === "MANAGER_NOTE_ADDED"` specifically to
  `entity_type === "activity"`, so both types share one branch instead of
  two near-duplicates. No `UrgentNotificationDialog` work needed —
  comments are always non-urgent.
- No `mark_read_for_entity` change was needed (Decision 4's read-receipt
  resolution above) — confirmed live (TC-9,
  `docs/Activity-Comment-Phase2-Notifications-Manual-E2E-Test-Plan.md`):
  both a Manager Note and a comment notification on the same Activity
  shared the identical `read_at` timestamp after clicking only one of
  them, proving the single mark-read call correctly cleared both.

## Deferred, not part of this plan

Edit/delete, @mentions, read receipts on comments (distinct from the
notification read-receipt above), narrowing notification recipients
below "everyone in the thread" if it turns out to be too noisy in
practice — none raised, not scoped here.

## Sequencing

Phase 1 shipped independent of everything else in flight. Phase 2's code
touches entirely separate files from the parallel in-flight session
(Audit Trail Extension, `opportunity_item`/`split` work) — no source
overlap — but was built and E2E-verified without yet updating the shared
handover docs (`active_progress.md`, `Progress-Archive-2026-09.md`,
`Backlog.md`), which stay held until that other session commits, so the
two threads' entries land in order instead of racing on the same files.
