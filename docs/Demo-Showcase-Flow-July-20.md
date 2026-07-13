# Demo Showcase Flow — July 20, 2026

**Purpose:** a presenter's script for demoing everything added to Cabio
Sales OS since June 29 (essentially the whole production app — the
Architecture Freeze on June 20-21 means nothing before June 22 is live in
this build; June 29 lands squarely inside the post-freeze rebuild, so this
covers Product Catalog CRUD, Opportunity/Project management, the full MUI +
TypeScript + React Query migration, and all 6 Milestone 1 gap-closure
items). Organized as one continuous story — a sales rep's day working a
real account — rather than a feature-by-feature list, so it flows naturally
in front of an audience.

**Format:** 8 acts, ~25-30 minutes total. Each step names the screen,
the action, and the one-line talking point. Bold **[NEW]** tags mark
things that didn't exist before June 29 — lean on those, since that's
what this demo is actually for.

**Companion doc:** `docs/Regression-Test-Plan.md` — run that *before* this,
not during. This script assumes everything already works; it's about
narrative flow and talking points, not verification.

---

## Before you present

- [ ] **Revert your own display name** back to `Basheer K` (currently
      shows `TEST - Sales Executive` from role-gate testing) —
      `UPDATE user_profile SET display_name = 'Basheer K' WHERE id = <your-id>;`
      Showing "TEST - Sales Executive" in front of an audience undercuts
      the polish of everything else.
- [ ] Have 4 browser sessions/profiles ready if you're doing the role-gate
      moment live (Act 6): your own login (Sales Executive), plus
      `manager@cabio-demo.com`, `gm@cabio-demo.com`, `admin@cabio-demo.com`.
      Or simpler — just use your own login (Sales Executive) to show the
      buttons *hidden*, then `admin@cabio-demo.com` in a second tab to show
      them *present*. Two logins is enough to make the point.
- [ ] Confirm both servers are up (`uvicorn` on :8000, `npm run dev` on
      the frontend) and you're on decent wifi if presenting live vs. local.
- [ ] Know which records you'll touch live (see "What gets created" below)
      so nothing surprises you mid-demo.

**What gets created live, and what stays after:** this script creates one
new child account, one new Quick Lead/Opportunity, one Activity log entry,
and one Collateral Link. All are realistic, presentable data — no
`REGRESSION TEST -` prefixes needed here (unlike the regression pass, this
is a demo, it should look real). Nothing needs to be cleaned up afterward;
it's fine for these to become part of the permanent demo dataset for future
walkthroughs.

---

## Act 1 — Orientation (2 min)

**Screen: Login → Customer Directory (default landing view)**

1. Log in. Land on Customer Directory.
2. Talking point: *"This is a Sales OS, not a CRM — it models the full
   pipeline from Target through Coverage to Opportunity to Revenue. What
   you're about to see is the production rebuild — everything was
   architecture-frozen on June 20th and rebuilt clean from there, so
   what's on screen now is the real thing, not prototype."*
3. Point out the sidebar: Customers, Opportunities, Product Catalog,
   Projects, Next Actions — the full navigation.

---

## Act 2 — Customer 360: the account-level story (6 min)

**Screen: Customer Directory → search → Customer 360**

1. Search for **"Government Medical College Kozhikode"** (or type "Govt"
   — unified search across name works).
2. Open it → Customer 360.
3. **Overview tab:**
   - Point out **[NEW]** **Customer Type** badge (institution-nature —
     e.g. "Government Hospital" or similar) and **[NEW]** Payer Behavior.
   - This account has no parent today — set that up live in Act 3.
4. **Activity tab** (now position 2 in the tab bar, not buried last):
   - Show the Activity Timeline — card-based, reverse-chronological,
     searchable.
   - Click **+ Log Activity**. Log a real interaction (e.g. "Visit" —
     discussed CT scanner replacement timeline). Try to submit with no
     Next Action — **[NEW]** it blocks you (BR-ACT-04, mandatory next
     action on every activity except Manager Notes). Fill in a follow-up,
     submit. Watch it land instantly at the top of the timeline.
5. **Stakeholders tab:**
   - Point out the 3 existing contacts with color-coded NPS: Dr. Rajesh
     Nair (green, 72), Dr. Priya Menon (amber, 35), Mr. Suresh Kumar (red,
     -15) — *"NPS now lives at the individual stakeholder level, not just
     the account, so you can see exactly who's a promoter and who's a
     detractor inside the same hospital."*
6. **Installed Assets tab:**
   - Show the CT Scanner and Digital X-Ray (own equipment) alongside any
     competitor equipment, highlighted in red — *"this is how we track
     competitive displacement opportunities."*

---

## Act 3 — Account hierarchy **[NEW]** (3 min)

**Screen: Customer 360 → Edit Customer, or Customer Directory → New Customer**

1. Create a new account: **"Aster MIMS Kannur"**, Imaging SBU, Customer
   Type = Multispeciality Hospital, **Parent Customer = "Aster MIMS
   Calicut"** (Autocomplete search).
2. Save. Navigate to **Aster MIMS Calicut** → Overview tab → point out the
   new **Child Accounts** chip showing "Aster MIMS Kannur."
3. Click the child chip → jumps straight into the child account's 360
   view. Click **Back** → returns cleanly to the Directory (not stuck
   mid-hierarchy).
4. Talking point: *"This is genuinely new plumbing — parent/child account
   relationships, with cycle protection so you can't accidentally create
   a loop, and it's fully bidirectional: view children from the parent,
   view the parent from any child."*

---

## Act 4 — From lead to pipeline (4 min)

**Screen: Customer 360 (Aster MIMS Calicut) → Quick Lead**

1. From Aster MIMS Calicut, launch **Quick Lead**.
2. Pick a product from the **SBU-filtered dropdown** — e.g. "1.5T MRI
   System." Set Lead Source (e.g. "Referral"), indicative value.
3. Submit → note the **auto-calculated indicative value** if multiple
   items are added, and the SBU-filtered product picker keeping the list
   relevant.
4. Navigate to **Opportunity Pipeline** — the new lead is sitting in the
   Lead column. *"From this point it's tracked through every stage —
   Qualified, Demo, Negotiation, Order, Delivery — with server-enforced
   stage gates, not just a Kanban card you can drag anywhere."*

---

## Act 5 — Opportunity Detail: the deepest tour (6 min)

**Screen: Opportunity Pipeline → click the new opportunity (or an existing, further-along one for stage-gate variety)**

1. **Overview tab** — walk the full field set, calling out **[NEW]**
   ones explicitly: Demo Start + **Demo End Date**, Expected Closure, PO
   Number, SBU, **Lead Source**, **Associated Project** (if this
   opportunity is linked to one).
2. Click **Edit** → show Lead Source is now backfillable (wasn't before —
   previously it could only be set once, at creation, and a missed one
   silently blocked stage progression). Set/adjust Demo End Date.
3. **Products / Splits / Stakeholders tabs** — all four tabs are
   pre-fetched on open now (**[NEW]**, used to lazy-load per click and
   feel sluggish) — click through all 4 rapidly to show there's no
   loading lag.
4. Change the opportunity's **stage** to trigger a status-gated field
   (e.g. moving toward Negotiation may require Hold Reason / Reactivation
   Date depending on current stage) — show the form actually has the
   fields the backend requires, not a dead-end.
5. If any opportunity in the pipeline is overdue for reactivation, point
   out the **Reactivation Overdue** badge — visible both here and on the
   Pipeline board.
6. Optional strong closer for this act: open a **WON or LOST** opportunity
   and try to change its status back to Active — show it correctly
   **refuses** ("Cannot change the status of a LOST opportunity"). *"Once
   an opportunity is closed, it's closed for audit integrity — you create
   a fresh opportunity instead, you don't reopen history."*

---

## Act 6 — Product Catalog + role-based governance **[NEW]** (5 min)

**Screen: Product Catalog**

1. Search products — unified search across product name and OEM/brand
   (e.g. search "Siemens").
2. Open a product detail. Show the **[NEW] Collateral Links** card — add
   a link (pick a real or placeholder brochure URL), pick a type icon,
   save. Click the link — opens in a new tab.
3. **The governance moment:** still logged in as yourself (Sales
   Executive) — point out the product list is **read-only**, no "+ Add"
   button. *"This wasn't gated before — anyone could add or edit the
   catalog. Now it's General Manager and Admin only."*
4. Switch to the `admin@cabio-demo.com` tab/session. Same screen — **+
   Add** button is there. Add a quick product (or just open Edit on an
   existing one) to show it actually works for the right role.
5. Talking point: *"This is enforced on both ends — the button's hidden
   for the wrong role, but even a direct API call gets rejected with a
   403. It's not just a UI trick."*

---

## Act 7 — Next Actions & reminders **[NEW]** (3 min)

**Screen: Next Actions**

1. Show the Pending / Completed toggle — *"this used to leak completed
   items into the Pending list; that's fixed."*
2. Find a reminder tied to an account — click the **account name** →
   jumps straight into Customer 360 for that account.
3. Back to Next Actions. Find (or use the one just logged in Act 4/5) a
   reminder tied to an **opportunity** — click the **opportunity name** →
   opens Opportunity Detail directly (brief loading spinner is expected —
   this is a genuine fetch, not a stale/partial object).
4. Click **Back** — returns to Next Actions, not to the Pipeline. *"Every
   click-through remembers exactly where it came from."*

---

## Act 8 — Project tracking, wrap-up (2 min)

**Screen: Project Directory**

1. Open an existing project (e.g. one under Government Medical College or
   Aster MIMS).
2. Use the header **+ Log** button to log an activity against the project
   directly — point out the "Project: {name}" chip confirming where it
   lands.
3. Close: *"Everything you just saw — hierarchy, lead source backfill,
   collateral links, the role gate, reminder click-through — landed in
   the last two weeks. Milestone 1 gap-closure is fully done as of today.
   Milestone 2 is next: stalled-opportunity detection, delivery/handover
   tracking, broader role-based access beyond the catalog."*

---

## Appendix — feature-to-act cross-reference

| Feature (added since June 29) | Act | Commit |
|---|---|---|
| Product Catalog CRUD, unified search | 6 | `6731cb6`, `0699391` |
| Installed Base CRUD | 2 | `71765eb` |
| Opportunity UX (Lead Source, product modals, value auto-calc) | 4 | `fbee83f` |
| Full MUI + TypeScript + React Query migration | throughout | `eb5f370`…`a0ef2e4` |
| Backend concurrency fix (screen-load speed) | throughout (implicit) | `2bb41b4` |
| Next Actions mandatory Next Action (BR-ACT-04) | 2 | `3bab93f` |
| BR-OP-02/03/05 status gates on Opportunity Detail | 5 | `2f7e074` |
| Reactivation Overdue badge | 5 | `349a41e`, `2f7e074` |
| Parent Customer display + editing | 3 | `87fde5a`, `95e118a` |
| Customer Type (institution-nature) | 2, 3 | `70cf978` |
| Opportunity Detail trio (Project/Lead Source/Demo End) | 5 | `b662751` |
| Reminder click-through | 7 | `ac6d008` |
| Product Catalog collateral links | 6 | `ab67209` |
| Catalog role gate (GM+Admin) | 6 | today's commit |

## Timing budget
| Act | Minutes |
|---|---|
| 1. Orientation | 2 |
| 2. Customer 360 | 6 |
| 3. Account hierarchy | 3 |
| 4. Lead to Pipeline | 4 |
| 5. Opportunity Detail | 6 |
| 6. Catalog + role gate | 5 |
| 7. Next Actions | 3 |
| 8. Projects + wrap-up | 2 |
| **Total** | **~31 min** |

Trim Act 5 first if you're running short — it's the most detail-heavy,
and its additions (a few extra Overview fields, prefetched tabs) are
subtle in a live demo even though they matter functionally. Acts 3, 6,
and 7 are all quick and visually obvious (live hierarchy creation, live
role-gate enforcement, live click-through navigation) — keep those intact,
they carry the strongest "wow" per minute spent.
