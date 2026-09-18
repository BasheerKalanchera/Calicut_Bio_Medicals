# Lead Follow-up Comments — Manual E2E Test Plan

**Status:** All 19 cases passed, run live against Dev 2026-09-18 with
Nishad K V (assigned rep), Fahad (Marketing User, lead creator), and
Haroon Sidheeq (GM). Pre-E2E `/code-review` (medium) passed clean
beforehand. One real gap found and fixed live mid-pass (TC-6): the lead
creator had no Comments UI at all — `MarketingLeadCommentThread` was only
wired into `MarketingLeadReviewQueueScreen.tsx`, and Marketing User has no
nav entry for that screen. Fixed by embedding the same component into
`MarketingLeadEntryScreen.tsx` too. A second gap found (TC-14) — Marketing
User has no notification bell at all, so can't be proactively nudged about
a reply — was triaged and deliberately deferred to `docs/Backlog.md`
(Basheer's call, not a blocker for this feature). Feature confirmed working
end to end: posting, chronological rendering, two-way/multi-party threads
(rep, manager, and the lead's own creator), RLS-composed visibility, full
notification fan-out, correct click-through with no per-lead detail
screen, and no regression to Activity Comments' own notification path.

**UX follow-on after the pass completed:** Basheer noticed lead cards had
no comment-count indicator, unlike Activity's own "Comments (N)" badge --
every card just said the plain word "Comments" regardless of thread size.
Fixed same session: added a correlated `comment_count` subquery to
`MarketingLeadRepository` (mirrors `ActivityRepository._comment_count_column`
exactly), exposed on `MarketingLeadResponse`, and wired through
`MarketingLeadCommentThread`'s toggle label on both screens. Verified live
as Nishad K V: #7450B3 (3 comments) now shows a red "COMMENTS 3" badge,
#1FCCED (0 comments) shows a plain "ADD COMMENT" link -- matching Activity's
display exactly. 896/896 backend tests pass, `tsc`/`eslint`/`ruff` clean.

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
| 1  | Pass   | As Nishad K V (Area Manager, Critical Care), lead #7450B3 (Aster DM, CONFERENCE — Bangalore trade fair) showed a collapsed "COMMENTS" toggle, no comments yet |
| 2  | Pass   | Expanded to "HIDE COMMENTS" — empty thread, "Add a comment…" box, Post button |
| 3  | Pass   | Nishad posted "TC-3: Called the chief cardiologist, following up on EDAN i20 interest from the trade fair." — appeared immediately, author "Nishad K V", timestamp "18 Sept, 02:33 pm", input cleared |
| 4  | Pass   | Navigated away and back to the Review Queue (fresh mount) — comment still present unchanged |
| 5  | Pass (role substituted — see note) | Test plan named Arun Adarsh (Vivek's Area Manager), but all testing so far was on lead #7450B3 (assigned to **Nishad K V**, not Vivek) — Arun Adarsh has no standing over Nishad (peer Area Managers, not a reporting relationship), so he'd see nothing under "Team Marketing Leads" for this lead. Substituted **Haroon (GM, unrestricted)** instead, confirmed as Nishad's actual manager for this purpose. Haroon posted "TC-5: Good work Nishad, let's close this by end of week." successfully — confirms comment rights aren't rep-only |
| 6  | Pass (after a real gap found and fixed) | As Fahad (Marketing User, creator of #7450B3), his own "Marketing Leads" screen had **no Comments UI at all** — `MarketingLeadCommentThread` was only wired into `MarketingLeadReviewQueueScreen.tsx` per the plan's literal wording, and Marketing User has no nav entry for that screen, so the creator had no way to read or post despite RLS already allowing it. Fixed live: embedded the same component into `MarketingLeadEntryScreen.tsx` too (`tsc`/`eslint` clean). After the fix, Fahad could see Nishad's TC-3 comment (confirms the `created_by = cabio_app_uid()` RLS clause actually works, not just reads correctly on paper) and posted "TC-6: Thanks Nishad, please keep me posted once he decides on the EDAN i20." successfully |
| 7  | Pass | Full 3-author chronological thread on #7450B3: Nishad K V 02:33 pm → Fahad 02:56 pm → Haroon Sidheeq 03:00 pm, all oldest-first |
| 8  | Pass   | Confirmed visually on TC-3's posted comment — no edit/delete affordance anywhere on the row |
| 9  | Pass (confirmed via cross-reference, not a dedicated live click-through) | Fahad's own "Marketing Leads" list (checked during TC-6) includes lead #B2D4D1, assigned to **Vivek**, confirming it genuinely exists — but Nishad's "Team Marketing Leads" section (checked before any of this session's testing, and again since) never showed it at any point, only his own two leads. Since Nishad (Area Manager, Critical Care, different zone, not Vivek's manager) never saw a lead known to exist, this is real evidence the RLS-composed visibility is actually blocking it, not just coincidentally absent |
| 10 | Pass | Fahad's TC-6 comment (a non-owner commenting after the owner) notified Nishad K V (the assigned rep/owner) — bell read "Fahad commented on marketing lead #7450B3" |
| 11 | Pass | As Nishad K V, bell badge showed a red dot, dropdown correctly read "Haroon Sidheeq commented on marketing lead #7450B3" (18 Sept, 03:00 pm) and "Fahad commented on marketing lead #7450B3" (02:56 pm) both unread (highlighted). No urgent dialog popped on page load for either |
| 12 | Pass | Nishad's own TC-3 comment (the very first on the thread, posted before anyone else) produced no notification for himself — his bell dropdown only ever showed the later Fahad/Haroon comments plus the original assignment, never an entry for his own first post |
| 13 | Pass (equivalent case) | Fahad's TC-6 reply, posted after Nishad (the owner) had already commented, correctly notified Nishad — same "reply after owner already in thread" shape as the planned case, roles swapped (non-owner replying triggers owner notification, same underlying rule) |
| 14 | Pass (Nishad's side confirmed; Fahad's side accepted as code-verified only) | Haroon's TC-5 comment (3rd participant, after Nishad and Fahad had both commented) notified Nishad correctly. **Real finding while checking Fahad's side:** Marketing User has no bell icon at all (`DemoApp.tsx:571` gates `<NotificationBell>` behind `!isMarketingUser`, a deliberate 2026-09-02 decision — see Backlog). Basheer's call: leave as-is, not in scope this session. Fahad's own notification row is accepted as code-verified only (identical fan-out logic to `ActivityCommentService`, already unit-tested and code-reviewed clean) — same "accepted as code-verified" precedent as the RLS Gaps pass's cross-SBU case |
| 15 | Pass | Clicked "Haroon Sidheeq commented on marketing lead #7450B3" — navigated straight to the Marketing Lead Review Queue, no attempt to scroll to or highlight #7450B3 specifically, matching the "no per-lead detail screen" design |
| 16 | Pass | Reopened the bell after TC-15's click-through — both the Haroon and Fahad comment notifications now show read (unhighlighted), confirming the bulk `mark_read_for_type("marketing_lead")` call cleared both by `entity_type`, not just the one clicked |
| 17 | Pass (passive, not deliberately exercised) | Convert/Discard/Reassign weren't clicked this session, but every screen touched (Review Queue, Marketing Leads) rendered existing CONVERTED/DISCARDED/SEEN leads, discard reasons/notes, and assignee names correctly throughout — no rendering breakage observed. A deliberate Convert/Discard/Reassign click-through would still be worth doing if time allows |
| 18 | Pass | Nishad's bell dropdown showed "Fahad assigned you marketing lead #7450B3" (10 Sept, 07:54 pm) rendering correctly, unaffected by the day's testing |
| 19 | Pass | As Haroon, posted "TC-19: Any update since this call?" on a CALL Activity owned by Nishad K V ("critical care icu" Opportunity). Nishad's bell correctly showed "Haroon Sidheeq commented on an activity" (Aster MIMS Calicut, 18 Sept, 03:15 pm), unread, alongside the marketing_lead notifications with no interference between the two types — confirms the `entity_type === "marketing_lead"` widening in `NotificationBell.tsx` didn't regress the existing Activity Comment path |
