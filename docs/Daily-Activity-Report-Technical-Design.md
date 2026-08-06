# Daily Activity Report — Technical Design

**Status:** Planned, not yet built. **Prepared:** 2026-08-06.

## Context

Activities (visits, calls, emails, meetings, notes) are logged against Accounts,
Projects, and Opportunities, but are only ever visible embedded in the individual
Account 360 / Project 360 / Opportunity Detail screen for that one record. There is
no cross-cutting view.

Haroon (General Manager) needs to see "who did what activity on a given day" across
the whole team, and today the only way is to open every account/opportunity one by
one. This is being built ahead of Issue 2 (split participant picker) because it's an
immediate operational need for daily team oversight, and — unlike Issue 2 — nothing
about it is undecided; everything it needs already exists in the data model.

**Scope:** a simple, filterable, chronological activity log for one day at a time
(date picker, defaulting to today; optional filter by team member), with click-through
to the underlying Account/Opportunity. **Not** a dashboard/analytics view.

### Checked against the PRD first — this doesn't already exist

The PRD's Reporting & Review Module (§5) and Appendix A dashboards were checked in
full. Nothing matches "a browsable log of who did what, on a specific day, across the
team." The closest related items:
- §5.4 Manager Dashboard / Appendix A.2.2 — "Rep/Team Activity Levels," an **aggregate
  count/level** for a not-yet-built dashboard, not a per-activity log.
- §5.12 Customer Portfolio Report — lists "Activities" as one dimension, but scoped
  **per customer**, not across the team for a given day.

So this is a genuinely new, narrower report — not a duplicate of a planned dashboard,
and it doesn't block or get blocked by those dashboards being built later.

No DB migration is needed — no new columns/tables. `Activity.activity_date` and
`Activity.user_id` are already indexed columns, which is exactly what the new query
filters on.

## Access model — full 6-tier scoping, not an Admin/GM-only gate

The first draft of this design gated the whole endpoint to `{"Admin", "General
Manager"}` only, to sidestep a real RLS gap: `activity_tier_visibility`'s Postgres
policy leaves account/project-only activities (`opportunity_id IS NULL`) visible to
**every** authenticated user regardless of role — harmless for the existing
single-account-scoped screens (you already navigated to that specific account), but
not something a new cross-team endpoint should inherit unchecked.

Decided against a phased "Admin/GM now, tiers later" rollout — the two options are
different *mechanisms*, not different amounts of *scope*: an allowlist that blocks
everyone else outright, vs. a scoping filter that includes everyone but narrows their
results. Opening the allowlist version up later would mean replacing the
authorization logic, not extending it — real rework, not free optionality. Building
the full tiered version up front turned out to be low-marginal-cost, because a
directly reusable building block already exists:

**Reuse, don't reinvent:** `backend/app/domains/organization/repository.py` already
implements exactly this hierarchy — `_UNRESTRICTED_ROLES = {"Admin", "General
Manager"}` plus a `_SCOPE_BUILDERS` dict (`SBU Manager` → own SBU; `Area Manager` →
own SBU+zone; `Sales Manager` → direct reports via `manager_id`) — already proven in
production for the User Directory / Opportunity Owner reassignment / Split picker
features. Every `user_profile` row already carries `sbu_id`, `zone_id`, and
`manager_id` directly, so the same filter logic applies unchanged to a query joining
`Activity` → `UserProfile` on `Activity.user_id` — same rules, just keyed on **who
logged the activity** instead of on the user row itself. These two names are being
promoted from private to shared (dropping the leading underscore) since this is now
their second real caller, rather than duplicating the dict in the activity domain.

**Net effect:** every role gets an appropriately-scoped view, not just Admin/GM —
Sales Staff sees their own day, Sales Manager sees themselves + direct reports, Area
Manager their SBU+zone, SBU Manager their SBU, Admin/GM everyone. There's no
allow/deny gate on this endpoint at all; every authenticated user can call it, they
just get their own tier's slice of the data.

## Backend

**`backend/app/domains/organization/repository.py`** — rename `_UNRESTRICTED_ROLES` →
`UNRESTRICTED_ROLES` and `_SCOPE_BUILDERS` → `TEAM_SCOPE_BUILDERS` (now an
intentionally shared building block, not a private module detail).

**`backend/app/domains/activity/schemas.py`**
- Add `ProjectNested` (mirrors the existing `AccountNested`/`OpportunityNested`).
- Add `ActivityReportRow` — modeled on the existing `ActivityContextNested` (used
  inside `ReminderResponse` today) but extended with the project nesting that schema
  lacks: `id`, `activity_type`, `activity_date`, `notes`, `account`, `opportunity`
  (nullable), `project` (nullable), `user`.

**`backend/app/domains/activity/repository.py`**
- Add `list_by_date(current_user, start, end, *, user_id=None, offset=0, limit=50)` —
  joins `UserProfile` on `Activity.user_id`; filters the `[start, end)` UTC range
  (explicit range, not a DB-side `DATE()` truncation — there's no timezone configured
  in `backend/app/db/session.py`, so a DB-side truncation would bucket by Postgres's
  default timezone, not India's); applies the tier scope (`UNRESTRICTED_ROLES` → no
  extra filter; otherwise `TEAM_SCOPE_BUILDERS[role](current_user) OR
  Activity.user_id == current_user.id`, mirroring `UserRepository.list_active`
  exactly); applies the optional explicit `user_id` filter (the frontend's
  team-member dropdown) as a further narrowing on top of the tier scope. Unlike the
  existing `list_by_account`/`list_by_opportunity`/`list_by_project`, does not
  suppress loading the account/project/opportunity relationships, since
  `ActivityReportRow` needs their names.
- Add matching `count_by_date(...)` — a real count query, same join and filters.

**`backend/app/domains/activity/service.py`**
- Add `list_daily_report(current_user, report_date, *, user_id=None, page=1,
  page_size=50)` — converts the given calendar date to a UTC range using India's
  timezone (`zoneinfo.ZoneInfo("Asia/Kolkata")`, stdlib, no new dependency); calls the
  new repository methods. No role gate here — access is about scope, not permission.

**`backend/app/domains/activity/router.py`**
- Add `GET /activities` — new, distinct from the three existing single-parent-scoped
  activity GETs and the bare `POST /activities`. Query params: `report_date`
  (required), `user_id` (optional), `page`, `page_size`. Passes the full
  authenticated user through to the service. Returns the standard
  `APIResponse[PaginatedResponse[ActivityReportRow]]` shape used everywhere else.

## Frontend

- **`sales-os-app/src/services/activities.ts`** — add `listActivityReport()`, same
  shape as the existing `listPipeline()`.
- **New: `sales-os-app/src/screens/DailyActivityReportScreen.tsx`** — structural
  template is the existing `NextActionsScreen.tsx`. Team-member filter copies
  `OpportunityPipelineScreen.tsx`'s owner-filter dropdown, but uses the **default
  "scoped"** parameter on `listUsers()` — so the dropdown itself only ever offers
  people the current user's tier can see, automatically staying in sync with what the
  backend returns. Date picker uses `@mui/x-date-pickers`' `DatePicker` (already a
  dependency; app is already wrapped in the needed provider — confirmed). Row
  rendering combines the existing activity-type badge styling with the existing
  click-to-navigate pattern used in `ReminderRow.tsx`.
- **New, small: `sales-os-app/src/utils/activityTypes.ts`** — the activity-type
  icon/color map is currently duplicated in two places; extracting a shared version
  here (and updating both existing usages) is bundled into this feature since adding
  a third copy is what specifically justifies extracting now.
- **`sales-os-app/src/DemoApp.tsx`** — add a nav entry, **not** admin-gated — every
  role now gets a correctly-scoped, useful view (even a Sales Staff rep sees their
  own day), so it belongs alongside "Next Actions" in the "SALES EXECUTION" section,
  not under "ADMINISTRATION". Mounted the same always-mounted/hidden way
  `NextActionsScreen` is today.
- **`sales-os-app/src/types/api.ts`** — regenerate via the existing `npm run
  generate:types` script once the backend change lands.

## Verification

**Backend (pytest):**
- Regression tests confirming `UNRESTRICTED_ROLES`/`TEAM_SCOPE_BUILDERS` behave
  identically after the rename.
- New repository-level tests for `list_by_date`, following the existing
  `test_organization_repository.py`'s `TestListActive` pattern exactly (mock DB,
  compile the generated WHERE clause to a SQL string, assert substrings) — one test
  per tier (Admin/GM unrestricted; SBU Manager; Area Manager; Sales Manager; plus the
  date-range clause always present and the optional `user_id` narrowing further).
- Service-level tests: date→UTC-range conversion correctness, offset math, real-count
  assertion.
- New router tests (this domain doesn't have a router test file yet): 401
  unauthenticated, 200 for each role with correctly-shaped rows, 422 when
  `report_date` is missing. No 403 case — there's no allow/deny gate, only scoping.
- Run: `cd backend && pytest tests/domains/activity/ tests/domains/organization/ -v`

**Frontend:** `npx tsc --noEmit`, `npm run lint`.

**Manual smoke test on Dev** (shared Supabase Dev DB, real click-through, no fake data):
1. Every role sees "Daily Activity Report" in nav now.
2. As Admin/GM: defaults to today; sees activity across the whole team, both SBUs.
3. As an Area Manager (4 real ones exist on UAT): confirm the report only shows
   activity from users in that manager's own SBU+zone — verifiable against real
   people today. Sales Manager/Sales Staff tiers aren't populated with real users yet
   (tied to the still-open Critical Care/Imaging manager hierarchy build-out) —
   verify those with synthetic test users for now, revisit live once real people
   exist there.
4. Team-member filter dropdown only offers people within the current user's own
   scope; narrows correctly; clearing returns to the full scoped list.
5. Log a fresh Activity, confirm it appears after refetch; pick a past date with
   known activity (cross-checked against an Account 360 Activity tab) → matching
   rows appear.
6. Click an account/opportunity name → navigates there; Back returns to the report
   with the same date/filter still applied.
7. An account-only activity renders without an opportunity link; a project-only
   activity renders its project chip correctly (new rendering case, no prior
   precedent).

## Critical files
- `backend/app/domains/organization/repository.py` (small rename, shared building block)
- `backend/app/domains/activity/repository.py`
- `backend/app/domains/activity/service.py`
- `backend/app/domains/activity/router.py`
- `backend/app/domains/activity/schemas.py`
- `sales-os-app/src/screens/DailyActivityReportScreen.tsx` (new)
- `sales-os-app/src/services/activities.ts`
- `sales-os-app/src/DemoApp.tsx`
- `sales-os-app/src/utils/activityTypes.ts` (new, small refactor bundled in)
