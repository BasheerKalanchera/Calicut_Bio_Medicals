# Discussion Paper: Lead Follow-up Comments

**Prepared for:** Basheer to confirm with Latheef Bhai before this is scoped into an
implementation plan.
**Prepared:** 2026-09-17.
**Status:** DRAFT — scope decided by Basheer; awaiting Latheef Bhai's confirmation.
Not yet scoped, not yet built.

---

## 1. Where this came from

Basheer assigned a marketing-sourced lead to a rep (Shruthi) one evening; checking back
later, it was still unopened. That surfaced two separate things, only one of which this
paper is about:

- The rep wasn't alerted outside the app — **already covered by existing design, not a
  gap.** `marketing_lead` assignment already fires an in-app bell notification
  (`notify_marketing_lead_assigned`), deliberately non-interrupting (see §2). No new
  alert channel (SMS/call/push) is being proposed here.
- Even once a rep does open the lead, there's no way for them to report back what they
  did with it, and no way for the person who assigned it to prod them for an update.
  **This is the actual gap this paper addresses.**

Separately, IndiaMART has told Cabio's Marketing team that logging specific engagement
statuses on IndiaMART's own platform (Contacted the customer, Follow-up completed, Demo
conducted, Quotation sent, Negotiation stage, Order received/lost) improves Cabio's
standing there. **Confirmed by Basheer, 2026-09-17: updating IndiaMART's own site stays
Marketing's manual responsibility — Sales OS does not push anything back to IndiaMART.**
What Sales OS is missing is simply the internal visibility Marketing needs to go do that
job — knowing what's actually happening with a lead they handed off.

## 2. The current gap

Checked directly against the code:

- `marketing_lead` already fires a bell notification on assignment
  (`notify_marketing_lead_assigned`, `backend/app/domains/notification/service.py:162`)
  and already tracks whether the rep has opened it (`first_viewed_at`, migration
  `0035_add_marketing_lead_first_viewed_at.py`) — the color-change Basheer sees on the
  lead list.
- Nothing exists for what happens after that. No field, no thread, no way for the rep to
  say "waiting on the customer's budget confirmation" or "not interested, no real
  requirement," and no way for the Marketing User who created the lead to nudge them for
  an update.

## 3. Proposed design — decided by Basheer, 2026-09-17

Reuse the existing Activity Comment feature's shape almost exactly — a two-way comment
thread, this time attached to a `marketing_lead` instead of an `Activity`:

- The assigned rep can post a comment on the lead: what they did, what they're waiting
  on, to either convert it into a real Opportunity or reject it.
- The Marketing User who created the lead (or, per an open question below, any Marketing
  User) can post on the same thread to prod the rep for progress.
- Same interaction shape as Activity Comments (`docs/Activity-Comment-Phase1-Manual-E2E-
  Test-Plan.md`, Phase 2 notifications, migration `0040`): no edit/delete, and posting
  notifies the other side. Reuses the existing `notification` table the same way
  `notify_manager_note_added` and the Activity Comment notifier already do — no new
  notification machinery needed, just a new caller.

## 4. What this does not do

- Does not push any status back to IndiaMART's own platform — that stays entirely
  Marketing's manual responsibility on IndiaMART's site, unchanged.
- Does not add any new notification channel (SMS/call/push) — the existing bell
  notification on assignment is considered sufficient; this paper only adds the ability
  to converse once the lead has been seen.
- Does not add a structured status field (e.g. a dropdown mirroring IndiaMART's own
  stage list) — comments are free text, matching how Activity Comments works today. See
  open question 1.

## 5. Open questions — not yet decided

1. **Free text only, or a structured status too?** A Marketing User skimming many leads
   may want an at-a-glance status (e.g. a short dropdown alongside the comment) rather
   than reading every thread. Activity Comments has no precedent for this — it would be
   new, not reused.
2. **Scope: `marketing_lead` only, or the Opportunity "Lead" stage too?** Basheer's ask
   was specifically about `marketing_lead`; whether a similar thread belongs on a
   regular Opportunity sitting at Lead stage is a separate question, not assumed here.
3. **Who can post as "the Marketing User side"?** Only the lead's original creator, or
   any user holding the Marketing User role?

## 6. Reference

- `docs/Activity-Comment-Phase1-Manual-E2E-Test-Plan.md`,
  `docs/Activity-Comment-Phase2-Notifications-Manual-E2E-Test-Plan.md` — the pattern
  being reused.
- `docs/Lead-Management-Implementation-Plan.md` — `marketing_lead` schema and the
  existing assignment-notification design.
- `backend/app/domains/notification/service.py:162` (`notify_marketing_lead_assigned`)
  — existing assignment notification, unchanged by this paper.
- `docs/Backlog.md` — pointer entry for this paper.
