# Lead Follow-up Comments — Implementation Plan

**Status:** Confirmed by Latheef Bhai, 2026-09-17. All three open design questions
resolved (Basheer, same day). Not yet built.
**Raised:** 2026-09-17 — Basheer assigned a marketing-sourced lead to a rep and found
no way to see what the rep did with it once opened, or to nudge them for an update.
Full background: `docs/Discussion-Lead-Followup-Comments-2026-09.md`.

## Problem

`marketing_lead` already fires a bell notification on assignment
(`notify_marketing_lead_assigned`) and tracks whether the rep has opened it
(`first_viewed_at`). Nothing exists for what happens after that — no field, no
thread, no way for the rep to say what they did or what they're waiting on, and no
way for Marketing (or anyone who can see the lead) to prod them for an update.

## Why a new table, not a field on marketing_lead

Same reasoning as Activity Comments (`docs/Activity-Comment-Implementation-Plan.md`):
this is a growing, many-per-lead, two-way conversation, not a single field. Bolting
one `follow_up_note` text column onto `marketing_lead` would only ever hold the last
word, not a thread.

## Decisions (confirmed 2026-09-17)

1. **Free text only** — no structured status dropdown. Matches Activity Comments
   exactly; nothing new to build or teach.
2. **Scope: `marketing_lead` only** — not extended to a regular Opportunity sitting
   at Lead stage. This is specifically about leads Marketing hands off.
3. **Who can post — visibility-based, not role-based.** Reuses the exact pattern
   Activity Comments already proved: whoever can already see the `marketing_lead`
   row can comment on it, with **no new role-name logic written at all**. Concretely,
   today's `marketing_lead_select` policy (migration `0037`) already covers: Admin/GM
   (unrestricted), the lead's own SBU Manager (SBU-wide), the assigned rep's Area
   Manager (their own reports only), and the assigned rep themself. If that
   visibility rule ever changes, the comment thread's permissions change with it —
   nothing here needs updating separately.

## Backend

Added within the existing `marketing_lead` domain (mirrors how `ActivityComment`
lives inside the `activity` domain, not a new top-level domain):

- **Model** `MarketingLeadComment` (`backend/app/domains/marketing_lead/models.py`):
  `id`, `marketing_lead_id` (FK → `marketing_lead`, NOT NULL, indexed), `body` (text,
  NOT NULL), `created_at`, `created_by` (FK → `user_profile`, NOT NULL, aliased to an
  `author` relationship — same naming as `ActivityComment.author`). No edit/delete
  fields — post-only in v1, same as Activity Comments.
- **Repository/Service**: `MarketingLeadCommentRepository`/`MarketingLeadCommentService`,
  mirroring `ActivityCommentRepository`/`ActivityCommentService`'s shape exactly
  (`list_for_lead`, `create_comment`, `lead_exists`, `get_lead_owner_id`,
  `list_distinct_commenter_ids`).
- **Router** (`backend/app/api/routers/marketing_leads.py`, new endpoints on the
  existing `/marketing-leads` router, not a new router file):
  - `GET /marketing-leads/{lead_id}/comments`
  - `POST /marketing-leads/{lead_id}/comments`
- **Migration `0047`** — new table + RLS, following `0040_add_activity_comment_table.py`'s
  exact shape:
  ```sql
  CREATE POLICY marketing_lead_comment_select ON marketing_lead_comment
  FOR SELECT USING (marketing_lead_id IN (SELECT id FROM marketing_lead));

  CREATE POLICY marketing_lead_comment_insert ON marketing_lead_comment
  FOR INSERT WITH CHECK (
      marketing_lead_id IN (SELECT id FROM marketing_lead) AND created_by = cabio_app_uid()
  );
  ```
  No UPDATE/DELETE policy at all — default-deny, same as `activity_comment`. One
  index on `marketing_lead_id`.
- **Notification** — `NotificationService.notify_marketing_lead_comment_added`
  (mirrors `notify_activity_comment_added` exactly): `type="MARKETING_LEAD_COMMENT_ADDED"`,
  `entity_type="marketing_lead"`, `entity_id=lead.id`, `is_urgent=False`. Recipients:
  the lead's `assigned_to_user_id` plus every distinct prior commenter, minus whoever
  is posting right now — identical rule to Activity Comments' Decision 4, same
  reasoning (real threads here are small: the rep, their manager, the Marketing User
  who created it).
- **`comment_count` on `MarketingLeadResponse`** — added 2026-09-18 during manual E2E
  (Basheer noticed lead cards had no comment-count indicator, unlike Activity's own
  "Comments (N)" badge). Correlated scalar subquery in
  `MarketingLeadRepository._comment_count_column`, mirrors
  `ActivityRepository._comment_count_column` exactly — query-time only, not a stored
  column, no migration.

## Frontend

- `MarketingLeadCommentThread.tsx` (new component, modeled directly on
  `ActivityCommentThread.tsx`): comment count/expand toggle + chronological thread +
  "Add a comment…" box.
- Embedded inside **both** `MarketingLeadReviewQueueScreen.tsx`'s existing lead card
  (next to the Convert/Discard buttons — the screen where a rep already opens,
  converts, or discards a lead) **and** `MarketingLeadEntryScreen.tsx`'s own lead card
  (the Marketing User's own created-leads list). Both are needed for Decision 3 to
  actually hold: `marketing_lead_select`'s `created_by = cabio_app_uid()` clause
  already grants the creator visibility/posting rights, but Marketing User has no nav
  entry for the Review Queue screen — without the second embed, the creator would have
  RLS access with no frontend surface to use it. Found live during manual E2E
  (2026-09-18, `docs/Lead-Followup-Comments-Manual-E2E-Test-Plan.md`'s TC-6) and fixed
  same session. Lazy-loaded (`enabled: expanded`) on both screens so the list doesn't
  fire one query per lead on load, same as Activity Comments.
- `services/marketingLeads.ts` gains `listMarketingLeadComments`/
  `createMarketingLeadComment`.
- `NotificationBell.tsx`'s `describe()` gains a label for
  `MARKETING_LEAD_COMMENT_ADDED`; `handleSelect()`'s navigation branch extended for
  `entity_type === "marketing_lead"` (parallel to the existing `"activity"` branch).

## Deferred, not part of this plan

Edit/delete, @mentions, a structured status field (open question 1, resolved as
"not now" above) — none raised, not scoped here. Extending this same pattern to
Opportunities at Lead stage (open question 2) is a separate future ask, not this one.

## Verification

Same discipline as Activity Comments: backend `pytest` (role/visibility-scoping +
notification-fanout tests, SQL-compile assertions where a real DB isn't needed),
`ruff check`, frontend `tsc --noEmit`/`eslint`. Manual E2E: post as the assigned rep,
confirm the lead's Area Manager/SBU Manager/GM can see and reply on the same thread
per the visibility rule above, confirm notification fan-out matches Decision 4's rule,
confirm no edit/delete affordance exists anywhere in the UI or via a direct API call.

## Sequencing

Zero file overlap with the other session's current Target Planning/Coverage Planning
track (`backend/app/domains/planning/`, `TargetPlanningScreen.tsx`) — this touches
`marketing_lead`/`notification`/`marketing_leads.py` only. Safe to build in parallel.
