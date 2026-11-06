# Exception Report (Customer with No Activity) — Implementation Plan

**Status:** Approved, 2026-11-04 (Basheer). Built (steps 1–2: `0741c02`, `31747a1`; review fix `a0c5a05`), pre-E2E code review done 4 Nov, merged into `main` 5 Nov (`28112eb`). Migration `0065` applied to Dev 5 Nov (`alembic current` = `0065 (head)`), `docs/Physical-Schema.sql` regenerated. E2E pending.
**Traceability rows:** 11.1 "Exception report: zero lead activity over 3 months" (PRD 5.7, Appendix A.3.6)
**Design / discussion:** `docs/Discussion-Overdue-Next-Actions-2026-11.md`, proposal point 5 and question 6

## Decisions

- D1. A plan of its own, built before the Competitive Loss and Demo-to-sale reports — Basheer, 2026-11-04
- D2. Visits, calls, meetings and emails count as activity; Notes, Manager Notes, Relationship Support and Sales Development don't (same as BR-OP-20) — Basheer, 2026-11-04
- D3. Each rep sees their own list; managers see their own and their team's — Basheer, 2026-11-04
- D4. A hospital has no owner, so a rep's "own" list is every hospital in their zones (including zones below them); an Area Manager's is the same for their own zones plus their team's (D3); an SBU Manager, GM and Admin see all hospitals — Basheer, 2026-11-04
- D5. Activity is counted per SBU: an Imaging rep's list ignores a Critical Care rep's visit, and the reverse. Visits by people with no SBU (GM, Admin) count for both. The all-hospitals view of a GM or Admin counts anyone's — Basheer, 2026-11-04
- D6. "3 months" is a fixed 90 days or more, with no box to change it — Basheer, 2026-11-04
- D7. Activity on an Opportunity whose products are all accessories doesn't count. An Opportunity with no products yet does count — Basheer, 2026-11-04
- D8. Gone-quiet hospitals are listed first, longest silence at the top; never-contacted hospitals follow — Basheer, 2026-11-04
- D8a. Two numbers sit above the list, one counting gone-quiet customers and one counting never-contacted customers — Basheer, 2026-11-04
- D9. Columns: hospital, zone, last activity date, who logged it, days silent, Active Opportunities, installed assets. "Who logged it" replaces the PRD's Account Manager, which isn't built — Basheer, 2026-11-04
- D10. Every customer is included, dealers too, because dealers are customers — Basheer, 2026-11-04
- D11. Each branch is its own line; a visit to the main hospital doesn't clear its branch — Basheer, 2026-11-04
- D12. An activity dated in the future doesn't count — Basheer, 2026-11-04
- D13. New screen under Reports, named "Customer with No Activity"; tapping a customer opens its page — Basheer, 2026-11-04. The Rep picker shows only to people with a team to pick from, not to reps — Basheer, 2026-11-04. The Zone picker shows to everyone with more than one zone, counting the zones below the ones they hold, so someone holding only North Kerala gets it and someone holding only Mangalore, with nothing below it, doesn't — Basheer, 2026-11-04
- D14. Read-only hospital counts from UAT before this plan is approved, because Dev has too few hospitals to judge the list length — Basheer, 2026-11-04
- D15. A small database addition lets the report read each hospital's last activity date, who logged it and its Active Opportunity count for that SBU, past the usual rule that a rep sees only their own Opportunities. Without it, a colleague's visit stays hidden and the hospital wrongly shows as quiet. A rep would see that date, name and count, never the Opportunity or the notes. Modelled on the plan-overlap flag (BR-PL-09) — Basheer, 2026-11-04
- D16. Above the two numbers, one line says whose list it is, which contacts count (D5) and how many of the hospitals in view are listed. SBU: "Imaging", "Critical Care", or "All SBUs" for a GM or Admin viewing all hospitals. Zones: "all zones" (SBU Manager, GM, Admin), "your zones and your team's" (Area Manager), "your zones" (Sales Staff); after a Rep pick "<name>'s zones", after a Zone pick "<zone> and the zones below it". Contacts: "only Imaging visits, calls, meetings and emails count" (or Critical Care), or "anyone's contact counts" for the all-SBUs view. Count: "28 of 38 hospitals". Example for Basheer K: "Imaging · all zones · only Imaging visits, calls, meetings and emails count · 28 of 38 hospitals". The line follows the Rep and Zone pick. No database change. No hint on a row that another SBU contacted the hospital (e.g. Test hospital 2, visited by Critical Care on 29 Oct, still reads "Never contacted" to Imaging): that would show one SBU's activity to the other across the SBU security boundary — Basheer, 2026-11-05 (found in the E2E, A2)
- D17. A "Search customers..." box above the pickers, like the one on Account Management (🔍 inside, ✕ once typed in). It narrows the list on screen to hospitals whose name contains what is typed, ignoring capitals, and works together with the Rep and Zone picks. The two tiles and the D16 line keep counting the whole list, not the matches. No match shows "No customers match your search." Changing the Rep or Zone clears the box. It filters the list already loaded, so no server or database change. Needed because UAT has far more hospitals than Dev, and it makes testing easier — Basheer, 2026-11-06 (found in the E2E, after B5)

## Figures and sources

- 38 hospitals on Dev; 26 never contacted, 1 gone quiet, 11 contacted in the last 90 days; 27 on the list — Dev read-only query, 2026-11-04 07:36 IST
- 0 of 68 Opportunities on Dev are accessories only — same query
- 6 branches, and 6 installed assets at 5 hospitals, on Dev — same query
- 17 of the 38 Dev hospitals filed directly under North Kerala — same query
- Vivek: 6 zones, 3 hospitals. Nishad K V: 1 zone, 25 hospitals — same query
- The UAT figures below leave out dealers, because the query ran before D10 was decided. Including them adds at most 7 to any list — worked out from the same query
- UAT: 769 accounts, 7 of them dealers, so 762 hospitals counted; 13 branches — UAT read-only query (D14), 2026-11-04 08:13 IST, rolled back
- UAT list if anyone's contact counts (GM and Admin view): 42 (40 never contacted, 2 gone quiet) — same query
- UAT list per SBU: Critical Care 620 (619 never contacted, 1 gone quiet); Imaging 113 (112, 1) — same query
- UAT longest lists per person: Nishad K V 162 of 228, Adydev 143 of 202, Naeem 29 of 103; Irfan has no zones — same query
- At least 91 of Critical Care's 620 sit outside every active Critical Care rep's and Area Manager's zones (620 less 228 + 202 + 67 + 32) — worked out from the same query
- SonoScape probe-cable example, and the unnamed hospitals in examples — made-up examples
- "No lead activity for 3 months", "minor transactions such as accessories" and the A.3.6 columns — `docs/Cabio Sales OS – Phase 1 - PRD.md`, 5.7 and A.3.6

## 1. In plain terms

A new report lists customers (hospitals, including dealers) where nobody has done any sales work in the last 3 months, so that a manager can step in before the relationship is lost. It only lists them. Nothing about a hospital or an Opportunity changes, and nobody gets a notification.

**What takes a hospital off the list.** A visit, call, meeting or email logged in the last 90 days, whether on the hospital itself or on one of its Opportunities. Work on an accessory-only Opportunity doesn't count, which is what the signed requirement asks for. For example, a rep who visited only to sell a SonoScape probe cable leaves the hospital on the list (made-up example).

**Whose list.** Hospitals have no named owner in the system, only a zone. So a rep's list is every quiet hospital in their zones. Two reps sharing a zone see the same hospitals.

**Two SBUs.** Each SBU has its own list, because a Critical Care visit says nothing about whether anyone is talking to that hospital about Imaging. A GM or Admin looking at all hospitals sees only the ones where neither SBU has been active. When they pick a rep, they see that rep's list.

**Seeing a colleague's work.** A rep normally sees only their own Opportunities and the activity on them. If the report followed that rule, a hospital a colleague visited last week through their own Opportunity would wrongly show as quiet on the rep's list. So the report needs a small database addition that reads the last activity date, who logged it and the Active Opportunity count. If a colleague's activity is recent, the hospital simply isn't listed and the rep sees nothing about it. If it is older than 90 days, the line shows that date and name. A rep never sees the Opportunity or the notes.

**The order.** Hospitals that had contact and then went silent come first, because those are the relationships being lost. Hospitals nobody has ever contacted come after them. On Dev, 26 of the 27 listed hospitals have never been contacted, so listing those first would bury the one that went quiet.

**Known limit.** A hospital filed at a region level, such as directly under North Kerala, shows for whoever holds that region, not for a rep who holds a district below it. The fix is correct filing of the hospital, not a change to this report.

**Environments.** Built and tested on Dev. The database addition goes on Dev first and has its own approved apply on UAT. The report reaches UAT at the next move from Dev after it is built, along with My Work and the Overdue tab if they haven't moved by then.

### On a phone

Each hospital is a card: name, then zone, then "Last activity 21 Jul, Fahad" or "Never contacted", with a "105 days" badge, and a line with the Active Opportunity and installed asset counts (made-up example). The title, pickers and two tiles stay fixed while the list scrolls (Simpler Table D15, D16). On a tablet or laptop it is a table. Checked at 390, 768 and 1280 px.

## 2. Build order

1. **Database addition, report data and tests.** Basheer runs the database update on Dev himself (`alembic upgrade head`; Claude gives the exact command). Nothing on Dev stops working. Propose a checkpoint commit with the regenerated `docs/Physical-Schema.sql`.
2. **The screen and its menu item.** Nothing on Dev stops working. Propose a commit once tests, type check and lint pass.
3. **Pre-E2E code review, then manual E2E on Dev.** The E2E plan, `docs/Customer-No-Activity-Report-Manual-E2E-Test-Plan.md`, is written ahead of the build. Its section C saves test records on Dev, because none exist today for an accessory-only Opportunity, a dealer or a future-dated visit. Activity rows can't be deleted, so that test data is permanent; its list is in the E2E plan, shown to Basheer first.

## 3. What could be affected

None — this adds a new read-only report, screen and database function. No existing data request, save or access rule changes. The menu file gets one new item and one new screen area, checked by opening the existing reports once in the E2E.

## 4. Not in this plan (with reasons)

- **Excel or PDF export:** Basheer will check with Haroon first (3 Nov).
- **Visit compliance:** out of Phase 1 (Basheer, 28 Sep); question 4 of the overdue paper.
- **Alerts or notifications:** the signed requirement asks for a report.
- **A box to change the 90 days:** the requirement fixes 3 months. Easy to add if managers ask.
- **Account Manager column:** the role isn't built (Traceability, row 6.3).
- **Competitive Loss and Demo-to-sale reports:** their own plans (D1).

## 5. Business rules and records to update

- Business-Rules: BR-ACC-06 added, 2026-11-04.
- Overdue paper: question 6 answered by Basheer, 2026-11-04 (recorded in its section 6).
- PRD: stays as signed. Line 1246 says "Hospitals With No Activity" and A.3.6 says "No Activity Hospital Report"; the screen's name is "Customer with No Activity" (D13).
- Traceability row 11.1 and the scorecard: after E2E passes, under the post-commit checklist.
- Backlog: remove "Exception report: zero lead activity over 3 months" once built.
- In-app help and User Manual: add this screen a day or two after the app (User Manual plan D15).

## 6. Technical addendum

**Backend (`backend/app/domains/reporting/`), one migration:**
- Why: `opportunity_tier_visibility` limits Sales Staff to their own, split or assigned-reminder Opportunities, and `activity_select` follows it, so a query under the viewer's row-level security misses colleagues' Opportunity-linked activity. Area Managers are limited by zone and SBU in the same way.
- Migration: one `SECURITY DEFINER` read-only function modelled on `cabio_app_plan_overlap` (migration `0055`), returning per `account_id` for a given SBU: last contact date, who logged it and Active Opportunity count. It returns nothing else. It keeps that function's check that the SBU asked for is the viewer's own unless they are Admin or GM, but includes the viewer's own rows. Exact shape checked against `docs/Backend-Implementation-Standards.md` at build. Completion checklist in the `cabio-db-and-scripting` skill; separate approval for UAT.
- `GET /reporting/no-activity-customers`, with optional `zone_id` and `user_id`; `router.py`, `service.py`, `schemas.py`, `repository.py`.
- Last-contact logic inside that function, on `activity.account_id`, using the same types as `_CONTACT_ACTIVITY_TYPES` and `activity_date <= now()`. It leaves out activity whose `opportunity_id` is accessory-only: at least one non-`BUYBACK` line, and every such line's `Product.product_type = 'ACCESSORY'`.
- `account` has no owner, SBU or row-level security. Scope comes from `user_zone` plus `zone_closure` for Sales Staff; for an Area Manager the same, plus the zones of their team as `TEAM_SCOPE_BUILDERS` defines it; and all accounts for SBU Manager, GM and Admin. If the approved Activity Type table is built first, read its "Counts as a visit" answer instead of a copy of the four types. `user_id` must fall within the viewer's team, same as `_apply_owner_scope`; otherwise the list is empty.
- D5 inside the function: filter on the logger's `user_profile.sbu_id` (matching, or NULL), using the listed person's SBU when `user_id` is given. No filter for a GM or Admin viewing all hospitals.
- Check at build: every rep and manager who gets a list has an SBU on `user_profile.sbu_id`, since D5 depends on it. On Dev they all do (read-only query, 2026-11-04); not yet checked on UAT.
- Active Opportunity count: `opportunity_status.status_code = 'ACTIVE'` through `opportunity.status_id`, on `opportunity.sbu_id`. Asset count from `installed_asset`, including competitor equipment.
- No filter on `customer_type` (D10), so dealers and accounts with no type are both included. 18 of 38 Dev hospitals have no type.
- Rule: 90 days or more, same "N or more" boundary as BR-OP-20.
- Tests: `backend/tests/domains/reporting/`, covering each decision, including role scope, a colleague's visit, the SBU split, accessory-only, future dates, dealers included and branches.

**Frontend (`sales-os-app/src/`):**
- New `screens/NoActivityCustomersReportScreen.tsx`, using `TableOrCards` and `ReportingUI`, with `onSelectAccount` to `handleSelectAccount`. Frontend standards 6.11. Rep picker as on `StagnantDealsReportScreen.tsx:46`: `listUsers("scoped")`, shown only when that list has more than one person.
- `services/reporting.ts`, `types/reporting.ts`.
- `DemoApp.tsx`: one item in `REPORTS_SECTION`, and one always-mounted screen area beside `stagnantDeals`. No role gate, same as the other reports. A person with no zones gets a clear empty message.
