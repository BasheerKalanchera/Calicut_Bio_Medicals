<!-- e2e-template v1: checked on save by .claude/hooks/test_plan_guard.py -->
# In-App Help Editor — Manual E2E Test Plan

**Covers:** `docs/In-App-Help-Editor-Implementation-Plan.md`.
**Built:** not yet built (plan approved 2026-10-22).
**Where:** Dev.

**Written ahead of the build.** The editor screen doesn't exist yet, so
its button labels and messages below come from the plan (D5, D6, D8).
Before the run, Build & Test replaces each with the exact words in the
built code (P6), as the testing checklist requires.

**What this test saves on Dev:** help text for Insights Dashboard (new)
and a one-word change to Pipeline's help, changed back in the same
section. Audit Log entries for these saves stay on Dev permanently.
Insights Dashboard's test help is replaced when the agreed texts load
(plan step 4, section F).

## Checked against live data

Checked read-only on Dev, 2026-10-22, as Admin (Abdul Latheef P), all
three RLS settings set and verified (role Admin, user id set, SBU NULL —
Admin has no SBU by design). Raw output: session scratchpad
`help_e2e_users_out.txt` (session 307018f2).

- **Who sees:** the Help Pages editor: Abdul Latheef P (Admin) and Haroon Sidheeq (General Manager) only. Must NOT see it: Vivek (Sales Staff, Critical Care), Arun Adarsh (Area Manager, Critical Care), Basheer K (SBU Manager, Imaging), Marketing User (Marketing User). The `?` help itself: every signed-in user, on screens that have help.
- **Who can approve:** n/a — nothing in this feature is approved.
- **Who can save:** Admin and General Manager (plan D1): Abdul Latheef P, Haroon Sidheeq. Area Manager, SBU Manager, Sales Staff and Marketing User can't (backend tests cover a direct save attempt; the screens offer no way to try).
- **Existing values:** no help table on Dev yet (Dev at migration `0062`). Today's help (`helpContent.tsx`): 8 pages — Project 360, Account Management, Customer 360, Pipeline, Opportunity Detail, Next Actions, Product Catalog, User Directory; Pipeline's has the only "If you're a Manager" tip. 14 menu screens have none (Insights Dashboard among them).

Button labels, messages and the order of checks are taken from the code,
not the design doc (for the editor, from the built code at P6).

## Figures and sources

- Users and roles above — Dev read-only query, 2026-10-22 (scratchpad
  `help_e2e_users_out.txt`, session 307018f2).
- 8 help pages, their titles, Pipeline's section headings ("Stages",
  "Kanban vs. List view", "Moving deals", "Search", "Filters") and the
  manager tip — `sales-os-app/src/utils/helpContent.tsx`, read 2026-10-22.
- 14 screens with no help; 22 help pages in all — `helpContent.tsx` and
  `DemoApp.tsx` nav lists, read 2026-10-22. Plus 6 pop-up forms = 28
  (help plan D14, Basheer, 2026-10-23).
- Test help text "Test heading" / "Click **Refresh** to reload." / bullets
  "First point", "Second point" / `<b>not bold</b>` — made-up example.
- "Help needs at least one section with a heading and some text." — plan
  D8 (proposed wording; replaced by the built text at P6).

**Tags:** every step starts with `[Simple]` (one click/type/verify-a-value,
Basheer runs it) or `[Complex: <reason>]` (Claude drives: layout shift,
multi-step, cross-screen/cross-role, or a genuine visual check). Saves to
Dev are "Basheer clicks, Claude watches"; Claude reads the record back in
the app.

**Opportunities:** none — no step opens or names an Opportunity.

## Pre-flight

- P1. [Simple] Basheer restarts the Dev backend after the feature's last backend change and confirms it's running. —
- P2. [Simple] Frontend running; a normal window plus a private window, so two people can be signed in at once. —
- P3. [Complex: automated checks] Claude runs `/code-review` (high: new table, access rules, migration) on the feature's commits, fixes findings, then runs full backend pytest, ruff, `npx tsc --noEmit` and `npm run lint`, and reports counts plainly, including failures that existed before. —
- P4. [Complex: read-only DB check] Claude confirms Dev's `alembic current` is the help migration (head) and `docs/Physical-Schema.sql` was regenerated after it. —
- P5. [Complex: read-only DB check] Claude re-runs the user and role check just before step 1 (including the hide-check people) and records any difference from the section above. —
- P6. [Complex: code read] Claude reads the built editor screen and help panel and replaces every planned label and message in this plan with the built wording, noting each change here. —

## A — The `?` help reads the same after the switch

1. [Simple] As Vivek, open **Pipeline**, click **?**. **Expected:** panel title "Pipeline — Help"; sections Stages, Kanban vs. List view, Moving deals, Search, Filters; an "If you're a Manager" box at the bottom. Close it. —
2. [Simple] As Vivek, **Account Management**, Projects tab, open any project, click **?**. **Expected:** title "Project 360 — Help" with sections Project Details, Opportunities, Activity. —
3. [Simple] As Vivek, open **Insights Dashboard**. **Expected:** no **?** button in the header (no help yet). —
4. [Complex: visual check of formatting] As Vivek, **Account Management**, click **?**. Claude checks "**+ Add**" still shows in bold in the Customers Tab section, as before the switch. —

## B — Who sees the editor

5. [Simple] As Haroon Sidheeq, open the menu. **Expected:** **Help Pages** under Administration. —
6. [Simple] As Abdul Latheef P, open the menu. **Expected:** **Help Pages** under Administration. —
7. [Simple] As Vivek, open the menu. **Expected:** no **Help Pages** item and no Administration section. —
8. [Simple] As Arun Adarsh, open the menu. **Expected:** no **Help Pages** item. —
9. [Simple] As Basheer K, open the menu. **Expected:** no **Help Pages** item. —
10. [Simple] As Marketing User, open the menu. **Expected:** only **Marketing Leads**; no **Help Pages**. —

## C — The editor screen

11. [Simple] As Haroon, open **Help Pages**. **Expected:** the screen list has 22 entries, grouped like the menu, with Customer 360, Opportunity page and Project page under their parent screens; 14 marked "No help yet" (Insights Dashboard among them); Pipeline not marked. —
12. [Complex: visual check against the panel] As Haroon, pick **Pipeline**. Claude checks the five sections and the manager tip match the `?` panel from step 1, and the preview looks like that panel. Click **Cancel**; nothing saved. —

## D — Saving help (Basheer clicks, Claude watches)

13. [Complex: multi-step save] As Haroon, pick **Insights Dashboard** (No help yet). **Expected:** its section editor opens, ready for its first help (D5). Title "Insights Dashboard — Help". Add one section: heading "Test heading", text "Click **Refresh** to reload." then two lines "- First point" and "- Second point". Manager tip: "Test manager tip." Check the preview shows Refresh in bold and two bullets. Click **Save**. **Expected:** saved; Insights Dashboard no longer marked "No help yet". —
14. [Complex: cross-role, after reload] As Vivek (private window), reload the app, open **Insights Dashboard**. **Expected:** **?** now shows; the panel reads "Test heading", Refresh in bold, two bullets, and an "If you're a Manager" box with "Test manager tip." —
15. [Complex: safety check] As Haroon, Insights Dashboard help, add to the section text a line `<b>not bold</b>`, **Save**. As Vivek, reload, open its **?**. **Expected:** the line shows exactly as typed, angle brackets included, not in bold. —
16. [Complex: refusal message] As Haroon, Insights Dashboard help, remove every section, click **Save**. **Expected:** refused with "Help needs at least one section with a heading and some text."; the earlier help is unchanged after **Cancel**. —
17. [Complex: two-person edit] As Abdul Latheef P, pick **Pipeline**, in the Search section change one word, **Save**. As Vivek, reload, Pipeline **?**: the changed word shows. Abdul Latheef changes it back, **Save**; Vivek reloads and sees the original. —

## E — Audit Log

18. [Simple] As Haroon, **Audit Log**, open the table filter. **Expected:** "Help Page" is in the list. —
19. [Complex: reading several entries] As Haroon, Audit Log filtered to Help Page. **Expected:** "Added" for Insights Dashboard by Haroon Sidheeq (step 13); "Changed" by Haroon (step 15); two "Changed" for Pipeline by Abdul Latheef P (step 17); nothing for step 16 (refused). —

## F — Agreed texts loaded (plan step 4, after all 28 are agreed)

20. [Complex: read-only DB check] Claude confirms Dev's `alembic current` is the agreed-text migration and the schema doc is regenerated. —
21. [Simple] As Haroon, **Help Pages**. **Expected:** no screen marked "No help yet"; Insights Dashboard shows its agreed text, not the step 13 test text. —
22. [Simple] As Vivek, open **?** on Insights Dashboard, Daily Activity Report and Next Actions. **Expected:** each matches its text in the help plan's section 7. —
23. [Simple] As Marketing User, **Marketing Leads**, click **?**. **Expected:** the Marketing Leads help from section 7. —
24. [Simple] As Vivek, open each of the six pop-ups from where it is used, type a word into its first box, and click the **?** in its title bar: **Log Activity** (**+ Log**, top bar); **Close Next Action** (**Next Actions**, **Mark to complete** on any row); **New Opportunity** (**+ Lead**, top bar); **Edit Opportunity** (any Opportunity's page, **Edit**); **New Stakeholder** (any hospital's page, **Stakeholders** tab, **+ Add**); **New Customer** (**Account Management**, **+ Add**). Close each pop-up with **Cancel** afterwards — nothing is saved. **Expected:** for each, the help opens on top of the pop-up and matches its text in section 7; closing the help leaves the pop-up open with the typed word still there. —
25. [Simple] As Haroon, **Help Pages**. **Expected:** a "Pop-up forms" group lists Log Activity, Close Next Action, Edit Opportunity, New Stakeholder, New Customer and New Opportunity, none marked "No help yet". —
