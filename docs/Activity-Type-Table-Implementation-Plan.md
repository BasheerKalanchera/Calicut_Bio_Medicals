# Activity Type Table — Implementation Plan

**Status:** Draft, 2026-10-28.
**Traceability rows:** none — an internal clean-up, not a signed requirement.
**Design / discussion:** Plan & Chore session, 2026-10-28 (Basheer).

## Decisions

- D1. The facts about each activity type are kept in one table in the
  database, and every screen, report and script reads them from there
  instead of keeping its own copy — Basheer, 2026-10-28.
- D2. The table starts with exactly today's 13 types and today's answers,
  so every screen works as it does now. Changing any type's answers (for
  example, whether a Visit must have an Opportunity) is a separate
  business decision, not part of this plan — Basheer, 2026-10-28.
- D3. Each type has these answers: Counts as a visit; Needs a next
  action; Hospital must be chosen when logging; Opportunity (Must be
  chosen / Optional / Not offered) — Basheer, 2026-10-28.
- D4. One more answer is needed to retire the code's copy of the six
  training and conference types: "Outcome/Learning must be filled in"
  (today asked only for those six) — proposed.
- D5. Admin and GM add new activity types, and rename existing ones, on
  the Reference Data screen
  (`docs/Reference-Data-Management-Screen-Implementation-Plan.md`), which
  is built after this plan. Adding a type means setting its answers
  (D3, D4) there too. The four types with rules of their own in the code
  (section 1) keep working after a rename, because the code knows each
  type by a fixed code that renaming doesn't change — Basheer,
  2026-10-28 (reverses the same day's "developer only").
- D6. Withdrawn 2026-10-28: not a decision. The list doesn't change; the
  safety lock that refuses an unknown type is in section 6.
- D7. Everyone signed in can read the table; no row-level limits, same as
  the lead source list — proposed.
- D8. The database's own check that a hospital is chosen reads the
  table's "Hospital must be chosen" answer instead of its own list of the
  six, so a new type added on the Reference Data screen (D5) is checked
  the same way — proposed.
- D9. The table holds each type's name and its order in the dropdown.
  Icons and colours stay in the app, in one shared function every screen
  calls (today the Log Activity form keeps its own copy) — Basheer,
  2026-10-28. A type with no icon yet (one just added on the Reference
  Data screen) shows the Note icon until a developer gives it one, as an
  unknown type does today — proposed.
- D10. The vendor pipeline report script (run by Claude on request, not
  in the app) keeps counting Visits and Meetings only for its "last
  visit" column; it is left out of this plan so SonoScape's file doesn't
  change — proposed.
- D12. Changing an existing type's answers is not on the Reference Data
  screen: it would change My Work and the Stagnant Opportunities report
  for past activities. That stays a developer change, like Opportunity
  stages on the same screen — proposed.
- D11. Built and tested on Dev; reaches UAT with the next normal move from
  Dev to UAT — proposed.

## Figures and sources

- 13 activity types — `backend/app/domains/activity/schemas.py:9`, read
  2026-10-28.
- 11 places that list types or groups of types — code search
  (`activity_type`, the type names) over `backend/app`, `sales-os-app/src`,
  `scripts` and `docs/Physical-Schema.sql`, 2026-10-28; listed in
  section 6.
- Today's answers for each type (the table in section 1) — read from
  `schemas.py:20-37`, `:101-156`, `reporting/repository.py:77`,
  `LogActivityModal.tsx:46`, `:106`, `:146`, `:205`, 2026-10-28.
- Vendor pipeline script counts Visit and Meeting only —
  `scripts/vendor_pipeline_report.py:135`, read 2026-10-28.
- Lead source list: a flag set only by database update, read through the
  master-data list, no row-level limits — migration 0033,
  `backend/app/api/routers/master_data.py:51`, `docs/Physical-Schema.sql:591`,
  searched 2026-10-28.
- Newest migration on main: `0064_brand_quarter_set_by_hand.py` —
  `backend/alembic/versions`, listed 2026-10-28; the number is re-checked
  at build (a parallel session may have taken the next one).
- Number of activities on Dev and UAT: not counted (a read-only Dev count,
  shown first, at build step 1).

## 1. In plain terms

**What happens today.** Every activity has a type, picked from 13 in the
Log Activity form. The app needs to know things about each type — does it
count as visiting the hospital, must a next action be set after it, must a
hospital be chosen. These answers are written out separately in 11 places:
the Log Activity form, the form for closing a next action, the server, the
reports, the database and two scripts. When a type is added or changed,
any place left out quietly disagrees with the rest. This has already
happened once: the vendor pipeline report script (run by Claude on
request, not in the app) counts only Visits and Meetings as contact,
while My Work and the Stagnant Opportunities report also count Calls and
Emails.

**What changes.** One table in the database holds the answers for every
type (D1). Every place above except the vendor pipeline report script
(D10) reads the table instead of its own copy.
Changing how a type behaves then means changing one line in the table.

**The table, starting with today's answers (D2):**

| Activity type | Counts as a visit | Needs a next action | Hospital must be chosen | Opportunity | Outcome/Learning must be filled in |
|---|---|---|---|---|---|
| Visit | Yes | Yes | Yes | Optional | No |
| Call | Yes | Yes | Yes | Optional | No |
| Meeting | Yes | Yes | Yes | Optional | No |
| Email | Yes | Yes | Yes | Optional | No |
| Note | No | Yes | Yes | Optional | No |
| Manager Note | No | No | Yes | Optional | No |
| Relationship Support | No | No | Yes | Must be chosen | No |
| Conference/Expo | No | No | No | Not offered | Yes |
| OEM/Product Training | No | No | No | Not offered | Yes |
| Certification | No | No | No | Not offered | Yes |
| Sales Training | No | No | No | Not offered | Yes |
| Seminar/Trade Show | No | No | No | Not offered | Yes |
| Other Development | No | No | No | Not offered | Yes |

What each answer controls today:
- **Counts as a visit** — resets an Opportunity's "Not visited" days on My
  Work and the Stagnant Opportunities report, and sets a hospital's "last
  visit" on My Work's hospital list. Only an activity linked to the
  Opportunity resets that Opportunity's days.
- **Needs a next action** — the Log Activity form asks for a next action;
  only these types can be picked when closing a next action, or as the
  first activity of a new lead; and a new activity of this type is
  refused while the person has an open next action on that Opportunity
  (they close it instead).
- **Hospital must be chosen** — the Log Activity form won't save without a
  hospital.
- **Opportunity** — "Must be chosen": the form won't save without one;
  "Not offered": the form doesn't show the Opportunity picker.
- **Outcome/Learning must be filled in** — the form shows the
  Outcome/Learning box and won't save it empty (D4).

**Rules that stay in the code** — they belong to one type only, so a
yes/no column would add nothing (section 6):
- a Manager Note can be marked urgent, and is shown as a note for the
  person it is for;
- Relationship Support needs a description and picks from a different
  Opportunity list;
- Other Development needs a description;
- a note written with a stage or status change is always a Note.

**What users see.** Nothing different: the same types, names, order,
icons and rules as today. Once the Reference Data screen is built, an
Admin or GM can add a new type there and set its answers (D5).

**Where it lands.** Dev first; UAT with the next normal move (D11).

### On a phone

No screen changes.

## 2. Build order

1. **Database** (one migration). Before writing it: a read-only Dev count
   of activities by type, shown first, to confirm every stored type is one
   of the 13. Create the table with the 13 types and today's answers; the
   database refuses an activity whose type isn't in it, and its hospital
   check reads the table (D8). Basheer runs
   `alembic upgrade head` on Dev; regenerate `docs/Physical-Schema.sql`;
   full backend tests; checkpoint commit. *Stops working on Dev:* nothing
   — the code still uses its own lists until step 2.
2. **Server.** The server reads the table for every check and report in
   section 6; error messages stay word for word. The table is sent to the
   app with the other fixed lists. Full backend tests; checkpoint commit.
   *Stops working:* nothing.
3. **Screens and script.** The Log Activity form, the close-next-action
   form and the new-lead form read the table; every screen takes icons
   and colours from the one shared function (D9); the UAT data-quality
   script reads the table too. Type check, lint, checkpoint commit.
   *Stops working:* nothing.
4. **Docs and test.** Business rules, the rule matrix, the data model
   docs; pre-E2E review; manual E2E on Dev.

## 3. What could be affected

Found by a code search on 2026-10-28:
- (a) **Screens that log an activity:** the Log Activity form (opened from
  an Opportunity, a hospital, My Work and the activity lists); closing a
  next action; the first activity on a new lead (Quick Lead); the note
  written with a stage or status change. Each must offer the same types
  and refuse the same entries as today.
- (b) **Reports that use the type:** My Work ("Not visited for", My
  hospitals' last visit) and the Stagnant Opportunities report — the same
  Opportunities and days as before. The activity count at
  `reporting/repository.py:334` counts every type on purpose — no change.
- (c) **Screens that show a type:** the activity timeline, next-action
  rows, the Daily Activity Report and the Log Activity dropdown show its
  icon and name — unchanged (D9). Script: the UAT data-quality check
  (same results). The vendor pipeline report is not touched (D10).

Each gets a check before and after, in the E2E test plan.

## 4. Not in this plan (with reasons)

- **The Reference Data screen itself** (D5): built under its own plan,
  after this one.
- **Changing any existing type's answers** (D2, D12): e.g. making an
  Opportunity required for a Visit is a business decision for later.
- **The server refusing an Opportunity on the six training types:** today
  only the form hides it; keeping today's behaviour (D2).
- **Moving icons and colours into the table** (D9).
- **The vendor pipeline report script** (D10).
- **A lighter option — one shared list in the server's code instead of a
  table:** Basheer asked for a table (D1).

## 5. Business rules and records to update

- Business-Rules: BR-ACT-01, BR-ACT-02, BR-ACT-04, BR-ACT-05, BR-ACT-09,
  BR-ACT-10, BR-ACT-11 and BR-OP-20 point to the activity type table for
  their lists of types instead of naming them. Matrix rows in the same
  commit.
- `docs/Physical-Schema.sql` (regenerated), `docs/Enterprise-Data-Model.md`,
  `docs/physical-data-model.md`, `docs/API-Catalog.md` (the new list).
- The UAT data-quality script's own notes.
- `docs/Reference-Data-Management-Screen-Implementation-Plan.md`: activity
  types join its lists (D5, D12) — written 2026-10-28.

## 6. Technical addendum

**The 11 places today (code search, 2026-10-28):**

| # | Where | What it lists |
|---|---|---|
| 1 | `backend/app/domains/activity/schemas.py:9` `ActivityType` | all 13 (Pydantic `Literal`; feeds the generated `sales-os-app/src/types/api.ts`) |
| 2 | `schemas.py:20` `SALES_DEVELOPMENT_ACTIVITY_TYPES` | the six: hospital optional (`:137`), Outcome required (`:145`) |
| 3 | `schemas.py:35` `NOT_CUSTOMER_FACING_TYPES` | eight: no next action (`:107`), can't close a reminder (`:288`); also `activity/service.py:170` (BR-ACT-11) and `opportunity/schemas.py:316` |
| 4 | `opportunity/schemas.py:226` `FirstActivityType` | five: first activity on a new lead |
| 5 | `reporting/repository.py:77` `_CONTACT_ACTIVITY_TYPES` | four: "Not visited" (`:93`) and hospital last visit (`:464`) |
| 6 | `docs/Physical-Schema.sql:412` `chk_activity_account_required` | the six (migration 0028) |
| 7 | `sales-os-app/src/components/LogActivityModal.tsx:26` | all 13, names and order for the dropdown |
| 8 | `LogActivityModal.tsx:46` | the six (`:101`, `:106`, `:146`, `:205`, `:212`, `:351`, `:361`) |
| 9 | `sales-os-app/src/components/CloseReminderModal.tsx:80` | five: closing a next action |
| 10 | `scripts/uat_data_quality_check.py:389` | eight (section 7a) |
| 11 | `scripts/vendor_pipeline_report.py:135` | Visit and Meeting only (D10) |

`sales-os-app/src/utils/activityTypes.ts:6` (icons, colours, names for the
timeline, `ReminderRow.tsx` and `DailyActivityReportScreen.tsx`) becomes
the one shared function, e.g. `getActivityTypeStyle(code)` (D9): icon
and colour from the app, name from the table; an unknown code gets the
Note style, as `ActivityTimeline.tsx:57` and
`DailyActivityReportScreen.tsx:26` do today. `LogActivityModal.tsx:26`'s
own emoji labels and `ReminderRow.tsx:54,154`'s inline fallbacks switch
to it.

**Single-type rules that stay in code:** `schemas.py:101` (urgent,
Manager Note), `:119`/`:128` (Relationship Support), `:154` (Other
Development), `activity/router.py:153`, `activity/service.py:204`, `:237`,
`opportunity/schemas.py:314`, `LogActivityModal.tsx:100-102`, `:217`,
`:495`. The table's code column is the stable key these refer to.

**Migration (next free number at build):**
- `activity_type_ref` (`code` varchar(50) PK, `label` varchar(100) NOT
  NULL, `sort_order` smallint NOT NULL, `counts_as_contact` bool,
  `needs_next_action` bool, `needs_account` bool, `opportunity_rule`
  varchar(20) CHECK in ('REQUIRED', 'OPTIONAL', 'NOT_OFFERED'),
  `needs_outcome_notes` bool, all NOT NULL; `is_active` bool DEFAULT
  true). Seeded with the 13 rows above.
- `activity.activity_type` gains an FK to `activity_type_ref.code` (the
  safety lock); existing rows unchanged.
- No RLS policy (D7), like `lead_source`.
- `chk_activity_account_required` is dropped and replaced by a
  `BEFORE INSERT OR UPDATE` trigger on `activity` that refuses a NULL
  `account_id` when the type's `needs_account` is true (D8; a CHECK can't
  read another table).

**Server:**
- `ActivityType` becomes `str` in the schemas; the Pydantic validators
  that test type groups (`schemas.py:107`, `:137`, `:145`, `:288`;
  `opportunity/schemas.py:226`, `:316`) move to the services, which read
  the table through a small repository (one query per request; the table
  has 13 rows). Error messages unchanged. Single-type validators stay in
  the schemas.
- `reporting/repository.py`: `_CONTACT_ACTIVITY_TYPES` becomes a subquery
  on `counts_as_contact`.
- `master_data.py`: new `ACTIVITY_TYPES = "activity-types"` entity, active
  rows by `sort_order`.

**Frontend:** `services` call for `/master-data/activity-types` (cached);
`LogActivityModal.tsx`, `CloseReminderModal.tsx` and `QuickLeadModal.tsx`
build their lists and show/hide fields from it; `activityTypes.ts` keeps
icons and colours. `api.ts` regenerated.

**Scripts:** `uat_data_quality_check.py` joins `activity_type_ref`
instead of naming types. `vendor_pipeline_report.py` unchanged (D10).

**Tests:**
- every group the old lists held equals the table's answers (13 rows,
  same yes/no as section 1);
- the hospital trigger refuses a missing hospital for the 7 types that
  need one and allows it for the six (D8);
- a type added to the table with its answers is offered and checked
  without a code change (D5);
- existing activity, reminder, opportunity and reporting tests pass
  unchanged in what they assert; frontend type check and lint.
