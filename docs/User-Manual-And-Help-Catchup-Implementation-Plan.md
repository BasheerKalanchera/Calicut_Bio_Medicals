# User Manual and In-App Help Catch-up — Implementation Plan

**Status:** Approved 2026-10-01 (Basheer). Steps 1–2 done 2026-10-15;
manual waiting for Basheer's PDF review. Step 3 (in-app help) follows that
review and also covers the Annual Target Planning Part 1 screens. It
reaches UAT a day or two after the full UAT move, not with it (D15,
Basheer, 2026-10-24; was "with the single full UAT move", 2026-10-21). (Plan vs Actuals Tracking's screens, which step 3 waited for,
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
  other — Basheer, 2026-10-22. **Count widened to 28 by D14, 30 by
  D16.**
- D14. **Help for the six most-used pop-up forms**, each with its own `?`:
  Log Activity, Close Next Action, Edit Opportunity, New Stakeholder,
  New Customer (the add-hospital form) and New Opportunity. Chosen from
  the UAT usage analysis of 4–10 Oct (Progress-Archive-2026-10, 11 Oct
  entry: hospital search → hospital page → log a visit, finish a next
  action, open and edit an Opportunity, add a contact, add a hospital).
  New Opportunity added although not in that analysis's findings: it is
  opened from four places (**+ Lead**, a hospital's and a project's
  Opportunities tab, **Convert** on a marketing lead). Help pages go
  from 22 to 28; the help editor lists the six as a "Pop-up forms" group
  (help editor plan D5, D9b) — Basheer, 2026-10-23. **Widened to eight
  by D16.**
- D15. **The UAT move no longer waits for the manual or help.** The full
  move goes as soon as the Annual Target Planning Part 1 E2E finishes;
  the manual PDF and the in-app help follow a day or two later, in their
  own move once the help editor is built ("no one is looking at the help
  at the moment"). Changes the 2026-10-21 line in Status and step 5 —
  Basheer, 2026-10-24
- D16. **Three separate pop-ups: Close Next Action, Why this change? and
  First activity — each gets its own help.** "Close Next Action" opens
  from **Mark to complete** or from Log Activity, "Why this change?" on
  Save after a stage or status change, and "First activity" on Create in
  New Opportunity. Each has its own purpose and button, so each gets its
  own help and `?`. Pop-up forms go from six to eight, help pages from
  28 to 30; replaces the help editor plan's "`?` in Close Next Action
  mode only" — Basheer, 2026-10-25. For Build & Test: all three are
  built from the same code file (`CloseReminderModal.tsx`), so each of
  its three modes needs its own help key.

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
     read the screen's code, draft its help (refresh 8, write 14, plus
     the 8 pop-up forms of D14 and D16), review it beside that screen's manual
     section and fix both. Agreed text is kept in section 7 of this plan
     until 3b can load it.
     *Docs-batch commits.*
   - **3b. Help table and editor (Build & Test, about 1.5–2 days,
     estimate).** Its own plan and test plan:
     `docs/In-App-Help-Editor-Implementation-Plan.md`; it loads section
     7's text once all 30 are agreed (its step 4; 22 before D14, 28
     before D16).
4. **Review and test (half a day).** `/code-review` (medium); short manual
   E2E: open `?` on every screen as each role; edit a help page as Admin
   and as General Manager, check the Audit Log entry, and check another
   role can't edit (Simple steps, Basheer).
5. **Ship to UAT a day or two after the full move (D15).** Help content
   loaded into UAT in its own move — after that, UAT's copy is the one that matters, and it is
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
so **8 to refresh + 14 to write = 22 help pages** (28 with D14's six
pop-up forms, 2026-10-23; 30 with D16's eight, 2026-10-25). Since the manual was
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
tested). The eight pop-up forms of D14 and D16 join the Sales Rep daily
group, most used first: Log Activity, Close Next Action, Why this
change?, First activity, New Opportunity, Edit Opportunity, New
Stakeholder, New Customer.

Format: help editor plan D2 (headings, **bold**, bullets) and D4
(optional manager box). Every screen's help opens with a short **What
this page is for** paragraph — why the screen exists — before the
sections on its buttons (Basheer, 2026-10-22). Each entry gives its help
key, the date Basheer agreed it, and the manual section checked beside
it.

### Account Management (`customers`) — agreed 2026-10-22 (Basheer)

Manual checked: A2 "Add a new hospital" (fixed the same day) and Part B
"Account Management". Manager box: none.

**Title:** Account Management — Help

**What this page is for**
Your list of the hospitals and projects you work with. Start here to
find a hospital and open its page, to add a hospital Cabio hasn't dealt
with before, or to see the tenders and building projects under way.
(Added 2026-10-22 under the opening-paragraph rule; shown to Basheer the
same day.)

**Customers tab**
- Lists every hospital you can see. Click a hospital to open its page.
- Type in **Search customers...** to find a hospital by name. The list
  updates as you type.
- Pick a zone from **All Zones** to see only that zone's hospitals.
- The tags under each name show its zone, parent hospital, payer
  behaviour and customer type.

**Add a hospital**
- Click **+ Add**. Fill in **Name** and **Zone**; your own zone is filled
  in for you. Parent Customer, Payer Behavior and Customer Type are
  optional. Click **Create**.
- When it's saved, the new hospital's page opens straight away, so you
  can add an Opportunity or log a visit.
- If a hospital with a similar name already exists, the form asks "Did
  you mean …?". Click **Use this one instead** to open the existing
  hospital. Use **Create Anyway** only if it really is a different
  hospital.
- If you have no territory yet, the form won't open. Ask your manager to
  set one up for you.

**Projects tab**
- Tenders and building projects at hospitals. Each one shows its
  hospital, status and owner.
- Search by project name or hospital name in **Search by project or
  hospital...**.
- **+ Add** creates a project: Account, Name, Status and Owner, plus an
  optional Bid Submission Date. Click a project to see its Opportunities
  and add one.

Sources (2026-10-22): `DemoApp.tsx:641–700`,
`CustomerDirectoryScreen.tsx:92–152`, `AddHospitalModal.tsx:102–128,
215–313`, `ProjectDirectoryScreen.tsx:316–330, 430, 546–584`.

### Customer 360 (`customer360`) — agreed 2026-10-22 (Basheer)

Manual checked: Part B "A hospital's page (Customer 360)" (fixed the
same day: Change Anyway, ↻ Refresh, Different WhatsApp number?,
Reactivation Overdue). Manager box: none (Admin/GM-only Business
Potential notes covered under Overview).

**Title:** Customer 360 — Help

**What this page is for**
This is everything Cabio knows about one hospital, in one place. It
shows who you deal with there and what they think of us, what you've
done at the hospital, the tenders and projects it has, every
Opportunity with it, and the equipment already installed, both ours and
competitors'. Check it before a visit or call to catch up quickly, and
update it afterwards so the next person sees the full picture.

**Top of the page**
- The hospital's name, zone, payment behaviour and Business Potential,
  then counts of Stakeholders, Projects and Opportunities. Use the back
  arrow to return to where you came from.

**Overview**
- The hospital's details: zone, Payer Behavior, Business Potential,
  Customer Type and Parent Customer. If it has branches, they're listed
  under **Child Accounts**. Click a parent or branch name to open its
  page.
- **Edit** changes the name, zone, parent, payer behaviour and customer
  type. If the new name looks like a hospital already in the directory,
  you'll see "Did you mean …?". Click **Use this one instead** to open
  that hospital. Use **Change Anyway** only if it really is a different
  hospital.
- Admin and GM set Business Potential on Rate Hospitals. You can't
  change it here.

**Activity**
- Everything logged at this hospital, newest first. **+ Log** adds an
  entry, and **↻ Refresh** reloads the list.
- Under each entry, open **Comments** to read the discussion, or **Add
  comment** to reply.

**Stakeholders**
- The hospital's contacts, each with designation, phone, email,
  sentiment (Promoter, Neutral, Detractor) and NPS score (-100 to 100).
- **+ Add** adds a contact. Tick **Different WhatsApp number?** only if
  their WhatsApp number isn't their phone number. **Edit** changes a
  contact.
- The **N Opportunities** button lists the Opportunities this contact is
  linked to. Click one to open it.

**Projects**
- The hospital's tenders and building projects, each with status, owner
  and bid date. **+ Add** creates one, **Edit** changes one, and clicking
  a project opens it.

**Opportunities**
- Shows Active Opportunities first. **Show All** adds On Hold, Won and
  Lost; **Show Active Only** goes back.
- Each one shows stage, status, owner, chance of winning (Win %) and
  value. A red **Reactivation Overdue** tag means an On Hold Opportunity
  has passed its date to restart.
- **+ Add** opens the New Opportunity form with this hospital already
  filled in. Click an Opportunity, or its **Edit**, to open its page;
  changes are made there.

**Installed Base**
- Equipment already at the hospital. **+ Add** records one: pick our
  product, or tick **Competitor Equipment** and type its name.
  Department and Installation Date are optional. Competitor equipment is
  marked **COMPETITOR**. Useful for spotting upgrade and service leads.

Sources (2026-10-22): `Customer360Screen.tsx:83–88, 162–262, 264–417,
475–556, 559–612, 924–978, 996–1000, 1106–1143, 1347–1354`;
`ActivityTimeline.tsx:240–262`; `ActivityCommentThread.tsx:123–176`.

### Pipeline (`opportunities`) — agreed 2026-10-23 (Basheer)

Manual checked: Part B "Pipeline" (fixed the same day: Kanban/List
switch, Won/Lost/On Hold shown too, listing order, back arrow). Replaces
the old help, which wrongly said cards can be dragged between columns,
listed 7 stages (Payment Pending missing) and named stage and closing-date
filters that don't exist.

**Title:** Pipeline — Help

**What this page is for**
This page lists all your Opportunities and shows which stage each one
has reached. Use it to see which Opportunities are moving forward and
which are stuck.

You see:
- your own Opportunities
- Opportunities where you share the sale with a colleague
- your team's Opportunities, if you are a manager

To change an Opportunity, click it to open its page.

**Kanban and List**
- **Kanban** (the usual view): one column per stage, in order: Lead,
  Qualified, Demo, Clinical Evaluation, Negotiation, Order, Delivery &
  Installation, Payment Pending. The number beside each stage is how
  many Opportunities are in it.
- The stage buttons along the top jump to that column — handy on a
  phone.
- **List**: every Opportunity as one row, with its stage as a tag.
  Easier for scanning a long list.
- In both, High Priority Opportunities come first, then the ones with
  the highest chance of winning.

**What each card shows**
- The Opportunity name, hospital, status (Active, On Hold, Won or Lost),
  value in Lakhs and owner.
- **High Priority**: every Opportunity past the Demo stage, or one
  marked High Priority by hand.
- **Reactivation Overdue**: an On Hold Opportunity has passed its date
  to restart.
- Click a card to open the Opportunity's page.

**Search and filters**
- Type in **Search by opportunity or hospital...** to narrow the list as
  you type. **×** clears it.
- **All Owners**: pick a person to see only their Opportunities. People
  who have left are under **Inactive Owners**, so their Opportunities
  can still be found.
- **All Zones**: pick a zone to see only that zone, including the areas
  within it.

**Arriving from a report**
- Clicking a bar or figure on a report opens Pipeline showing only those
  Opportunities. A **Showing: …** line says what is shown and how many.
- **Clear filter** shows everything again; the back arrow returns to the
  report.

**Manager box:** Leave the owner on **All Owners** to see your whole
team's Opportunities, or pick one person to review theirs before a
one-to-one.

Sources (2026-10-23): `OpportunityPipelineScreen.tsx:81–155, 193–264,
399–480, 491–580`; `DemoApp.tsx:726–750`; `opportunity/repository.py:164–279`
(no status filter; High Priority then win probability, BR-OP-15).

### Log Activity pop-up (`popup_logActivity`, key name settled at build — help editor plan) — agreed 2026-10-25 (Basheer)

Manual checked: Part A "Log what you did" (fixed the same day, rewritten
as short paragraphs: Opportunity picker, logging for a colleague, open
next action, training and events, Relationship Support). Manager box:
Manager Note. Found while checking: any role can pick Manager Note —
Backlog "Log Activity: Manager Note for managers only" (Basheer: change
the code); this help assumes the fix.

**Title:** Log Activity — Help

**What this form is for**
Use it to record each contact with a customer: a visit, call, email or
meeting. Write down what happened and what you'll do next. Your manager
and colleagues read these records, and the next person to deal with the
hospital starts from them. You can also record training and events you
attended, help you gave a colleague on their Opportunity, or a note to
someone in your team.

**Details tab**
- **Select account**: the hospital. It's filled in for you when you open
  the form from a hospital's page or an Opportunity's page.
- **Type**: Visit, Call, Email, Meeting or Note for work with a customer.
  The other types are explained below.
- **Date & Time**: when it happened. It starts at the current time;
  change it if you're logging something from earlier.
- The box below Date & Time is who the activity is for. Leave it on
  **Me** unless you're logging for a colleague.
- **Opportunity (optional)**: link the activity to one of the hospital's
  Opportunities, or leave it on **None — hospital-level**. When you open
  the form from an Opportunity's page, it says **Linked to this
  opportunity** instead.
- **Notes**: what was discussed and what was agreed.

**Next Action tab**
- Visit, Call, Email, Meeting and Note all need a next action: what
  you'll do next, and by when.
- **Next Action**: for example, "Call to confirm demo date".
- **Next Action Due Date**: it starts at tomorrow.
- **Assign Next Action To**: leave it on **Me**, or give the next action
  to a colleague.
- It appears in **Next Actions** for whoever it's assigned to.

**If you already have an open next action**
- If you have a next action still open on this Opportunity, the form
  shows it in a yellow box. The button changes to **Close next action**.
- Close that next action and say what happened. You can't log a new
  activity on top of it. The same applies when you're logging for a
  colleague who has an open next action there.

**Training and events**
- Conference/Expo, OEM/Product Training, Certification, Sales Training,
  Seminar/Trade Show and Other Development.
- The hospital is optional and there's no next action. Fill in
  **Outcome/Learning** with what you got out of it. Other Development
  also needs a **Description**.

**Relationship Support**
- For when you helped a colleague's Opportunity, for example by
  introducing them to a contact you know. It doesn't matter which SBU or
  zone the Opportunity is in.
- Pick the hospital, then the **Related Opportunity**, and write a
  **Description** of what you did. There's no next action. It doesn't
  change who owns the Opportunity or who gets credit for the sale.

**Manager box:** To write a note to someone in your team, pick **Manager
Note** as the Type. Choose the person under **This Note Is For**. Tick
**Urgent — notify immediately** to pop it up on their screen; otherwise
they just get a notification. There's no next action.

Sources (2026-10-25): `LogActivityModal.tsx:26–49, 156–173, 196–236,
283–551`; `DemoApp.tsx:944–956`; `activity/service.py:202–209`;
Business-Rules BR-ACT-02, BR-ACT-10, BR-ACT-11.

### Close Next Action pop-up (`popup_closeNextAction`, key name settled at build) — agreed 2026-10-25 (Basheer)

Manual checked: Part A "Finish a next action" (rewritten the same day:
the follow-up is required except on Won/Lost — the old text said "only
if a new task came out of it" — plus Also close and "This visit produced
a new Opportunity"). Manager box: none.

**Title:** Close Next Action — Help

**What this form is for**
A next action is a promise to do something by a date. Close it when
you've done it: say what happened and set the next step. That way every
Opportunity always has one next step planned, and your manager can see
what was done.

**What you're closing**
- The grey box at the top shows the next action and its due date.
- Other open next actions you have on the same Opportunity are listed
  under **Also close**. Tick any you finished in the same visit or call.
- When the form opens from Log Activity with several open, tick at least
  one under **Next actions to close**.

**Details tab**
- **Type**: Visit, Call, Email, Meeting or Note.
- **Date & Time**: when you did it. It starts at the current time.
- **What was done?**: required.

**Follow-up tab**
- Required: every closed next action sets the next one. The box starts
  with the text of the one you're closing; change it to the real next
  step.
- **Due Date** starts at tomorrow. **Assign To** stays on **Me** unless a
  colleague will do it.
- **Won or Lost:** the follow-up is optional; leave it empty to close
  with no follow-up.
- **A next action at a hospital with no Opportunity:** you can tick
  **This visit produced a new Opportunity** instead of setting a
  follow-up. Press **Complete** and fill in the New Opportunity form; the
  next action closes once the Opportunity is saved.

Sources (2026-10-25): `CloseReminderModal.tsx:80–90, 146–168, 333–354,
426–463, 546–614`; `ReminderRow.tsx:98`; `OpportunityDetailScreen.tsx:282–345`
(own rows only).

### Why this change? pop-up (`popup_whyThisChange`, key name settled at build) — agreed 2026-10-25 (Basheer)

Manual checked: Part A, new section "Say why a stage or status changed"
(added the same day; the manual had none). Manager box: none.

**Title:** Why this change? — Help

**What this form is for**
Every stage or status change on an Opportunity needs a reason, so anyone
reading its history knows why it moved. The form appears when you press
**Save** after changing the stage or status.

**What to fill in**
- If you have an open next action on this Opportunity, the change closes
  it. With more than one, pick which under **Next action to close**.
  Write **Why the change?** and set the follow-up.
- If you have none, your reason is saved as a Note, and you set a next
  action now.
- **On Hold:** the follow-up must be due on or before the re-activation
  date.
- **Won or Lost:** the follow-up is optional.
- **Cancel** takes you back to the Edit form; nothing is saved.

Sources (2026-10-25): `OpportunityDetailScreen.tsx:1623–1636, 2092–2100`;
`CloseReminderModal.tsx:189–192, 287–314, 397–425, 602–613`.

### First activity pop-up (`popup_firstActivity`, key name settled at build) — agreed 2026-10-25 (Basheer)

Manual checked: Part A "Create an Opportunity" step 7 (fixed the same
day; it said Create saves at once). Manager box: none.

**Title:** First activity — Help

**What this form is for**
Every new Opportunity starts with the conversation that led to it, and a
next action. The form appears when you press **Create** on the New
Opportunity form.

**What to fill in**
- **Type**, **Date & Time** and **What happened?** (required). When you
  convert a marketing lead, its note is filled in for you.
- **Follow-up:** the next action and its due date, both required. It
  goes to the Opportunity's owner unless you change **Assign To**.
- **Create** saves the Opportunity, this activity and the next action
  together. **Cancel** takes you back to the New Opportunity form with
  nothing saved.

Sources (2026-10-25): `QuickLeadModal.tsx:387–389, 717–728`;
`CloseReminderModal.tsx:316–331, 392–396, 593–604`.

### New Opportunity pop-up (`popup_newOpportunity`, key name settled at build) — agreed 2026-10-25 (Basheer)

Manual checked: Part A "Create an Opportunity" (two lines added the same
day: **+ Add Hospital**, and a Repeat Order lead source skips the demo
dates, and the closing date from Negotiation on — `opportunityStatus.ts:22–28`) and Part D "Create an Opportunity for either SBU".
Manager box: the SBU choice for Admin and General Manager.

**Title:** New Opportunity — Help

**What this form is for**
Use it when a hospital shows real interest in buying something, so the
Opportunity is tracked from the first conversation to the order. The
same form opens from **+ Lead** in the top bar, **+ Add** on a
hospital's Opportunities tab, **+ Add** on a project, and **Convert** on
a marketing lead.

**The basics**
- **Name**: a short name you'll recognise, for example "SonoScape P60
  for radiology".
- **Account**: the hospital. It's already filled and locked if you
  started from a hospital or a project. If the hospital isn't in the app
  yet, use **+ Add Hospital**.
- **Project** (optional): link it to one of the hospital's projects.
- **Stage**: how far along it is. Choosing a stage fills **Win
  Probability %** with that stage's usual chance; you can change it.
- **Owner**: who is responsible for it.
- **Lead Source** (optional): where it came from. For a referral, tick
  **External referrer (not Cabio staff)** and type the name, or leave it
  unticked and pick a colleague.

**Value and products**
- From Qualified onwards, **Indicative Value (Lakhs)** is needed.
- **+ Add Products**, then **Done**. Once products are added, the value
  is worked out for you and shows "(auto)".

**Fields that appear as the stage goes up**
- Demo or later: **Demo Start Date** and **Demo End Date**.
- Negotiation or later: **Expected Closure Date**. It also appears
  earlier if you set the chance to 50 % or more, and then it must be
  filled.
- Order or later: **PO Number** and **PO Date**. PO Date is needed from
  Delivery & Installation onwards and can't be a future date.
- For a **Repeat Order** lead source, the demo dates aren't asked for,
  and from Negotiation onwards nor is the closing date.

**Fast-Track**
Tick **Fast-Track this Opportunity** to skip the demo and closing-date
steps with your manager's approval. Pick **Approved By** (your own
manager or a General Manager) and a **Reason**. The manager you name is
notified.

**After Create**
**Create** opens the **First activity** form: the conversation that led
to this Opportunity and its first next action. **Create** there saves
everything together; **Cancel** takes you back with nothing saved. A new
Opportunity always starts as Active.

**Manager box:** Admins and the General Manager also pick the **SBU**
the Opportunity belongs to. Everyone else creates in their own SBU.

Sources (2026-10-25): `QuickLeadModal.tsx:115, 323–346, 425, 450–663,
715–726`. "SonoScape P60 for radiology" — made-up example.

### Edit Opportunity pop-up (`popup_editOpportunity`, key name settled at build) — agreed 2026-10-25 (Basheer)

Manual checked: Part A "Move an Opportunity forward", "Put an
Opportunity On Hold, or mark it Lost", "Mark an Opportunity Won" — no
gaps. Manager box: none. The form's "this deal is past Demo stage" line
is covered by Backlog "Wording: "deal" → "Opportunity""; the help uses
"Opportunity".

**Title:** Edit Opportunity — Help

**What this form is for**
Keeps an Opportunity up to date as the sale moves: its stage, status,
value, dates and who owns it. Open the Opportunity, **Overview** tab →
**Edit**.

**Stage and Status**
- **Stage** is how far the sale has got; **Status** is whether it is
  Active, On Hold, Won or Lost.
- Changing the stage moves **Win Probability %** to the new stage's
  usual chance, if it was still at the old stage's usual chance. A
  figure you typed yourself is kept.
- **On Hold** needs a **Hold Reason** and a **Reactivation Date** in the
  future.
- **Lost** needs a **Loss Reason**; for "Competitor Won", also the
  **Competitor Name**.
- **Won** comes in two saves: first save it at **Payment Pending** (Won
  is greyed out until then), then set Won, tick **I confirm full
  payment has been received**, and add an optional **Payment Note**.
  Won needs a PO Number and PO Date.
- Won and Lost are final: the Opportunity can't be reopened or its stage
  changed. If the customer comes back, create a new one.

**Why this change?**
When you change the stage or status and press Save, a **Why this
change?** form opens; nothing is saved until you fill it in. **Cancel**
brings you back here.

**Other fields**
- **Name**, **Project**, **Owner** and **Lead Source** can be changed
  any time. For a referral, tick **External referrer (not Cabio staff)**
  and type the name, or leave it unticked and pick a colleague.
- **Indicative Value (₹ Lakhs)** is needed from Qualified onwards. Once
  products are added it is worked out from them and can't be typed.
  Products are changed on the Overview tab, not in this form.
- **High Priority**: tick it to flag the Opportunity, up to the Demo
  stage. After Demo, every Opportunity is high priority automatically.

**Dates and PO**
- **Demo Start Date** and **Demo End Date** from Demo onwards.
- **Expected Closure Date** from Negotiation onwards — or earlier once
  the chance is 50 % or more, and then it must be filled.
- For a **Repeat Order** lead source, the demo dates aren't asked for,
  and from Negotiation onwards nor is the closing date.
- **PO Number** and **PO Date** from Order onwards. PO Date is needed to
  move to Delivery & Installation and to mark Won, and can't be a
  future date.

**Fast-Track**
Tick **Fast-Track this Opportunity** to skip the demo and closing-date
steps with your manager's approval. Pick **Approved By** (the owner's
own manager or a General Manager) and a **Reason**. Unticking it
removes the approval.

Sources (2026-10-25): `OpportunityDetailScreen.tsx:217, 1515–1567,
1624–1635, 1871–2090`; `opportunity/service.py:371`;
`opportunity/validators.py:161`.
