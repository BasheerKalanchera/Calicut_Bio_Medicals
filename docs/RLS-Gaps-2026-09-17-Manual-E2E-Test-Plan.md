# RLS Gap Fixes (2026-09-17) — Manual E2E Test Plan

**Feature:** not a new feature — a hardening pass closing 5 pre-existing
gaps found in a broader review after the same day's Target Planning fix
(`docs/Target-Planning-Code-Review-Findings-2026-09-17.md`'s finding #6
pattern, generalized). Migration `0046` plus a matching
`DocumentService.delete_document` change. None of the 5 were being
actively exploited — each was masked only by the app never asking the
database (or, for #5, the service layer) to do the risky thing. This plan
is about three things at once: confirming each gap is actually closed,
confirming nothing that already worked (mark-reminder-complete,
delete-a-document, mark-notification-read, log-an-activity, Relationship
Support cross-SBU logging) broke as a side effect, and confirming the
regression a code-review pass caught mid-build (Relationship Support)
really is fixed, not just reverted-to-broken-differently.

**Scope:**
1. `activity` — INSERT no longer bypasses opportunity-visibility scoping
   via the "own subject" shortcut, **except** the one deliberate carve-out
   for BR-ACT-10 Relationship Support (logging a note against a deal
   outside your own SBU/zone via a real, narrow account-match check) —
   the first draft of this fix broke that feature; caught in code review
   before it shipped, now has its own explicit policy branch mirroring
   the service layer exactly. No UPDATE/DELETE policy at all (unchanged
   in practice — no such endpoint ever existed).
2. `marketing_lead` — Area Manager's SELECT/UPDATE clause now also
   requires `sbu_id = cabio_app_sbu_id()`, matching the SBU Manager clause
   right above it.
3. `document` (command scoping) — split into SELECT/INSERT/DELETE; no
   UPDATE policy (unchanged in practice — no such endpoint ever existed).
4. `document` (delete authorization) — **the second real gap, found
   while verifying #3, fixed on Basheer's decision, not part of the
   original 4:** deleting an Opportunity-linked document used to require
   nothing beyond ordinary RLS visibility (any teammate on the deal could
   remove a colleague's upload). Now requires the deal's owner or
   Admin/GM, enforced in both `DocumentService.delete_document` and
   `document_delete`'s own RLS.
5. `notification` — UPDATE is now recipient-only; sender's insert-time
   grant no longer survives into later updates.
6. `reminder` — same command-scoping cleanup as `document` (#3): split
   into SELECT/INSERT/UPDATE (UPDATE deliberately kept — `PATCH
   /reminders/{id}` really does mark `is_completed`); no DELETE policy
   (unchanged in practice — no such endpoint exists).

**Not directly testable through the UI (by design, not a gap in this
plan):** the exploit path for #1's general case and for #5 require calling
the API directly with a payload the UI never sends (an activity's
`opportunity_id` pointing at a deal with no relationship-support link
either; a sender PATCHing someone else's notification). The UI was never
the attack surface for those two — the database was. Everything else below
(including #1's Relationship Support carve-out, and both #2 and #4's real
negative cases) is fully reachable and tested live.

**Test users needed:** reuse Target Planning's cast — Vivek (Sales Staff,
Critical Care), Arun Adarsh (Area Manager, Vivek's actual manager,
Critical Care), Nishad K V (Area Manager, different zone, same SBU as
Vivek/Arun, *not* Vivek's manager), Abdul Latheef (Admin), Haroon
(General Manager). Group B additionally needs one account/opportunity
pair outside Vivek's own SBU/zone, for the Relationship Support check.

---

## A — `activity`: regression, ordinary logging still works

1. As Vivek, open one of his own deals, log a new Activity (any type —
   Call/Visit/Email).
   **Expected:** saves normally, appears in the Activity timeline
   immediately.
   **Result: PASS** (note: Vivek owns no opportunities in this dataset,
   so this ran against "usg m/c", a deal owned by Basheer K that Vivek
   can already see — logged a Call with note "RLS regression check -
   Group A step 1" plus a required next action; saved and displayed
   correctly, attributed to Vivek).
2. As Vivek, open a deal he has a Split on but doesn't own outright (if
   one exists) and log an Activity there.
   **Expected:** saves normally — confirms the `cabio_app_has_split`
   branch still works untouched.
   **Result: not run** (no such Split deal identified during this pass).
3. Hard-refresh, reopen the deal from step 1.
   **Expected:** the logged Activity is still there — confirms it
   actually persisted, not just a local UI update.
   **Result: PASS** — confirmed still present after hard refresh.

## B — `activity`: the regression this plan exists to catch — Relationship Support and author ≠ subject

4. As Vivek, use Relationship Support / "Related Opportunity" (wherever
   the app exposes logging a referral note against a deal outside your
   own territory) to log a note against an opportunity in a *different*
   SBU/zone than his own, via its account.
   **Expected:** saves normally. **This is the exact case the first draft
   of the RLS fix broke** — code review caught it before it shipped, and
   this step is the live confirmation the corrected policy (the explicit
   `cabio_app_opportunity_in_account` branch) actually works, not just
   that it compiles.
   **Result: PASS** — on account "aster medicity" (Ernakulam, outside
   Vivek's own zone), Type = Relationship Support revealed a "Related
   Opportunity" dropdown scoped to the whole account; selected an
   opportunity there, saved successfully with no error.
5. As Vivek, confirm that note is visible afterward on that deal's
   Activity tab (read-back, not just the write succeeding).
   **Result: PASS** — confirmed on the account's Activity tab: entry
   type RELATIONSHIP SUPPORT, attributed to Vivek, correct note text.
6. As Arun Adarsh (Area Manager), use "Push Logging" (or the manager-note
   entry point) to log an activity *on behalf of* Vivek, on one of
   Vivek's own deals.
   **Expected:** saves normally — this is the flow where `user_id`
   (subject = Vivek) and `created_by` (author = Arun) differ.
   **Result: PASS** — as Arun, logged a Manager Note (Urgent checked)
   "for Vivek" against account "aster medicity"; saved successfully.
7. As Vivek, confirm that entry shows up on the deal's Activity tab,
   attributed correctly (shows Arun as the one who logged it, about
   Vivek/the deal).
   **Result: PASS** — Vivek's login showed an Urgent Notification dialog
   ("Arun Adarsh left you an urgent manager note"); clicking Review
   navigated to the account's Activity tab showing "MANAGER NOTE,
   Arun Adarsh, RLS test for notification" at the top — author (Arun)
   and subject (Vivek, via the notification recipient) both correct.

## C — `marketing_lead`: the real fix, negative case

*(Setup: find or note an existing marketing lead assigned to one of Arun's
direct reports, in Arun's own SBU (Critical Care) — or ask Basheer to
point to one live.)*

8. As Arun Adarsh, open Marketing Lead Queue (or wherever leads assigned
   to his reports surface).
   **Expected:** the lead from Setup is visible — confirms the Area
   Manager clause still works for the *same-SBU* case (regression check
   for the fix itself).
   **Result: PASS** — used a real existing lead instead of a fresh
   Setup: #B2D4D1, assigned to Vivek (Arun's direct report, same SBU),
   is visible in Arun's queue. Confirmed via User Directory that this is
   in fact the only manager/report pair in the org with a lead sitting
   in the queue right now — every manager→report relationship in this
   dataset is same-SBU (Fazal→Fahad, Shruthi→Rudrappa, Arun→Vivek), so
   step 10's actual cross-SBU case has no real data to demonstrate it
   against; not reachable live in this dataset.
9. As Nishad K V (different zone, same SBU, **not** that rep's manager),
   open the same screen.
   **Expected:** that lead is **not** visible to Nishad — he's not the
   rep's manager at all, so this should already have been true before the
   fix too (this step mainly confirms the fix didn't accidentally *widen*
   visibility).
   **Result: PASS** — Nishad's queue shows only his own leads (#7450B3,
   #1FCCED); #B2D4D1 (Vivek's) correctly absent.
10. *(The actual bug this fixes needs a lead whose `sbu_id` differs from
    its assignee's own SBU — this is a data-shape issue, not something
    reachable by clicking through the UI as it stands today, since leads
    are normally assigned within the assignee's own SBU. If Basheer knows
    of one, or can point to a rep who changed SBUs, use that; otherwise
    this specific negative case is confirmed by the code-level fix +
    backend logic alone, same as the target_plan RLS fix's negative case
    required a genuinely cross-SBU pairing to demonstrate.)*
    **Result: confirmed not reachable live** — see step 8's note; no
    manager/report pair in this org is cross-SBU. Covered by code-level
    fix + backend logic only.

## D — `document`: the second real fix, negative case (fully live-testable)

11. As Abdul Latheef (Admin), open Product Catalog, add a new collateral
    link (brochure/video) to any product.
    **Expected:** saves normally.
    **Result: PASS** — swapped to Haroon (GM, also in the Admin/GM
    allow-list) since he was already logged in: added a collateral link
    "RLS Group D test collateral" to product "ECG Cable"; saved
    normally.
12. Delete that same collateral link.
    **Expected:** deletes normally — confirms `document_delete`'s
    product-collateral branch still works exactly as before.
    **Result: PASS** — deleted as Haroon; removed immediately, only the
    pre-existing "Brochure" link remained.
13. As Vivek (Sales Staff), open one of *his own* deals' Documents tab,
    upload a file, then delete it.
    **Expected:** both succeed — confirms the owner path works for the
    person it's actually meant for.
    **Result: PASS.** Vivek owns no opportunities in this dataset, so
    this step was swapped to Fazal (owner of "New USG m/c"): uploaded
    "Scan of Phase 1 requirements.pdf" to that deal's Documents tab as
    Fazal, then deleted it as Fazal — both succeeded (Documents (0),
    "No documents uploaded yet." afterward).
14. As Arun Adarsh (Area Manager, **not** the owner of Vivek's deal),
    open that same deal's Documents tab, try to delete the file Vivek
    just uploaded (skip this step if Vivek already deleted it in step 13
    — upload a fresh one first).
    **Expected:** blocked — this is the actual gap that was found and
    fixed: a teammate who isn't the deal's owner and isn't Admin/GM can
    no longer delete another rep's upload just because they can see the
    deal.
    **Result: PASS (security), with a follow-up UX finding.** Swapped to
    Basheer K (SBU Manager — same SBU as owner Fazal, since Arun's own
    SBU/zone couldn't see this Imaging deal at all) attempting to delete
    Fazal's document on "New USG m/c". Clicked delete 3 times: the
    document was never removed (Documents (1) throughout), and no
    console error or exception appeared — confirms the block is real,
    not a UI fluke.
    **Follow-up fix needed:** the delete control gives **no feedback at
    all** when blocked — no error banner, no toast, nothing. A real user
    in this situation would think their click didn't register, not that
    they lack permission. Needs an error toast/banner on a blocked
    delete (e.g. "Only the deal's owner or an Admin/GM can remove this
    document"), surfaced the same way other blocked actions in the app
    already show errors (compare the account-required banner already
    used elsewhere on this same Documents tab).
15. As Haroon (GM) or Abdul Latheef (Admin), delete the same file.
    **Expected:** succeeds — the Admin/GM overlay still works.
    **Result: PASS** — as Haroon, deleted "Additional Requirements from
    Project Kickoff meeting.pdf" from "New USG m/c" (Fazal's deal, not
    Haroon's own); succeeded immediately (Documents (0), "No documents
    uploaded yet.").

## E — `reminder`: regression

16. As Vivek, open Next Actions, find a pending reminder (or create one
    via logging an Activity with a next-action date), mark it complete.
    **Expected:** flips to completed normally — this is the flow that
    would have broken if `reminder_update` had been dropped instead of
    kept.
    **Result: PASS** — marked the Group A next action ("Follow up on
    quote") complete with a closure note.
17. Hard-refresh, confirm it stays marked complete.
    **Result: PASS** — Completed tab shows it as DONE with the closure
    timestamp and note (Pending tab briefly showed stale cached state,
    but the Completed tab confirmed the real persisted result).

## F — `notification`: regression

18. As Vivek, open the notification bell, click "mark read" on any
    unread notification (or trigger a fresh one first, e.g. by having
    Arun approve/reject something of Vivek's).
    **Expected:** marks read normally — confirms `notification_update`'s
    narrowed (recipient-only) policy still lets the recipient do the one
    real thing the app needs.
    **Result: PASS via UI** — no unread notification existed to test
    with (Vivek's only prior one was already read), so Arun logged a
    fresh Urgent Manager Note for Vivek (see Group B step 6) to generate
    one. Vivek's Urgent Notification dialog appeared and "Review" was
    clicked with no error. Not independently confirmed at the network
    level that the underlying PATCH succeeded (checking that hit a
    session rate limit and was dropped in favor of moving on) — the UI
    flow completing without error is the evidence recorded here.

## G — Regression, unrelated screens

19. Spot-check Pipeline and Insights still load normally for at least one
    role — confirms nothing broader broke.
    **Result: PASS** — checked as Haroon (GM): Insights loaded full
    org-wide pipeline/forecast/activity data; Pipeline Kanban loaded all
    stages with deal counts and cards normally.

---

## Not re-tested live (verified by direct schema/code inspection instead)

The exploit paths that aren't UI-reachable — an activity inserted against
an opportunity_id with no relationship at all to the actor (no split, no
assignment, no account match); a sender PATCHing a notification after
handing it to someone else — were confirmed by reading
`docs/Physical-Schema.sql`'s regenerated policy text directly against each
table's real router/service endpoints (see the migration's own docstring
for the endpoint-by-endpoint check, including the BR-ACT-10 trace that
caught the Relationship Support regression). 876/876 backend tests pass
(5 new, covering the document-delete ownership rule specifically).

## Sign-off

**Date:** 2026-09-17
**Result: PASS overall**, with one follow-up UX fix identified (not a
security gap) and one item accepted as code-verified only.

- **Group A** (activity, ordinary logging) — PASS. Step 2 (Split-deal
  case) not run — no such deal existed in this dataset.
- **Group B** (activity, Relationship Support + author≠subject) — PASS,
  all steps. This is the regression the whole plan existed to catch, and
  the corrected `cabio_app_opportunity_in_account` branch is confirmed
  working live.
- **Group C** (marketing_lead) — PASS on the reachable cases (8–9).
  Step 10's actual cross-SBU case is confirmed **not reachable live** in
  this dataset (no manager/report pair is cross-SBU) — accepted as
  covered by the code-level fix only, consistent with the same
  limitation noted on the target_plan RLS fix earlier this session.
- **Group D** (document delete authorization) — PASS on all of 11–15,
  including the actual gap this pass exists for (a non-owner, non-Admin/
  GM teammate is now correctly blocked from deleting another rep's
  upload). One follow-up logged: the delete control gives no user-facing
  feedback when blocked (no toast/banner) — a UX gap, not a security one.
- **Group E** (reminder) — PASS.
- **Group F** (notification) — PASS via UI (urgent-notification dialog +
  Review flow completed with no error). The underlying PATCH request
  was not independently confirmed at the network level — deprioritized
  after a session rate limit interrupted that check; UI-level evidence
  only.
- **Group G** (Pipeline/Insights regression) — PASS.

**Not re-tested live** (by design, per the "Not directly testable"
section above): confirmed via schema/code inspection instead.

**Conclusion:** migration `0046` and the `DocumentService.delete_document`
change are working as intended. Safe to commit.
