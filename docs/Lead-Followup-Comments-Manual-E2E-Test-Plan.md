# Lead Follow-up Comments — Manual E2E Test Plan

**Status:** Built, not yet run live. Backend (896/896 tests pass, `ruff`
clean) and frontend (`tsc`/`eslint` clean) both complete; migration `0047`
applied to Dev, `Physical-Schema.sql` regenerated. Built per `docs/Lead-
Followup-Comments-Implementation-Plan.md`. Pre-E2E `/code-review` run
separately per `CLAUDE.md`'s standing rule — fix any findings from that
pass before starting this one.

## Setup

- **The Marketing User test account** — creates leads, needs to see its
  own created leads' threads.
- **A rep with an assigned marketing lead** whose manager chain is known —
  reusing the same cast as the RLS Gaps test plan: **Vivek** (Sales Staff,
  Critical Care), **Arun Adarsh** (Area Manager, Vivek's actual manager,
  Critical Care), **Nishad K V** (Area Manager, different zone, same SBU,
  **not** Vivek's manager — the negative case).
- **Basheer K** (SBU Manager, Imaging) and **Haroon** (Admin/GM) for the
  broader-visibility tiers.
- At least one `marketing_lead` row assigned to Vivek, status `NEW` (so it
  shows in his own queue as well as Arun Adarsh's "Team Marketing Leads"
  section) — reuse one from the RLS Gaps pass if still present, or create a
  fresh one as the Marketing User.
- Multiple logins available (or log out/in between steps); if testing two
  people at once in the same physical browser, use separate browser
  contexts so sessions don't share storage.

## What the feature actually does (context for why these cases are shaped
this way)

Any `marketing_lead` can now carry a flat, post-only comment thread,
rendered directly under its card in the Marketing Lead Review Queue — same
shape as Activity Inline Comments, reused rather than reinvented. Posting
and viewing rights are **visibility-based, not role-based**: whoever the
`marketing_lead_select` RLS policy already lets see the row (Admin/GM,
the lead's SBU Manager, the assigned rep's Area Manager, the assigned rep
themselves, **and the lead's own creator**) can also comment on it — no
separate Marketing-User-only or manager-only gate. Every comment notifies
a computed set of people (the assigned rep, plus everyone who's already
commented, minus whoever's posting right now), always non-urgent, bell
only. There is deliberately **no per-lead detail screen** — a notification
click-through always lands back on the Review Queue itself, not a
highlighted card. The feature explicitly does **not** sync anything to
IndiaMART's own site and does **not** add any new alert channel — nothing
here should be tested against IndiaMART.

---

## A. Basic thread — post, render, persist

- [ ] **TC-1 — Zero comments, collapsed by default.** Open any lead card
  with no comments yet in the Review Queue. **Expect:** a "Comments"
  toggle under the action buttons, collapsed — no network request fires
  until expanded.

- [ ] **TC-2 — Expanding shows an empty thread.** Click "Comments."
  **Expect:** expands to the "Add a comment…" box, no comment rows, label
  changes to "Hide comments."

- [ ] **TC-3 — Posting a comment works.** As Vivek (assigned rep), type a
  comment on his own lead, click Post (or press Enter). **Expect:** appears
  immediately, correct author name, sensible timestamp, input clears.

- [ ] **TC-4 — Comment persists.** Collapse/re-expand (or reload).
  **Expect:** the same comment is still there, unchanged.

## B. Two-way thread

- [ ] **TC-5 — The manager can also post.** As Arun Adarsh (Vivek's Area
  Manager), open the same lead under "Team Marketing Leads," expand
  Comments, post a reply. **Expect:** succeeds — visibility-based, not
  restricted to the rep or to a manager role.

- [ ] **TC-6 — The lead's creator can also post.** As the Marketing User
  who created this lead, open it (their own created-leads list), expand
  Comments, post. **Expect:** succeeds — confirms the creator clause in
  `marketing_lead_select` extends to the comment thread too, not just the
  rep/manager chain.

- [ ] **TC-7 — Chronological order.** With 3 comments now present (Vivek,
  Arun Adarsh, Marketing User). **Expect:** oldest first, top to bottom.

## C. No edit/delete (v1 scope)

- [ ] **TC-8 — No edit/delete control anywhere.** Look at any posted
  comment, including your own. **Expect:** no edit/delete affordance —
  post-only, matching Activity Comments' own posture. *(Database-level
  enforcement — no UPDATE/DELETE RLS policy on `marketing_lead_comment` —
  is a code/schema check, not something to click-test; skip unless you
  specifically want a live write against Dev, which needs its own
  go-ahead per CLAUDE.md's DB safety rule.)*

## D. RLS inherits the parent lead's own visibility

- [ ] **TC-9 — A manager with no standing over this lead can't see or post
  comments on it either.** As Nishad K V (Area Manager, same SBU as Vivek,
  different zone, **not** Vivek's manager), confirm Vivek's lead doesn't
  show in "Team Marketing Leads" at all (regression check against
  `marketing_lead_select`'s own scoping — same negative case the RLS Gaps
  pass already proved), and by extension there's no way to reach a comment
  thread on it. This is the case that actually proves the
  compose-through-parent-table design (`marketing_lead_id IN (SELECT id
  FROM marketing_lead)`) is doing real work, not just passing the happy
  path.

## E. Notification fan-out

- [ ] **TC-10 — First comment notifies the assigned rep.** As Arun Adarsh,
  comment on Vivek's lead (nobody else has commented yet). **Expect:**
  save succeeds.

- [ ] **TC-11 — The rep's bell picks it up, never the urgent dialog.** Log
  in as Vivek. **Expect:** bell badge increases, dropdown reads "[Arun
  Adarsh] commented on marketing lead [ref]." `UrgentNotificationDialog`
  never pops — this notification type has no urgent variant.

- [ ] **TC-12 — Self-comment does not self-notify.** As Vivek, comment on
  his own lead before anyone else has. **Expect:** no notification fires
  for anyone.

- [ ] **TC-13 — Rep replying after a manager commented notifies that
  manager.** Continuing TC-10: Vivek replies. **Expect:** Arun Adarsh (not
  Vivek) gets a new bell notification — the exact case Activity Comments'
  own fan-out fix targets, reused here.

- [ ] **TC-14 — A third participant's reply notifies everyone already in
  the thread.** With Vivek and Arun Adarsh both having commented, have the
  Marketing User (creator) post a new comment. **Expect:** both Vivek and
  Arun Adarsh get notified, not just whoever replied most recently. Then
  have one of them reply again: confirm no duplicate notification when the
  assigned rep is also already a prior commenter (exactly one notification
  per person, not two).

## F. Notification click-through — no per-lead detail screen

- [ ] **TC-15 — Click-through opens the Review Queue, not a highlighted
  card.** Click a `MARKETING_LEAD_COMMENT_ADDED` bell entry. **Expect:**
  navigates to the Marketing Lead Review Queue (same behavior as
  `MARKETING_LEAD_ASSIGNED`'s own click-through) — no attempt to scroll to
  or highlight the specific lead, since there's no per-item anchor for it.

- [ ] **TC-16 — Viewing the queue clears the comment notification too.**
  After TC-15, check the bell again. **Expect:** the
  `MARKETING_LEAD_COMMENT_ADDED` notification (and any
  `MARKETING_LEAD_ASSIGNED` ones for the same lead) both show read — GET
  `/marketing-leads`' bulk `mark_read_for_type("marketing_lead")` covers
  both types by `entity_type`, not just the assigned one.

## G. Regression

- [ ] **TC-17 — Marketing Lead Review Queue unaffected.** Convert, Discard,
  Reassign, and the existing pending/"Team Marketing Leads" split all still
  work exactly as before — the new thread is additive to the card, not a
  rewrite of the screen.

- [ ] **TC-18 — MARKETING_LEAD_ASSIGNED notification still works.** Assign
  a fresh lead to someone, confirm the existing bell copy/click-through for
  that type is unaffected by the `entity_type === "marketing_lead"`
  refactor in `NotificationBell.tsx`'s `handleSelect()`.

- [ ] **TC-19 — Activity comment notifications still work.** Post a
  comment on an unrelated Activity, confirm `ACTIVITY_COMMENT_ADDED`'s own
  bell copy/click-through is unaffected — proves the two comment-thread
  features (Activity's and this one) didn't get tangled together in the
  shared `NotificationBell.tsx`.

---

## Results log

Fill in as each test case is run. Move a summary of the overall outcome to
the current `docs/Progress-Archive-2026-09.md` entry once the full pass is
complete, then flip this feature's row in `docs/Signed-Requirements-to-PRD-
Traceability.md` (it's in the "Pending — proposed, not yet built" table,
not the main Done/Partial/Not-started tally, so no scorecard regeneration
is needed for this one).

| TC | Result | Notes |
|----|--------|-------|
| 1  |        |       |
| 2  |        |       |
| 3  |        |       |
| 4  |        |       |
| 5  |        |       |
| 6  |        |       |
| 7  |        |       |
| 8  |        |       |
| 9  |        |       |
| 10 |        |       |
| 11 |        |       |
| 12 |        |       |
| 13 |        |       |
| 14 |        |       |
| 15 |        |       |
| 16 |        |       |
| 17 |        |       |
| 18 |        |       |
| 19 |        |       |
