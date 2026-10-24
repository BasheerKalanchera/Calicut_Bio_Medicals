# In-App Help Editor — Implementation Plan

**Status:** Approved 2026-10-22 (Basheer). Not yet built — Build & Test.
Reaches UAT a day or two after the full UAT move, not with it (parent
plan D15, Basheer, 2026-10-24).
**Traceability rows:** none (supports the UAT rollout; step 3b of
`docs/User-Manual-And-Help-Catchup-Implementation-Plan.md`).
**Design / discussion:** that plan's D1 change, 2026-10-22 (help moves out
of the app's code). Test plan: `docs/In-App-Help-Editor-Manual-E2E-Test-Plan.md`.
**Built by:** Build & Test. The help wording itself is written in Plan &
Chore (parent plan step 3a) and loaded at step 4 below.

## Decisions

- D1. **Who edits:** Admin and General Manager, from a new screen in the
  Administration menu. Every other role only reads help in the `?` panel —
  Basheer, 2026-10-22
- D2. **Formatting:** a heading per section, **bold** (for button names,
  as today) and bullet points — nothing more — Basheer, 2026-10-22
- D3. **Record of changes:** every help save is recorded in the existing
  Audit Log (who changed which screen's help, and when) — Basheer,
  2026-10-22
- D4. **"If you're a Manager" box:** kept, as an optional second text box
  per screen; left empty, no box shows — Basheer, 2026-10-22
- D5. **Editor layout:** on the left, the list of screens (grouped like the
  menu, by menu name, with the three record pages — Customer 360,
  Opportunity page, Project page — under their parent screen, and a
  "Pop-up forms" group for the six pop-ups of parent plan D14: Log
  Activity, Close Next Action, Edit Opportunity, New Stakeholder, New
  Customer, New Opportunity, each with its own `?` in its title bar —
  Basheer, 2026-10-23); screens with no help are marked "No help yet". Picking one opens its help on the
  right as a list of sections (a heading box and a text box each), with
  **Add section**, **Remove** and **Move up/down**, the optional manager
  tip, and a live preview of how the `?` panel will look. **Save** and
  **Cancel** at the bottom. Picking a screen marked "No help yet" opens
  the same section editor for that screen, ready to write its first
  help — Basheer, 2026-10-22
- D6. **How formatting is typed:** bold as `**+ Add**` (two stars each
  side), a bullet as a line starting with `- `. A help-box above the text
  boxes shows both. The app draws these itself (no new library); anything
  else shows as plain text, so no web code can be slipped into help —
  Basheer, 2026-10-22
- D7. **What the Audit Log records:** a new screen's help being written
  for the first time (Added), each later save (Changed); shown under a new
  table name "Help Page" in the Audit Log's table filter. Unlike most
  tables (where only changes and removals are logged), the first write is
  logged too, because writing help for a screen with none is the main
  thing Admin will do — Basheer, 2026-10-22
- D8. **No delete:** a screen's help can be edited but not removed, so the
  `?` button can't vanish from a screen by accident. Save is refused when
  every section is empty: "Help needs at least one section with a heading
  and some text." — Basheer, 2026-10-22
- D9. **Starting text, loaded in two goes, both by database updates
  (migrations) so UAT gets them automatically with the move:** (a) with the
  new table, today's 8 help pages are copied in exactly as they read now,
  so no screen loses its help on Dev; (b) once Plan & Chore has agreed all
  28 texts (parent plan section 7; 22 before parent plan D14,
  2026-10-23), a second update replaces those 8 and adds the other 20
  (14 screens and 6 pop-up forms). After the UAT move, help changes are made only on the
  editor screen, never by a database update — Basheer, 2026-10-22
- D10. **When others see an edit:** the next time they open or reload the
  app, not instantly. The editor's own preview and `?` panel update at
  once — Basheer, 2026-10-22
- D11. **Two people editing the same help at once:** the later save wins;
  both saves show in the Audit Log. No locking (two editors in Phase 1) —
  Basheer, 2026-10-22

## Figures and sources

- 8 screens with help today, 14 without, 22 help pages in all —
  `sales-os-app/src/utils/helpContent.tsx` keys and `DemoApp.tsx` nav
  lists, read 2026-10-22; matches parent plan section 6 (2026-10-15).
  Plus 6 pop-up forms = 28 (parent plan D14, Basheer, 2026-10-23). Pop-up
  titles "Log Activity", "Close Next Action", "New Opportunity", "New
  Customer" — `LogActivityModal.tsx:279`, `CloseReminderModal.tsx:387`,
  `QuickLeadModal.tsx:425`, `AddHospitalModal.tsx:215`; "Edit
  Opportunity" — `OpportunityDetailScreen.tsx:1871`; "New Stakeholder" —
  `Customer360Screen.tsx:1268`, read 2026-10-23.
- 19 menu screens + 3 record pages — `DemoApp.tsx` `getNavSections`,
  `MARKETING_NAV_SECTIONS`, `helpViewId` (line 345), read 2026-10-22.
- Only one "If you're a Manager" tip today (Pipeline) —
  `helpContent.tsx:126`, read 2026-10-22.
- Admin and General Manager as the editing roles; the brand table's
  read-for-all, write-for-Admin/GM rules as the pattern —
  `docs/Physical-Schema.sql` (`brand_read`, `brand_insert`,
  `brand_update`), read 2026-10-22.
- Audit triggers log changes and removals, and inserts only on line
  tables — `docs/Physical-Schema.sql` `trg_audit_*`, read 2026-10-22.
- No Markdown library in the app — `sales-os-app/package.json`, checked
  2026-10-22.
- Dev at migration `0062`, no help table yet — Dev read-only query,
  2026-10-22 (scratchpad `help_e2e_users_out.txt`, session 307018f2).
- "Two editors in Phase 1": the active Admin and GM on Dev are Abdul
  Latheef P and Haroon Sidheeq — same Dev query, 2026-10-22.
- Estimate about 1.5–2 days — estimate, not counted (parent plan step 3b);
  about half a day to a day more for the pop-up `?` buttons (D5, parent
  D14) — estimate, not counted, 2026-10-23.
- Example button name `**+ Add**` — `helpContent.tsx` (Account
  Management help).

## 1. In plain terms

Today the `?` help is written inside the app's program code, so changing
a sentence needs a developer and a new release. After this work, the
help lives in the database:

- Admin and General Manager get a new **Help Pages** screen under
  Administration. It lists every screen in the menu, plus the Customer
  360, Opportunity and Project pages and the six most-used pop-up forms
  (such as Log Activity and New Opportunity), and marks the ones with no
  help yet. Those six pop-ups gain their own `?` button.
  They pick a screen, change its sections, see a preview, and save.
- Everyone else sees no change except better help: the `?` button looks
  and opens the same way. Once a screen has help, its `?` appears; a
  screen with no help has no `?`, as today.
- Every save shows in the Audit Log, with who changed which screen's help.
- The user manual (PDF) is not affected; it stays a separate document.

**Environments:** built and tested on Dev. The table, today's 8 help
pages and the 28 agreed texts all reach UAT with the full UAT move (the
database updates run there as part of it). From then on, UAT's help is the
copy that matters; at Production go-live it is copied across from UAT
(`docs/Deployment-Topology.md` to gain that line at step 5).

## 2. Build order

1. **Table, starting text, read and save (backend).** New help table
   with the Admin/GM-only save rule; database update (a) copies today's 8
   help pages in (D9a); read endpoint for every signed-in user, save
   endpoint for Admin/GM (D1, D8); Audit Log trigger (D7); backend tests.
   Basheer runs the database update on Dev himself (command given at the
   time). *Checkpoint commit.* Nothing changes on screen yet: the `?`
   panel still reads the code file.
2. **`?` panel reads the table; editor screen (frontend).** The `?`
   button and panel read from the table (D10); the code file
   `helpContent.tsx` is removed; new **Help Pages** screen (D5, D6); "Help
   Page" added to the Audit Log filter (D7). tsc, lint, frontend tests.
   *Checkpoint commit.* On Dev, help reads exactly as today, now from the
   table. Nothing stops working between steps 1 and 2.
3. **Pre-E2E review and E2E** (`cabio-e2e-testing`): `/code-review`
   (high — new table, access rules, migration), then the test plan's
   sections A–E.
4. **Agreed texts loaded.** When parent plan section 7 holds all 28
   agreed texts: database update (b) (D9b); Basheer runs it on Dev; test
   plan section F. *Commit.*
5. **Ships with the full UAT move** (parent plan step 5): both database
   updates run on UAT; post-commit checklist.

Steps 1–3 don't wait for the wording; step 4 does.

## 3. What could be affected

Code search 2026-10-22 for `HELP_CONTENT`, `helpContent` and `HelpDrawer`:

- (a) Screens that request it: the header `?` button and the help panel
  in `DemoApp.tsx` (lines 588 and 958), shown on every screen through
  `helpViewId`. Check before and after: `?` on Pipeline (has help, with
  the manager tip), Account Management Projects tab (shows the Project
  page help), Insights Dashboard (no help, no `?`).
- (a2) The six pop-up forms of parent plan D14 (2026-10-23), each gaining
  a `?` in its title bar: Log Activity (`LogActivityModal.tsx`, from the
  top bar, a hospital's page and an Opportunity's page), Close Next
  Action (`CloseReminderModal.tsx`, from Next Actions and an
  Opportunity's page; also used as "First activity" and "Why this
  change?"), New Opportunity (`QuickLeadModal.tsx`, from **+ Lead**, a
  hospital's and a project's Opportunities tab, and **Convert** on a
  marketing lead), Edit Opportunity (`OpportunityDetailScreen.tsx`), New
  Stakeholder (`Customer360Screen.tsx`), New Customer
  (`AddHospitalModal.tsx`, from Account Management and inside New
  Opportunity). Check before and after: each opens, saves and cancels
  exactly as today; New Customer opened from inside New Opportunity
  (a pop-up on a pop-up) still shows its own `?`.
- (b) Reports or links that open those screens with a filter: none — the
  help panel isn't opened by a link; it reads whichever screen is showing.
- (c) Other screens that reuse it: none besides the Audit Log, which gains
  one table name ("Help Page"); its other filters are untouched. Check
  before and after: the Audit Log table filter list.

## 4. Not in this plan (with reasons)

- **Joining the Reference Data screen**
  (`docs/Reference-Data-Management-Screen-Implementation-Plan.md`, draft):
  that screen edits short label lists (Hold Reasons, Lead Sources); help
  pages are long formatted text with sections, so they get their own
  screen.
- **Help per role** (different text for a rep and a manager): the manager
  tip (D4) covers what's needed today.
- **Version history with "restore"**: the Audit Log keeps every earlier
  version (D3); restoring is done by copying the old text back.
- **Images or links in help**: D2; screenshots were rejected in the
  parent plan (D6) because they go stale.

## 5. Business rules and records to update

- Business-Rules: none (no sales behaviour changes).
- `docs/Physical-Schema.sql` regenerated after each database update.
- Frontend Standards §9 or the screen list: new screen
  `HelpPagesScreen.tsx` (MUI from the start).
- `docs/Deployment-Topology.md`: one line at step 5 — help is copied from
  UAT to Production at go-live (D9).
- Parent plan: D7a already replaced by the "No help yet" list (D5).

## 6. Technical addendum

- **Table** `help_page` (name to confirm against Standards §3 at build):
  `id` uuid PK; `view_id` varchar(50) unique not null (matches
  `DemoApp.tsx` `view` / `helpViewId`); `title` varchar(100) not null;
  `sections` jsonb not null — `[{heading, body}]`, body in the D6 subset;
  `manager_note` text null (D4); audit fields mixin (`created_at`,
  `updated_at`, `created_by`, `updated_by`). Not SBU-scoped.
- **RLS:** mirror `brand`: `help_page_read` FOR SELECT USING (true);
  `help_page_insert` / `help_page_update` WITH CHECK
  `cabio_app_role_name() IN ('Admin','General Manager')`; no DELETE
  policy (D8).
- **Audit:** `trg_audit_help_page AFTER INSERT OR UPDATE OR DELETE` →
  `audit_log_row_change()` (D7). Check the Audit Log's save grouping
  (0059, `audit/repository.py`) shows a single-row insert as one "Added"
  save. Add `{ value: "help_page", label: "Help Page" }` to
  `AuditLogScreen.tsx` `TABLE_OPTIONS`.
- **Migrations:** (a) `0063_help_page` — table, policies, trigger, and
  today's 8 entries converted from `helpContent.tsx` JSX to the D6 subset
  (`<strong>` → `**…**`); (b) `00NN_help_page_agreed_text` — upsert of all
  28 from parent plan section 7 (D9b). Use the next free number at the
  time; Annual Target Part 2 may take 0063 first.
- **Backend:** small domain (`help`, or inside `reference` — Standards §2
  Domain Boundaries decides). `GET /api/v1/help-pages` (all signed-in
  roles; returns every row, small); `PUT /api/v1/help-pages/{view_id}`
  (Admin/GM, service-layer role check as `AuditLogService._require_admin`
  plus RLS; upsert; D8 validation; title ≤100, heading ≤100, body ≤2000
  characters, ≤12 sections — limits to confirm at build).
- **Frontend:** `useQuery(['helpPages'])` loaded once after sign-in
  (D10); `DemoApp.tsx` shows `?` when `helpPages[helpViewId]` exists;
  `HelpDrawer.tsx` takes the row and renders the D6 subset with a small
  formatter (React elements only, no `dangerouslySetInnerHTML`).
  `HelpPagesScreen.tsx` under Administration (`getNavSections` admin
  list), `useMutation` + invalidate `['helpPages']`. The screen list for
  "No help yet" comes from the nav lists (exported constant) plus
  `customer360`, `opportunityDetail`, `projectDetail`, plus the six
  pop-up keys (D5; e.g. `popup_logActivity` — names to settle at build,
  ≤50 chars for `view_id`). Pop-up `?`: a small button in each of the six
  forms' title bars opening `HelpDrawer` with that key; check the drawer
  shows above the open pop-up (z-index). `CloseReminderModal` has three
  titles (`CloseReminderModal.tsx:387`) — show its `?` in "Close Next
  Action" mode only, unless Basheer says otherwise at build. Delete
  `utils/helpContent.tsx`.
- **Tests:** backend — read as Sales Staff; save as Admin and as GM;
  refused as Area Manager, Sales Staff and Marketing User (service and
  RLS); empty-sections refusal; upsert creates then updates; audit row
  written for insert and update; `test_persistence.py` counts. Frontend —
  formatter (bold, bullets, plain text for anything else, no HTML
  passes through); every nav id is in the editor's screen list.
