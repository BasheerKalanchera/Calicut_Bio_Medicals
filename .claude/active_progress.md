# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-09-21_

## 2026-09-21 session (later) — Product Catalog Brand/Category/Model: built, migrated to Dev, smoke-tested live, committed and pushed — full manual E2E pass still pending

Picked up yesterday's stopped-mid-thread: Basheer answered the 6 open
data questions (keep "Kolkata"; leave wall-mount-stand out, he'll add it
manually later; drop "EDAN elite V Series" and "EDAN i20"; standardize
on "SonoScape"; brand is plain "Maquet"). Two more duplicate pairs
(H100B, i15) surfaced while cross-checking and were resolved the same
way. Finalized seed data: 59 active products across 9 brands/20
categories.

**Real environment mismatch found before writing any migration:**
Dev's `product` table (30 rows) is not a mirror of UAT's 65 — it's
leftover seed/test data, missing 35 real UAT products and carrying 4
unrelated ones (ECG Cable, Heart-Lung Machine, Siemens USG M/c,
Sonoscape Test). A migration hardcoding "update this UAT id in place"
would have duplicated every real product once promoted to UAT later.
Fixed by matching each of the 59 corrected products by its old `name`
(unique in both environments) at migration runtime — updates in place
if found, inserts fresh if not — so the same migration self-adapts to
whichever environment it runs against. Brand→SBU assignment (SonoScape
→ Imaging, everything else → Critical Care) cross-checked against both
Dev's and UAT's live data before writing it in (Basheer's go-ahead given
for both, including the UAT read).

**Built and applied to Dev:** migrations `0048`/`0049` (new
`brand`/`category`/`model` tables + RLS + triggers; `product` cut over
to `brand_id`/`model_id`/`category_id`, retiring 7 old rows). Backend:
new `reference/catalog_router.py` (Brand/Category/Model CRUD,
Admin/GM-gated), `Product` schema/service/repository updated, reporting
brand-grouping now joins the real `Brand` table. Frontend: Product
Catalog's Add/Edit form now cascades SBU → Brand → Model (Category
auto-fills), inline "+ Add new brand/model/category" for Admin/GM,
Product Name field removed (server-computed). 896/896 backend tests
pass, `tsc`/eslint clean, `Physical-Schema.sql` regenerated.

**Smoke-tested live on Dev as Haroon** (list rendering, detail view,
Add-form cascading pickers, SBU-scoped Brand options) — no full manual
E2E pass yet. **Committed `cd0d8ab`, pushed to `origin/main`.**
Post-commit checklist run: Traceability's Feature 4.1 row updated (stays
Partial, not Done, until E2E passes), scorecard regenerated and
`--check`-clean, `Backlog.md`'s Product Catalog entry replaced with the
2 real remaining follow-ups (full E2E pass; Product Performance's brand
cards still have no pipeline filter to drill into). Also caught and
fixed a stale claim in the plan doc itself (it said the Target Planning
brand-table edit was "not done yet" — checked directly, it was actually
resolved 2026-09-20).

**Also found while checking today's work, deferred to tomorrow morning
per Basheer's call:** 5 old products (not 34 — most of the original ~30
Dev rows were upgraded in place, not left behind) are now deactivated
rather than deleted, because real Dev data still points at them:
- **EDAN i15** (1 marketing lead) — clear fix: repoint to the real
  survivor "EDAN i15 Blood Gas" (same analyzer, corrected entry), then
  delete the old row. Basheer confirmed this one's obvious, do it first.
- **EDAN elite V Series** (1 opportunity line), **EDAN i20** (1
  marketing lead), **ECG Cable** (2 opportunity lines + 1 document),
  **Siemens USG M/c** (3 opportunity lines) — no safe automatic
  replacement (ambiguous which V-series model, a deliberately-dropped
  model, or not in Haroon's corrected list at all). Needs Basheer's
  actual decision on each, not a guess — walk through them one by one.

**Next step (tomorrow morning, first thing):** the 5-product cleanup
above. Then run the full manual E2E pass (`docs/Product-Catalog-Name-
Derivation-Implementation-Plan.md`'s Verification section) before
flipping Feature 4.1 to Done.

## 2026-09-21 session — UAT-vs-main commit gap explained (53 behind, 17 feat/fix); local `uat` branch found stale (root cause: 2026-09-14 emergency hotfix pushed straight to origin/uat) — parked for tomorrow, nothing built/synced

Discussion only, no code/git changes made. Full detail:
`docs/Progress-Archive-2026-09.md`'s "2026-09-21 session" entry.

**Next step:** tomorrow morning — decide when to `git pull` local `uat`
(now vs. right before the sync — either works, zero risk either way),
then carry out the main→uat promotion Basheer flagged for "the next
couple of days" (17 feat/fix commits, headlined by Target Planning, Lead
Follow-up Comments, Insights Dashboard, Reports, High Priority Deal Flag).

## 2026-09-20 session — UAT backup taken, first restore/DR drill run and validated, restore script + runbook built and committed

Commit **`e8de3f6`** (pushed) adds `scripts/restore_uat.ps1` and
`docs/UAT-Disaster-Recovery-Runbook.md`. Full detail, including the two
bugs found and fixed while building/testing the script (a `pg_trgm`
extension gap on fresh restore targets, and a PowerShell stderr-capture
bug that made a successful restore look like a failure), is in
`docs/Progress-Archive-2026-09.md`'s "2026-09-20" entries.

**Next step:** check `docs/Backlog.md` for the two open items the runbook
flagged but didn't resolve — laptop as a single point of failure for
local backups, and the Google Drive offsite copy being manual/irregular
— add them if not already there. No other thread is in progress.

## 2026-09-19 session — Scorecard rename committed, external review doc logged; waiting on a parallel session's Target Planning fix before picking up Target-dependent features

Two small commits landed and pushed to `origin/main`:
1. **`be98a00`** — renamed "New Features Added" to "Commitment beyond
   contract" across `scripts/generate_scorecard.py`,
   `docs/Phase1-Delivery-Scorecard.md`, and both `.scratch` client HTML
   files. `--check` caught one file stale before regenerating; confirmed
   clean and diffed before committing — label/wording only, no tallies
   changed.
2. **`9e3147e`** — logged `docs/Review-Phase1-Effort-Beyond-Contract-
   Negotiation-2026-09.md` (an external "Antigravity" tool's review of the
   Phase 1 effort-negotiation discussion paper), cross-referencing the
   original paper's commit `1cef3bc` in the message per Basheer's request.

Walked the docs for which signed features were genuinely waiting on Target
Planning (Coverage Planning, the Forecast month/quarter + <3×-target
alert, the Batch 2 Insights Dashboard tiles, Beat Plan Compliance, the
planned Annual KPI Target) and discussed sequencing. Full list and
rationale: `docs/Progress-Archive-2026-09.md`'s "2026-09-19" entry.

**Corrected on two points:** (1) a small Target Planning fix is still
in progress in a parallel session (its WIP, `docs/Brand-Level-Target-
Planning-Implementation-Plan.md`, appeared mid-session — left untouched);
(2) **`docs/Phase1-Completion-Sprint-Plan.md` is deprecated as of
~2026-09-12 — Phase 1 sequencing now comes from `Signed-Requirements-to-
PRD-Traceability.md` directly, not the Sprint Plan doc.**

**Separate thread, same day — Brand-Level Target Planning scoped, planning
only, nothing built.** `docs/Brand-Level-Target-Planning-Implementation-
Plan.md` drafted (bottom-up, mandatory per-brand split, Admin/GM-only
vendor-target entry, no cascade). Surfaced a real prerequisite: brand
grouping needs `product.oem_name` to stop being free text, which the
already-approved Product Catalog fix (migration 0048) does **not** do.
Basheer's call: promote that into a real "Part 2" of the Product Catalog
clean-up (Brand/Category/possibly Model → real controlled tables) and land
it **before** Brand-Level Target Planning is built. Full detail:
`docs/Progress-Archive-2026-09.md`'s "2026-09-19 (later)" entry;
`docs/Backlog.md`'s Product Catalog entry updated with the same
sequencing.

**Next step:** two independent things to pick up — (1) wait for Basheer to
confirm the other parallel session's Target Planning fix has landed, then
pick the next item straight from the Traceability Matrix's Partial/
Not-started rows; (2) write Part 2's actual technical design into
`docs/Product-Catalog-Name-Derivation-Implementation-Plan.md` (which
fields become real tables — Model's shape is still an open question, not
decided) and review it with Basheer before Brand-Level Target Planning can
start.

## 2026-09-18 session — Lead Follow-up Comments: built, full manual E2E pass (19/19), one real gap found and fixed live, comment-count badge added — ready to commit and push

Built per `docs/Lead-Followup-Comments-Implementation-Plan.md`: two-way
comment thread on `marketing_lead`, mirroring the existing Activity Comment
pattern exactly (RLS select/insert policies, notification fan-out,
`MarketingLeadCommentThread.tsx` modeled on `ActivityCommentThread.tsx`).
Migration `0047` applied to Dev, `Physical-Schema.sql` regenerated. Pre-E2E
`/code-review` (medium) came back clean. **Committed `d899b15`.**

Ran the full 19-case manual E2E pass live against Dev as Nishad K V
(assigned rep), Fahad (Marketing User, lead creator), and Haroon Sidheeq
(GM) — full results in `docs/Lead-Followup-Comments-Manual-E2E-Test-
Plan.md`. All 19 **Pass**. Two real findings, both resolved:
1. The lead creator (Marketing User) had no Comments UI at all —
   `MarketingLeadCommentThread` was only wired into the Review Queue
   screen, which this role has no nav entry for. Fixed by embedding it
   into `MarketingLeadEntryScreen.tsx` too.
2. Marketing User has no notification bell at all (pre-existing,
   deliberate 2026-09-02 decision) — can't be proactively nudged about a
   reply. Basheer's call: leave as-is, logged in `docs/Backlog.md`.

**UX follow-on after the pass:** Basheer noticed lead cards had no
comment-count indicator, unlike Activity's own "Comments (N)" badge. Added
a correlated `comment_count` subquery to `MarketingLeadRepository`
(mirrors `ActivityRepository._comment_count_column` exactly), verified
live — matches Activity's display precisely.

896/896 backend tests pass, `tsc`/`eslint`/`ruff` clean throughout.

**Next step:** commit everything (backend/frontend fixes, both doc
updates, this file) and push. This feature's row lives in Traceability's
separate "Pending — proposed, not yet built" table, not the main tally —
update its Status text there, no scorecard regeneration needed.

## 2026-09-18 session (latest) — UAT selective-migration audit; utils/reporting.ts renamed to utils/formatter.ts, committed and pushed

Basheer asked how to selectively hold back a parked feature from an
upcoming UAT sync (leadership reviewing the Delivery Dashboard's
Partial/Not-started rows for Phase 2 parking). Audited the 38 commits
on `main` not yet on `uat` (11 `feat:`, 3 `fix:`, rest docs/chore):
confirmed none of the 5 new Alembic migrations (`0042`-`0046`) touch
overlapping tables, so any one is mechanically excludable from a UAT
sync with a one-line `down_revision` repoint; the harder blockers are
UI-embedded changes (Kanban sort, Report Drill-down, Product Catalog
gating) baked into already-shared screens, not schema.

That audit surfaced a real naming mixup: `utils/reporting.ts` holds
only generic fiscal-quarter/currency-formatting helpers (no reporting
logic), but both Target Planning and the new Report screens import
from it — collision was cosmetic, not a real coupling. Renamed to
`utils/formatter.ts` (`git mv`, history preserved) and updated the 5
importing screens. `tsc --noEmit` clean; live smoke-tested (Insights,
Target Planning Quarterly+Annual, Pipeline/Sales/Product Performance
Reports) — no console errors, all Lakhs/period formatting correct.
Committed and pushed by Basheer directly, post-commit checklist run
retroactively per his request. Commit `160736a`.

**Next step:** none pending on this thread. Not a signed-requirement
feature — no Traceability/Scorecard change needed. The UAT
selective-migration decision itself is still open (leadership hasn't
named which features to park yet) — pick this back up once they do.

## 2026-09-17 session — RLS gaps (activity/marketing_lead/document/notification) fixed, full live manual E2E pass, committed and pushed

Fixed 4 pre-existing RLS gaps (a 5th, document delete authorization,
found separately while verifying #3) surfaced by a code-review pass:
migration `0046` plus a matching `DocumentService.delete_document`
change (owner or Admin/GM only). A code review before E2E caught a real
regression in the first draft (BR-ACT-10 Relationship Support broken by
removing the wrong bypass) — fixed and re-reviewed clean.

Ran the full live manual E2E pass across Vivek, Arun Adarsh, Nishad K V,
Fazal, Basheer K (swapped in for Arun on the document-delete negative
case, since Arun's SBU couldn't see the Imaging-SBU test deal at all),
and Haroon — every group PASS. Two real findings along the way, both
resolved: the document owner-path steps needed a live swap (Vivek owns
no opportunities in this dataset) to Fazal/Basheer K/Haroon; the
marketing_lead cross-SBU case (step 10) confirmed **not reachable
live** at all — every manager→report pair in the org is same-SBU — so
it's accepted as code-verified only. One UX gap logged directly in the
test plan (not Backlog, per Basheer's call): a blocked document delete
gives no error toast/banner at all, silently doing nothing.

Full results: `docs/RLS-Gaps-2026-09-17-Manual-E2E-Test-Plan.md`'s
Sign-off section. **Committed and pushed `6d333ef`.**

**Next step:** none pending on this thread — fully wrapped, committed,
and pushed. Not a signed-requirement feature, so no Traceability/
Scorecard flip needed. The delete-blocked-with-no-feedback UX fix is
tracked in the test plan itself, not Backlog — pick it up from there
whenever frontend polish is next in scope.

## 2026-09-17 session (earlier) — Target Planning frontend built, code-reviewed, full multi-role manual E2E pass, 6 bugs found and fixed live — feature Done, post-commit checklist run

Built the missing frontend (`TargetPlanningScreen.tsx` + service/types +
nav entry), reworked "My Target" mid-build into a per-SBU grouped view
once Basheer clarified GM sells across both SBUs personally, added the
requested Annual view, ran the new Pre-E2E code review rule (caught 2
blocking bugs + 3 smaller ones), then drove a full live manual E2E pass
across every role (Basheer switching logins) per
`docs/Target-Planning-Manual-E2E-Test-Plan.md` — which itself surfaced 2
more real gaps (GM's own target could never reach anyone's approval
queue; Admin was wrongly given a personal target). All fixed and
verified live. Post-commit checklist run: Sign-off filled in, Feature
3.1/6.4 flipped to Done in Traceability/Scorecard, Backlog updated.
**Committed and pushed `abaf8fa`, `4927502`, `f8213ee`, `9e36c95`.**
Full narrative and retro: `docs/Progress-Archive-2026-09.md`'s
"2026-09-17" entry.

## 2026-09-17 session — Lead Follow-up Comments discussion paper written; scorecard tooling extended with a "Pending — proposed, not yet built" list

Basheer relayed a real incident (a lead assigned to Sruthi sat unopened for
hours) that turned into two separate, resolved threads: the existing
`marketing_lead` assignment notification/read-tracking was confirmed
working as designed (bell-only, by intent — not a gap); the real gap is no
way for a rep to report back what they did with a lead, or for Marketing
to nudge them. Scoped by Basheer as a reuse of the existing Activity
Comment pattern — explicitly **not** an IndiaMART status sync, **not** a
new SMS/call alert. Written up:
`docs/Discussion-Lead-Followup-Comments-2026-09.md` — awaiting Latheef
Bhai's confirmation before an implementation plan is scoped.

Basheer also asked for this, plus the existing Pricing/Discount-Authority
paper, to be tracked to closure in the Traceability matrix. Since that
matrix's "Commitment beyond contract" section feeds the client-facing
scorecard verbatim as already-*built* features, added a new, separate
"Pending — proposed, not yet built" subsection instead (own Status
column, not counted in any Done/Partial/Not-started tally) so leadership
sees these as open decisions, not delivered work. Required extending
`scripts/generate_scorecard.py` to parse and render it (own color, own
stat tile, own section) across `Phase1-Delivery-Scorecard.md` and both
client HTML views. `--check` confirms all four generated files are in
sync; both `.scratch` Artifacts republished.

Also fixed a stale header found along the way:
`docs/Lead-Management-Implementation-Plan.md` still said "Planned, not
built" — the feature has actually been live since 2026-09-02.

**Next step:** none pending on this thread — awaiting Basheer's
conversation with Latheef Bhai on both pending items before either gets
scoped into a real implementation plan.

## 2026-09-16 session (recovery) — Target Planning approval-workflow backend recovered from a crashed session, verified, committed

A parallel session building Target Planning (owner sets a quarterly target,
direct manager approves/rejects, nobody approves their own row, Admin/GM
only steps in for someone else's) froze mid-session while doing frontend
reconnaissance. Traced by reading that session's own saved transcript
(`6a419dd4-2a70-49bf-a2ac-82627198c238.jsonl`, last activity 2026-09-16
~21:17): the freeze came from a hung Docker Desktop shutdown command run
right after `docs/Physical-Schema.sql` had already regenerated successfully
— the schema step itself never failed, nothing was lost.

**Backend confirmed complete and working:** `backend/app/domains/planning/`
(models with new `status`/`approved_by`/`approved_at` columns, repository,
service, router), migration `0044_target_plan_approval_and_rls.py` (already
applied to Dev), RLS updated so nobody can approve their own row. 864/864
backend tests pass (36 in the new planning tests), `ruff` clean.
`docs/Target-Planning-Implementation-Plan.md`'s three previously-open
decisions (GM's own approver, re-approval on revision, pending targets
counting in the rollup) are resolved and match the code.

**Not built yet:** the frontend screen — `TargetPlanningScreen.tsx`,
`services/targetPlanning.ts`, `types/targetPlanning.ts`, nav entry. The
crashed session had only gotten as far as reading `territoryAdmin.ts`'s
service/type pattern and searching for the shared `FormModal` component to
reuse before it froze — no frontend file exists yet.

**Committed `1d9d46a`** (backend only — no Traceability/Scorecard flip,
since the feature isn't usable end-to-end until the screen exists).

**Next step:** build the frontend piece per the plan doc's "Frontend
changes" section — start by confirming `FormModal` and following
`services/territoryAdmin.ts`'s pattern, same place the crashed session
was headed.

## 2026-09-16 session — Scorecard tally drift fixed, `--check` staleness guard added, third client view built: committed `40460ad`/`1b7a4c5`, pushed

Basheer caught Traceability.md's own "Current tally" line (26/14) had
drifted from its actual row data (27/13). Fixed structurally rather than
by hand: `scripts/generate_scorecard.py` now also rewrites that line
(inside new TALLY:START/END markers) and a new `--check` mode fails
loudly, naming any stale file, without writing anything. Codified in
`CLAUDE.md`'s new "Scorecard integrity" section (Done only after full
E2E, status-flip + regenerate as one step) and a new standing runbook,
`docs/Scorecard-Maintenance-Process.md` (supersedes `docs/Scorecard-
Single-Source-Implementation-Plan.md`, marked as such). **Committed
`40460ad`.**

Then built a second client-facing view on request:
`.scratch/phase1-scorecard-by-status.html` — same 50 requirements grouped
Done/Partial/Not Started/New Features Added first, then by app area
within each; internal PRD-reference column dropped. Generated by the same
script, covered by the same `--check` guard, published as its own
Artifact. **Committed `1b7a4c5`** (amended from an initial `feat:` to
`chore:` per Basheer's call — not a signed-requirement feature, it's
scorecard tooling), **pushed to `origin/main`.**

**Next step:** none pending on this thread. Open, not yet actioned:
Basheer asked about running `scripts/backup_uat.ps1` (UAT DB backup);
explained what it does and asked for go-ahead, none given yet — pick up
if he asks again.

Full detail: `docs/Progress-Archive-2026-09.md`'s "2026-09-16 — Scorecard
tally fix..." entry.

## 2026-09-16 session (latest) — Report Drill-down (Feature 11.2) full manual E2E pass: complete, committed, Traceability flipped to Done, pushed

Ran the full A–F test plan live with Basheer as Haroon, then Fazal (Area
Manager) for role scoping. All steps PASS except two data-limited (not
failures): `docs/Report-Drilldown-Manual-E2E-Test-Plan.md` has the full
record. Two real gaps surfaced mid-pass and were fixed:
1. No way back to the originating report after a drill except the
   browser's own Back button, which doesn't work in this app at all (no
   URL routing between screens). Added a back arrow to the banner
   (`pipelineReturnView` in `DemoApp.tsx`, per-report, not hardcoded).
2. A fresh drill-down silently inherited a stale Owner/Zone dropdown
   left over from an earlier, unrelated visit, hiding a real match
   behind a false "No opportunities found." Fixed in
   `OpportunityPipelineScreen.tsx` — a fresh drill now resets both to
   "All."
On request, also extended drill-down to Product Performance's total
"Opportunities" metric (`ProductPerformanceReportScreen.tsx`) —
previously deliberately non-clickable, now drills the same as Won/Lost
but with no status filter (spans all statuses). No backend change
needed. Verified live as Fazal, including confirming it doesn't bypass
role scoping.
`tsc`/lint clean on all three. Full detail:
`docs/Progress-Archive-2026-09.md`'s "2026-09-16" entries.

Also added a `## Post-commit checklist` section to `CLAUDE.md` (5-step
habit: active_progress.md, Progress-Archive retro, Backlog check,
Traceability+scorecard regen, `--check` + republish) — this thread was
its first real run.

**Committed and pushed** in two commits: `9023965` (the three code
fixes + test plan/Progress-Archive/this file) and `f61ef48` (Feature
11.2 flipped to Done in Traceability.md, scorecard tally regenerated
28/12/10, both `.scratch` client Artifacts republished — 7qRxCt4B... and
VcwUvDNA...). Same commit also noted a forward dependency on Feature
4.1 (Backlog.md: planned Product Catalog name-field change, pending
Haroon).

**Retro:** the checklist worked as designed — regenerating and
`--check`ing the scorecard in the same breath as the status flip caught
nothing amiss, and republishing right after meant the client view never
sat stale. One real gotcha worth remembering: a parallel session was
active in this same repo the whole time (untouched `backend/app/
domains/planning/*` work) — `git status` before every stage/commit is
what kept the two threads from getting tangled together.

**Next step:** none pending on this thread.

## 2026-09-15 — Report Drill-down (Feature 11.2): built, smoke-tested, committed `6bb0d31`

Built same session, right after Sales Report + Pipeline Report shipped
(below). Plan: `docs/Report-Drilldown-Implementation-Plan.md`. Every
bar/card in Pipeline Report, Sales Report, and Product Performance that
summarizes many deals into one number is now clickable — lands on the
Pipeline board's List view, pre-filtered to exactly those deals, via a
dismissible "Showing: X — Clear filter" banner. No permanent new filter
dropdown added to the Kanban/List board itself. Checked every report
screen first: Stagnant Deals, Opportunities On Hold, and Daily Activity
Report were already flat deal lists with click-through — nothing needed
there.

Two new backend filters on `GET /opportunities/pipeline`: `sbu_id`
(direct column) and `product_id` (EXISTS-subquery against
`OpportunityItem`, avoids duplicating a multi-product opportunity — same
approach as an earlier, never-built plan for this exact problem). Every
other dimension (Rep/Zone/Stage/Won-Lost) reuses filters that already
existed. Trade-Ins/Returns and Brand-grouped cards stay deliberately
non-clickable — neither maps to one real `product_id`. 843/843 backend
tests pass (5 new), `tsc`/lint clean.

**Smoke-tested live as Haroon (GM), not a full pass:** Pipeline Report's
Product breakdown ("SonoScape E2") drilled to exactly one deal, opened it,
confirmed its Products tab really does show SonoScape E2 as its only line
item. Sales Report's Rep breakdown ("Basheer K") drilled to exactly one
Won deal matching the report's own ₹4.0L. Product Performance's Won and
Lost counts drilled correctly and separately; Brand-grouped cards
confirmed non-clickable (no navigation on click). "Clear filter" works.

**Committed `6bb0d31`.** Full sign-off doc:
`docs/Report-Drilldown-Manual-E2E-Test-Plan.md` — 21 steps across
Pipeline/Sales/Product Performance drill-down, banner/filter interaction,
role scoping, and regression. Only the smoke-test items above are
checked off; the rest (Stage/Zone/SBU drills, Trade-Ins non-clickability,
period-picker interaction, banner composition with Owner/Zone dropdowns,
rep-level scoping) is **not yet run**.

**Next step:** run the full A–F pass in the test plan above (needs a
rep-level login for step E18, same as Feature 11.1's pass used Nishad K
V), then flip Feature 11.2's Traceability/Scorecard row and log this in
Progress-Archive. Tracking-doc updates for Feature 11.2 have not been
done at all yet — Feature 11.1's are done (see below).

## 2026-09-15 session (even later) — UAT Data Quality Check: built, real RLS bug found and fixed mid-session, committed `e9158c9`

Basheer asked to check UAT for data inconsistencies, then to add an
Activity best-practice check on top. Built `scripts/uat_data_quality_check
.py` (read-only, app-role connection, RLS-impersonated as an active
Admin/GM for full company visibility) covering 8 checks: duplicate
accounts, Lakhs/Rupees value mixups, dead accounts (zero Opportunity/
Activity), Opportunities with zero Activity, bad splits, WON/LOST deals
edited after close, Activities missing the mandatory next action
(BR-ACT-04), short/generic notes, and likely double-submits.

**First run reported mostly clean — wrongly.** Basheer caught it directly:
asked to verify "ALOHA HOSPITAL Kizshery" (reported as a dead account)
actually had an opportunity. It did. Root cause: the script's RLS
impersonation used `set_config(..., true)` (transaction-local), but the
script ran under `psycopg2`'s `autocommit=True`, so every query after the
first started a new transaction and the impersonated identity was already
gone — `cabio_app_uid()` silently returned `NULL` for the rest of the run.
Every check touching `opportunity` or `reminder` (2, 3, 4, 7a, 7c, 8) was
built on zero real data, not just the one row Basheer caught. Fixed by
switching to `false` (session-scoped); the script now also verifies
`cabio_app_uid()` actually resolves before running anything and aborts
loudly instead of silently reporting zeros.

**Corrected findings, dramatically different from the first pass:** Lakhs/
Rupees mixups 0→**24**, dead accounts 81→**34** (ALOHA correctly dropped),
zero-Activity Opportunities 0→**56**, missing next-action 0→**82** (40 of
them Haroon's own, 25 Fazal's), short/generic notes 9→**20**, PO-set-no-
Activity 0→**5** (the exact pattern Basheer had flagged from memory,
confirmed real).

**Second bug found while re-verifying the double-submit check:** the time
comparison (`a2.created_at - a1.created_at < interval '5 minutes'`)
matched pairs *days or weeks* apart too, since a large negative interval
still compares as "less than" 5 minutes — 122 false positives. Fixed with
`ABS(EXTRACT(EPOCH FROM ...))`, corrected count: 14 candidates.

**Then Basheer pushed back again, correctly:** timing alone can't tell an
accidental duplicate from a rep logging two real updates in quick
succession. Pulled the actual note text for all 14 pairs — only 4 were
genuine (a bare "Done" or "Done the delivery" repeated verbatim, 3 of them
Haroon's), the other 10 were real sequential updates (e.g. Fazal
documenting each step of one KIMS Hospital Koduvally installation across
several calls). Folded this into the script permanently: it now pulls note
text for every 7c candidate and classifies by text-similarity (>0.85 ratio
via `difflib`), not just elapsed time, printing only the likely-genuine
ones by default.

Full findings, all lists complete: `docs/UAT-Data-Quality-Findings-2026-09
-15.md`. **Committed `e9158c9`** (script + findings doc).

**Discussed, not building yet:** whether to turn this into a live
Administration-section report for Admin/GM to self-serve. Recommended
holding off — every check here has needed a human judgment call at some
point (thresholds, the note-similarity cutoff, recognizing a bulk-import
Lead cluster isn't the same problem as a genuinely stale deal); a
dashboard would surface that same noise or need real product design work,
not just wiring up the existing queries. Closest precedent if revisited:
the Audit Log screen (Module 6b), same "built beyond signed scope" shape.

**Next step:** two things worth a conversation with the team, not
engineering follow-up — (1) Haroon/Fazal's concentration in the 82
missing-next-action list (79% of the total between just the two of them),
(2) Om Hiremath's 15-of-56 zero-Activity cluster (identical "New USG
Machine requirement" Leads created 2026-09-01/02, looks like a bulk import
that never got real follow-up).

## 2026-09-15 session (earlier) — Sales Report + Pipeline Report (Feature 11.1, Module 5): built, full live E2E pass, committed `44e6d8c`

Built while the Kanban priority-sort work (below) was in a parallel
session — zero file overlap by design. Also closes Feature 2.2's Pipeline
product filter row (2026-09-14 decision). **Pipeline Report** reuses the
existing `pipeline_summary` engine as-is (zero new backend work). **Sales
Report** is Won-deals-only: period picker (This Month/This Quarter/All
Time, fiscal-year aware), 4 headline stats, Rep/Zone/SBU/Product
breakdown — deliberately no leaderboard (Basheer's call: raw revenue
comparison across reps isn't meaningful given differing territories/
targets). Added a real `Opportunity.closed_at` column (migration `0043`),
stamped once a deal first becomes terminal, so period filtering reflects
actual close dates. 837/837 backend tests pass, `tsc` clean.

**Two live incidents mid-build, both resolved:** Kanban board briefly 500'd
(migration `0043` not yet applied to Dev — Basheer ran `alembic upgrade
head`); `Physical-Schema.sql`'s header got clobbered by the raw `pg_dump`
regen command for a second time, prompting Basheer to ask why this keeps
happening — built `scripts/regen_physical_schema.ps1` to structurally fix
it (rebuilds the header automatically, no more manual restore step).

**Architecture question resolved live:** Insights Dashboard's "Pipeline by
X" tile and the new Pipeline Report currently show identical data —
Basheer's call was to **keep both** (Pipeline Report will grow a
drill-down feature the dashboard tile won't have), not consolidate.

**Full live E2E pass** as Haroon (GM) and Nishad K V (Sales Person) — every
number cross-checked and reconciled exactly, role scoping confirmed
correct for both tiers, no bugs found. SBU/Area Manager tier not tested
(no login available). Full detail: `docs/Progress-Archive-2026-09.md`'s
"2026-09-15 (later again)" entry; sign-off: `docs/Sales-And-Pipeline-
Report-Manual-E2E-Test-Plan.md`.

**Committed `44e6d8c`** (feature) and `30556b3`/`d3abb45` (tracking-doc
follow-ups). Feature 2.2's Pipeline filters row flipped to Done; Feature
11.1's Core Reports row stays Partial (only Margin Report remains — needs
product cost capture, scheduled separately). Scorecard regenerated (27
Done/13 Partial/10 Not started of 50) and republished to the client
Artifact (version 7). `docs/Backlog.md`'s Pipeline-filters entry closed;
its `closed_at` cross-reference updated. One stale note caught and fixed
along the way: Traceability's Weekly Follow-up Report row cited the
High Priority field as a blocker after that field had already shipped —
corrected.

**Next step:** none pending on this thread — fully wrapped and committed.
See the Report Drill-down entry above, built directly on top of this.

## 2026-09-15 session (earlier) — Kanban/List sorted by priority (Sprint Plan item, Feature 2.2): built, live E2E-verified, committed `90a752a`

Picked up right after High Priority Deal Flag (below) was committed
(`b000a09`), since it directly unblocks this item. Basheer's calls before
building: sort key is High Priority first, *then* win probability (not a
blended score); no recency tiebreaker; pipeline fetch cap raised from 100
to 500 rather than removed outright (closed deals never drop out of this
query, so true "no limit" would grow unbounded over years — 500 is
generous headroom without that risk, confirmed against how other CRM
Kanban tools actually get used: filters/search/reports, not scrolling
hundreds of cards).

**Backend-only change** (neither Kanban nor List sorts client-side, so no
frontend logic needed): `OpportunityRepository.list_pipeline` joins
`OpportunityStage` and orders by a `CASE` expression (`stage.display_order
> 30 OR high_priority_manual`) descending, then `win_probability`
descending. `page_size` ceiling raised in the router (`le=100` →`le=500`)
and both frontend call sites. 819/819 backend tests pass (6 new, following
the SQL-compile assertion pattern from `test_reporting_repository.py` — no
real DB needed), `ruff`/`tsc` clean.

**Live E2E pass, same session, as Haroon (GM):** verified both visually and
by pulling the real API response and checking the sort invariant
programmatically across all 53 Dev deals (zero violations). Live-flagged a
5%-probability Lead-stage deal as manually High Priority — it jumped to
rank 13 of 53, above 11 deals with much higher probability, proving
priority genuinely outranks probability rather than blending with it — then
reverted the flag immediately after. Filters (Owner) confirmed to compose
correctly with the new sort; raised cap confirmed via stage-chip counts
summing exactly to the API's total (53); badges/search unaffected. No bugs
found. Full detail: `docs/Kanban-Priority-Sort-Manual-E2E-Test-Plan.md`'s
sign-off. Traceability/scorecard/sprint-plan docs flipped to Done. Basheer
asked for the same pass re-run live on-screen afterward (he hadn't watched
the first run) — repeated the core case (flag "New USG msg" High Priority,
watch it jump to the top of Lead/List despite 5% probability, confirm via
Owner filter, revert) with him watching throughout; identical result.

**Committed `90a752a`** — backend code, the three tracking docs, the new
test-plan doc, and this entry, all in one commit.

**Follow-on same session — scorecard tooling rebuilt as single source of
truth, committed `8e55ac0`.** Basheer caught the Scorecard's summary tally
not auto-updating when a row flips (hand-maintained, not a formula) — root
cause led to a bigger ask: one file driving every status report, no more
hand-typing the same status in three places. Built:
`Signed-Requirements-to-PRD-Traceability.md` now carries a `Client Note`
column (plain business language, Partial rows only — what Haroon/Latheef
Bhai actually see) and the "Commitment beyond contract" table;
`scripts/generate_scorecard.py` regenerates both `Phase1-Delivery-
Scorecard.md` and the published client Artifact (`.scratch/phase1-
scorecard.html`, republished to the same Artifact URL, now version 6) from
it. First design pass used three note tiers (internal/leadership/client);
collapsed to two once Basheer clarified the Client Note *is* what
Haroon/Latheef Bhai see, so a separate "leadership" tier was redundant.
First pass at the client output was also a separate `Phase1-Client-
Dashboard.md` markdown file — Basheer rejected the extra file, so the
script was rewritten to update the existing published `phase1-
scorecard.html` directly instead (same look, byte-checked against a
hand-fixed reference before trusting the generator). Full design doc:
`docs/Scorecard-Single-Source-Implementation-Plan.md`.

**Workflow going forward, for every future feature:** flip a Status/Client
Note in Traceability.md, re-run `scripts/generate_scorecard.py`,
republish `.scratch/phase1-scorecard.html` to the Artifact. Confirmed
working live same session: the other (parallel) session used this exact
flow unprompted for its own Sales/Pipeline Report tracking-doc update, no
issues.

## 2026-09-15 session (earlier still) — High Priority Deal Flag (Sprint Plan item 8, BR-OP-15): live manual E2E pass complete — Done, committed `b000a09`

Full pass run live once the Forecast-by-Product thread wrapped up: Nishad K
V (Area Manager) for Groups A-D (automatic past-Demo badge, manual flag
set/unset/persisted, flag becomes moot past Demo), Haroon (Admin/GM) plus a
one-field live DB backdate (explicit go-ahead, reverted immediately after)
for Group E's "both badges together" case, since no On-Hold/Reactivation-
Overdue deal existed in Dev. No bugs found. Full detail:
`docs/Progress-Archive-2026-09.md`'s "2026-09-15 (later still) — High
Priority Deal Flag" entry; sign-off:
`docs/High-Priority-Deal-Flag-Manual-E2E-Test-Plan.md`.
Traceability/scorecard/sprint-plan docs flipped to Done.

**Committed `b000a09`** — all 18 files (backend/frontend code, migration,
tests, and the tracking docs) in one commit.

**Next step:** none pending on this thread — see the Kanban priority-sort
entry above, which built directly on this.

## 2026-09-15 session (earlier) — Forecast broken down by Product (Sprint Plan item 7, Feature 2.5): Done, committed

Built, two real bugs found and fixed live (headline double-counting;
a `group_id` type-widening fix that briefly broke every other breakdown),
one design decision revised live (Buyback lines now bucket under a new
"Trade-Ins / Returns" row instead of being dropped, so the product view
reconciles to the page total), full manual E2E pass across three roles.
Traceability/scorecard/sprint-plan docs updated, pass logged. Full detail:
`docs/Progress-Archive-2026-09.md`'s "2026-09-15 (later still)" entry;
build/test detail: `docs/Forecast-By-Product-Implementation-Plan.md` and
`docs/Forecast-By-Product-Manual-E2E-Test-Plan.md`.

**Committed** — `34d0170`.

**Next step:** none pending on this thread. The Product Performance
drill-down plan below is still unbuilt and available to pick up next.

## 2026-09-15 session (earlier) — Pipeline product filter + Product Performance drill-down: implementation plan written and approved, not yet built

Grew out of picking the next Sprint Plan item to work while the other
session builds High Priority Deal Flag (item 8). Landed on Feature 11.2
Drill-down Reporting (PRD 5.9), scoped to its first concrete case: Product
Performance Report's "Won"/"Lost" cards are dead ends today, no way to see
which deals they count. Checked the opportunity-list engine behind Kanban/
List (`list_pipeline`) — it filters by account/stage/status/owner/zone, not
product. Basheer connected this to the already-decided-but-unbuilt Pipeline
product filter (`docs/Backlog.md`'s "Account Directory / Pipeline filters"
entry, decided 2026-09-14: product filtering belongs on a future standalone
Pipeline Report, not the Kanban filter bar) — same underlying capability
serves both, so build it once now rather than twice across two weeks.

Plan: `docs/Pipeline-Product-Filter-And-Report-Drilldown-Implementation-Plan.md`
— add `product_id` to `list_pipeline`/`count_pipeline` via an `EXISTS`
subquery (a plain join would duplicate opportunities with multiple line
items), no migration, no schema field. Frontend: a `nextActionsInitialDueBefore`-
style pre-filter passed into `OpportunityPipelineScreen` from a clicked
Product Performance metric, shown as a dismissible banner rather than a new
filter dropdown — Kanban board's filter bar stays Owner/Zone only, per the
2026-09-14 decision. Checked for file overlap with the in-flight High
Priority build first: none — that touches `models.py`/`schemas.py`/
`create_opportunity`, this touches `list_pipeline`/`count_pipeline`/router
query params, no shared lines.

**Nothing built yet.**

**Next step:** build backend first (repository → service → router → tests),
then `sales-os-app/src/services/opportunities.ts`, then the `DemoApp.tsx`
pre-filter state + `OpportunityPipelineScreen`/`ProductPerformanceReportScreen`
wiring, per the plan doc above.

## 2026-09-14 session (even later) — Latheef Bhai's voice message folded into the Pricing/Discount-Authority discussion paper

Relayed transcript added a second, separate problem to
`docs/Discussion-Pricing-Discount-Authority-2026-09.md`: time-bound special
pricing (e.g. a Dec year-end discount that should stop being honored once
the window passes) — distinct from the existing four-tier discount ladder,
which already matched his own restatement. New §5.1, new open question 6 in
§6, cross-referenced from §1/§5/§7/§8. Proposed reusing `BR-OP-02`'s
`reactivation_date`/"Reactivation Overdue" pattern rather than a new
mechanism — not designed further, awaiting Haroon/Latheef Bhai's decision.
Doc-only, no code. Full detail: `docs/Progress-Archive-2026-09.md`'s
"2026-09-14 (later still)" entry.

**Next step:** none pending — the paper is ready for Haroon/Latheef Bhai's
review whenever Basheer wants to send it.

## 2026-09-14 session (later still) — Product Catalog Collateral Security (Sprint Plan item 2) + sidebar nav cleanup: built, scope corrected live mid-test with Basheer driving, full E2E pass — Done, staged for commit

Collateral Links (brochures/videos on a product) now Admin/GM-only to
add/remove, on screen and on the server; viewing/opening an existing link
stays open to everyone — first build over-restricted viewing too, Basheer
caught it live testing as Vivek (Sales Staff) and had me rebuild before
continuing. Full A-E manual E2E pass completed live (Haroon as GM, Vivek as
Sales Staff), 796/796 backend tests pass, `tsc` clean. Feature 4.1 (Module
6b) flipped Partial → Done (tally now 24/15/11 of 50).

**Same live pass, two follow-on nav fixes Basheer spotted:** (1) Product
Catalog was sitting under an "ADMINISTRATION" sidebar section that, for
every non-Admin/GM role, only ever showed that one item — moved to Sales
Execution for those roles (Admin/GM keep it under Administration, unchanged,
since they manage it); Administration now disappears entirely for everyone
else instead of showing a misleading near-empty section. (2) The combined
sidebar had grown to 13 items across 3 sections for Admin/GM — made all
three sections independently collapsible (chevron toggle, `localStorage`-
remembered, Sales Execution open by default, Reports/Administration start
collapsed); first chevron glyph was too small to see, swapped for a proper
MUI `ExpandMoreIcon`. All of it verified live as both Haroon and Vivek.

Full detail: `docs/Progress-Archive-2026-09.md`'s "2026-09-14 (later)" and
"2026-09-14 (even later)" entries; full E2E results:
`docs/Product-Catalog-Collateral-Security-Manual-E2E-Test-Plan.md`.

**Staged, not yet committed** (`git add`, 12 files — backend + frontend code,
tests, and doc updates: traceability, scorecard, sprint plan, progress
archive, this file, the new test-plan doc). Commit message drafted and
handed to Basheer to commit himself.

**Next step:** none pending on this thread — Basheer to commit when ready.

## 2026-09-14 session (later) — Admin/GM split hotfix pushed straight to UAT, bypassing pending main commits; Basheer verifying live now

**Bug found live in UAT last week:** Haroon (GM) added a Sales Staff member to
a deal's split at 20%, then couldn't find his own name in the picker to take
the remaining 80%. Root cause: BR-FIN-06's same-SBU split-eligibility check
structurally excludes every Admin/GM user (they have no real SBU, only a
NOT-NULL placeholder) from ever being a split candidate — including
themselves, even as the caller. Confirmed in the live code
(`organization/repository.py`'s `scope="sbu"` branch,
`opportunity/service.py`'s `replace_splits`). Not a bug in the traditional
sense — deliberate design that never anticipated a GM personally taking a
split — but real enough that Haroon wants it fixed urgently.

**Options discussed with Basheer:** (A) let Admin/GM add only themselves —
narrow, mirrors the self-row carve-out normal users already get; (B) let
anyone pick any Admin/GM into a split — wider, more misuse surface; (C) give
Admin/GM a real SBU — rejected, reopens a decision made twice before.
**Basheer chose A.** Separately, Basheer asked for a new feature: notify a
rep when they're added to a split (didn't exist before at all).

**Urgency + branching constraint:** Basheer wants this on UAT *now*, but
`main` has 7 pending commits (Insights Dashboard Batch 1a/1b, several docs)
he does NOT want promoted to UAT yet. Solution: branched
`hotfix/admin-gm-split` off `origin/uat`'s tip (`a28ac61`), not off `main`,
built the fix there, so it could only carry exactly this change.

**Built on that branch** (8 files): the two eligibility carve-outs (picker +
save-time check, both narrowly self-only), the new `notify_split_added`
notification (reuses the existing generic `notification` table, no
migration), frontend copy in `notificationDescribe.ts`, 14 new/updated
backend tests, and `Business-Rules.md`'s BR-FIN-06 amended with both changes.
747/747 backend tests pass, `ruff`/`tsc` clean (pre-existing warnings
unrelated to this change).

**Committed `7ddd439`, pushed straight to `origin/uat`** (`git push origin
hotfix/admin-gm-split:uat`) — clean fast-forward, confirmed via `git log
origin/main..origin/uat` that only this one commit landed, none of the 7
pending main commits came along. Working tree returned to `main`, Basheer's
stashed WIP (Product Catalog Admin/GM restriction + doc edits) restored
exactly as left.

**Verified live on UAT by Basheer, 2026-09-14 — working end to end.**
Self-add succeeded, and the new `SPLIT_ADDED` notification fired correctly
to the recipient. No further UAT-side action pending. Basheer told Haroon
it's live and confirmed.

**Synced onto `main` too, properly (merge, not cherry-pick).** Basheer asked
the right question: a cherry-pick would have given the fix a *different*
commit id on `main` than the one already on `uat` — harmless today, but it
would have broken next week's routine `main` → `uat` fast-forward promotion
(git would see two unrelated-looking commits with the same content, not one
already-applied change, and refuse the fast-forward). Fixed by doing a real
`git merge origin/uat` into `main` instead — brings the actual `7ddd439`
commit into `main`'s own history so it's genuinely already-applied from
git's point of view. Checked first for any real overlap with the 7 pending
main-only commits: only one shared file (`Business-Rules.md`), confirmed to
merge with zero conflicts (different sections of the doc). Merge commit
`29dcd61`, 797/797 backend tests pass (the combined suite). **Committed and
pushed to `origin/main`** (`e55a77f..29dcd61`). Confirmed via `git merge-base
--is-ancestor 7ddd439 HEAD` that `uat`'s tip is now a genuine ancestor of
`main` — next week's promotion will fast-forward cleanly, no special
handling needed. Basheer's Product Catalog WIP untouched throughout (zero
file overlap with any of this).

**Next step:** none pending on this thread — fully resolved, both branches
correctly related. Basheer continuing his own Product Catalog Collateral
Security work on `main` next.

## 2026-09-14 session — Partial-item walkthrough through Modules 4-7; tally now 23 Done / 15 Partial / 12 Not started of 50

Continued the scorecard walkthrough through Modules 4, 5, and 6 (Governance
& Admin). Several note corrections in Modules 4-5 (status unchanged, see
Progress Archive for detail). In Module 6, Basheer flagged three items from
memory as likely mis-scored — all three confirmed and flipped to Done:
Territory/Zone Mapping (2.1 — PRD explicitly defers "Territory" to a future
phase, so that wasn't a real gap; found a different real gap instead, PIN-
code-to-Zone auto-mapping, which Basheer parked for Phase 2 in
`docs/Backlog.md`), Product-Team Mapping (6.6 — SBU-scoped enforcement
confirmed at the business-rule layer, BR-OP-11/12), and Workflow Rules/lead
reassignment (13.1 — Opportunity Owner reassignment already scoped to a
manager's own team; the Admin/GM approval half was optional in the original
signed text anyway). All three artifacts (traceability doc, scorecard doc,
published Artifact — now v11) updated in lockstep throughout. Full
narrative: `docs/Progress-Archive-2026-09.md`'s "2026-09-14" entry.

Also added a one-line note to Module 6b's Collateral Security row (4.1,
still Not started, tally unchanged) — Basheer is planning to restrict
Product Catalog access to Admin/GM only; confirmed live that today anyone of
any role can view/edit the catalog, so there's no partial progress to
credit yet, just a note that it's planned and will flip straight to Done
once shipped. Then in Module 7, the "hybrid database" row (15.1/15.2/16.1/
16.2) flipped Partial → Done — confirmed real PDF/JPG/PNG file uploads
already exist at the Opportunity level (Supabase Storage, not just pasted
links), which is what PRD 10's "structured + unstructured data" ask
actually needed. Artifact now v13.

**Walkthrough exercise closed out same session:** relabeled the scorecard's
"Built, unasked" column to "New Features Added" (both docs + Artifact, now
v14). Calculated real progress two ways: strictly-done is 23/49 = 46.9%;
counting the 15 partly-done items as half-credit gives 62.2% — presented
both, weighted one as the fairer "real progress" number.

**Then built `docs/Phase1-Completion-Sprint-Plan.md`** — the 15 Partial rows
(plus the Module 6b Collateral Security "Not started" row Basheer pulled in
alongside them) sorted into: 8 items closeable **this week** (pure build
work, no missing prerequisite), 4 items for **next week** (each needs a
specific "Not started" row finished first — named per item), 4 items
**blocked** on a Haroon/Latheef Bhai or leadership decision (not schedulable
by engineering time), and 1 item (**Demo outcome tracking**) left as-is,
confirmed acceptable for Phase 1. Full mapping of all 15 rows to their
bucket is in that doc.

**Then reconciled `docs/Backlog.md` against the scorecard's 26 pending
rows** (full file read, 1,416 lines). Nothing stale from today's 4 Done-
flips; the "blocked on decision" bucket was already well covered. 5 real
gaps found (scorecard rows with no Backlog entry): Demo-to-sale conversion
report, Exception report, Weekly Follow-up Report, Beat Planning, live-
production-DB backup. **Basheer resolved 2 directly:** Beat Planning is the
same build as Coverage Planning, not a second gap (confirmed field-for-field
against the PRD text) — cross-referenced everywhere instead of duplicated;
live-DB backup deferred to go-live (≥2 weeks out per Basheer), moved out of
the Sprint Plan's "this week" into a new "Deferred to go-live" section, and
parked in Backlog. **Added Backlog entries for the remaining 3** (Demo-to-
sale conversion, Exception report, Weekly Follow-up Report — all "not
blocked, just not built"). **Checked the Target Planning open question**
Basheer asked about: confirmed via `Physical-Schema.sql` that `target_plan`
has no product-category dimension at all (one row per user/SBU/quarter,
single amount) — a real 4th open design question, not just a doc gap, added
to the existing Target Planning Backlog entry, needs Basheer's call (fold
into the upcoming migration vs. Phase 2 follow-on) before that feature ships.

**Commit `ac96b8c`** covers everything through the Backlog reconciliation
pass above.

**Then split one more row out: Competitive Loss Report.** Basheer asked
whether the "rolled-up loss report" mentioned in the Sprint Plan deserved
its own scorecard line — checked the PRD, Appendix A.3.5 names it as its own
deliverable, same shape as the earlier Demo-to-sale conversion report split.
Added as Feature 1.4's second row in Module 5 (Not started), trimmed the
now-redundant mentions out of two other rows, updated the Sprint Plan's item
3 to reference it. Tally now **23 Done, 15 Partial, 12 Not started of 50**
(was 49) — real progress recalculated: 46.0% strictly done, 61.0% weighted.
Artifact now v17.

**Then Pipeline product filter (Feature 2.2) resolved** — Basheer decided it
belongs on the standalone Pipeline Report, not bolted onto the Kanban board;
moved out of the Sprint Plan's "blocked" bucket into next week's Sales
Report + Pipeline Report item, note corrected in all 3 scorecard artifacts
(now v18) and in the Backlog entry (Pipeline half now decided; Account
Directory hospital-class filter half stays open). **Not yet committed.**

**Then Haroon confirmed both open questions from above.** Stagnant-deal
thresholds: real per-stage numbers (Lead 14d, Qualified 7d, Demo 7d,
Negotiation 5d, Order 2d, Delivery & Installation 30d), configurable per SBU,
same for both today — turned out `Business-Rules.md`'s `BR-OP-06` already had
this exact rule designed with a placeholder 180-day flat number; rewritten
with the real thresholds + SBU-configurability. Resolves Feature 1.3
(Module 3) and Feature 13.2 (Module 4) at once — same build, this week.
Product cost: Haroon confirmed it can be added, Admin/GM-only; Basheer
confirmed Margin (wherever shown) carries the same restriction. New rule
**BR-CAT-04** added, cross-referenced from BR-CAT-01. Resolves Feature 4.3
and 11.1's Margin Report half (both Module 5) — moved from "blocked" to a
new "Product cost + Margin" item, next week. All 4 affected scorecard rows +
Backlog (3 places) + Sprint Plan updated in the same pass. Artifact now v19.

**Then Haroon confirmed the actual High Priority rule** — replacing, not
refining, the earlier ₹30L/₹15L + 14-day proposal. New rule (BR-OP-15,
`Business-Rules.md`): any deal past Demo stage is automatically High
Priority (computed, no field); Lead/Qualified/Demo deals need a manual flag
a person sets by hand (does need a new `opportunity` field). Updated Feature
2.2's row across all 3 scorecard artifacts (now v20, still Not started, note
now reflects the confirmed rule), the Sprint Plan's this-week item, the
Weekly Follow-up Report Backlog entry (no longer blocked), and caught/fixed
a stale "Opportunities On Hold unbuilt" claim in the Insights Dashboard gap
note along the way (it shipped 2026-09-11).

**Then A/B/C/D hospital class (Feature 5.1) resolved** — Haroon confirmed
parked for Phase 2. Backlog's open-questions entry drops to two
(Segmentation, Tiering); Account Directory filter cross-reference updated
(A/B/C/D filter now moot too). Status stays Partial, note updated across all
3 scorecard artifacts (now v21). Sprint Plan's "Blocked" bucket is now
empty — replaced with a "Parked for Phase 2" section.

**Nothing from this session is committed since `ac96b8c`** — everything from
the Competitive Loss Report split onward (Pipeline filter resolution,
stagnant-deal thresholds, product cost/Margin, High Priority rule, A/B/C/D
class deferral) is still pending a commit.

**Next step:** commit everything above, then start on this week's items from
`docs/Phase1-Completion-
Sprint-Plan.md`. Module 6's remaining "Not started" rows (Account Manager
role, Target Management) and the rest of Module 7 (the RBAC/encryption/
backup row) never got the closer re-verification pass the rest of the
scorecard did — low priority now that the sprint plan exists, but worth a
mention if Basheer asks why they weren't touched. Separately, Basheer's open
questions for Haroon/Latheef Bhai before the leadership presentation is
final are unchanged: A/B/C/D hospital class, Account Segmentation, Customer
Tiering, per-product-category stagnation threshold, the Account Directory/
Pipeline filter decision, Margin (product cost capture), and now the Target
Planning product-category split question — all in `docs/Backlog.md`.

## 2026-09-13 session (later) — Phase 1 Delivery Scorecard + signed-requirements traceability matrix built and verified against live code

Built for Basheer's upcoming Cabio leadership presentation: `docs/Signed-
Requirements-to-PRD-Traceability.md` (maps every signed Feature ID to its PRD
section and build status — the working reference) and `docs/Phase1-Delivery-
Scorecard.md` (same data, leadership-facing summary), plus a matching published
Artifact. Root-caused why the signed doc's numbering (Feature 5.1-17.5) doesn't
match the PRD's own section numbers (one-time reorg, outside git history — see
Progress Archive). Walked all 20 originally-"Partial" items one by one against
the live schema/code, not just docs — corrected several the first-pass audit got
wrong in both directions. Final tally (superseded 2026-09-14, see above):
18 Done, 18 Partial, 12 Not started of 48 signed requirements, plus a 15-item
"Commitment beyond contract" list. Full narrative: `docs/Progress-Archive-2026-
09.md`'s "2026-09-13 (later)" entry.

## 2026-09-13 session — Backlog reconciliation: two days of undocumented planning decisions (Target/Coverage Planning, Reference Data screen, Support Attribution paper) synced in

Basheer flagged the Backlog as stale. Found `docs/Target-Planning-Implementation-
Plan.md` and `docs/Coverage-Planning-Implementation-Plan.md` sitting with substantial
uncommitted edits from 2026-09-11 (all 9 combined open decisions between the two
resolved with Basheer that day) plus two new untracked docs
(`docs/Reference-Data-Management-Screen-Implementation-Plan.md`, 2026-09-11, and
`docs/Discussion-Opportunity-Support-Attribution-2026-09.md`, 2026-09-12) — none of
it had been logged to `docs/Progress-Archive-2026-09.md`, synced to
`docs/Backlog.md`, or committed. Backfilled a Progress-Archive entry for each of the
two missing days, and rewrote Backlog's stale Milestone 2 Target/Coverage Planning
entries plus added the two missing items. Full detail: `docs/Progress-Archive-
2026-09.md`'s 2026-09-11 (later still) and 2026-09-12 backfill entries.

**Next step:** commit all of the above (the two plan-doc corrections, the four new/
updated docs, Backlog.md, this file, and the Progress-Archive backfill) as one
handover-catchup commit.

## 2026-09-11 session — UAT login outage fixed, then a UAT migration; one item left for Haroon

1. **UAT login outage diagnosed and fixed, no action pending.** "Unable
   to verify your session" on the UAT login screen -- root-caused live
   to a Supabase platform incident (their free-tier pooler got stuck)
   plus a pre-existing pooling-mode misconfiguration (`DATABASE_URL` on
   session-mode port `5432`, whose 15-client ceiling ordinary app
   traffic could exhaust on its own). Fixed by switching `DATABASE_URL`
   to Supavisor's transaction-mode port `6543` (`backend/.env.uat` +
   Render env var, redeployed) -- confirmed live, login works, no code
   change or migration involved. `ADMIN_DATABASE_URL` deliberately left
   on session mode (low-traffic, and `pg_dump` isn't safe under
   transaction pooling). New standing convention documented in
   `docs/Backend-Implementation-Standards.md`. Full narrative:
   `docs/Progress-Archive-2026-09.md`'s 2026-09-11 entry.
2. **UAT migration, same day** -- `main` -> `uat` (`643256f..a28ac61`,
   10 commits, migrations `0040`-`0041`): Activity Inline Comments
   (Phases 1+2) and the Audit Trail Extension
   (`stakeholder`/`opportunity_item`/`split`), plus three smaller riders.
   Backup taken first, fast-forward push, both Render services confirmed
   Live, migrations applied clean. Smoke test deliberately stopped at
   UI-only checks (Activity tab renders, "Add comment" control appears
   correctly) -- no test comment/Activity posted, since both are
   immutable on this project. Full detail: `docs/UAT-Migration-2026-09-
   11.md`; narrative: `docs/Progress-Archive-2026-09.md`'s "2026-09-11
   (later)" entry.
3. **Insights Dashboard, Batch 1a -- 5 of 8 planned widgets built and
   fully verified, no action pending.** New `backend/app/domains/
   reporting/` domain (Pipeline Value, Weighted/Unweighted Forecast,
   Overdue Actions, Activity Levels, Stagnant Deals) +
   `InsightsDashboardScreen.tsx`. Product Performance Summary, High-
   Priority Deals, and Opportunities On Hold deliberately deferred --
   a separate, concurrent planning session was actively drafting
   Product Performance Summary's own spec in the same plan doc, so this
   pass backed out of that section and stuck to the 5 already-agreed
   items. 27 new backend tests, 767/767 full suite, `tsc`/lint clean.
   **Manual E2E, live on Dev, all three role tiers** (GM/unrestricted,
   SBU Manager, Sales Staff) -- correct scoping and correct manager-tile
   visibility confirmed at every tier, every total cross-checked
   internally. Dev servers stopped after verification. Full narrative:
   `docs/Progress-Archive-2026-09.md`'s "2026-09-11 (later still) --
   Insights Dashboard" entry.
4. **Insights Dashboard, Batch 1b -- Dashboard-vs-Reports split acted on,
   no action pending.** Stagnant Deals extracted out of
   `InsightsDashboardScreen.tsx` into its own `StagnantDealsReportScreen.
   tsx` (backend unchanged); two new report screens built from scratch,
   `ProductPerformanceReportScreen.tsx` (grouped by Product/Brand/SBU,
   Gross Margin excluded -- still blocked on the pending pricing feature)
   and `OpportunitiesOnHoldReportScreen.tsx` (newly spec'd against PRD
   §5.13, Days On Hold derived from the existing Audit Trail, no schema
   change). New **REPORTS** nav section, shared `components/
   ReportingUI.tsx` extracted for the tile/card helpers all 4 screens
   now use. 11 new backend tests (38 in the domain, 778/778 full suite),
   `tsc`/lint/`ruff` clean. High-Priority Deals stays excluded -- still
   pending Cabio leadership sign-off, not a technical blocker. Manual
   smoke test, live on Dev (one role -- this reuses the exact scoping
   already proven across all three tiers in Batch 1a, so the real risk
   was new query correctness, not scoping): Product Performance's
   By-Brand vs. By-Product grouping caught its own distinct-counting
   correctness (EDAN: 6 distinct opportunities vs. 7 if naively summed
   per-product -- proves one real deal carries two EDAN products,
   correctly counted once). Full narrative: `docs/Progress-Archive-2026-
   09.md`'s "2026-09-11 (later still) -- Insights Dashboard, Batch 1b"
   entry.

**Next step:** none pending from this session. Haroon posted comments on
UAT (Ullal Diagnostic Centre / Benaka Health Centre activities) and
confirmed via Basheer that the feature looks good on mobile -- UAT
migration item closed. Insights Dashboard's last remaining item, High-
Priority Deals, is blocked on Cabio leadership confirmation, not a
follow-on batch to schedule -- see `docs/Insights-Dashboard-
Implementation-Plan.md`.

## 2026-09-10 session — three small fixes closed, no action pending

1. **UAT backup script's Docker shutdown bug** — fixed and verified live,
   **committed `7931491`**. Full detail below under "UAT backup/disaster-
   recovery."
2. **`_TERRITORY_ADMIN_ROLES` naming clash (from `docs/Backlog.md`)** —
   two unrelated constants sharing one name (territory map editing vs.
   zone search for hospital creation), flagged as a near-miss risk, no
   incident yet. Renamed to `_TERRITORY_MAP_ADMIN_ROLES`
   (`reference/service.py`) and `_ZONE_SEARCH_UNRESTRICTED_ROLES`
   (`master_data.py`); fixed one comment in `account/service.py` that
   had been pointing at the wrong one of the two. No behavior change —
   740/740 backend tests pass, live smoke test across Sales Staff, Area
   Manager, and Admin/GM confirmed the zone picker and Territory Map
   edit gates unaffected. **Committed `4c1bf83`.** Backlog entry
   removed — nothing left to pick up here.
3. **UAT's `rls_auto_enable()` event trigger — permanent fix (from
   `docs/Backlog.md`, 3 prior lockout incidents)** — identified its real
   name (`ensure_rls`) via a read-only `pg_event_trigger` lookup,
   confirmed Dev never had it, then Basheer ran `DROP EVENT TRIGGER
   ensure_rls;` live on UAT via Supabase's SQL Editor. Re-verified after:
   UAT now matches Dev exactly (only the six standard Supabase-managed
   triggers remain). UAT migrations now behave exactly as authored, no
   more silent third-party RLS override. Backlog entry closed — one
   follow-up left for whenever Prod is set up (confirm Prod has no
   equivalent trigger before assuming parity, and decline Supabase's
   "enable RLS for the whole database" setup prompt — see
   `docs/Progress-Archive-2026-08.md`'s "Trap for Prod" note).
4. **Activity comment/manager-note notifications didn't say which
   Activity** — clicking one landed on the deal's Activity tab with no
   indication which entry the comment was on (found live via `/demo`,
   Al Shifa Hospital, a deal with comments on more than one Activity).
   Fixed: the notification's Activity id is now threaded through to
   `ActivityTimeline.tsx`, which scrolls to, highlights, and auto-expands
   the right one. Two follow-on bugs found during a live walk-through of
   every notification on one deal (both from Activity cards staying
   mounted across repeated notification clicks) fixed the same session.
   **Committed `5a0bd4e`.** Full narrative: `docs/Progress-Archive-2026-09
   .md`'s "2026-09-10 (later)" entry.

**Next step:** none chosen yet — see `docs/Backlog.md` for the
remaining shortlist (WON/LOST immutability, registering the UAT backup
scheduled task, Insights Dashboard).

## Pending, awaiting Haroon / not yet actioned

**Activity log privacy hole — confirmed live 2026-09-10 with a real
example, Basheer to discuss approach with Haroon before deciding how to
build the fix.** Deal-less activities (no `opportunity_id`) bypass the
`activity_tier_visibility` RLS policy entirely and become visible to
literally anyone — confirmed live: Shruthi (Area Manager, Bangalore,
Imaging) can see all 3 of Fahad's deal-less activities on Al Shifa
Hospital (Fahad: Sales Staff, Mangalore, Imaging, reports to Fazal —
no relationship to Shruthi at all). Affects the Account and Project
Activity tabs specifically; the Daily Activity Report already has its
own separate, correct hierarchy filter and is unaffected. Proposed fix:
replace the bypass with the same manager-chain check the Daily Activity
Report already uses, built as a database rule so it covers every
current and future screen, not just one. One open design question for
whoever builds it: `MANAGER_NOTE` rows store the note's subject
(`user_id`) and its actual author (`created_by`) as different people —
needs a decision on whose chain governs visibility. Full detail:
`docs/Backlog.md`'s "Activity log privacy hole" entry; full narrative:
`docs/Progress-Archive-2026-09.md`'s 2026-09-10 entry.

**Three Dev bug fixes, promoted to UAT 2026-09-09 — plain `main` -> `uat`
push (`dbfaea1`..`643256f`, 8 commits, no migrations involved):**
1. Account picker silently truncated at 100 hospitals (found via "+Lead"),
   fixed in 4 files, **committed `a4cf3d9`**.
2. SBU Manager blocked from Add Hospital by two independent zone-gate
   checks that only exempted Admin/GM, **committed `c16b45a`**.
3. Add/Edit Hospital's rep-scoped zone picker (`search_zones_for_hospital`,
   built `e86d49a` 2026-08-31) only ever searched a rep's **primary**
   zone_id, ignoring any additional zones assigned via `user_zone` --
   found live 2026-09-09 (Vivek, Sales Staff: Alappuzha primary + 5 more
   districts, could only find Alappuzha; also affects Naeem's secondary
   zone Wayanad). Not a UAT-specific data problem -- reproduced
   identically on Dev for Vivek before fixing. Not a regression from a
   recent change either: the bug has existed since the picker was built:
   it just never got exercised on UAT until yesterday's 2026-09-08 batch
   shipped this feature there for the first time. Fixed: `ZoneRepository.
   search_by_name` now takes `within_zone_ids` (plural) and
   `search_zones_for_hospital` scopes by `current_user.zones` (all
   assigned zones) instead of just `zone_id`. New regression test
   (`test_rep_with_additional_zones_searches_across_all_of_them`)
   reproduces Vivek's exact case. 711/711 backend tests pass, `ruff`
   clean. Manually verified live. **Committed `643256f`.**

Full narrative for #1-2: `docs/Progress-Archive-2026-09.md`'s "2026-09-08
(later)" and "2026-09-08 (later still)" entries.

**Manager Note notification — 15-case E2E pass completed 2026-09-09, no
action pending.** One live report right after the pass (urgent note to
Rudrappa not appearing immediately) turned out to be cross-tab session
interference from running two logins in the same physical browser during
testing (Supabase's `localStorage`-backed session syncs across tabs of
the same origin) -- retested directly and it worked correctly. Feature
itself confirmed working. Full narrative: `docs/Progress-Archive-2026-09
.md`'s 2026-09-09 entry.

**Activity inline comments — both phases built, full E2E passes, no
action pending.** Two-way thread, anyone who can see the Activity can
post, no edit/delete in v1 — thread renders directly under each
Activity's own card. **Phase 1** (the thread itself, migration `0040`,
**committed `738ef64`**): 12-case E2E pass 2026-09-09, `docs/Activity-
Comment-Phase1-Manual-E2E-Test-Plan.md`. **Phase 2** (notifications),
built same day after Basheer
resolved the two design gaps a review pass found (notify actual thread
participants, not just the Activity's fixed owner; no separate read-
receipt handling needed since the thread renders under its Manager Note
in the same card): 11-case E2E pass, `docs/Activity-Comment-Phase2-
Notifications-Manual-E2E-Test-Plan.md` — one case (TC-5) briefly looked
like a real fan-out bug, root-caused to a transient dev-server reload
race, not a code defect. **Polish, same day:** each Activity's comment
toggle now shows a count badge ("Comments" + a small red pill, or a
plain "Add comment" link when there's none yet) instead of a bare
"Comments" label for every entry regardless of whether it has any —
`comment_count` added to `ActivityResponse` via a correlated subquery,
no new endpoint. Fly-by fix in the Phase 1 pass: `ActivityReportRow` was
missing the `created_by_user` field `DailyActivityReportScreen.tsx`
already expected (gap from `356933d`, caught via `tsc`). Phase 2 +
polish **committed `80bef46`**. Full plan: `docs/Activity-Comment-
Implementation-Plan.md`.

**WON/LOST opportunities are not actually immutable — BR-OP-09 gap, found
live 2026-09-05, not yet fixed.** Confirmed a product's price can be
changed on an opportunity already marked WON with no error — only the
`status_id` field itself is protected, not stage/price/items/owner/etc.,
and none of it is caught by the audit trail (`opportunity_item` isn't
covered — fix planned, see Current task 0b below). Basheer's explicit requirement: any fix must keep an
Admin/GM-only correction path for genuine data-entry mistakes, not just
lock terminal opportunities down entirely. **Open, unresolved sub-
question:** Nishad (Area Manager, owns the opportunity in question)
reported he couldn't make the same edit that Basheer (Admin) could — no
role-based gate found anywhere in the code, so this is unexplained
pending a live repro with the actual error text. Full detail: `docs/
Backlog.md`'s WON/LOST entry; full narrative: `docs/Progress-
Archive-2026-09.md`'s "2026-09-05 (later still)" entry.

**UAT data-quality pass, same session, no action pending:** 10 accounts
(after Basheer deleted 2 junk "Duplicate" rows live) have zero
Opportunities and zero Activity; 22 more have an Opportunity but zero
Activity logged (ties into the existing Order-stage-zero-Activity
Backlog item); 80 have Activity but never became an Opportunity.
Activity-quality spot check on 52 entries logged 2026-09-04/05 mostly
solid, flagged one likely accidental double-submit (Dr.Moopen's Medical
College, "Done"/"Done" a minute apart) and a few generic entries. Full
detail: same Progress Archive entry as above.

**Opportunity Notes Privacy — built, migrated (0039), all 8 verification
steps passed live against Dev 2026-09-05. Committed `552c0ee`.** Haroon
(doing field work himself) didn't want his private discussion notes
visible to Area Managers/SBU Managers in whose territory/SBU his deals
sit, even though the zone/SBU-wide visibility itself is working as
designed. Built: hide only the Activity-tab notes (RLS policy
`activity_tier_visibility`, migration `0039`, new
`cabio_app_user_role_name` helper) via a role-hierarchy check — Area
Manager can't see notes logged by SBU Manager/GM/Admin, SBU Manager
can't see GM/Admin notes — with a looped-in carve-out (existing
split/reminder) granting full visibility regardless of rank. Documents
and the Opportunity record itself stay fully visible. `Physical-
Schema.sql` regenerated 2026-09-05 (also caught up migrations 0032-0038,
not regenerated since 2026-09-02). Full plan:
`docs/Opportunity-Notes-Privacy-Implementation-Plan.md`.

**Two incidental findings during verification, both confirmed correct
behavior, not bugs — logged for the record, no action taken:**
1. Admin/General Manager can never appear in the Split-participant
   picker (`GET /users?scope=sbu`) — by design, BR-FIN-06/ADR-037 (their
   `sbu_id` is a NOT-NULL placeholder, not real membership). Means Haroon
   himself can't be added to a split anywhere in the app. Same root
   pattern as this whole feature (GM personally working deals breaks
   assumptions built for an overlay-only role) — flagged as a possible
   future product question, not fixed here.
2. A Sales Staff rep with a split/reminder on a superior's deal sees all
   its notes regardless of rank (confirmed live: Vivek + Basheer K's
   split) — correct, Sales Staff was deliberately left out of the
   hierarchy-hide scope, and the carve-out is unconditional by design.
   Losing opportunity visibility entirely when a split is removed (also
   observed live) is `opportunity_tier_visibility` behaving normally,
   unrelated to this migration.

Full narrative: `docs/Progress-Archive-2026-09.md`'s
2026-09-04 and 2026-09-05 entries. Also tracked in `docs/Backlog.md`.

**UAT backup/disaster-recovery — script verified working live 2026-09-06, scheduled task still not registered.**
Free-tier Supabase has no automatic backups; first manual dump taken
2026-09-05 (`cabio_uat_2026-09-05.dump`, 204 KB compressed,
`pg_restore --list` verified complete against the 4-table UAT/main
migration gap — expected, UAT is behind head). UAT is tiny (13 MB total,
~408 KB `public` schema) so sizing/incremental-backup complexity isn't a
concern. **`scripts/backup_uat.ps1`** — throwaway Docker `postgres:17`
`pg_dump --schema=public` approach, reads `ADMIN_DATABASE_URL` from
`backend/.env.uat`, writes to `C:\Backups\CabioUAT`, prunes dumps older
than 14 days, logs every run to `backup_log.txt`. Google Drive mirror
step is commented out for now (Google Drive for Desktop not installed).
External-disk copy stays a manual weekly step per Basheer's call — not
automated.

**2026-09-06: manual run failed first (Docker Desktop wasn't running),
then failed again after a naive fix (PowerShell 5.1 turned the
`docker info` stderr redirect into a terminating error under
`$ErrorActionPreference = "Stop"`), then succeeded** once
`Test-DockerUp` locally scoped `SilentlyContinue` around that check.
Script now: checks if Docker Desktop is running, starts it and polls up
to 90s if not, runs the dump, then **stops Docker Desktop again
afterwards if the script itself was the one that started it** (tracked
via `$script:DockerStartedByScript`, in a `finally` block so it runs on
both success and failure) — avoids Docker sitting idle all day just for
one daily dump.

**2026-09-10: shutdown path exercised for real, found broken, fixed,
re-verified.** Docker Desktop relaunched itself right after the script
reported stopping it — root cause was `Stop-DockerIfStartedByScript`
only killing the frontend (`Docker Desktop.exe`), while the separate
`com.docker.backend`/`com.docker.build` processes stayed alive and
silently respawned the frontend to keep the tray icon present. Fixed to
also stop `com.docker.*` processes before `wsl --shutdown`. **Committed
`7931491`.** Re-verified live with a genuine cold start (Docker fully
quit via tray icon first): start → dump → verify → stop, zero Docker
processes left running afterward. Full narrative:
`docs/Progress-Archive-2026-09.md`'s 2026-09-10 entry.

**Design change:** scheduled-task trigger will be `-AtLogOn` instead of
the originally planned `Daily -At 7:30AM`, since the script now handles
its own Docker start/stop — ties the backup to "logged in" (already the
constraint, no stored password) without needing Docker running
unattended all day.

**Next step, Basheer's to do:**
1. Register the logon-triggered scheduled task:
   ```powershell
   $action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"C:\Users\Basheer\GitHub\Calicut_Bio_Medicals\scripts\backup_uat.ps1`""
   $trigger = New-ScheduledTaskTrigger -AtLogOn
   Register-ScheduledTask -TaskName "CabioUATBackup" -Action $action -Trigger $trigger -Description "UAT pg_dump backup, runs at logon"
   ```
2. Confirm the first scheduled run succeeds and appears in `backup_log.txt`.
New CLAUDE.md rule came out of this thread too (below). Full narrative:
`docs/Progress-Archive-2026-09.md`'s 2026-09-04, 2026-09-05, 2026-09-06
and 2026-09-10 entries.

**2026-09-15: 2026-09-14's daily backup was missed** (still a manual
process — the scheduled task above still isn't registered). Basheer asked
for a catch-up run; script executed successfully with his explicit
go-ahead (`cabio_uat_2026-09-15.dump`, 327 KB, 374 TOC entries verified).
Reinforces that the scheduled-task registration above is still the real
fix — a manual-only process will keep missing days.

**CLAUDE.md — new UAT-access safety rule, uncommitted.** Never connect
directly to the UAT Supabase project (`backend/.env.uat`), even
read-only, without asking Basheer first and stating exactly what will
run. Added after a live UAT size-check ran without asking during the
backup discussion above. Also saved to memory.

## Current task 0 — Audit Trail (+ Admin/GM Audit Log screen): committed

Migration `0030_add_audit_log.py` applied to Dev, `Physical-Schema.sql`
regenerated, Admin/GM "Audit Log" review screen built same-day. All 5
verification-plan checks passed live against Dev. **Committed `099e54c`**
("feat: add Audit Trail for account/user_profile/product/opportunity
(ADR-017)"). Full narrative: `docs/Progress-Archive-2026-09.md`'s
2026-09-02 entry.

**Two small follow-on doc commits same day, both closed, no further
action:** (1) Tally SBU/Territory accounting memo for Latheef Bhai —
relayed as a recommendation only, tracked in `docs/Backlog.md`, nothing
for engineering to build unless the Tally integration itself gets
scoped later. (2) 11 unrelated stale doc-only files (pre-dating this
session, zero overlap with Lead Management) caught up and committed.
Full narrative: `docs/Progress-Archive-2026-09.md`'s "2026-09-02 (later)"
entry.

## Current task 0b — Audit Trail Extension (opportunity_item/split/stakeholder): built, migrated, full 18-case E2E pass, committed

Built and E2E-tested live against Dev 2026-09-09, including a
click-through follow-on for the new parent-context chips. Two real bugs
found and fixed during the pass (spurious `updated_by`-only audit rows
on untouched lines; a `KeyError` that 500'd the entire Audit Log
endpoint), both re-verified live. 738/738 backend tests pass, `ruff`/
`tsc` clean. **Committed `6a580fa`.** Full narrative: `docs/Progress-Archive-2026-09.md`'s
"2026-09-09 (later still)" entry; full test results: `docs/Audit-Trail-
Extension-Manual-E2E-Test-Plan.md`.

**Next step:** promote to UAT alongside the WON/LOST (BR-OP-09) fix,
which depends on this coverage. `target_plan`'s own audit-trail gap
stays tracked separately in `docs/Backlog.md`, deferred until Target
Planning itself is built.

## Current task 2 — Auth Session Resilience: committed

Part A (retry-before-signout) and Part B (60-min idle timeout), both root-
caused and fixed 2026-09-02 after the 2026-08-31 mid-debug stop point.
**Committed `1991834`** ("feat: add Auth Session Resilience (idle timeout
+ transient-failure retry)"). Full narrative: `docs/Progress-Archive-
2026-09.md`'s 2026-09-02 entry.

## Current task 3 — Lead Management for Marketing-Sourced Leads ("Marketing Lead"): built, migrated (0031-0038), Groups A-F passed live, committed

Full build per `docs/Lead-Management-Implementation-Plan.md`, staged as
`marketing_lead`/`marketing-leads` (renamed mid-E2E — collided with the
Opportunity Stage "Lead"). Original feature build **committed** `4b24eb5`
("feat: add Lead Management for Marketing-Sourced Leads..."); everything
below (notifications, manager rights, RLS fixes, reference tag) is a
substantial follow-on built 2026-09-03, **committed `c7b90db`** ("feat:
add marketing lead assignment notifications, manager Convert/Discard/
Reassign rights", 2026-09-03 21:31).

**Grew substantially during Groups C-E live testing, 2026-09-03** (full
narrative: `docs/Progress-Archive-2026-09.md`'s 2026-09-03 entries):
assignment notifications for marketing leads (`notify_marketing_lead_
assigned`, mirrors the existing Opportunity-assignment pattern); two live
bugs found and fixed (both screens sharing `GET /marketing-leads`
auto-fired on every login instead of only when actually viewed, silently
marking notifications read — now gated on an `active` prop); Convert's
green context box now shows Source/Conference (previously silently
dropped); Convert wasn't invalidating the Pipeline query (fixed); new
`first_viewed_at` column (migration `0035`, applied) driving a single
milestone pill (NEW→SEEN→CONVERTED/DISCARDED) on the Marketing User's own
screen, replacing the old static status pill; discarded leads now show
their reason/note there too.

**Group F (visibility/authorization) found a real gap, now fixed, then
scope grew further on Basheer's own call:** RLS already granted SBU/Area
Manager (own SBU) and Admin/GM (all SBUs) visibility into other reps'
marketing leads, but no screen surfaced it — the queue only ever showed
"assigned to me." New "Team Marketing Leads" section added to
`MarketingLeadReviewQueueScreen.tsx`. Basheer then decided managers
should be able to **act**, not just see: migration `0036_marketing_lead_
manager_update_rights.py` widens `marketing_lead_update` to let SBU
Manager (own SBU) and Area Manager (own reports only, via `manager_id` —
mirrors BR-OP-14's immediate-manager precedent) Convert/Discard directly,
plus a **new Reassign action** (same manager set, deliberately excluding
the assigned rep themselves) for handing a lead to a different rep, e.g.
someone on leave — resets "seen" state and re-notifies the new assignee.
**Migration 0036 applied.** Live testing (SBU Manager/GM logins) then
found two more real gaps, both fixed same day: (1) the Reassign modal's
rep picker over-excluded SBU Manager/Area Manager, inconsistent with the
original Assign-To picker at creation — aligned to match; (2)
self-delegation — Fazal (Area Manager) has leads assigned directly to
himself and had no way to hand one to his own report, since
`_actor_manages` alone can't authorize "delegate my own lead" (asks "do I
manage myself," always false). Added an explicit self-delegation
carve-out for any manager-tier role; Reassign now also shows in the
personal-queue section for managers. **Then a third gap, also fixed same
day:** Fazal (Area Manager) could still *see* Shruthi's leads under "Team
Marketing Leads" despite her not reporting to him — Area Manager's
`marketing_lead_select` visibility had been SBU-wide since the original
0031 policy, never narrowed when 0036 tightened the *update* policy to
own-reports-only. Migration `0037_marketing_lead_area_manager_select_
own_reports.py` narrows SELECT to match UPDATE exactly (SBU Manager's
own-SBU visibility unchanged). Verified via a direct UPDATE attempt as
Fazal against Shruthi's lead (0 rows affected, RLS already correctly
blocking the write) before concluding this was a visibility-only gap, not
an authorization bypass. 685/685 backend tests pass, `tsc`/lint clean.

**Migration 0037 applied; immediately hit a real 500 on Reassign:**
`marketing_lead_update`'s `WITH CHECK` (0036) was identical to its
`USING` clause — fine for Convert/Discard (never touch
`assigned_to_user_id`), but Reassign's whole job is changing that column,
and two of the four authorization clauses are keyed on it. Postgres
re-evaluates `WITH CHECK` against the row *after* the update, so
reassigning to anyone who isn't the actor themselves or (for Area
Manager) their own report got rejected with `InsufficientPrivilege` — hit
immediately when Fazal self-delegated to Shruthi. Migration `0038_fix_
marketing_lead_update_with_check.py` relaxes `WITH CHECK` to `true`.
685/685 still passed, but this alone **did not actually fix it** —
applied live, retried, still 500'd.

**Root cause was deeper than WITH CHECK.** Isolated via direct DB tests
(reassign Fazal's own lead to himself: succeeds; to Fahad, his report:
succeeds; to Shruthi, not his report: fails, identical error): Postgres
independently refuses to let an UPDATE leave the resulting row invisible
to the actor under the table's own SELECT policy — regardless of what
`WITH CHECK` says. Since 0037 narrowed Area Manager's SELECT visibility
to their own reports only, reassigning outside that set was structurally
impossible for an Area Manager no matter what the UPDATE policy allowed.
Presented two fixes to Basheer: (a) restrict reassignment targets to
people the actor can already see (simple, narrower), or (b) a
SECURITY-DEFINER bypass function (preserves full flexibility, adds a
privilege-escalation code path). **Basheer chose (a).**

Built: `_actor_manages` generalized to take an explicit `(target_user_id,
target_sbu_id)` pair instead of a lead object, reused for both "can I act
on the current assignee" and a new second check, "can I hand it to this
new assignee" — an Area Manager's reassignment target must now also be
one of their own reports (SBU Manager/Admin/GM unaffected, already
SBU-wide/unrestricted). Frontend `MarketingLeadReassignModal.tsx` mirrors
this: Area Manager's rep picker now filters to `manager_id === self`
instead of "anyone in the SBU." 686/686 backend tests pass (2 new — a
positive self-delegation-to-a-report case, a negative
delegation-to-a-non-report case), `tsc`/lint clean. Full narrative:
`docs/Progress-Archive-2026-09.md`'s 2026-09-03 (later) entry.

**F.1-F.3, self-delegation (step 7) confirmed working live 2026-09-03**
(Basheer K as SBU Manager, Fazal reassigning to Fahad with the restricted
picker). One more bug found during this pass, fixed same day: Fahad
(Marketing User) assigned a lead to Rudrappa — bell showed a red dot, but
the dropdown entry wasn't highlighted. DB check: notification read 36s
after creation, consistent with Rudrappa genuinely opening Marketing Lead
Queue via the sidebar (not by clicking the bell notification) — that
path marks it read server-side but never told the bell's cached
unread-count to refresh, only its own 60s poll would eventually catch up.
`MarketingLeadReviewQueueScreen.tsx` now invalidates `["notifications",
"unread-count"/"list"]` itself whenever it becomes active, not just on
bell-click-through. `tsc`/lint clean, no backend change needed.

**Group F complete (steps 4-6 passed live 2026-09-03)** — Admin/GM
full visibility+action across SBUs, already-reviewed-lead rejection,
plain-rep-cannot-reassign all confirmed.

**Small polish, same day:** Basheer noticed a lead reassigned away and
back (Rudrappa -> Shruthi -> Rudrappa) produces two notifications reading
identically ("assigned you a marketing lead") with no way to tell weeks
later they're the same lead, not two, or notice nothing got silently
dropped. Considered a live-status enrichment (show the lead's current
state/assignee in the notification) but Basheer said not to over-engineer
it -- simpler fix: `NotificationBell.tsx`'s `describe()` now includes a
short tag from `entity_id` ("...marketing lead #A1B2C3"), already on
every notification response, no backend change. Same tag recurs across a
lead's reassignment history. Factored into a shared `marketingLeadRef()`
helper (`utils/marketingLeadMilestone.ts`) and rolled out everywhere a
lead appears, per Basheer's follow-up ("should be visible throughout the
system") — both queue card types, the Marketing User's own list,
Discard/Reassign modal titles, and Convert's green context box. Then
restyled again on Basheer's feedback: moved from a trailing light-grey
label to a **leading**, bold indigo badge (`#eef2ff`/`#4338ca`) ahead of
the account name on every card, so it actually stands out instead of
reading as an afterthought. `tsc`/lint clean throughout, no backend
changes for any of this.

**Session wrap-up 2026-09-03 (late):** all of today's work (30 files: 24
modified, 6 new — migrations 0035-0038, marketing_lead/notification
backend, 3 new frontend files, doc updates) **committed** as `c7b90db`.

**Next step: Group G (regression)** — the last group in
`docs/Lead-Management-Manual-E2E-Test-Plan.md`: normal rep's +Lead/+Log
unaffected, direct-IndiaMART-Opportunity assignment stays non-urgent,
normal assignment notification unchanged. Once G passes, the whole Lead
Management feature (Groups A-G) is E2E-confirmed end to end.

**Next up after E2E completes: two items now queued in `docs/Backlog.md`
(plus the SBU-required-at-Marketing-User-creation gap parked there too —
see that doc for detail).**
1. **Engagement History generation** (supersedes the old "Relationship
   Notes" plan as of 2026-09-01) —
   `docs/Engagement-History-Generation-Implementation-Plan.md`. **Blocked
   on one open decision, not code-ready:** which LLM/processing approach
   to use is a data-privacy call for Basheer/leadership (§6 of the plan).
   Full narrative: `docs/Progress-Archive-2026-09.md`'s 2026-09-01 entry.
2. Milestone 2/Target Planning and the Annual Development-Activity KPI
   remain further-out candidates in `docs/Backlog.md`. The UAT
   `rls_auto_enable()` trigger remains a standing risk item, not a
   feature.

## UAT migration — status as of 2026-09-09

**2026-09-09 batch promoted:** `main` -> `uat` (`origin/uat` fast-forwarded
`dbfaea1`..`643256f`, verified a clean fast-forward before pushing, no
migrations in this range so no DB step needed). 8 commits: the three Dev
bug fixes above (#1-3), the Manager Note notification feature + its E2E
close-out (`356933d`, `38b8729`), the Docker-graceful-shutdown fix to
`backup_uat.ps1` (`fbb1a77`), and two handover/doc-only commits
(`58a59ad`, `dad13ca`). **Smoke-tested manually by Basheer 2026-09-09, passed. Team notified,
UAT clear to use for these features. No action pending from this
thread.** Local `uat` git branch ref was found stale
(pointed at a 2026-08-21 commit, `81fded7`) and corrected to track
`origin/uat`.

**2026-09-08 batch (prior promotion):** `main` -> `uat` (`dbfaea1`),
migrations `0024`-`0039` applied (Marketing Lead Handling, Private Manager
Notes, Audit Trail, Manager-Approved Fast-Tracking, New Activity Types,
Relationship-Support Notes, Reminders on Login, Deal Assignment Alerts,
Duplicate Hospital Warning). One live gotcha (`gate_override_reason`
losing its RLS to UAT's standing `rls_auto_enable()` trigger — 3rd
occurrence, see `docs/Backlog.md`) caught pre-emptively and fixed.
Smoke-tested (3-login pass, all 9 features), team notified via WhatsApp,
UAT reopened. Full step-by-step record: `docs/UAT-Migration-2026-09-08.md`;
narrative: `docs/Progress-Archive-2026-09.md`'s 2026-09-08 entry.

Both Star Sales and the extended sales team now have UAT access and have
been walked through the app. Full territory/roster detail:
`docs/Progress-Archive-2026-08.md`'s 2026-08-24 and 2026-08-29 entries;
underlying territory data: `docs/Zone-Hierarchy-Territory-Data-2026-08.md`
(now stale in two places — Bangalore's zone-tree shape, and Nagesh
Ninganoor's territory after his resignation — see the 2026-08-29 archive
entry for both).

**Known blocker, still standing:** direct DB-touching commands
(migrations, raw queries) get blocked by the Claude Code auto-mode safety
classifier regardless of chat approval. Basheer runs these himself
(`!`-prefixed or his own terminal). Read-only SQL (SELECT queries via a
python/psycopg2 script, using `.venv/Scripts/python.exe` directly — Git
Bash mis-resolves `source .venv/Scripts/activate` on this machine) runs
fine without tripping the classifier when using the normal app-role
connection string — used repeatedly this session for UAT diagnostics with
no issue.

**New finding, 2026-09-07:** the normal app-role connection is RLS-
constrained, so a raw script query on an RLS-protected table can silently
return 0 rows with no error, indistinguishable from "table is empty" (hit
this checking the Opportunity count: showed 0, reality was 108, confirmed
once Basheer ran the elevated query himself). The elevated/admin
connection string bypasses RLS and gives the real count, but using it
trips the classifier even for a plain read-only SELECT, so it has to be
run by Basheer directly. Takeaway: never trust a low/zero count from the
normal connection on an RLS-protected table without cross-checking.
