# Discussion: Marketing Leads — Seeing New Comments, and Whether the Feature Is Earning Its Keep — 2026-09-28

**Status:** **Parked until about 12 Oct 2026.** Lead comments reached UAT on
2026-09-27. Before building anything more, the sales team gets 1–2 weeks to
use them, then a read-only usage check on UAT (section 5) decides what, if
anything, gets built. Nothing is built or changed.
**Participants:** Basheer (decisions), Claude (options and analysis).
Latheef Bhai to be told the outcome.
**Origin:** the 2026-09-24 demo to Latheef Bhai and Haroon — item 1 under
"Requested by Cabio leadership — to be built" in
`docs/Signed-Requirements-to-PRD-Traceability.md`. Backlog entry: "Marketing
User has no notification bell" in `docs/Backlog.md`.

## 1. Summary

At the demo, leadership asked that the marketing user be able to see which of
their leads have new comments from the sales team. Basheer had proposed a
notification bell for this. On analysis, a bell is the wrong tool for this
user, and a simple highlight on the lead is enough (section 3).

That discussion raised a bigger question: is the whole marketing-lead feature
more machinery than the real flow of leads needs (section 4)? The decision is
to build nothing more on it for now, let the team use lead comments for 1–2
weeks, then look at real usage numbers from UAT.

## 2. How it works today

- A marketing user enters a lead — for example, an IndiaMART enquiry or a
  conference contact — and assigns it to a salesperson.
- The salesperson reviews it and either turns it into a deal or discards it
  (with a reason). Until then it stays a lead, not a deal.
- Since 2026-09-27 on UAT, either side can comment on a lead. Each comment
  notifies the others in the thread — but the marketing user has no bell, so
  they can't see those notifications.
- The marketing user's whole app is one screen: Marketing Leads. It lists
  their leads, newest first. Each lead shows its outcome (new / converted /
  discarded, with the date and, if discarded, the reason) and a comment count.
- That comment count covers *all* comments, read or not. So a lead with an
  old comment looks exactly the same as one with a fresh reply.
- **Basheer's observation (2026-09-28):** quite a few leads have been opened
  by the salesperson but not acted on — neither turned into a deal nor
  discarded. Lead comments may change that, now that the marketing user and
  the salesperson can talk on the lead itself.

## 3. Options considered for "which leads have new comments?"

| Option | Verdict | Why |
|---|---|---|
| **Notification bell** for the marketing user | Dropped | Their app is one screen, and they land on it at login — there's no "somewhere else" to call them back from. Clicking a lead notification can only open the full list (a lead has no page of its own), and opening that screen marks every lead notification read at once — so the bell can't point to *which* lead anyway. |
| **Also notify when a lead is converted or discarded** | Dropped | One extra notification for every lead entered — at 15 IndiaMART enquiries a day, up to 15 pings a day, burying the comments that actually need a reply. The outcome is already shown on each lead. |
| **Highlight leads with unread comments** — a light tint on the card and "1 new" on its comment link; cleared when the thread is opened | **Preferred, if the usage check says it's needed** | Leadership's own suggestion. Shows *which* lead needs attention, right where the marketing user already is. |
| **Also move highlighted leads to the top** | Dropped for now | Needs an extra rule so cards don't jump while being read. The list is already newest-first and comments mostly land on recent leads. Can be added later if lists grow long. |

## 4. Is the marketing-lead feature overkill?

Basheer raised this on 2026-09-28.

**Why it isn't, in principle:**
- It came from a real incident (2026-08-31): a conference lead entered
  directly as a deal duplicated one a salesperson already had at Demo stage.
  The fix was structural — a lead stays a lead until a salesperson reviews
  it. Salesforce and Zoho work the same way.
- It keeps the marketing user out of deal values and other salespeople's
  pipelines.

**Where it may be:**
- It has grown into a separate role with its own screen, a review queue for
  the sales team, convert/discard steps with reasons, and comment threads —
  and the highlight would be one more layer. That fits a steady stream of
  leads, but is heavy for a handful a month.
- None of it was in the signed contract (it's item 11, and comments item 16,
  in Traceability's "beyond contract" list), so each addition is unpaid
  effort.

**Decision (Basheer, 2026-09-28):** keep what's built — it works and is
tested, and removing it would cost effort for no gain. Build nothing more on
it until the usage check in section 5.

## 5. The usage check (around 12 Oct)

A read-only check on UAT, run with Basheer's go-ahead under the UAT rule. It
connects the same way as the regular data-quality check (the normal app
login, never the master login), sees the data as an Admin would, and
reports counts only — no customer names or lead text.

It counts:
1. Leads by outcome: never opened by the salesperson; opened but no
   decision; converted; discarded.
2. For "opened but no decision": how long since first opened (under 1 week,
   1–2 weeks, 2–4 weeks, over 4 weeks).
3. Leads entered per week.
4. The same outcomes per assigned salesperson.
5. Who enters leads, and in what role.
6. Comments: how many, on how many leads, first and latest dates.

**How to read it:**
- **Leads are flowing and comments are being used:** build the highlight
  (section 3). It's a small change.
- **Comments are moving the "opened but no decision" leads:** the thread is
  already doing its job. Build the highlight only if the marketing user is
  missing replies.
- **Few leads, or comments unused:** build nothing. Tell leadership the
  comment count on each lead already shows activity, and revisit when
  marketing volume grows.

## 6. Build notes (for Basheer)

- **Size, if built:** small — no migration. One backend change (clear lead
  notifications one lead at a time, when that lead's thread is opened) and
  one screen change (the highlight).
- **Timing:** the Marketing Leads screen isn't in the files the hospital-wise
  planning session is changing. The bell would have touched the app's main
  layout file, which it is — another reason the highlight is the simpler
  path.
- **Environment:** built and tested on Dev first; reaches UAT with the next
  main → UAT move.
- **Follow-up paperwork:** once decided, update the Backlog entry and
  Traceability's leadership-request item 1, which still describe a
  notification bell.

### Technical addendum

- Marketing menu has one entry (`DemoApp.tsx`, `MARKETING_NAV_SECTIONS`),
  and it's the default view for this role. `<NotificationBell>` renders only
  when `!isMarketingUser`.
- `GET /marketing-leads` calls `mark_read_for_type(user, "marketing_lead")`
  (`backend/app/api/routers/marketing_leads.py:96`) — bulk mark-read of all
  the user's lead notifications on list view. The highlight needs per-lead
  unread state instead: e.g. a `has_unread_comments` flag on the list
  response from unread `MARKETING_LEAD_COMMENT_ADDED` notifications, with
  mark-read per `entity_id` when the thread opens. To confirm at planning:
  whether the sales team's review queue relies on the bulk mark-read.
- `MarketingLeadCommentThread.tsx` shows the total `comment_count`,
  collapsed until clicked.
- Usage check: tables `marketing_lead` (`status` NEW / CONVERTED /
  DISCARDED, `first_viewed_at`, `created_at`, `assigned_to_user_id`,
  `created_by`) and `marketing_lead_comment`. RLS impersonation pattern from
  `scripts/uat_data_quality_check.py`. Migration `0047` (comments) reached
  UAT in the 2026-09-27 `0042` → `0054` upgrade.
