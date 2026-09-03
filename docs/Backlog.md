# Backlog

Deferred/parked work and undecided product questions — not scheduled, not
part of the current task. See `.claude/active_progress.md` for what's
actively being worked on right now. Items here move out once picked up
(into the active task) or once formally decided (into the relevant
authoritative doc — ADR, Business-Rules, a standards doc — per CLAUDE.md's
Session Handoff rule).

## Parked initiatives

### ~~MUI migration backlog (§9 of Frontend-Implementation-Standards.md)~~ — DONE, 2026-08-18

**Fully complete.** `ProjectDirectoryScreen.tsx` (`1d51b6d`) was the last
file — full triple-conversion (styling + React Query + `.jsx`→`.tsx`),
same ritual as every prior migration on this list. `Frontend-
Implementation-Standards.md`'s §9 table reached 0 pending, triggering its
own post-migration cleanup instructions (Superseded blocks deleted, §9
collapsed, doc bumped to v3.0) — full per-file migration history
preserved in `docs/Progress-Archive-2026-08.md` before that cleanup
removed the narrative from the standards doc itself. This backlog section
kept only as a pointer; nothing left to pick up here.

## Deferred / undecided items

- **Order-stage deals closing with zero Activity logged — candidate soft-
  warning rule, not built.** Raised 2026-09-03 (Basheer, reviewing UAT
  data for pipeline-stage coaching guidance): of 96 real opportunities in
  UAT, every BR-OP-01 gate field (Demo Date, Expected Closure Date, PO
  Number, Order Value, Product items) checked out clean once `REPEAT_ORDER`
  cases were excluded (BR-OP-13 legitimately skips the demo/negotiation
  dates for those). The one genuine gap found: 4 of 19 Order-stage
  opportunities — all already **Won** (Mihras Hospital "Labour room
  product"; ST JOHNS HOSPITAL Kattappana "EDAN IX 12 MONITOR"; KIMS Alshifa
  Perinthalmanna "Transport Incubator" and "Oxymag Transport Ventilator")
  — have **zero Activity logged anywhere against the account**. The order
  itself is on record (PO number, value) but nothing documents the
  conversation that led there. All 4 are `REPEAT_ORDER`/`EXISTING_CUSTOMER`
  deals, so this isn't a BR-OP-13 violation — it's a separate, currently
  unenforced gap: Activity presence has no stage-gate check at all in
  `validate_stage_transition` (`app/domains/opportunity/validators.py`).
  **Candidate fix, same shape as BR-ACC-03's near-duplicate-hospital soft
  warning:** a non-blocking prompt (not a hard gate — legitimate
  phone-only repeat orders exist) when advancing to Order or Won with zero
  Activity on the account. A softer version (team coaching, not tooling)
  already went out as a WhatsApp best-practice note 2026-09-03. Needs
  Basheer's call on whether the coaching note is sufficient or this
  warrants an actual rule.

- **Activity-note data-quality nudge (Latheef Bhai's idea) — VERY LOW
  PRIORITY, not decided, not scoped.** Raised 2026-09-03 (phone call to
  Basheer): while reviewing the day's Activity entries, Latheef Bhai
  noticed a quality gap — some reps write generic notes ("Met the
  Manager") vs. specific ones ("Met the BME, Mr. X and Y", citing Vivek's
  entries as the standard). Proposed an Amazon-style "people who bought
  this also bought" prompt: when a rep's note looks generic, suggest what
  a more detailed entry usually includes, dismissible either way.
  Discussed at length, not built: a cheap heuristic (role-keyword present,
  no proper-noun nearby — e.g. "Manager"/"BME" with no name after it)
  could catch the specific example given, with zero LLM cost/latency/
  privacy exposure, but only that one pattern — it doesn't generalize to
  other vagueness ("Discussed pricing" with no product named) the way an
  LLM shown good/bad examples could. The general-purpose AI version would
  need an LLM and should be bundled with the same pending data-privacy
  decision already blocking Engagement History Generation
  (`docs/Engagement-History-Generation-Implementation-Plan.md` §6) rather
  than a second separate vendor/privacy call. If ever built: never block
  Save, bias toward under-firing over false positives, frame as a tip not
  a correction, give a personal opt-out, and never surface individual
  dismiss/accept counts to a manager (turns a tip into a surveillance
  signal). A lighter, already-shipped alternative exists today: sharing
  real good examples team-wide as positive/credited best-practice content
  — see the two WhatsApp notes sent 2026-09-03 (`docs/Progress-
  Archive-2026-09.md`'s "2026-09-03 (parallel thread)" entry) and the
  Order-stage-Activity entry above. Needs Basheer's call on whether this
  is worth scoping at all, or if the WhatsApp-coaching approach is
  sufficient going forward.

- **`marketing_lead` not covered by the ADR-017 audit trail.** Raised
  2026-09-03 while scoping manager Convert/Discard/Reassign rights
  (`docs/Lead-Management-Manual-E2E-Test-Plan.md`'s Group F). ADR-017's
  audit_log trigger only covers account/user_profile/product/opportunity
  (Phase 1) — `marketing_lead` reassignment, conversion, and discard
  currently only get a `structlog` info-level log line, same as every
  other action in that domain, not a queryable history. Deliberately kept
  minimal for now rather than scoping a schema addition into an
  already-large change. Worth a real audit trail (who reassigned what,
  from whom, when, why) if reassignment turns out to be used often enough
  that "why did this move" becomes a real question — extending the
  existing audit_log trigger to this table would be the natural Phase 2.

- **Urgent-notification infrastructure retained for future reuse.** The
  IndiaMART 4-hour-SLA urgent path (`URGENT_LEAD_SOURCE_NAMES` computing
  `is_urgent` in `notify_opportunity_assigned`) was retired 2026-09-02 as
  part of Lead Management — IndiaMART inquiries now go through the
  `marketing_lead` review queue first, so nothing needs to interrupt a rep
  the moment an Opportunity is assigned anymore. **Explicitly decided
  2026-09-03: do NOT remove the underlying machinery** — `notification
  .is_urgent`, `NotificationRepository.list_urgent_unread`/`count_unread`'s
  urgent split, `GET /notifications/urgent-unread`, and the frontend's
  `UrgentNotificationDialog.tsx` (interrupting popup + 60s poll + dismiss/
  review flow) all stay in place, unused but ready. To light up a new
  urgent case later: add a `notify_*` method in `backend/app/domains/
  notification/service.py` that passes `is_urgent=True` for whatever
  condition warrants it — no new infrastructure needed, same shape the old
  IndiaMART logic had. See the comments on `notify_opportunity_assigned`
  and at the top of `UrgentNotificationDialog.tsx`.
  **Loose end found live 2026-09-03 while investigating this:** `is_urgent`
  is frozen on a `Notification` row at creation, not recalculated — a
  handful of pre-2026-09-02 IndiaMART test rows (all "aster medicity",
  actor Basheer K/Abdul Latheef P, Aug 25 and Aug 30) still carry
  `is_urgent = true` in the shared Dev DB. All but one are already read; one
  unread row (id `87636436-c484-4872-862b-3cd4201494e6`, recipient Shruthi,
  created 2026-08-30) still pops the dialog on her login. Not a recurring
  bug — confirmed no code path can create a new urgent row today — just
  stale pre-fix data. **Not yet cleaned up** — Basheer to pick: open it as
  Shruthi (Review marks it read, same as any assignment notification) or a
  one-time `UPDATE ... SET read_at = now()` on that row.

- ~~**Audit trail for account/user_profile/product/opportunity.**~~ —
  **DONE, 2026-09-02.** Migration `0030_add_audit_log.py` per
  `docs/Audit-Trail-Implementation-Plan.md` (ADR-017 Phase 1): one shared
  `audit_log` table, a generic `SECURITY DEFINER` trigger function
  (`UPDATE`/`DELETE` only — CREATE deliberately not logged, see the plan's
  resolved question 1), Admin/GM-only RLS read policy. Applied to Dev,
  `Physical-Schema.sql` regenerated. **Scope grew same-day beyond the
  original DB-only plan:** built the Admin/GM "Audit Log" screen too
  (new `backend/app/domains/audit/` domain + `AuditLogScreen.tsx`, nav-
  gated same as Territory Map/User Directory) — originally logged as a
  deferred follow-up below, picked up same session once Basheer saw the
  raw-UUID `changed_by` column and asked for it. Two rounds of live
  E2E-driven refinement beyond the base build: (1) resolved `changed_by`,
  the row's own `record_label`, and ~18 known foreign-key fields
  (`zone_id`, `owner_id`, `stage_id`, etc. — a hand-maintained
  field-name→table map, a deliberate, bounded exception to the trigger's
  own genericness) to human names instead of raw UUIDs; (2) a DELETE
  entry's full-row snapshot (all ~29 columns) was cluttered on screen —
  fixed by collapsing it behind a "Show all N fields" toggle, collapsed
  by default per Basheer's explicit call. All 5 verification-plan checks
  passed live against Dev, including RLS confirmed both at the DB level
  (direct role-scoped query) and in the app itself (Shruthi's non-admin
  login correctly has no Audit Log nav entry). Full build/verification
  narrative: `docs/Progress-Archive-2026-09.md`'s 2026-09-02 entry.
  **Not yet committed** as of this writing.

- **Lead Management for Marketing-Sourced Leads — built, migrations `0031`
  through `0034` applied to Dev, manual E2E in progress (Groups A and B
  passed 2026-09-02; resume at Group C).**
  **Renamed `lead`/`leads` → `marketing_lead`/`marketing-leads` mid-E2E**
  (collided with the existing Opportunity Stage "Lead" — see
  `docs/Progress-Archive-2026-09.md`'s 2026-09-02 entries and migration
  `0032_rename_lead_to_marketing_lead.py`). Raised
  2026-08-31 after a duplicate-Opportunity incident (Mount Zion Medical
  College, assigned to Vivek, duplicated a deal he'd already entered
  himself). New "Marketing User" role (create-and-assign only, zero
  pipeline visibility) plus a new `marketing_lead` table — deliberately not reusing
  `opportunity`, since a marketing/conference-sourced entry may not even
  be a real prospect yet, and putting it directly into the pipeline table
  would pollute forecast numbers before anyone's judged whether it's
  real. Nothing becomes a real Opportunity until the assigned rep reviews
  and converts it — structurally prevents the kind of duplicate that
  triggered this, rather than trying to detect it after creation. Bundled
  in: the IndiaMART 4-hour buylead-credit SLA moved outside Cabio
  entirely (the lead-entry person now handles it directly on IndiaMART's
  platform before anything reaches Sales OS), retiring the old
  `URGENT_LEAD_SOURCE_NAMES` urgent-notification logic in
  `notification/service.py`. Both of the plan's original open questions
  are resolved (no Account-creation rights for Marketing User;
  assignment picker filtered by the lead's `sbu_id`). Full design:
  `docs/Lead-Management-Implementation-Plan.md`; E2E plan and live
  progress: `docs/Lead-Management-Manual-E2E-Test-Plan.md`,
  `docs/Progress-Archive-2026-09.md`.
  **Follow-up, not part of this phase (raised 2026-09-02, during Group A
  E2E testing):** creating a *brand-new* Marketing User via User
  Directory's "+ Add User" flow currently fails with "SBU is required for
  this role" — `organization/service.py`'s `create_user` (`service.py:45-
  52`) only exempts the SBU-required check for roles in
  `_USER_WRITE_ROLES = {"General Manager", "Admin"}`, and Marketing User
  isn't in that set. Doesn't block current testing (reassigning an
  *existing* user's role, as done for live E2E, goes through `update_user`
  instead, which has no such check at all). **Not a one-line fix:**
  `_USER_WRITE_ROLES` is overloaded — it also gates who's authorized to
  create/update users at all (`service.py:35`), so simply adding
  Marketing User to it would incorrectly grant this role user-management
  rights. Correct fix is a second, separate constant scoped to "roles
  that don't need a real SBU membership" (Admin, GM, Marketing User),
  leaving the authorization check untouched.

- **Tally accounting alignment (SBU/Territory Cost Centre tagging) — a
  recommendation relayed to Latheef Bhai, not a decision or a build item.**
  Raised 2026-09-02 (phone call to Basheer): marketing expenses aren't
  visible by SBU today. Full write-up:
  `docs/Discussion-Tally-SBU-Territory-Accounting-2026-09.md` (also
  published as a memo artifact for sharing). Core recommendation — set up
  "SBU" and "Territory" as two independent Cost Categories in Tally, make
  Cost Centre tagging mandatory on Marketing ledgers first — needs **zero
  Sales OS engineering work**; it's a Tally configuration change for the
  accounts team. The eventual payoff of actually connecting Tally to
  Sales OS (once that integration is scoped, not started) is a Marketing
  ROI-by-SBU report pairing Tally spend against Sales OS lead/revenue
  data — not something to build now. Nothing for this session to pick up
  unless/until Latheef Bhai wants the integration itself scoped.

- **Engagement History generation — planned, not built, one open decision.**
  Superseded the earlier "Relationship Notes" plan (manual Activity type)
  2026-09-01: reps get zero new fields to fill in. Instead, a weekly batch
  job (plus an on-demand refresh) synthesizes a standing "where does this
  account stand" summary purely from Activity + Next Action data reps
  already enter, shown on a new Engagement History tab (Account/Opportunity
  360) and rolled up into a manager-dashboard Account Engagement Report.
  Validated by hand against real UAT data first (58 accounts) before
  committing to build. **Open:** which LLM/processing approach to use is a
  data-privacy decision for leadership, not an engineering call — options
  and a recommendation are laid out in the plan. Full design:
  `docs/Engagement-History-Generation-Implementation-Plan.md`.

- **UAT's `rls_auto_enable()` event trigger — permanent fix needed, not just
  another one-off disable.** UAT (not Dev) has an out-of-band Supabase event
  trigger that auto-enables RLS on any newly created table with zero
  policies — added outside the Alembic migration chain, first surfaced
  2026-08-05 while regenerating `Physical-Schema.sql` and flagged then as
  "reconciliation still open" (`docs/Progress-Archive-2026-08.md`). It has
  now caused **two separate lockout incidents**: the original 18-table
  UAT-wide lockout on 2026-08-03 (root-caused and fixed via `ALTER TABLE
  ... DISABLE ROW LEVEL SECURITY` on those 18 tables — see that day's
  entry), and again on 2026-08-21 when migrations `0018`/`0019` created
  `user_zone` and `zone_closure` — silently breaking Territory Map's
  coverage pills (reads return empty, no error) and throwing a 500 on zone
  assignment saves (which the browser misreports as a CORS error, since
  the failure response skips CORS headers — not an actual CORS
  misconfiguration). Both times fixed the same reactive way, per-table,
  after something broke. **Needs a permanent fix:** either remove the
  `rls_auto_enable()` trigger from UAT entirely (restoring parity with
  Dev, which never had it), or add an explicit "check + disable RLS on any
  new table" step to the migration workflow
  (`Backend-Implementation-Standards.md`'s migration checklist) so it's
  never missed again. Also applies to the eventual Prod promotion — see
  Deployment-Topology.md's existing "Trap for Prod" note, which already
  warns about the Supabase project-setup prompt but not about this
  standing UAT-only trigger.

- **Duplicate hospital names in the Customer Directory — Option B built
  and committed (`e86d49a`, 2026-08-31); not Haroon's decision status
  below).** Account creation only blocked an exact-name match
  (case-insensitive); a one-character-off name was allowed through, so
  near-duplicate hospital records could pile up. Raised 2026-08-29
  (extended sales team walkthrough); two options were written up for
  Haroon's decision (restrict new-hospital creation to Admins only, or a
  soft similarity-warning using Postgres `pg_trgm`). Option B was built
  and validated as a working prototype 2026-08-30/31 — near-duplicate
  warning on both create AND rename, a zone-branch lookup bug fix, and a
  rep-territory-scoped zone picker. Backend 644/644 passing, `tsc`/`lint`
  clean. **Manual E2E status, 2026-09-01: Basheer reports the full
  Groups A-G pass (`docs/BR-ACC-03-Manual-E2E-Test-Plan.md`) is now
  complete, with several bugs found and fixed along the way — but none
  of that was logged at the time, and the specifics aren't recoverable
  from memory now.** No further detail exists beyond what's in this
  entry; treat the feature as manually verified but its testing history
  as undocumented. This gap is what prompted the new "Testing narration"
  rule in `CLAUDE.md` (log bugs found/fixed during manual testing as they
  happen, going forward). **Whether it actually ships is still Haroon's
  call** per the original brief (Option A vs. B) — building it only
  proved Option B works, it didn't make the decision. Full writeup:
  `docs/Duplicate-Hospital-Decision-Brief-2026-08-29.md`; build
  narrative: `docs/Progress-Archive-2026-08.md`'s 2026-08-30 and
  2026-08-31 entries.

- ~~**Manager-Attested Stage-Gate Override for first-time fast-tracked deals.**~~
  — **DONE, 2026-08-27.**
  Raised at the 2026-08-19 leadership demo, decided same-day (2026-08-25,
  Basheer/Haroon, `docs/Discussion-FastTrack-Gate-Override-2026-08.md`) and built
  in the same session per `docs/Manager-Attested-Gate-Override-Implementation-
  Plan.md`: migration `0027`, `BR-OP-14` in `Business-Rules.md`, all 4 opportunity
  entry points. Reworked 2026-08-26/27 from an auto-appearing box (rejected
  during E2E) to an explicit "Fast-Track this Deal" checkbox; gained a
  one-time approver notification; two audit-integrity bugs found and fixed (a
  re-stamping/re-notifying bug on unrelated saves, and an uncheck-doesn't-
  reblock-the-gate bug). Manual E2E complete, 20 Pass / 2 Skipped. Committed
  `9043a50`, `a7fb786`. Full build narrative:
  `docs/Progress-Archive-2026-08.md`'s "2026-08-25 (later)" and "2026-08-26/27"
  entries.

- ~~**`UrgentNotificationDialog` multi-item race.**~~ — **DONE.** Diagnosed
  2026-08-25 as a gap in the 2026-08-25 Progress-Archive entry's bug #1 fix
  ("Urgent dialog blocking the Opportunity Detail screen") — that fix covered
  the single-item and bell-dropdown cases but left one edge case uncovered:
  reviewing one of 2+ outstanding urgent items still popped the dialog back up
  over the just-opened Opportunity Detail screen within ~500ms, since
  `handleReview`'s `setTimeout(..., 500)` invalidated `["notifications"]`
  wholesale, which by prefix-matching also swept up `urgent-unread` — the exact
  query the earlier fix scoped `refetchOnWindowFocus: false` on specifically to
  stop it refetching out-of-band. Fixed (confirmed live in
  `UrgentNotificationDialog.tsx`, committed as part of `e47ccc9`, on `main`):
  narrowed that invalidate to `["notifications", "unread-count"]` and
  `["notifications", "list"]` only, leaving `urgent-unread` to its own
  `refetchInterval: 60_000` — consistent with the component's own documented
  design ("reappears on next poll, not silence-forever-able by accident").

- ~~**Referral Credit Part 2 — Relationship-Support Activity.**~~ —
  **DONE, 2026-08-27.** Split out 2026-08-18 when Part 1 (Referral Credit,
  `BR-FIN-07`) shipped — see `docs/Progress-Archive-2026-08.md`'s
  2026-08-18/19 entry. Built per `docs/Referral-Credit-And-Relationship-
  Support-Implementation-Plan.md`: migration `0029` (two `SECURITY DEFINER`
  functions + `activity_tier_visibility` RLS amendment — the
  `referred_by_user_id`/`referred_by_note` columns were already live via
  `0023`, not recreated), `BR-ACT-10` in `Business-Rules.md` (also amends
  BR-ACT-04/BR-ACT-05), `LogActivityModal.tsx`'s "Related Opportunity"
  picker, the new `GET /accounts/{account_id}/opportunities/lookup`
  endpoint. Lets someone outside a deal's normal ownership/SBU log a
  "relationship support" note against a specific Opportunity via a narrow
  `SECURITY DEFINER` RLS carve-out. 11 new backend tests, 619/619 passing;
  `tsc`/lint clean. **Two gaps found and filled beyond the original plan:**
  `opportunity_id` and `notes` are both now required for this type (the plan
  left both optional at the schema level, which would have let the feature
  degrade into a meaningless unlinked, empty note). Migration applied to Dev,
  `Physical-Schema.sql` regenerated and reviewed. **Manual verification
  complete, all 16 cases pass** — including the cross-SBU flow (plan doc
  step 12.3), run live as Fahad doubling as both the same-SBU sanity check
  and the cross-SBU test subject
  (`docs/Referral-Credit-And-Relationship-Support-Manual-E2E-Verification.md`).
  **One finding, tighter than planned, not a bug:** a cross-SBU logger's own
  note text reads back fine, but the linked Opportunity's *name* stays
  invisible even on their own logged entry — the nested `opportunity`
  relationship load still goes through Opportunity's own RLS, which they
  still fail. The widening is even narrower in practice than "name-only in
  the picker" as designed.

  **Opportunity picker scope narrowed 2026-08-25** (architecture discussion
  with Basheer, before the build): the "which Opportunity is this about"
  picker in `LogActivityModal.tsx` renders **only when Activity Type =
  Relationship Support is selected** — the earlier plan's general-purpose
  version (available for *any* activity type logged from the Account level)
  was explicitly dropped, not bundled in. Two options were considered and
  rejected before landing here: (a) drop the Opportunity-level link
  entirely, logging only at the Account level — this would have avoided the
  cross-SBU visibility question altogether (an Account-only note already
  works today for anyone, zero new backend code), but loses which specific
  deal the support was about; (b) keep the general-purpose picker as
  originally planned — rejected as unnecessarily broad exposure for a
  narrow, informal use case, and it would have shipped the general
  convenience as an incidental side effect rather than a deliberate
  decision. **Important, confirmed still true as built:** the activity-type
  gate is frontend-only — it doesn't shrink the backend security work, since
  the lookup function itself can't know why the frontend is calling it and
  still has to return that Account's Opportunity names to anyone who calls
  it. Manual cross-SBU verification still required, including via a raw API
  call, not just through the gated UI.

- **Milestone 2 — Target Planning, Insights Dashboard/Reporting, Coverage Planning. All
  three fully scoped 2026-08-25, none started.** Sequencing decided the same session,
  superseding the original Target → Coverage → Reporting order from
  `implementation_plan.md`: Coverage Planning is new rep data-entry work that pays off
  only after adoption, while Reporting Batch 1 needs no new behavior from anyone and
  pays off immediately on data already flowing in — same "adoption before more
  features" reasoning that drove the 2-region weekly-deploy model
  (`docs/Deployment-Topology.md`). Decided rollout order:
  1. **Target Planning** — `docs/Target-Planning-Implementation-Plan.md`. Hard
     prerequisite for Coverage Planning (`BR-PL-03`'s FK). RLS-enable-only migration —
     `target_plan` already exists live, unprotected, never went through Alembic (a
     pre-migration-baseline leftover, same category as the `rls_auto_enable()` item
     above). **5 open decisions pending Basheer**, listed in the plan: who can set
     targets (proposed: SBU Manager/Area Manager/Admin/GM write, Sales Staff read-only
     own row), SBU Target as a computed rollup vs. a stored row, annual-as-sum-of-
     quarters, no approval workflow, no edit-lock once Coverage Plans reference a
     Target Plan.
  2. **Insights Dashboard / Reporting Batch 1** — `docs/Insights-Dashboard-Implementation-Plan.md`.
     Zero dependency on Target or Coverage Planning — split out from the PRD's much
     larger Reporting & Review Module (§5) to the target-independent subset: Pipeline
     Value, Weighted/Unweighted Forecast, Overdue Actions, Activity Levels, a read-only
     Stagnant Deals report. Explicitly **not** `BR-OP-06`'s real Stalled-status
     automation — no job scheduler exists in this codebase yet, so that stays a
     separate future item. **All 3 open decisions resolved 2026-08-25:** Pipeline
     Aging dropped from Batch 1 entirely (no stage-history table exists, and the only
     fallback — `opportunity.updated_at` — was judged too imprecise to ship); stagnant-
     deal threshold ships as a `threshold_days` query parameter defaulting to 180
     (`BR-OP-06`), with 90/~3-months (PRD §5.7) selectable as the alternate, rather
     than picking one; Overdue Actions tile is team-rollup only (Sales Staff don't get
     it — redundant with their own Reminders-on-Login bell — SBU Manager/Area
     Manager/Admin/GM see their team's count broken out per rep). **Real gap still
     open, not a decision, an incompleteness in the plan itself:** 3 of the 8 Batch 1
     items — High-Priority Deals, Opportunities On Hold, Product Performance Summary —
     are listed in the plan's scope table but have no `schemas.py`/`router.py` entry
     spec'd yet; need fleshing out before build covers the full stated scope.
  3. **Coverage Planning** — `docs/Coverage-Planning-Implementation-Plan.md`. Same
     RLS-enable-only migration situation as Target Planning (`coverage_plan`/
     `coverage_plan_entry` also live, unprotected, pre-Alembic). Permission shape is
     the *reverse* of Target Planning — self-authored by the rep, not manager-set.
     **4 open decisions**: who authors a plan (self vs. manager-delegated), whether
     Account selection should be territory-restricted (nothing else in the app
     restricts Account choice by zone/SBU today, so this would be a new precedent),
     `coverage_frequency` as free text vs. a fixed picklist, and the same "approved
     Target Plan" wording gap as Target Planning's decision.
  4. **Reporting Batch 2** (attainment %, Pipeline Coverage Ratio, Beat Plan
     Compliance) — needs both Target and Coverage Planning data to exist, necessarily
     last. Not separately scoped yet — fast-follow once #1 and #3 have real data.

  **Referral Credit Part 2 (was competing for the same queue slot) shipped
  2026-08-27** — see that entry below. Target Planning is next in line for
  this track, still gated on the 5 open decisions above; nothing built yet.

- **Annual Development-Activity KPI — a real manager-set target, tracked against
  Sales Development Activities.** Decided with Haroon 2026-08-27
  (`docs/Discussion-Sales-Development-Activities-2026-08.md`): once Sales Development
  Activities exist, a manager should be able to set an annual target for a rep (e.g.
  "4 trainings this year") and see actual-vs-target attainment for it, the same idea
  as the revenue target in Target Planning but for a count of development activities
  instead of money.
  **Architecture decision, made 2026-08-27:** this does **not** get bolted onto the
  `target_plan` table Target Planning is building this week. That table is
  revenue-only (a currency amount) and quarterly only, by design — forcing a
  count-based, annual metric into the same row would complicate the very migration
  currently shipping and produce a confusing half-currency/half-count table. Instead,
  this gets its **own table** later (something like `annual_kpi_target`: user, SBU,
  year, KPI type, target count), reusing the same manager/RLS scoping pattern Target
  Planning establishes, once it exists to copy from.
  **Sequencing:** deliberately last in line — needs both Target Planning (to copy the
  scoping pattern from) and Sales Development Activities (to have real logged
  activity counts to compare against) built first. Not yet scoped as a formal
  implementation plan; nothing implemented.

- **Activity log privacy hole — some entries are visible to everyone in the
  company, not just the rep's own manager chain.** Surfaced 2026-08-27 while
  scoping Sales Development Activities (`docs/Discussion-Sales-Development-
  Activities-2026-08.md`). Every activity a rep logs is supposed to be
  visible only to that rep and their reporting chain (manager, GM, etc.) —
  same as everything else in the app. But there's an existing bug in the
  database-level rule that enforces this: for any activity that isn't
  attached to a specific Opportunity, the rule doesn't restrict it at all —
  it's visible to every logged-in user, any role, any zone. This bug already
  exists today for some activity types. The new Sales Development Activities
  (conferences, training, certifications) are designed to never be attached
  to an Opportunity or even an Account, so every single one of them will
  fall into this open bucket. Not urgent — nothing sensitive about customer
  deals is exposed, just things like "so-and-so attended a training" — but
  it's a real, growing gap worth fixing properly (correcting the underlying
  database rule) rather than leaving it to spread further as more
  unattached activity types get added. Needs Basheer's call on priority;
  nothing implemented.

- ~~**Critical Care/Imaging manager hierarchy — UAT/Prod rollout.**~~ —
  **SUPERSEDED, confirmed 2026-08-22.** The 2026-07-30 entry (`docs/
  Progress-Archive-2026-07.md`'s Phase 2E section) was about *test*
  accounts blocked on Basheer creating new Supabase Auth UUIDs — that
  blocker no longer applies. A real Critical Care hierarchy with real
  staff has since been built: `docs/Zone-Hierarchy-Territory-Data-2026-08.md`
  (2026-08-12 update) shows Nishad managing Critical Care in North Kerala
  with Adydev reporting to him, and Adarsh's entire South Kerala cluster
  confirmed Critical Care SBU. Nothing left to pick up under this entry.
- **9 date-only `type="date"` fields left unconverted, on purpose.**
  Basheer's explicit scope call during the MUI migration (see the
  `@mui/x-date-pickers` archive entry) — `Customer360Screen.tsx`/
  `OpportunityDetailScreen.tsx` (7 fields) and `ProjectDirectoryScreen.tsx`
  (2 fields). Pick up only if Basheer decides to extend scope; not
  blocking anything.
- **`sales-os-app/src/App.jsx` legacy `/prototype` route still says
  "Sales Manager."** Mock-data-only route, unaffected by the real Sales
  Manager Tier Collapse elsewhere in the app. Not yet decided whether the
  prototype route is worth touching at all — Basheer's call, pending.

- ~~**Make `user_profile.sbu_id` (and audit `zone_id`) properly nullable for
  Admin/General Manager.**~~ — **DONE, confirmed 2026-08-22.** Superseded
  2026-08-16 by `docs/Admin-GM-SBU-Agnostic-Implementation-Plan.md` (a
  fresh full investigation — every RLS policy + every Python `.sbu_id`
  read re-checked against current code, not this stale 2026-07-28 scope),
  then **shipped 2026-08-17, commit `91a0906`**: migration `0022` drops
  `sbu_id`'s `NOT NULL` and backfills Admin/GM rows to `NULL`;
  `UserProfile` model, `UserMeResponse`/`UserListResponse`/`UserCreate`
  schemas, and `set_rls_context()`'s None-guard all updated to match;
  `UserDirectoryScreen.tsx` hides the SBU field for Admin/GM. Verified
  live on Dev for all 3 real Admin/GM accounts per the commit message.
  Nothing left to pick up here — notes below kept for history only.

  Surfaced 2026-07-28 while fixing the `/users`
  endpoint's visibility filter (see `docs/Progress-Archive-2026-07.md`) —
  Admin/GM are an unrestricted overlay tier, not members of any SBU/zone, but
  `sbu_id` is `NOT NULL` today so their rows carry a meaningless placeholder
  value that can coincidentally leak into another tier's scoped view. Fixed
  for now with a contained role-based exclusion in `UserRepository.list_active`;
  the conceptually-correct fix is nullable columns, but that's real multi-file
  work, not a quick follow-up:
  1. Migration: `ALTER TABLE user_profile ALTER COLUMN sbu_id DROP NOT NULL`,
     backfill existing Admin/GM rows to `NULL`.
  2. `UserProfile` model: `sbu_id: Mapped[uuid.UUID | None]`,
     `sbu: Mapped[SBU | None]`.
  3. `set_rls_context()` (`app/db/session.py`): add the same
     `if user.sbu_id is not None:` guard `zone_id` already has. Lower risk
     than it first looked — confirmed `cabio_app_sbu_id()`
     (`0009_cabio_app_rls_helper_functions.py`) already does
     `NULLIF(current_setting(..., true), '')::uuid`, so a never-set or
     reset-to-empty session var already resolves to a clean SQL `NULL`
     rather than erroring; this exact problem was already solved once for
     `zone_id` and applied uniformly to all 4 identity functions.
  4. ~~**Open product decision, not just plumbing:** `opportunity` router
     stamps `sbu_id=current_user.sbu_id` unconditionally on create, and
     `opportunity.sbu_id` is `NOT NULL` — if Admin/GM has no `sbu_id`, either
     they shouldn't create opportunities directly (business-rule gate), or
     the create form needs an explicit SBU picker when the creator has none.
     Needs Basheer's call before implementing.~~ — **RESOLVED 2026-08-04** as
     BR-OP-12 (`docs/Business-Rules.md`): Admin/GM now get an explicit,
     required SBU picker on both create forms and are never defaulted to
     their own `sbu_id`. This code path is already forward-compatible with
     `sbu_id` going nullable — no further change needed here when/if this
     migration is picked up.
  5. Audit every other unconditional read of `.sbu_id`/`.sbu` — `UserCreate`/
     `UserUpdate`/`UserListResponse` schemas, User Directory screen
     rendering, target/coverage plan creation.
  6. Data migration runs against the live shared dev DB — same care as any
     other live write.
  7. Touches the same doc surface as Phase 2E's Task 10 pass
     (`Physical-Schema.sql` etc., completed 2026-07-30) — update those docs
     again in the same commit as this migration rather than creating new
     doc debt.
  8. Dedicated manual verification pass logging in as Admin/GM post-change,
     same spirit as Task 8/9's role-by-role checks — confirm nothing breaks
     now that their session carries a genuinely absent `sbu_id` for the
     first time ever.
- **Parent-account cycle guard — recursive-CTE optimization, not needed yet.**
  `AccountService._creates_cycle` (`backend/app/domains/account/service.py`)
  walks the ancestor chain with one DB round-trip per level; full reasoning
  and the CTE alternative are in that function's own docstring, not repeated
  here. Revisit only if a future milestone introduces deeper hierarchies.
- **Parent/Child account navigation — richer `initialData` instant-paint.**
  Surfaced during Milestone 1 "Parent Customer display" planning (2026-07-10,
  see `docs/Prototype-Production-Parity-Audit.md` §6). `Customer360Screen.tsx`'s
  `account.parent_account`/`account.child_accounts` are typed as a minimal
  `AccountRef {id, name}` — clicking a parent or child link still paints
  instantly from that (and reliably kicks off an immediate background
  refetch), but the *initial* paint only has a name, no
  zone/payer_behavior/counts, unlike Directory-list navigation which has
  all of that from its already-fetched row data.
  **Why it's cheap, if picked up later:** `account.zone` is a separate,
  non-self-referential relationship — always eager-joined regardless of nesting —
  so `parent_account.zone` is already in memory once `parent_account` loads; no
  extra query needed to expose it. For `child_accounts`, the `list_children()`
  repository query would just need `joinedload(Account.zone)` added to its
  options — one wider `SELECT`, not an extra round trip. Still 2 queries total for
  the whole account-detail endpoint, same as today.
  **What it'd take:** (1) backend — use `AccountListResponse` (zone, payer_behavior,
  parent_account_id) instead of the minimal `AccountRef` for `parent_account`/
  `child_accounts`, safe one level deep (no self-referential recursion risk since
  neither field nests a further `parent_account`); (2) frontend — `DemoApp.tsx`'s
  `selectedAccount` state (currently typed `{id, name}` only) needs widening to
  carry the richer object through `handleSelectAccount`, so it flows into
  `Customer360Screen`'s `initialAccount` prop → `useQuery`'s `initialData` the same
  way Directory-list navigation already works. Real cost is a slightly heavier
  payload on every account-detail fetch — negligible, and zero for the majority of
  accounts with no parent/children.
- **NPS field range enforcement + product dropdown label consistency (two-fix commit).**
  Surfaced during `Customer360Screen.tsx` Commit B E2E verification (2026-07-06).
  (1) NPS Score on Stakeholders has no range constraint today — free-number input.
  Standard NPS survey input is 0–10 per respondent; the -100 to +100 range is an
  aggregate metric, not a per-person score. Backend `nps_score` is already
  constrained `ge=-100, le=100` — the frontend-only 0–10 clamp idea needs
  revisiting/a decision before any fix is executed, not a ready-to-build task.
  ~~(2) Opportunity item-picker renders `{p.name}` only; Installed Base dropdowns
  render `{p.name} — {p.model_number}`. One-line fix in `Customer360Screen.tsx`
  line ~928 (still present as of `1bc4678`).~~ — **INVESTIGATED AND DROPPED,
  2026-08-17: the premise doesn't hold against real data.** Checked both
  claims directly: no two products in the catalog share a `name` (zero
  duplicates, confirmed by query), so there's no actual disambiguation gap
  for a model-number suffix to close; and `name` is already, for ~27 of 29
  real products, a literal `"{oem_name} {model_number}"` concatenation
  (e.g. `EDAN` + `SE-1200 Express` = `EDAN SE-1200 Express`), so appending
  `— {model_number}` would mostly just repeat the model number a second
  time on the same line. Also confirmed the Installed Base dropdown does
  **not** currently show the model number either (only the read-only
  saved-asset summary row does) — the original "Installed Base already
  does this" half of the claim was itself inaccurate, likely stale since
  `Customer360Screen.tsx`'s MUI rewrite. One real product (`Siemens USG
  M/c`, model `P500`) has a name that doesn't surface its model number,
  but that's a single mislabeled row, not a systemic pattern worth a
  cross-cutting fix. Not picked up.
- **`OpportunityDetailScreen.tsx` — convert Products/Splits/Stakeholders inline edit
  forms to `FormModal` (desktop UX fix).** Surfaced during E2E verification 2026-07-06.
  On desktop (1920px) the inline edit mode for Products, Splits, and Stakeholders tabs
  renders as form fields floating inside the narrow content column — looks stranded and
  unfinished compared to the modal pattern used elsewhere. Not "free" to fold into an
  already-planned touch of the file — it's its own standalone future change.
- **Round 1 activity query optimization — never ported to the opportunity-scoped
  path.** `activity/service.py::list_by_account` sources its `total` from
  `account.activity_count` (no separate COUNT query); `list_by_opportunity` still
  does the old 3-round-trip pattern (`opportunity_exists` + `list` + a separate
  `count_by_opportunity`). Minor now that the backend concurrency fix removed the
  actual bottleneck, but a real, verified gap. Also: `ActivityRepository.count_by_account`
  is now dead code (only referenced in tests, never called in production) — confirmed
  via repo-wide grep. And `list_by_account`'s own `total`/`total_pages` response fields
  are a "lower bound" approximation (`offset + len(items)`), not an accurate count —
  works today only because `Customer360Screen.tsx` overrides it with `activity_count`;
  any other caller of that endpoint would get a wrong total. Low priority, not
  demo-blocking, but a real correctness gap in the API contract.
- **Input text size/weight on migrated `TextField`s.** Every pre-migration
  Tailwind file used a shared `inp` constant with `text-sm font-medium`
  (14px/500) on every text input. No migrated file's `TextField`s carry an
  explicit override — MUI default typography (~1rem/400) instead. Confirmed
  present in `QuickLeadModal.tsx`, `OpportunityDetailScreen.tsx`, and
  `Customer360Screen.tsx`. Basheer's call: fix once, holistically, in the
  theme (`src/theme/index.ts`'s `MuiOutlinedInput`/`MuiInputBase` override)
  rather than per-file. Grep `size="small"` across migrated files first.
- `statusColors.ts` — create as one pass after Tailwind migration; consolidates
  ~11 files; resolve emerald-50-vs-100 (and any other weight inconsistencies) at
  that time from complete view.
- **Type the shared frontend service functions properly.** `listUsers`
  (services/masterData.ts), `listAccounts`, `listOpportunities`,
  `updateOpportunity` (services/accounts.ts) — and likely their siblings —
  return `Promise<unknown>` instead of a typed shape, forcing callers to use
  `any[]`/local inline types. Cascades — consumed by Customer360Screen.tsx,
  CustomerDirectoryScreen.jsx, QuickLeadModal.tsx, LogActivityModal.tsx.
  Deferred because it's a shared-service-layer change, not part of any
  single file's migration. Post-migration, medium priority.
- **Next Actions screen: show everything + search/filter bar (by account/hospital
  name, reminder text, overdue, completed), replacing the Pending/Completed
  toggle.** Raised by Basheer 2026-07-06 as an alternative to the include_completed
  bug fix; not adopted then (minimal fix chosen instead).
  Would need: backend query params on `/reminders` (`search`, `status:
  pending|completed|overdue|all`) built server-side to preserve pagination
  (reminders never get deleted — BR-ACT-04 mandates one per Activity, so the
  dataset grows indefinitely); `Reminder`/`Activity` already joins `Account`
  (`lazy="joined"`), so hospital-name search is cheap. Open question never
  resolved: what "name" should match — reminder_text, opportunity name, or a
  stakeholder/contact name (no such field exists on Reminder/Activity today —
  would need a new join if that's the intent). Frontend would replace
  `NextActionsScreen.tsx`'s `ToggleButtonGroup` with a search field + status
  filter. Not started.
- **Consolidate +LOG / +LEAD into context-sensitive global buttons — now
  PARTIALLY DONE, not fully.** Was: 3 independent `LogActivityModal` mounts
  (`DemoApp.tsx`, `Customer360Screen.tsx`, `OpportunityDetailScreen.tsx`).
  During the Project Details activity-logging build (`6075c80`, 2026-07-06),
  Project Detail was wired into `DemoApp.tsx`'s existing header `+Log` button
  instead of adding a 4th independent mount — `DemoApp.tsx` now has
  `selectedProject` state + `onSelectProject`/`openLogActivityRef` plumbing,
  proving the "lift state into DemoApp" approach works in practice.
  **Still remaining:** `Customer360Screen.tsx` and `OpportunityDetailScreen.tsx`
  still each have their own separate `LogActivityModal` mount, untouched —
  retrofitting those two onto the same header-button pattern is the rest of
  this item. Same rationale as before (duplication is what let the
  `.then()`-vs-`useQuery` defect go unnoticed). Sequence after the MUI
  migration backlog, or opportunistically if either file is touched again.
- **Extract a shared `BackButton` component.** The circular `IconButton` +
  `ArrowBackIcon` control (Frontend-Implementation-Standards.md §6.6 item 7)
  is inlined in `OpportunityDetailScreen.tsx` and will be needed unchanged in
  `Customer360Screen.tsx`, `ProductCatalogScreen.jsx`,
  `ProjectDirectoryScreen.jsx` when they migrate. Do as its own small refactor,
  or fold into the second of these files to migrate.
- **§6.7 enforcement gap** (Frontend-Implementation-Standards.md). No mechanical
  guard against hardcoded hex colors drifting back into per-component `sx`
  props (theme should be single source of truth). Post-demo, not blocking.
- **§9 enforcement gap** (Frontend-Implementation-Standards.md). §9's checkmarks
  are self-reported and have already drifted silently twice
  (`LogActivityModal.tsx`, `OpportunityDetailScreen.tsx` both mislabeled
  "React Query ✓" while still using manual `.then()`). Candidate guards: grep
  `.then(` in files listed "React Query ✓"; grep `: any`/`any[]` in files
  listed "TypeScript ✓". Post-demo, not blocking.
- **Inline "+ New Stakeholder" shortcut from the Opportunity Stakeholders tab.**
  `OpportunityDetailScreen.tsx`'s "Link Stakeholder" form only lists existing
  account-level `Stakeholder` records — no way to create one without leaving
  the opportunity. Not a data-model gap (Stakeholder is always account-scoped).
  Reuse `Customer360Screen.tsx`'s existing "New Stakeholder" `FormModal` field
  set/service call, then `addOpportunityStakeholder` to link it. Basheer's
  call: hold as deferred.
- **`brand` filtering on `ProductService.list_products` — not implemented.**
  If real brand filtering is ever needed, add it to
  `ProductService.list_products`/`ProductRepository.list_products` and add
  a genuine test for it then — not before.
- ~~Reminders-on-login feature is DEFERRED behind the migration — not
  lost, not current.~~ — **BUILT 2026-08-22, revised 2026-08-23, not yet
  verified.** GM Haroon requested a login notification; implemented as
  this same deferred feature (each user sees their own due/overdue Next
  Actions on login, plus a date-range filter on the Next Actions
  screen). Committed `dc826b2` as an inline banner 2026-08-22; changed
  to an overlay `Dialog` 2026-08-23 per Basheer's UX call, which also
  surfaced and fixed a pre-existing ~500-700ms latency (count now rides
  free on the `/auth/me` response already fetched at login, instead of a
  separate round trip). **Manual E2E: partially done** — remaining
  checklist items are now bundled with the Opportunity-Assignment-
  Notifications feature's manual pass (both surface in the app header)
  — see `active_progress.md`. Full design in
  `docs/Reminders-on-Login-Implementation-Plan.md`; narrative in
  `docs/Progress-Archive-2026-08.md`'s 2026-08-22 and 2026-08-23 entries.
- **Opportunity-Assignment Notifications — three pieces deliberately
  deferred, not built.** Built 2026-08-24 (`b772416`, plan in
  `docs/Opportunity-Assignment-Notifications-Implementation-Plan.md`):
  a header bell notifies a user when someone else assigns them an
  Opportunity, with an interrupting dialog for IndiaMART-sourced leads
  (4-hour buylead-credit SLA). Explicitly out of scope for that build:
  (1) notifying the *previous* owner when displaced by a reassignment;
  (2) a full notification history page beyond the header dropdown's
  recent list; (3) real push notifications (service worker + backend
  push sender) that would reach a recipient whose app/phone is fully
  closed — the shipped urgent dialog only helps if the app is already
  open when it polls. Also not wired: BR-OP-06's Stalled-opportunity
  notification, though the generic `notification` table this feature
  introduced is shaped to support it later without rework.
- **`pool_pre_ping` health-check round trip on every DB connection
  checkout — app-wide latency, deliberately not touched.** Surfaced
  2026-08-23 while root-causing the reminders-dialog latency
  (`docs/Progress-Archive-2026-08.md`'s 2026-08-23 entry). Adds ~60-100ms
  to every single API request. Removing it in favor of
  `pool_recycle`-based staleness handling (`backend/app/db/session.py`'s
  `engine`) would save that app-wide, but trades off some
  connection-error resilience — on a live shared dev DB, Basheer should
  make that call deliberately, not have it bundled into a quiet perf
  patch. Not started.
- ~~**`docs/Physical-Schema.sql` is stale and unreliable**~~ — **RESOLVED
  2026-08-03.** Regenerated via `pg_dump --schema-only` (Docker, `postgres:17`
  image matched to the live server's actual version — see finding below)
  against the UAT database; confirmed all previously-missing objects are now
  present. Process fix landed too: `Backend-Implementation-Standards.md`'s
  migration workflow now has an explicit "Regenerate Physical-Schema.sql"
  step, so this can't silently drift again. Full history in
  `docs/Progress-Archive-2026-08.md`'s 2026-08-03 entry.
  **Side finding:** both Dev and UAT are actually running **Postgres 17.6**,
  not 16 as `CLAUDE.md` stated (corrected same day) — likely just stale from
  the original planning-stage writeup, not an actual environment mismatch.
- **`sales-os-app` has a real `typescript`/`openapi-typescript` peer dependency
  conflict.** Surfaced 2026-08-02 deploying the UAT frontend to Render, which
  does a genuinely clean `npm install` — `package.json` declares
  `typescript@^6.0.3`, but `openapi-typescript@7.13.0` (dev-only, used solely
  by the `generate:types` script) peer-requires `typescript@^5.x`, so a clean
  `npm install` fails with `ERESOLVE`. Not caught locally because Basheer's
  local `node_modules` predates the `typescript` 6.x bump and was never
  reinstalled from scratch. Worked around for UAT with
  `npm install --legacy-peer-deps` in Render's Build Command — safe there
  specifically because `openapi-typescript` never runs during `vite build`,
  but the underlying mismatch is still real and will hit the same wall on
  any other clean install (a new dev machine, CI, Prod's frontend build).
  Real fix: either downgrade `typescript` to `^5.x` or wait for
  `openapi-typescript` to support the `6.x` peer range — not decided yet.
- **`npm audit` reports 9 vulnerabilities (1 low, 8 high)** in `sales-os-app`'s
  dependency tree, surfaced during the same 2026-08-02 UAT frontend deploy.
  Pre-existing, not introduced by that deploy. Needs a proper look (`npm
  audit` for detail, then `npm audit fix` or manual upgrades) — not done
  under Monday-deadline time pressure.
- **`sales-os-app`'s production JS bundle is 1.58 MB**, over Vite's 500 kB
  chunk-size warning threshold — flagged in the same 2026-08-02 UAT deploy
  log. Performance item (code-splitting via dynamic `import()`), not a
  correctness one. Candidate approach in the build's own warning: dynamic
  imports or `build.rolldownOptions.output.codeSplitting`.
- ~~**`ProjectDirectoryScreen.jsx`'s opportunity create/update never refreshes
  React Query caches at all**~~ — **DONE, confirmed 2026-08-22.** Resolved
  as part of the file's MUI + React Query + TypeScript migration
  (`1d51b6d`, `ProjectDirectoryScreen.tsx`) — the deferral rationale below
  ("fix it when this file's migration lands") played out exactly as
  planned. Confirmed 10 `queryClient.invalidateQueries(...)` calls now
  present across the opportunity/project create/update handlers,
  including `["opportunities", "byAccount", ...]` and `["pipeline"]`.
  Nothing left to pick up here.
- ~~**Opportunity create forms are missing stage-gate fields (Demo Date,
  Expected Closure Date, PO Number) — BR-OP-00 direct-to-advanced-stage
  creation fails.**~~ — **SHIPPED 2026-08-05, `main` commit `6a8e841`.**
  Surfaced 2026-08-04, UAT orientation session — a rep creating an
  Opportunity directly at Order stage hit a server rejection for a
  missing Demo Date, a field that screen didn't even show. Turned into
  two decisions, both now shipped: (1) all 4 opportunity create/edit
  entry points brought to field parity — Demo Start/End Date, Expected
  Closure Date, PO Number, and (found during Basheer's manual
  verification) Hold/Lost/Won status-gated fields that Project Detail's
  edit modal was missing entirely; (2) a new `REPEAT_ORDER` lead-source value
  relaxes the Demo/Clinical Evaluation gates (`BR-OP-13`) for customers
  repeat-ordering the exact same equipment (~40% of the pipeline, per Haroon),
  while Order Value/Product Details stay required. Full decision record
  and implementation summary in
  `docs/Discussion-FastTrack-Opportunity-Creation.md`. **Still
  outstanding:** not yet pushed to `uat`; `REPEAT_ORDER` seed row applied to
  Dev only, needs the same on UAT once this ships there; verified working
  on Dev by Basheer, UAT not yet checked.
  **Opportunity cloning** (auto-fill a REPEAT_ORDER deal from the
  customer's last order) was considered and deliberately kept separate —
  logged here as a future item, not picked up yet.
- **Split participant picker / cross-SBU contribution — DECIDED 2026-08-05,
  ready to build.** Surfaced 2026-08-04, UAT orientation session — team
  expected to be able to split a deal with anyone regardless of SBU. Turned
  out to bundle three separate needs, each resolved on its own terms with
  Haroon — full record in `docs/Discussion-SplitParticipant-SBU-Scope.md`
  (v6):
  1. **Split stays same-SBU, any-zone — SHIPPED 2026-08-07.** Cross-SBU
     splits remain deliberately disallowed (ADR-037/`BR-FIN-06`) — not
     reopened. The picker's `listUsers()` scope was renamed from
     `sbu_zone` to `sbu` and its zone check dropped (small backend change,
     see `Discussion-SplitParticipant-SBU-Scope.md` SS3.1 for why "no
     backend change" turned out not to hold).
  2. **Referral credit** — new `referred_by_user_id` on Opportunity, any
     SBU/zone (reuses the existing `scope="all"` picker), one-time, no
     revenue/visibility impact.
  3. **Relationship-support activity** — self-reported `Activity` logged
     against the Account with a structured `opportunity_id` link,
     `activity_type = RELATIONSHIP_SUPPORT`. Needs one new Postgres function
     (`cabio_app_opportunity_in_account`, mirrors the existing
     `cabio_app_has_split` pattern) and a small `activity_tier_visibility`
     RLS amendment (`OR user_id = cabio_app_uid()`, so a cross-SBU
     contributor can read back their own logged activity) — both confirmed
     against the live policy source, not assumed.
  **Nothing implemented yet** — this entry moves once picked up.
- ~~**Admin/General Manager can't create Opportunities outside their own home
  SBU, despite RLS already granting them unrestricted cross-SBU access.**~~ —
  **RESOLVED 2026-08-04.** Surfaced during the UAT orientation session —
  Haroon Sidheeq (General Manager role) unable to enter opportunities in the
  SBU other than his own. Root cause was `opportunity/router.py` hardcoding
  `sbu_id=current_user.sbu_id` for every caller unconditionally, with no way
  for any role to override it — contradicting the `opportunity_tier_visibility`
  RLS policy (ADR-009), which already granted Admin/General Manager
  unrestricted cross-SBU write access at the database level. Fixed as
  **BR-OP-12** (`docs/Business-Rules.md`): `OpportunityCreate` gained an
  optional `sbu_id` field, honored only for Admin/General Manager
  (`OpportunityService.create_opportunity` — `AuthorizationError` for any
  other role attempting an override, `NotFoundError` for a nonexistent SBU;
  BR-OP-11's item-SBU check validates against the overridden SBU, not the
  caller's own). Both opportunity-create entry points got a role-gated SBU
  dropdown wired to it: `Customer360Screen.tsx`'s "Add Opportunity" modal and
  the global "+ Lead" `QuickLeadModal.tsx` — the Products picker in each now
  filters by the selected SBU too, not just the caller's own.
  **Follow-up (2026-08-04, same day):** the SBU field was initially optional
  with a "My own SBU" default — Basheer flagged that a default doesn't make
  sense for a role with no meaningful "own" SBU, and that leaving it
  untouched would silently create the Opportunity in the caller's
  placeholder `sbu_id`. Tightened so Admin/GM must always explicitly choose
  (no default, `"My own SBU"` removed from both pickers, label changed to
  "SBU *"): backend rejects with `BusinessRuleViolation` if `role_name` is
  Admin/GM and `sbu_id` is omitted; frontend blocks submission client-side
  too. Also considered and rejected (again) giving Admin/GM a real
  `SBU = "Corporate"` row instead of a placeholder — same objection as the
  2026-07-28 finding in `docs/Progress-Archive-2026-07.md`: it would leak
  into every other SBU-scoped picker/report (Product Catalog filters, User
  Directory's SBU assignment dropdown, Target/Coverage Planning's SBU
  dimension) and only holds if every future Admin/GM account remembers the
  convention. The role-gated dropdown already avoids needing any sentinel
  value. Also hid the "SBU: {name}" placeholder chip in the sidebar user
  footer (`DemoApp.tsx`) for Admin/GM, same reasoning. 9 new/updated backend
  unit tests total, 397/397 backend suite passing, `npx tsc --noEmit` and
  `npm run lint` clean. Not yet manually verified on Dev/UAT by Basheer.
  **Still separate/unresolved:** the "Make `user_profile.sbu_id` ... nullable"
  item above — that's Admin/GM having *no* home SBU value at all in the DB
  (vs. today's placeholder value that the app now knows to ignore). Point 4
  of that item (the open product decision about opportunity creation) is
  now effectively answered by this fix and needs no further work whenever
  that migration is eventually picked up — the create-opportunity path
  never relies on Admin/GM's own `sbu_id` being meaningful in the first
  place. The sidebar/zone display (line 272 of `DemoApp.tsx`, same
  meaningless-placeholder problem) was raised but deliberately left alone —
  not asked for.
- ~~**New product line onboarding (e.g., Cardiology) — not yet conceptualized.**~~
  — **RESOLVED 2026-08-06, confirmed with Haroon.** Not a new SBU — Cardiology
  sells under whichever existing SBU (Imaging or Critical Care) each product's
  technology fits; no dedicated team yet means no case for SBU-level
  infrastructure. No new tracking field either — `category_name` isn't being
  repurposed (confirmed dead/unused in the codebase). Current Cardiology
  inventory is entirely refurbished stock (confirmed 2026-08-13). Full
  reasoning, and the cutover plan for whenever Cardiology does graduate to its
  own SBU, in `docs/Discussion-Strategic-Growth-Topics-2026-08.md` §1.
- **Account Manager concept — relationship ownership distinct from
  Opportunity ownership — not yet conceptualized.** Raised in leadership
  discussion, 2026-08-05. Idea: a named Account Manager owns the overall
  relationship with a customer (hospital), responsible for mining further
  business there, as distinct from whoever owns a given Opportunity at that
  account. Today `Account` has no owner concept at all — only Opportunities
  have an `owner_id`. **Basheer's explicit call: this needs to be
  conceptualized and presented to Haroon and Latheef Bhai before any
  implementation work starts** — not a build item yet, don't design ahead of
  that conversation.
  **Update 2026-08-06:** this isn't starting from a blank page — the PRD
  already specifies it. §6.3 "Account Manager Assignment" and §6.3A "Customer
  Ownership Management" call for an optional "Primary Account Manager" per
  customer account, explicitly noted to "coexist with product-category
  ownership" (a separate, also-unbuilt PRD concept). Full analysis in
  `docs/Discussion-Strategic-Growth-Topics-2026-08.md` §2 — worth bringing to
  the Haroon/Latheef conversation as a starting point.
- **New lines of business — geography expansion via joint venture partners —
  not yet conceptualized.** Raised in leadership discussion, 2026-08-05.
  Cabio is considering partnering with a third party to sell Cabio's
  products in a new geography as a joint venture. Open question: how would
  that kind of expansion be represented in the system — a new `Zone`, a
  different `SBU`, a distinct owning entity/tenant, or something else
  entirely — given the current model assumes Cabio is the single selling
  entity throughout. No design work started; likely the largest-scope item
  of the four raised in this meeting, worth scoping carefully before
  committing to a data-model direction.
- ~~**Multi-zone user assignment — decided 2026-08-07, moved to
  `active_progress.md` as the next build item.**~~ — **SHIPPED, stale
  entry corrected 2026-08-17.** Built as Multi-Zone Milestone 1 — confirmed
  live and covered in the 2026-08-17 regression pass
  (`docs/Regression-Test-Plan-2026-08.md`'s A1, verifying a multi-zone
  Area Manager sees data from every assigned zone together). This entry
  was never marked done when the feature shipped. One narrower question
  from design doc `docs/Multi-Zone-Assignment-Technical-Design.md`'s §7
  (Target/Coverage Planning's `target_plan.zone_id` nullability) wasn't
  re-verified tonight — check that doc directly if it matters, not
  re-litigated here.
- ~~Document/photo upload on Opportunity~~ — **DONE, 2026-08-11**, commit
  `49c4c1d`, pushed to `origin/main`. Turned out to need real Storage
  infrastructure, not just a frontend gap as first scoped here — see
  `docs/Opportunity-Document-Upload-Implementation-Plan.md`.
- ~~**Activity Notes field silently blocks multi-line entry**~~ — **DONE,
  2026-08-17 (`c9861a0`).** Root cause was exactly as suspected:
  `FormModal.tsx`'s `<form onKeyDown>` handler blocked Enter on both
  `INPUT` and `TEXTAREA` tags; dropped `TEXTAREA` from the check. Follow-on
  found during verification: three read-only display sites (Activity
  Timeline, Daily Activity Report, a closed reminder's activity) needed
  `whiteSpace: "pre-wrap"` since newlines were saving correctly but
  collapsing visually — fixed same commit. Two more instances of the same
  display gap found and fixed in `1a3738d`: buyback item descriptions and
  product descriptions.
- ~~**Pipeline screen zone filter**~~ — **DONE**, confirmed live in
  `OpportunityPipelineScreen.tsx` (`listPipeline({ zone_id: zoneFilter,
  ... })`) — already built and committed; this entry was stale.
- ~~**Change default landing screen from Account Management to Pipeline**~~ —
  **DONE, 2026-08-12.** `DemoApp.tsx:47`, `useState("customers")` →
  `useState("opportunities")`. Back-navigation return-view state
  (`accountReturnView`, `opportunityReturnView`, etc.) and `accountSubTab`
  are independent `useState`s, confirmed unaffected.
- ~~**User Directory's Edit form always resends a user's existing
  `manager_id`, even when untouched.**~~ — **DONE, 2026-08-17.** Fixed
  exactly as discussed when this was surfaced (2026-08-12): the SBU
  `TextField`'s `onChange` in `UserDirectoryScreen.tsx` now looks up the
  currently-selected manager in the already-fetched `users` list, and
  clears `form.manager_id` back to `""` (visibly, in the form) if that
  manager is a normal (non-Admin/GM) person whose `sbu_id` no longer
  matches the newly-selected SBU — Admin/GM managers stay exempt, mirroring
  the backend's own exemption. Forces an explicit re-pick instead of
  silently resending a now-invalid value. Frontend-only, no backend/
  migration change; `tsc --noEmit`/`npm run lint` clean.
- ~~**Run `tsc --noEmit` / `npm run lint` / `ruff check` on the Territory
  Admin session's changes (2026-08-15).**~~ — **DONE 2026-08-15.** All
  four clean: `tsc --noEmit` (whole project, including legacy `.jsx` —
  nothing pre-existing surfaced either), `npm run lint`, `ruff check
  app/domains/reference/`, and a backend module-import + `FastAPI` app
  build check (`from app.main import app`, 16 routes). Covered the full
  batch: duplicate-zone-name 409 fix, clear-Parent-Zone-to-top-level fix +
  explicit top-level checkbox, alphabetical child-zone sort, and the soft
  "name exists elsewhere in the tree" warning. Still not manually
  exercised on Dev.
