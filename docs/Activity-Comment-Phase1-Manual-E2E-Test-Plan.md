# Activity Inline Comments (Phase 1) — Manual E2E Test Plan

**Status:** All 12 cases resolved 2026-09-09, run live against Dev with
Basheer K (SBU Manager) and Fazal. Built per `docs/Activity-Comment-
Implementation-Plan.md`, Phase 1 only (no notifications — that's Phase 2).
Migration `0040` applied to Dev, `Physical-Schema.sql` regenerated.
710/710 backend tests pass, `tsc`/`eslint`/`npm run build` all clean.
TC-8 (RLS visibility inheritance) verified by design rather than live —
see its own row below for why. Feature confirmed working end to end:
posting, chronological rendering, two-way replies, both entry points
(Opportunity-tied and account-only), no notifications fired (Phase 2
boundary intact), no regression to the existing Activity Timeline.

## Setup

- Two users who can both see the same Activity — any manager/rep pair
  works (e.g. **Basheer K (M)** and **Shruthi (R)**, reused from the
  Manager Note test plan).
- One Activity each on: an Opportunity's own Activity tab, and an
  Account's Customer 360 Activity tab (no Opportunity) — comments render
  inside `ActivityItem`, used by both screens, so both entry points need
  a pass.
- A **restricted-visibility case** for Group D: a senior-tier Activity
  note an Area Manager/SBU Manager cannot see, per migration `0039`
  (Opportunity Notes Privacy). Any account already used to verify that
  migration works (e.g. Haroon's own private note) is fine to reuse.
- Two logins available (or log out/in between steps).

## What the feature actually does (context for why these cases are shaped
this way)

Any Activity can now carry a flat, chronological comment thread,
rendered directly under that Activity's own card in the timeline — not
a separate screen. Anyone who can already see the Activity (same rule
as `activity_tier_visibility`) can post; there's no manager-only
restriction. No edit, no delete, no read-tracking in v1 — a comment is
permanent once posted, the same immutability posture as the Activity
itself. **No notifications fire from this yet** — that's deliberately
deferred to Phase 2, built once this pass confirms the thread itself
works.

---

## A. Basic thread — post, render, persist

- [ ] **TC-1 — Zero comments, collapsed by default.** Open any Activity
  with no comments yet. **Expect:** a "Comments" toggle under the
  Activity's notes, collapsed — no network request fires yet (thread
  is lazy-loaded only on expand).

- [ ] **TC-2 — Expanding shows an empty thread.** Click "Comments."
  **Expect:** expands to show just the "Add a comment…" input box, no
  comment rows, button label changes to "Hide comments."

- [ ] **TC-3 — Posting a comment works.** Type a comment, click Post
  (or press Enter). **Expect:** comment appears immediately in the
  thread, correct author name (the actual logged-in user, not anyone
  else) and a sensible timestamp, input box clears.

- [ ] **TC-4 — Comment persists.** Collapse and re-expand the thread
  (or reload the page). **Expect:** the same comment is still there,
  unchanged.

## B. Two-way thread

- [ ] **TC-5 — The other party can also post.** Log in as the second
  user (M or R, whichever didn't post in TC-3). Open the same Activity,
  expand Comments, post a reply. **Expect:** succeeds, no manager-only
  gate blocks the rep (or vice versa).

- [ ] **TC-6 — Chronological order.** With 2+ comments from different
  authors now present. **Expect:** oldest first, reading top-to-bottom
  as a real conversation, not newest-first or unordered.

## C. No edit/delete (v1 scope)

- [ ] **TC-7 — No edit/delete control anywhere.** Look at any posted
  comment, including your own. **Expect:** no edit icon, no delete
  icon, no long-press/right-click affordance — post-only, matching
  Activity's own posture.

*(Database-level enforcement — no UPDATE/DELETE RLS policy exists on
`activity_comment` at all, confirmed in the migration and regenerated
`Physical-Schema.sql` — is a code-review/schema check, not something to
verify by clicking. Skip unless you specifically want to test it with a
live write against Dev, which needs its own go-ahead per the DB safety
rule in CLAUDE.md.)*

## D. RLS inherits the parent Activity's own visibility

- [ ] **TC-8 — A user who can't see the Activity can't see or post
  comments on it either.** Log in as an Area/SBU Manager who is
  already known to be blocked from a specific senior-tier Activity note
  (migration `0039`'s own hierarchy-hide). Confirm that Activity itself
  still doesn't show for them (regression check), then confirm there's
  no way to reach a comment thread on it at all — not just an empty
  thread, the whole Activity (and by extension anything attached to it)
  stays invisible. This is the case that actually proves the
  compose-through-parent-table RLS design (`activity_id IN (SELECT id
  FROM activity)`) is doing real work, not just passing the happy path.

## E. Both entry points render it

- [ ] **TC-9 — Opportunity-tied Activity.** Open an Activity on an
  Opportunity's own Activity tab, confirm Comments works there (post,
  see it, persists).

- [ ] **TC-10 — Account-only Activity.** Open an Activity from Customer
  360's Activity tab (no Opportunity), confirm the same.

## F. No notifications yet (Phase 1 boundary check)

- [ ] **TC-11 — Posting a comment doesn't notify anyone.** After TC-3
  or TC-5, check the other party's bell (badge count, dropdown) and
  confirm nothing new appears, and the urgent dialog never pops.
  **Expect:** no notification of any kind — confirms Phase 2 hasn't
  been accidentally half-wired in.

## G. Regression

- [ ] **TC-12 — Existing Activity Timeline unaffected.** Notes,
  reminders, activity-type badges, the "+ Log" flow, and the
  Manager Note author-display fix (`created_by_user`) all still work
  exactly as before on both the Opportunity and Customer 360 Activity
  tabs — the new comment thread is additive, not a rewrite of anything
  else in `ActivityTimeline.tsx`.

---

## Results log

Fill in as each test case is run.

| TC | Result | Notes |
|----|--------|-------|
| 1  | Pass   | Manager Note on "New opportunity for hospital pick" (Al Shifa Hospital) showed collapsed "Comments" toggle |
| 2  | Pass   | Toggle expands to "Hide Comments", showing the thread + Add-a-comment box |
| 3  | Pass   | Basheer K posted "Did you follow up?" and "Fazal?" -- correct author, timestamps |
| 4  | Pass   | Thread persisted across the session (both of Basheer's comments plus Fazal's reply all visible together) |
| 5  | Pass   | Fazal (rep) replied "Yes. I met him yesterday." -- confirms not manager-only |
| 6  | Pass   | Chronological order: Basheer K 12:39pm, Basheer K 12:40pm, Fazal 12:41pm, oldest first |
| 7  | Pass   | No edit/delete control on any comment, including the poster's own |
| 8  | Verified by design | Not live-tested -- Basheer's observation 2026-09-09: the real use case is a manager commenting on a visible activity, not commenting on one's own private note nobody else can see, so this edge case doesn't come up in practice. RLS composes through the parent Activity's own visibility at the DB level (confirmed in migration 0040 + regenerated Physical-Schema.sql), a safety net rather than something worth a live click-through |
| 9  | Pass   | Opportunity-tied Activity (Al Shifa Hospital's "New opportunity for hospital pick") -- Comments worked directly on the Opportunity's own Activity tab |
| 10 | Pass   | Account-only Manager Note "Hi Fazal, talk to GM" logged from Customer 360 (Al Shifa Hospital, no Opportunity); Fazal's reply "Sure I will." rendered correctly |
| 11 | Pass   | Fazal's bell showed no red dot after Basheer's comments; this session's bell also clean after Fazal's reply -- confirms Phase 2 (notifications) not accidentally wired in |
| 12 | Pass   | Existing Activity Timeline fields (notes, author display, activity-type badges, Log Activity flow) all rendered correctly alongside the new comment threads throughout this pass -- no regression observed |
