# Active Progress — Cabio Sales OS
_Session: 2026-08-21 → 2026-09-02_

## Current task 0 — Audit Trail (+ Admin/GM Audit Log screen): committed

Migration `0030_add_audit_log.py` applied to Dev, `Physical-Schema.sql`
regenerated, Admin/GM "Audit Log" review screen built same-day. All 5
verification-plan checks passed live against Dev. **Committed `099e54c`**
("feat: add Audit Trail for account/user_profile/product/opportunity
(ADR-017)"). Full narrative: `docs/Progress-Archive-2026-09.md`'s
2026-09-02 entry.

## Current task 1 — BR-ACC-03 (duplicate hospital): committed, manual E2E plan not yet confirmed complete

Committed `e86d49a` on 2026-08-31. Full narrative: `docs/Progress-
Archive-2026-08.md`'s 2026-08-30 and 2026-08-31 entries.

**Still open:** the full manual E2E test plan (`docs/BR-ACC-03-Manual-
E2E-Test-Plan.md`, Groups A-G) has not been explicitly confirmed
complete end to end — Basheer exercised the create/edit UI live during
the build session with no issues found, but that's not the same as a
Groups A-G sign-off. Also still open: the Option A vs. B decision itself
is Haroon's call, per `docs/Duplicate-Hospital-Decision-Brief-2026-08-
29.md`; nothing here is live for the sales team regardless.

## Current task 2 — Auth Session Resilience: committed

Part A (retry-before-signout) and Part B (60-min idle timeout), both root-
caused and fixed 2026-09-02 after the 2026-08-31 mid-debug stop point.
**Committed `1991834`** ("feat: add Auth Session Resilience (idle timeout
+ transient-failure retry)"). Full narrative: `docs/Progress-Archive-
2026-09.md`'s 2026-09-02 entry.

## Current task 3 — Lead Management for Marketing-Sourced Leads (now "Marketing Lead"): built, migrated, manual E2E in progress

Full build per `docs/Lead-Management-Implementation-Plan.md` (two open
decisions resolved 2026-09-02: no Account-creation rights for Marketing
User; assignment picker filtered by the lead's `sbu_id`). Migration
`0031_add_lead.py` applied to Dev, `main.py` wired, `Physical-Schema.sql`
+ frontend types regenerated.

**Renamed `lead`/`leads` → `marketing_lead`/`marketing-leads` mid-E2E
(2026-09-02, Group A)** — collided with the existing Opportunity Stage
"Lead." Migration `0032_rename_lead_to_marketing_lead.py` (0031 never
edited), full backend domain + router + tests renamed, full frontend
(services/components/screens/DemoApp.tsx nav) renamed, types
regenerated again. Full reasoning: `docs/Progress-Archive-2026-09.md`'s
2026-09-02 entry. 659/659 backend tests pass, `tsc`/lint clean throughout.

**Manual E2E in progress** per `docs/Lead-Management-Manual-E2E-Test-
Plan.md`: **Group A passed**, after fixing two gaps found live —
`NotificationBell` and the sidebar's SBU/zone badge were both still
visible for Marketing User despite the "zero pipeline visibility" design
(neither functionally dangerous, but inconsistent — fixed same
`!isMarketingUser` pattern as the other restricted elements). **Currently
mid-Group B**, which found and fixed three more real gaps live: (1) Lead
Source picker restricted to CONFERENCE/IndiaMART via a new
`lead_source.is_marketing_source` flag (migration `0033`) instead of
showing all 12 reference values; (2) extracted `AddHospitalModal.tsx` out
of `CustomerDirectoryScreen.tsx` and added an inline "+ Add Hospital"
shortcut to `QuickLeadModal.tsx`'s Convert flow; (3) `marketing_lead.
account_id` made nullable (migration `0034`, "Not Sure Yet" — the
create-form's own helper text had been claiming this worked when the
field was actually still required) — also caught and fixed a latent
inner-join bug this would have caused in `MarketingLeadRepository`
before it ever shipped. All three: full detail in `docs/Progress-Archive-
2026-09.md`'s 2026-09-02 entries. 661/661 backend tests pass, `tsc`/lint
clean throughout.

**Groups A and B both now fully passed live** (migrations `0031`-`0034`
all applied to Dev). **Stopped for the day here — resume manual E2E at
Group C** (`docs/Lead-Management-Manual-E2E-Test-Plan.md`: rep's Marketing
Lead Queue shows assigned leads, cross-rep visibility check) **tomorrow**,
then Groups D-G (Convert, Discard, RLS/authorization, regression).

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

## UAT migration — status as of 2026-08-29

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
fine without tripping the classifier — used repeatedly this session for
UAT diagnostics with no issue.
