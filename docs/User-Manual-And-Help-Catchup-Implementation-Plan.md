# User Manual and In-App Help Catch-up — Implementation Plan

**Status:** Approved 2026-10-01 (Basheer). Steps 1–2 done 2026-10-15;
manual waiting for Basheer's PDF review. Step 3 (in-app help) follows that
review and also covers the Annual Target Planning Part 1 screens; it ships
with the single full UAT move (Annual Target plan D52) — Basheer,
2026-10-21. (Plan vs Actuals Tracking's screens, which step 3 waited for,
passed E2E 2026-10-13.) **Reshaped 2026-10-22 (Basheer):** help text
moves from the app's code into a database table with an Admin/GM editor
(D1 changed, D7a replaced, D9–D13). Help wording is written screen by
screen in Plan & Chore, alongside the manual review (step 3a); Build &
Test builds the table and editor in parallel (step 3b).
**Traceability rows:** none (supports the UAT rollout; Backlog "Bring the
user manual and in-app `?` help up to date").
**Design / discussion:** this plan. Original manual and help: Progress-Archive
2026-08, entry for `3cfa132` (2026-08-01).

## Decisions

- D1. Approach: rewrite the manual and the help text by hand, and add a
  guard that stops them drifting again (D7) — Basheer, 2026-10-01.
  **Changed 2026-10-22:** the help text no longer lives in the app's
  code; it lives in a database table that Admin and General Manager can
  edit from a screen (D9–D13), so a wording fix needs no developer and
  no release. The manual stays a separate document. The "one shared
  source" option in section 3 is still not chosen — Basheer, 2026-10-22
- D2. The manual and help describe what UAT will have **after the
  hospital-wise Part 1+2 move** (including Target & Coverage Planning,
  Rate Hospitals and plan-versus-actual). Written now from Dev, published
  with that move — Basheer, 2026-10-01
- D3. The manual is organised **by role first** ("How do I…" for Sales
  Rep, Area Manager, Admin/GM, Marketing User), followed by a short
  reference section per screen — Basheer, 2026-10-01
- D4. **Every menu screen gets a `?` help page**: refresh the 8 that exist,
  write the 14 that are missing (list in section 5) — Basheer, 2026-10-01
- D5. The manual reaches the team as a **PDF sent with each UAT move**
  (same style as the data-quality reports); the in-app `?` stays the
  everyday help — Basheer, 2026-10-01
- D6. **No screenshots** — they go stale with every screen change; button
  names in bold instead — Basheer, 2026-10-01
- D7. Keeping it current: (a) a frontend test that fails when a menu screen
  has no help page; (b) CLAUDE.md "Post-commit checklist" gains a line:
  a feature that changes a screen updates that screen's help text and
  manual section in the same feature commit — Basheer, 2026-10-01.
  **(a) replaced 2026-10-22:** a test can't check a database, so the
  help editor screen lists every menu screen and marks the ones with no
  help yet (help editor plan D5). (b) stands; "updates the help text" now means updating
  the help table's starting content (step 3b) — Basheer, 2026-10-22
- D8. Basheer reviews the manual text before the PDF goes out; Haroon
  receives it with the UAT move — Basheer, 2026-10-01
- D9–D12. The help editor's decisions (who edits, formatting, Audit Log,
  manager box) — Basheer, 2026-10-22; recorded as D1–D4 in
  `docs/In-App-Help-Editor-Implementation-Plan.md`
- D13. **Order of work:** the 22 help texts are written in Plan & Chore
  now, screen by screen with the manual review (step 3a), while Build &
  Test builds the table and editor (step 3b); the agreed text is then
  loaded into the table as starting content, so neither waits for the
  other — Basheer, 2026-10-22

## 1. In plain terms

The user manual and the `?` help button were written on 1 Aug. Since then
about 70 features have been built, so both are out of date. Eight screens
have help that is partly wrong or missing new buttons. Fourteen screens have
no help at all: when a user presses `?` there, nothing happens.

After this work:
- Every screen in the menu has a `?` page explaining what it is for and
  what each button does, using the exact words on the screen.
- The manual becomes a short guide per role: for example, a Sales Rep sees
  "How do I log a visit", "How do I mark an Opportunity Won", "How do I
  make my quarter's plan", while an Admin sees "How do I rate hospitals"
  and "How do I approve a plan".
- The manual and help use "plan" for a rep's own figure and "target"
  only for a figure set from the top: a brand's target, the SBU target,
  or a person's quarterly target set by the person they report to
  (Frontend Standards 6.10, built `25fbeab` 2026-10-14; widened for
  Annual Target Planning 2026-10-21).
- A test stops a new screen from shipping without help, and each future
  feature updates its own help as part of the same change.

## 2. Build order

1. **Inventory (half a day).** List every menu screen per role from the
   code, and map each feature built since 1 Aug to the screen it changed.
   Output: a checklist table at the end of this plan.
2. **Manual rewrite (about 1 day).** `docs/UAT-User-Manual.md`: role
   guides plus the screen reference. Basheer reviews (D8).
   *Checkpoint commit (docs only).*
3. **In-app help, two strands in parallel (D13).**
   - **3a. Help wording (Plan & Chore, about 1 day).** Screen by screen:
     read the screen's code, draft its help (refresh 8, write 14), review
     it beside that screen's manual section and fix both. Agreed text is
     kept in section 7 of this plan until 3b can load it.
     *Docs-batch commits.*
   - **3b. Help table and editor (Build & Test, about 1.5–2 days,
     estimate).** Its own plan and test plan:
     `docs/In-App-Help-Editor-Implementation-Plan.md`; it loads section
     7's text once all 22 are agreed (its step 4).
4. **Review and test (half a day).** `/code-review` (medium); short manual
   E2E: open `?` on every screen as each role; edit a help page as Admin
   and as General Manager, check the Audit Log entry, and check another
   role can't edit (Simple steps, Basheer).
5. **Ship with the UAT move.** Help content loaded into UAT as part of
   the move — after that, UAT's copy is the one that matters, and it is
   copied to Production at go-live. PDF to the team (D5); CLAUDE.md line
   (D7b); post-commit checklist.

Total about 4.5–5 days (estimate; was 3 before the 2026-10-22 change). Steps 1–2 can start any time; step 3 touches the same
frontend as the Plan vs Actuals Tracking build, so it waits until its screens are
settled.

## 3. Not in this plan (with reasons)

- **Heavier option: one shared source.** The manual's screen sections
  would live in one file that the app shows directly in the `?` drawer and
  that is also printed as the PDF, so the two can never disagree. Adds a
  Markdown display library to the app and about 1 more day. Not chosen
  (D1) because help text (short, per screen) and the manual (task guides
  per role) are written for different moments. The 2026-10-22 change
  (help in a table) is not this option: the manual is still written
  separately.
- **Videos or walkthrough tours:** rejected on 2026-08-01 for a pilot of
  this size; nothing has changed that.
- **Translations:** not requested.

## 4. Business rules and records to update

- None in Business-Rules (no behaviour changes).
- CLAUDE.md "Post-commit checklist" (D7b).
- Backlog entry "Bring the user manual and in-app `?` help up to date":
  replaced by a pointer to this plan; removed when shipped.

## 5. Technical addendum

- **Files:** `docs/UAT-User-Manual.md` (124 lines);
  `sales-os-app/src/utils/helpContent.tsx` (202 lines, keyed by
  `DemoApp.tsx`'s `view` value; `HelpDrawer.tsx` shows `HELP_CONTENT[view]`,
  and the `?` button is hidden when there is no entry — `DemoApp.tsx:581`).
- **Help that exists (8):** `customers`, `customer360`, `projectDetail`,
  `opportunities`, `opportunityDetail`, `nextActions`, `catalog`, `users`.
- **Help missing (14):** `marketingLeads`, `marketingLeadQueue`,
  `insights`, `targetPlanning`, `dailyActivity`, `stagnantDeals`,
  `opportunitiesOnHold`, `productPerformance`, `pipelineReport`,
  `salesReport`, `territories`, `auditLog`, `rateHospitals`,
  `brandTargetTracking`.
- **Coverage test (D7a) — replaced 2026-10-22** by the editor's "no help
  yet" list on the help editor screen
  (`docs/In-App-Help-Editor-Implementation-Plan.md`, which holds the
  table, endpoints and screen design).
- **Wording source:** button labels, tab names and messages taken from the
  screen code, not from design docs (CLAUDE.md, 2026-09-30).
- **PDF:** HTML built from the manual, printed with Chrome headless. Draft
  for review: `Desktop\cabio\` (Basheer, 2026-10-15). The final copy goes
  to the team only after Basheer approves it (folder to confirm at step 5).

## 6. Step 1 inventory (2026-10-15)

Read from the code and git on 2026-10-15. **19 menu screens**
(`DemoApp.tsx` nav lists; Projects is a tab inside Account Management, not
a menu screen). 5 have help; **14 have none**; 3 more help pages cover
pages opened from a record (Customer 360, Opportunity page, Project page),
so **8 to refresh + 14 to write = 22 help pages**. Since the manual was
written (`3cfa132`, 2026-08-01): 169 feature/fix commits, 117 of them
changing screens.

**Who sees which menu (code, `getNavSections`):**
- Sales Rep, Area Manager, SBU Manager: Sales Execution (6) + Product
  Catalog + Reports (6) = 13 screens.
- Admin, General Manager: Sales Execution (6) + Reports (6) +
  Administration (6, Product Catalog moves here) = 18 screens.
- Marketing User: Marketing Leads only.

**Checklist.** "Changes" = feature/fix commits touching that screen's
file since 2026-08-01 (counted by script; one commit can touch several
screens). Main changes are read from commit titles.

| Screen (menu name) | Help | Manual | Changes | Main changes to cover |
|---|---|---|---|---|
| Account Management | refresh | §3 | 5 | zone filter, near-duplicate hospital warning, Projects tab |
| ↳ Customer 360 (page) | refresh | §4 | 19 | one create form, Active-only Opportunities with Show All, WhatsApp number, activity comments |
| ↳ Project page | refresh | §5 | 8 | one create form, editing on the Opportunity page |
| Pipeline | refresh | §6 | 16 | zone filter, High Priority sort, report drill-downs, payment gate |
| ↳ Opportunity page | refresh | §6 | 23 | buyback/accessories, documents, referral credit, gate override, fast-track, splits, High Priority, payment gate, chance ≥ 50 % needs a closure date |
| Marketing Lead Queue | write | — | 4 | convert/discard/reassign, follow-up comments |
| Next Actions | refresh | §7 | 3 | date-range filter, overdue badge, login reminders |
| Insights Dashboard | write | — | 9 | tabs, forecast by product/brand, Target vs Actuals |
| Target & Coverage Planning | write | — | 20 | hospital-wise plans, brand split, approval, Annual view, SBU target box, roster, "plan" wording |
| Product Catalog | refresh | §8 | 6 | Brand/Category/Model lists, collateral links Admin/GM only |
| Daily Activity Report | write | — | 5 | development and relationship activities, manager notes |
| Stagnant Deals | write | — | 1 | — |
| Opportunities On Hold | write | — | 1 | — |
| Product Performance | write | — | 6 | brand drill-down |
| Pipeline Report | write | — | 5 | brand and zone breakdowns, counts, drill-down, Active only |
| Sales Report | write | — | 5 | brand and zone breakdowns, drill-down |
| User Directory | refresh | §9 | 9 | multiple zones, deactivate/reactivate, Marketing User with no SBU |
| Territory Map | write | — | 5 | zone hierarchy, deactivate/reactivate, coverage view |
| Audit Log | write | — | 4 | pages by save |
| Rate Hospitals | write | — | 3 | ratings, ₹0 warning colours |
| Brand Target Tracking | write | — | 5 | vendor target vs team committed |
| Marketing Leads | write | — | 3 | lead entry, follow-up comments |

**Shared parts (manual §1–2, no help page):** 21 commits touch only shared
pieces — Log Activity (relationship-support activity, activity
comments), notifications (assignment, split participant, comments),
login reminders, idle sign-out, landing on Pipeline, Add Hospital zone
rule.

**Step 2 coverage:** Win Probability passed its E2E on 2026-10-15 and is
in the manual. Next-action rules is left out while it is being built
(Basheer, 2026-10-15); add it before the manual is final (D2).

## 7. Agreed help wording (step 3a)

Filled screen by screen as Basheer agrees each one; loaded into the help
table at step 3b. Order (2026-10-22): Sales Rep daily screens first
(Account Management, Customer 360, Pipeline, Opportunity page, Project
page, Next Actions), then the reports, then the Admin screens; Target &
Coverage Planning last (still changing while Annual Target Part 1 is
tested).

_None agreed yet._
