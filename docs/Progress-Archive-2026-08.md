# Cabio Sales OS — Progress Archive (2026-08)

Session narrative moved out of `.claude/active_progress.md` as work
completes, per CLAUDE.md's Session Handoff rule — this file is
reference-only, not read at session start. Everything below was already
resolved/shipped by the time it was written here; nothing here is open
work. See git log / commit messages for full technical detail on anything
committed.

---

## 2026-08-01 — bug-fix batch + UAT prep work

Bug fixes and feature work found/requested during and after the
2026-07-31 demo, in the order they landed:

- **Next Actions tab on Opportunity 360 not refreshing** after logging an
  activity or completing a reminder. Root cause: `LogActivityModal.tsx`
  and `CloseReminderModal.tsx` only invalidated the global `reminders`
  React Query cache, never the opportunity-scoped `opp-reminders` cache
  the Opportunity 360 Next Actions tab actually reads from. (`507685f`)
- **Opportunity/Project cards on Account 360's tabs were Edit-only** —
  no click-through to full detail. Made whole-card-clickable (Edit
  button stops propagation) on both Customer 360's Opportunities/Projects
  tabs and, once the underlying Project 360 navigation plumbing was
  built, Project 360 too. Along the way, fixed a real crash: Project
  360's Next Actions/Opportunities navigation initially passed only a
  minimal `{id, name}` object into `ProjectDetailView`, which assumes a
  full record including `account` — caused a blank screen on click.
  (`7ccc258`)
- **Product Catalog was silently RLS-blocked cross-SBU** — clicking a
  filter for another SBU showed a misleading "No products found" instead
  of surfacing that it was an access restriction. Business decision: open
  catalog **read** access to everyone (products are reference data, no
  pricing/customer sensitivity), since there's no confidentiality reason
  to hide one SBU's catalog from another. Split the RLS policy
  (`product_read_all` for SELECT, unrestricted; existing SBU-scoped
  policy kept for INSERT/UPDATE/DELETE) — migration `0014`, applied live.
  Added a new backend guard (`BR-OP-11`) so a product can still only be
  *added to an Opportunity* within its own SBU, since RLS no longer
  covers that. (`1d4ce86`)
- **User manual + in-app contextual Help system.** Decision changed from
  the original "Google Doc" plan to a Markdown manual
  (`docs/UAT-User-Manual.md`) plus an in-app `[?]` Help drawer — cheaper
  to keep in sync while the UI is still moving (MUI migration, RLS work
  ongoing) than either a video walkthrough or a full role-aware
  content-authoring system (considered and explicitly rejected as
  premature investment for a 6-7 person pilot). The manual was reviewed
  against actual screen/tab/business-rule behavior and corrected (wrong
  Pipeline stage list — 7 stages not 5, missing Customer 360 tabs, missing
  Opportunity Detail tabs, undocumented mandatory-field rules). Generalized
  into `HelpDrawer.tsx` + `helpContent.tsx`, keyed by current screen,
  covering all 7 screens plus Project 360. While writing Project 360's
  help entry, found its Opportunities section had dead create-opportunity
  code (`openAddOpp`/`handleCreateOpp`) never wired to a button — fixed
  that too, so the docs describe real behavior, not a workaround.
  (`3cfa132`)
- **Stakeholder gets a `whatsapp_number` field** (migration `0015`,
  applied live). Design decision: rather than a boolean flag on the
  existing `phone` field (can't represent a genuinely different WhatsApp
  number) or a second field left blank/NULL by convention (requires every
  future reader to know a fallback rule), the frontend mirrors `phone`
  into `whatsapp_number` on every save unless a "Different WhatsApp
  number?" checkbox is checked — auto-propagates on phone edits too,
  since phone is only ever edited through this same form. Found and fixed
  8 pre-existing Pyrefly "could not find name" warnings in
  `account/models.py` along the way (missing `TYPE_CHECKING` imports for
  cross-domain relationship types, unlike `organization/models.py`'s
  pattern) — unrelated to the feature, just discovered while touching the
  file. (`c051279`)
- **`manager_id` cross-SBU visibility loophole — fixed.** Surfaced
  2026-07-31 while explaining the Sales Manager RLS tier post-demo:
  `UserService.create_user`/`update_user` never checked that a
  `manager_id` assignment stayed within the same SBU, so an Admin/GM
  could (by mistake or otherwise) assign a Sales Staff person's manager
  to a Sales Manager in the *other* SBU, letting that manager see
  opportunities across the SBU boundary via the Sales Manager RLS tier.
  Fixed with a same-SBU check (`ValidationError` on mismatch), correctly
  comparing against the *effective* SBU when both `sbu_id` and
  `manager_id` change in the same PATCH. Documented as `BR-ORG-01`.
  Manually verified by Basheer via User Directory. Also corrected a
  stale backlog item in the same commit: `account.zone_id` already had
  an index (migration `0001`, confirmed live) — only the SQLAlchemy
  model's `index=True` documentation was missing; no DB change needed.
  (`926469d`)

All of the above committed and pushed to `main`.
