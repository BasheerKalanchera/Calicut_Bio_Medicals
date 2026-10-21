# Cabio Sales OS — User Manual

**For:** the UAT release after the October 2026 move. Written from the Dev
build of 15 October 2026 (User Manual and Help Catch-up plan, step 2);
targets updated 21 October 2026 for Annual Target Planning Part 1.
**Status:** draft for Basheer's review (plan decision D8); goes out as a PDF
with the UAT move (D5).

How to read this manual: find your role in Part A and follow the "How do
I…" steps. Part B describes each screen in the menu, in menu order. Button
and field names are shown in **bold**, exactly as they appear on screen.

---

## Contents

- Part A — How do I…
  - A1. Everyone: signing in, the menu, the top bar
  - A2. Sales Representative
  - A3. Area Manager and SBU Manager
  - A4. Admin and General Manager
  - A5. Marketing User
- Part B — Screen by screen
- Part C — Rules the app enforces

---

# Part A — How do I…

## A1. Everyone

### Sign in and sign out
- Sign in with your Cabio email and password.
- If you leave the app idle, it signs you out and shows "You were signed out
  due to inactivity. Sign in again to continue."
- **Sign Out** is at the top right.

### Find your way around
- **☰** (top left) opens the menu. The card at its top shows who you are
  signed in as, your role and zone, and your SBU.
- The menu has groups. **REPORTS** and **ADMINISTRATION** start folded;
  click the heading to open them.
- **?** (top right) opens help for the screen you are on. It appears only
  on screens that have a help page.

### The top bar
- **+ Lead** (green) opens the **New Opportunity** form from anywhere.
- **+ Log** opens **Log Activity** from anywhere.
- The bell shows your notifications. An urgent one (for example an urgent
  manager note) pops up on screen with **Dismiss** and **Review**.

### When you sign in
If you have next actions due today or overdue, a reminder box appears.
**Review** opens Next Actions showing everything due by the end of today;
**Dismiss** closes the box.

---

## A2. Sales Representative

Your menu: Account Management, Pipeline, Marketing Lead Queue, Next
Actions, Insights Dashboard, Target & Coverage Planning, Product Catalog,
and the six reports.

### Add a new hospital
1. Account Management → **Customers** → **+ Add** (or **+ Add Hospital**
   inside the New Opportunity form).
2. Fill **Name** and **Zone**. Parent Customer, Payer Behavior and Customer
   Type are optional.
3. **Create**.
- If a hospital with a similar name already exists, the form shows "Did
  you mean … ? It's already in the directory." Click **Use this one
  instead** rather than creating a second copy.

### Create an Opportunity
Every way of creating an Opportunity opens the same **New Opportunity**
form: **+ Lead** in the top bar, **+ Add** on a hospital's Opportunities
tab, **+ Add** on a project, or **Convert** on a marketing lead.

1. Fill **Name**, **Account** (already filled and locked if you started
   from a hospital or project), **Stage** and **Owner**.
2. Choosing a stage fills **Win Probability %** with that stage's usual
   chance (Lead 5 %, Qualified 20 %, Demo 35 %, Clinical Evaluation 55 %,
   Negotiation 70 %, Order 90 %, Delivery & Installation 95 %, Payment
   Pending 98 %). You can change it.
3. From Qualified onwards, **Indicative Value (Lakhs)** is required. Once
   you add products it is calculated for you and shows "(auto)".
4. More fields appear as the stage goes up:
   - Demo or later: **Demo Start Date** and **Demo End Date**.
   - Negotiation or later: **Expected Closure Date**.
   - Order or later: **PO Number** and **PO Date**. PO Date is required
     from Delivery & Installation onwards and can't be a future date.
5. If you set **Win Probability** to 50 % or more before Negotiation, the
   **Expected Closure Date** box appears and must be filled. A high chance
   without a closing date is refused with: "Win Probability is 50% or more
   but there's no expected closure date - add one."
6. Optional: **Project**, **Lead Source**, products (**+ Add Products**,
   then **Done**).
   - If Lead Source is a referral, tick **External referrer (not Cabio
     staff)** and type the name, or leave it unticked and pick a colleague.
7. **Create**. A new Opportunity always starts as Active.

### Skip the demo or closing date with your manager's approval (Fast-Track)
Tick **Fast-Track this Opportunity** (in the create or edit form).
1. **Approved By**: your own manager, or a General Manager.
2. **Reason** (required once an approver is named) and an optional
   **Note**.
- The Demo and Expected Closure Date steps are then not required. PO
  Number, PO Date, products and payment are still required later.
- The manager you name gets a notification.

### Move an Opportunity forward
1. Open it (Pipeline, or the hospital's Opportunities tab).
2. **Overview** tab → **Edit** → change **Stage** → **Save**.
- If your Win Probability is still the old stage's usual figure, it moves
  to the new stage's figure. If you typed your own figure, it is kept.
- The app checks each stage's requirements on save (see Part C).

### Put an Opportunity On Hold, or mark it Lost
In **Edit**, change **Status**.
- **On Hold** needs a **Hold Reason** and a **Reactivation Date** in the
  future. When that date arrives, the Opportunity shows "Reactivation
  Overdue".
- **Lost** needs a **Loss Reason**; if the reason is "Competitor Won", also
  **Competitor Name**.
- Won and Lost are final: such an Opportunity can't be reopened. If the
  customer comes back, create a new one.

### Mark an Opportunity Won
1. Move it to **Payment Pending** and **Save** — this says delivery and
   installation are done.
2. **Edit** again, set **Status** to **Won**, tick **I confirm full payment
   has been received**, add an optional **Payment Note**, **Save**.
- Won needs PO Number, PO Date and products.
- Won is greyed out ("save at Payment Pending first") until the
  Opportunity has been saved at Payment Pending.
- Part payment or an advance does not count.

### Log what you did
1. **+ Log** (top bar), or **+ Log** on an Opportunity's or hospital's
   Activity tab.
2. **Details**: **Type**, **Date & Time**, and Notes. Pick the hospital if
   it isn't already filled.
3. **Next Action**: **Next Action**, **Next Action Due Date**, and
   optionally **Assign Next Action To** someone else. Required for Visit,
   Call, Email, Meeting and Note.
4. **Log**.
- Training and event types (Conference/Expo, OEM/Product Training,
  Certification, Sales Training, Seminar/Trade Show, Other Development):
  hospital optional, **Outcome/Learning** required, no next action. Other
  Development also needs a **Description**.
- **Relationship Support** (helping a colleague's Opportunity): pick the
  **Related Opportunity** and fill **Description**; no next action.

### Finish a next action
1. **Next Actions** → **Pending**.
2. **Mark to complete** on the row.
3. Fill **Type**, **Date & Time** and **What was done?**. Add a
   **Follow-up** with a **Due Date** only if a new task came out of it.
4. **Complete**.

### Make your quarterly plan
**My Plan** shows **Your target for** the quarter (e.g. Oct–Dec 2026), set
by your manager — or **Not set yet**. Your plan is how you mean to reach it.
1. **Target & Coverage Planning** → **Quarterly** → **My Plan**.
2. **Plan** next to your SBU (or **Continue** for a draft, **Revise** for a
   submitted one).
3. Add hospitals from your area (**Hospitals**), with Visits, Amount (₹
   Lakhs) and an optional Objective for each.
4. **Split by Brand**: how the amount divides across brands.
5. **Save draft** (only you can see it) or **Submit for approval**.
- Revising an approved or rejected plan asks **Why did the plan change?**
  and sends it back to your manager.
- If a colleague in your SBU has also planned one of your hospitals for the
  quarter, you are told who. You may both keep it.

### See how you are doing
**Insights Dashboard** → **Target vs Actuals** (your plan against what you
have received and won) and **Pipeline** (your open Opportunities by stage,
product and so on).

### Work a marketing lead
**Marketing Lead Queue** lists leads assigned to you.
- **Convert** opens the New Opportunity form with the lead's details in a
  green box.
- **Discard** needs a **Reason** (Duplicate, Not interested, Unable to
  contact, Junk).
- **Reassign** passes it to another rep.

---

## A3. Area Manager and SBU Manager

Everything in A2, plus:

### Approve or reject your team's plans
**Target & Coverage Planning** → **Needs Your Approval** → **Approve** or
**Reject** (with an optional note). A revised plan shows **Revised** and
the rep's reason.

### See the team's plans
On **Target & Coverage Planning**, **SBU Target & Plans** shows every
plan in your scope. **Annual** shows the four quarters added up. An SBU
Manager also sees the **SBU target** for the quarter: the total of the
SBU's brand targets, read-only. An Area Manager doesn't; they see their own
target (**Your target for** the quarter, set by the person they report to).

### Divide your target among your team
**Target & Coverage Planning** → **Quarterly** → **SBU Target & Plans** →
**Team targets** → **Set target** (or **Change**) next to a person → amount
in ₹ Lakhs → **Save**. One figure per person who reports to you. While the
figures don't add up to your own target, a warning shows how far short or
over they are; you can still save. You can't set your own target.

### Watch the team
**Insights Dashboard** has two extra tabs for you: **Team Activity** (last
30 days) and **Overdue Actions**. **Target vs Actuals** shows your team.
**Daily Activity Report** shows any day's activity, for **All Team
Members** or one person.

### Approve a Fast-Track
You get a notification when a rep names you under **Approved By**. Nothing
waits for you; the notification is for your awareness.

### Write a note to a rep
**+ Log** → Type **Manager Note** → **This Note Is For** (the rep). Tick
**Urgent — notify immediately** to pop it up on their screen.

### Team marketing leads
**Marketing Lead Queue** also shows **Team Marketing Leads**.

---

## A4. Admin and General Manager

Your menu has no Marketing Lead Queue or Next Actions; it adds the
**ADMINISTRATION** group.

### Set brand targets
**Brand Target Tracking** → pick the year (◀ ▶) and the SBU.
1. **Seasonal pattern for** the year: how the SBU's year is shared across
   **Jan–Mar**, **Apr–Jun**, **Jul–Sep** and **Oct–Dec** (adding up to
   100 %) → **Save pattern**. Set it before entering brand targets for that
   year.
2. **Set target** (or **Revise**) next to a brand → **Year starts in**
   (January, April, July or October; can't be changed once the brand has a
   yearly figure) → **Brand's own yearly figure (₹ Lakhs)** → **Stretch
   (%)** (the stretched target shows below it) → tick **This brand has its
   own seasonal pattern** only if it differs → **Save**.
- The stretched target is spread over the brand's four quarters and saved
  as its quarterly targets. Open a brand (▸) to see each quarter's
  **Target**, **Team committed** (from submitted plans) and **Gap**.
- Changing a figure, stretch or pattern later changes only the quarter in
  progress and later ones; quarters already ended keep their targets.
  Changing the SBU's pattern also changes every brand that follows it.
- The SBU's target for a quarter is the total of its brands' targets; it
  can't be typed. Target vs Actuals measures the SBU's Won against it.

### Divide the SBU target
**Target & Coverage Planning** → **Quarterly** → **SBU Target & Plans** →
pick the SBU → **Team targets**: one figure for each person at the top of
the SBU (today the Area Managers), against the SBU target.

### Create an Opportunity for either SBU
In the New Opportunity form you must choose the **SBU**. Other roles always
create in their own SBU.

### Manage users
**User Directory** → **Add User**: **Supabase User UUID** (from the
Supabase sign-in dashboard), **Display Name**, **Role**, **SBU**, zones
(**+ Add another zone**) and **Manager** → save. **Deactivate** removes
access.
- A user's SBU can't be changed while they still own open Opportunities in
  another SBU; the app names them so you can reassign them first.

### Manage zones
**Territory Map** → **Add Zone** or, on a zone, **Add child zone**, **Edit
zone**, **Deactivate**. **Refresh Territory Visibility** updates who can
see what after zone changes.

### Rate hospitals
**Rate Hospitals** → set each hospital's **Business Potential** (High,
Medium, Low, or Not rated) and **Why this rating?**. The notes are visible
only to Admin and GM.

### Maintain the product catalogue
**Product Catalog** → **+ Add** → SBU, Brand, Model, Category (set from the
model), Product Type (New Equipment, Refurbished, Accessory) → save. Open a
product to **Edit** it or add **Collateral Links** (brochure, video, image).
Only Admin and GM can change the catalogue; everyone can view it.

### Check who changed what
**Audit Log** → filter by table, by **Changed by**, and by Added / Changed
/ Removed.

---

## A5. Marketing User

Your only screen is **Marketing Leads**.
1. **+ New Marketing Lead**.
2. **SBU**, **Lead Source**, **Assign To** (a rep). Optional: Account (if
   the hospital isn't listed, leave it blank and describe it in the note),
   **Event Name**, **Product (if known)**, **Note**.
3. **Create**. The rep sees it in their Marketing Lead Queue.
- Each lead has a **Comments** thread for back-and-forth with the rep.

---

# Part B — Screen by screen

Each screen in menu order: what it is for and what you can do there.
Part A has the step-by-step instructions.

## Account Management

Your list of hospitals and projects. Two tabs:
- **Customers**: every hospital you can see. Search by name, or pick a
  zone from **All Zones**. Click a hospital to open its page. **+ Add**
  adds a new hospital.
- **Projects**: tenders and building projects at hospitals. Search by
  project or hospital. **+ Add** creates one (Name, Account, Status, Owner,
  optional Bid Submission Date). Open a project to see its Opportunities
  and add one.

## A hospital's page (Customer 360)

Everything about one hospital. At the top: name, zone, payment behaviour,
Business Potential, and counts of stakeholders, projects and
Opportunities.

**Tabs:**
- **Overview**: the hospital's details, its parent group and branches.
  **Edit** changes name, zone, parent, payment behaviour and customer
  type. (Business Potential is set by Admin or GM on Rate Hospitals.)
- **Activity**: everything logged at this hospital. **+ Log** adds an
  entry; you can comment on any entry.
- **Stakeholders**: the hospital's contacts, with designation, phone,
  email, NPS score (-100 to 100) and sentiment (Promoter, Neutral,
  Detractor). **+ Add** adds a contact; **N Opportunities** shows which
  Opportunities the contact is linked to.
- **Projects**: the hospital's projects. **+ Add** creates one.
- **Opportunities**: Active Opportunities by default; **Show All** also
  shows On Hold, Won and Lost. **+ Add** creates one for this hospital.
- **Installed Base**: equipment already at the hospital, ours or a
  competitor's (tick **Competitor Equipment** and type its name). Useful
  for upgrade and service leads.

## Pipeline

All Opportunities you can see, one column per stage. The stage names along
the top jump to that column (useful on a phone).
- Search by Opportunity or hospital; filter by owner (former staff are
  under **Inactive Owners**) and zone.
- Each card shows the hospital, status, value, owner, and the **High
  Priority** and **Reactivation Overdue** badges.
- When you arrive from a report, a **Showing: …** line says what is
  filtered. **Clear filter** shows everything; **Back to report** returns.

## Opportunity page

Everything about one Opportunity. Open it from Pipeline, a hospital's
Opportunities tab or a report.

**At the top:** Stage and Status, **Win Prob** (the chance of winning),
**Value**, **Owner**, and the **High Priority** and **Reactivation
Overdue** badges when they apply. A yellow notice means the chance is
50 % or more but there is no closing date — add one in **Edit**.

**Tabs:**
- **Overview**: the details. **Edit** changes stage, status and dates (see
  Part A).
- **Activity**: everything logged for this Opportunity. **+ Log** adds an
  entry; you can comment on any entry.
- **Next Actions**: tasks for this Opportunity. Close them from the **Next
  Actions** screen.
- **Products**: what is being sold. Saving products updates the Value
  automatically. Buyback (trade-in) lines reduce the total.
- **Splits**: colleagues who share the credit; the percentages must add up
  to 100 %. Once Won, only the GM can change it.
- **Stakeholders**: the hospital contacts involved in this Opportunity.
  Add new contacts on the hospital's page first.
- **Documents**: PO copies, quotes and photos (PNG, JPEG or PDF, up to
  4 MB). Deleting a file does not ask for confirmation.

## Marketing Lead Queue

Leads the marketing team has assigned to you. **Convert** turns a lead into an Opportunity; **Discard** needs a
reason; **Reassign** passes it to a colleague. Each lead has a
**Comments** thread with the marketing team. Managers also see **Team
Marketing Leads**.

## Next Actions

Your to-do list. **Pending** shows open tasks, **Completed** the finished
ones; **Due from** / **Due to** narrow the dates.
- Each task shows **Overdue** (due on an earlier day), or **Due** with
  its date, plus the hospital, Opportunity, owner and who logged it.
- **Mark to complete** asks what was done (see Part A).

## Insights Dashboard

How you, or your team, are doing.
- **Target vs Actuals**: for the quarter — **PO received** (POs dated in
  the quarter), **Won (paid)**, **Expected this quarter** (open
  Opportunities, adjusted by their chance) and **Likely finish** (Won +
  Expected), against the plan and the target — the SBU target (Admin, GM,
  SBU Manager) or, for an Area Manager's **Your team** row, their own
  target. Broken down by zone and by person, with each person's target
  beside their plan. Flags Opportunities whose closing date has passed.
  Arrows move between quarters.
- **Pipeline**: **Active Pipeline Value** and **Weighted Forecast** (value
  adjusted by chance), grouped by Stage, Rep, SBU, Zone, Product or Brand.
  Click a bar to see its Opportunities.
- Managers only: **Team Activity** (who logged what) and **Overdue
  Actions** (who has tasks past due).

## Target & Coverage Planning

Quarterly plans: which hospitals each person will cover and how much they
expect to bring in.
- **Quarterly** shows one quarter; **Annual** adds up the four quarters
  of the year.
- Quarters are shown by month, e.g. **Oct–Dec 2026**.
- **My Plan** (everyone except Admin): **Your target for** the quarter (not
  for GM), your plan and its status — Not started, Draft, Pending Approval,
  Approved, Rejected, or Needs Brand Split.
- **Needs Your Approval** (managers): plans waiting for you. A revised plan
  is marked **Revised** with the reason.
- **SBU Target & Plans** (managers, Admin, GM): every plan in your scope;
  the **SBU target** (brands' total, read-only; Admin, GM and SBU Manager
  only); and **Team targets**, where you divide your target among the people
  who report to you.

## Product Catalog

All products, by SBU, brand and model, with type (New Equipment,
Refurbished, Accessory) and links to brochures, videos and images. Search
by product, brand or SBU. Everyone can view; only Admin and GM can add or
change products.

## Reports

In every report, click a figure to see the Opportunities behind it. In
zone views, a zone's figures include the zones under it.
- **Daily Activity Report**: what was logged on a chosen day, for **All
  Team Members** or one person.
- **Stagnant Deals**: open Opportunities with no activity logged for
  **90+ days** or **180+ days**.
- **Opportunities On Hold**: everything On Hold, with reason, reactivation
  date and days on hold.
- **Product Performance**: by product, brand or SBU — quantity sold,
  revenue and average price from Won Opportunities, plus counts of all,
  Won and Lost Opportunities.
- **Pipeline Report**: the same figures as Insights → Pipeline (Active
  Opportunities only).
- **Sales Report**: **Revenue Won**, **Deals Won**, **Win Rate** and **Avg
  Deal Size** for **This Month**, **This Quarter** or **All Time**, by
  rep, zone, SBU, product or brand.

## Administration (Admin and GM)

- **User Directory**: add, edit, deactivate and reactivate users; set
  role, SBU, zones and manager.
- **Territory Map**: zones and their parents; add, edit or deactivate a
  zone. **Refresh Territory Visibility** after changes.
- **Audit Log**: who added, changed or removed what, and when.
- **Rate Hospitals**: set each hospital's Business Potential (High,
  Medium, Low) with a reason.
- **Brand Target Tracking**: by calendar year — the SBU's seasonal
  pattern, and each brand's own yearly figure, stretch and stretched
  target, with its four quarters (target, what the team has committed in
  submitted plans, and the gap).

See A4 for the steps.

---

# Part C — Rules the app enforces

## Stages, in order
Lead → Qualified → Demo → Clinical Evaluation → Negotiation → Order →
Delivery & Installation → Payment Pending.

You can create an Opportunity at any stage, as long as everything the
earlier stages need is filled in.

| Moving to | Needs |
|---|---|
| Qualified and above | Indicative Value |
| Demo and above | Demo date — unless Lead Source is REPEAT_ORDER or it is fast-tracked |
| Negotiation and above | Expected Closure Date — unless REPEAT_ORDER or fast-tracked |
| Delivery & Installation and above | PO Number and PO Date (not in the future) |
| Payment Pending | Nothing extra |
| Won | Saved at Payment Pending first; PO Number, PO Date, products; full payment confirmed |

## Statuses
- **Active**: every new Opportunity starts here.
- **On Hold**: reason and a future reactivation date.
- **Lost**: reason; competitor name if a competitor won.
- **Won**: see the table.
- Won and Lost are final.

## Win Probability
- Starts at the stage's usual figure.
- You may type your own (0–100). A stage change keeps your own figure and
  moves only the usual one.
- 50 % or more before Negotiation needs an Expected Closure Date.

## Ownership
- An Opportunity's SBU is set when it is created and never changes.
- Products must belong to the Opportunity's SBU.
- An Opportunity's owner must be in its SBU.
