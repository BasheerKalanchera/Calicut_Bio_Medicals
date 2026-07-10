# Prototype → Production Parity Audit

**Date:** 2026-07-10 (v1) · Revised 2026-07-10 (v2 — architecture-verified) · Revised 2026-07-10 (v3 — demo date moved to July 20, scope re-tiered)
**Author:** Architecture review (Claude Code)
**Purpose:** For features already shipped in production, identify what the prototype had that production is missing or weaker on, ahead of the July 20 Core System Readiness Demo checkpoint.

**Method:** v1 compared `sales-os-app/src/App.jsx` (8,740-line prototype) against the seven production screens reachable from `DemoApp.tsx` — a pure code diff. v2 cross-checked every "demo-visible" and "high severity" finding from v1 against `ADR.md`, `Business-Rules.md`, `Enterprise-Data-Model.md`, `API-Catalog.md`, `physical-data-model.md`, `Cabio Sales OS – Phase 1 - PRD.md`, and the live backend (`models.py`, `validators.py`, seed data) — because the prototype is not the architecture, and some things it did were later deliberately rejected, while other things the architecture *requires* were never checked against the prototype at all. See **§7 Verification Changelog** for exactly what changed between v1 and v2 and why.

**Scope note:** This audit covers only screens that exist in both prototype and production. It excludes prototype-only modules with no production equivalent yet — Manager Dashboard, Beat Planning, Insights/Reporting, and Admin (Users/Settings). Those are unbuilt milestones, not "gaps in existing features," and are not counted below.

**Totals (v3): 50 real gaps · 6 confirmed not-gaps (architecturally rejected, explicitly deferred, or descoped) · 2 regressions · 4 new gaps found independent of the prototype comparison**

---

## 1. Customer Directory & Customer 360

Production: `CustomerDirectoryScreen.jsx`, `Customer360Screen.tsx`

### Directory / list

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Segment filters | Zone, Class, Specialty dropdowns + name search | Free-text search only | Demo-visible |
| Card info density | City, Zone, Customer Type, Class, Specialty, clickable "Parent: X" | Zone + Payer Behavior only | Demo-visible |
| New Customer fields | City, Class, Specialty, Customer Type, Parent Customer (searchable lookup) | Name, Zone, Payer Behavior only | Demo-visible |

**Architecture note on Class/Specialty/Customer Type (corrects v1):** v1 filed these as "Tier 3, needs a call, maybe deliberately scoped out." They're not. `Cabio Sales OS – Phase 1 - PRD.md` defines all of this as a named Phase 1 feature — §1.1 ("Account Structure," Corporate Group → Hospital → Department hierarchy), §1.2 (Medical Specialty segmentation), §1.3 (Tier classification), and formally in §B.2.6 (`CustomerType`, `CustomerClass`, `CustomerTier`, `CustomerStatus`, plus a full address block). None of it made it into `Enterprise-Data-Model.md` or `Physical-Schema.sql` — confirmed absent from both the docs and the live `Account` model. This is a drop between the PRD and the formalized data model, not a considered Phase 1 simplification.

**The PRD also contradicts itself on `CustomerType`**, which matters for what gets built: the narrative §1.1 hierarchy (Corporate Group/Hospital/Department) and the formal §B.2.6 appendix (`Multispeciality Hospital / Specialty Hospital / Diagnostic Center / Clinic / Dealer / Medical College Hospital / Government Hospital / Other`) use the same field name for two different concepts. **Resolved 2026-07-10:** the hierarchy-level question doesn't need its own field — `account.parent_account_id` already answers it (an account with children is a Group, an account with a parent is a child, an account with neither is standalone). `CustomerType` will instead mean institution nature, using the exact §B.2.6 enum. **Decision confirmed by Basheer: build the institution-nature `CustomerType` field.** `CustomerClass` (A–D) and `CustomerStatus` remain open — not yet decided for this pass.

**Parent Customer — re-verified against live code, this is not pure frontend work as first stated.** `account.parent_account_id` is a real, live, self-referencing FK with no uniqueness constraint — structurally it already supports one Corporate Group having many Hospital children, and chains an arbitrary number of levels deep (Group → Hospital → Department), confirmed via `backend/app/domains/account/models.py` and `service.py`'s create/update validation (blocks self-parenting, requires the parent to exist, no depth limit). **But the read direction only works one way today:** every account query in `repository.py` explicitly does `noload(Account.child_accounts)`, and no endpoint exposes "list the children of this account." So there's a real backend gap (a new read path — an endpoint or query param) in addition to the frontend gap (nothing in production, list or detail, reads or displays `parent_account_id` at all — confirmed zero references outside the prototype and generated types).

### Customer 360 — Overview

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Relationship Health card | Primary Contact, Last Interaction, Open Follow-Ups count, live stakeholder sentiment | Absent entirely | Demo-visible |
| Installed Base summary | Tiles: Total Installed, Imaging count, Critical Care count, Latest Install Date | Only exists as a separate tab list | Demo-visible |
| Opportunities summary | Tiles: Open Opportunities, Total Pipeline ₹, Weighted Pipeline ₹, Won Revenue YTD | Absent on Overview | Demo-visible |
| Class/Specialty/Type/Parent editing | Manager-gated inline edit + re-parent via lookup | No such fields surfaced here | Demo-visible — see architecture note above |
| Activity Timeline extras | Inline "Reminders & Follow-ups" panel + search over interactions | Unconfirmed if reminders surface inline vs. only in Next Actions | Needs check |

### Stakeholders & Installed Assets

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Quick-contact: Call | One-tap Call button per row | No affordance | Demo-visible — confirmed cheap, see §6 |
| Quick-contact: WhatsApp | One-tap WhatsApp button, reuses the same phone number as Call | No affordance | Demo-visible — blocked on the already-tracked `whatsapp_number` deferred item; **note the prototype reuses the existing phone field for both Call and WhatsApp rather than storing a separate WhatsApp number** — worth deciding whether production really needs a distinct `whatsapp_number` column or can reuse `stakeholder.phone` the same way |
| Stakeholder empty state | Explanatory copy + inline "+ Add" CTA | One-line message | Edge-case |
| Asset service notes | Freeform "Service Notes / Status" field | No equivalent field | Edge-case |

**Delete stakeholder — removed from scope (2026-07-10).** For the record: this item's origin was the raw prototype diff (v1) — the prototype had a Manager-gated delete with an audit-log entry, production doesn't, so v1 flagged it as a gap. It was never backed by a Business Rule or ADR requirement. On review, the opposite case is actually stronger: `API-Catalog.md §2.2` documents only `GET`/`POST`/`PATCH` for stakeholders — no `DELETE` — and that's consistent with a real, recurring pattern elsewhere in the same document (Installed Assets: *"Delete is omitted as assets rarely disappear; they are replaced"*; Reminders: *"DELETE omitted as users should mark tasks complete rather than delete them"*; Target Plans: *"DELETE omitted as targets are historical audit records once set"*). Stakeholder delete fits that same pattern better than it fits "gap to close." See §7 for this as a v2→v3 correction.

*Not a gap: production's asset form (competitor-equipment flag, product picker, department, edit) is richer than the prototype's.*

---

## 2. Projects

Production: `ProjectDirectoryScreen.jsx` (list + detail in one file)

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Project Type field | Type (New Build, Expansion, Upgrade, Renovation, Digital Transformation) — column + filter | No equivalent field anywhere | Demo-visible |
| Status filter | Status dropdown (Planning/Active/On Hold/Completed) | Search only | Demo-visible |
| Detail header badges | Color-coded Status, Type, Expected Close Date as pills | Status buried as plain text lower on page | Demo-visible |
| "Add Opportunity" from Project | Create opportunity pre-linked to project | **Regression** — state/handlers exist but no button ever renders them | Demo-visible |
| Linked-opportunity cards | Value, win%, stage, owner, hold/overdue/demo-date badges, click-through to full detail | Name/stage/win%/value only, opens small inline modal, no click-through | Demo-visible |
| Expected close date in list | Shown as table column | Not surfaced in list cards | Edge-case |
| Clickable customer name | Jumps to Customer 360 from project row | Plain text, no navigation | Edge-case |
| Opportunity count badge | "Associated Opportunities — N Deals" | No count shown | Edge-case |

### Confirmed NOT a gap: Project On-Hold workflow

v1 called this "Demo-visible · High" — the single top-priority item. **That was wrong.** `Business-Rules.md BR-PROJ-01` restricts the Project lifecycle to exactly six statuses: `DRAFT, ACTIVE, BID_SUBMITTED, AWARDED, LOST, CLOSED`. Confirmed identically in `Enterprise-Data-Model.md §5.2`, `Seed-Data.sql`, and the live `project_status` table — `ON_HOLD` does not exist for Project anywhere. The strict On-Hold discipline (`ADR-005`, `BR-OP-02`) applies to Opportunities only — Projects were kept as simple grouping/tender vehicles. This is not a bug to fix before the demo; building it would mean adding a new `ProjectStatus` value plus `hold_reason_id`/`reactivation_date` columns on `project` — an architecture decision, not a patch. **Drop from all pre-demo scope.**

---

## 3. Opportunity Pipeline & Detail

Production: `OpportunityPipelineScreen.tsx`, `OpportunityDetailScreen.tsx`. Largest module — carries the most prototype feature density (hold/handover/demo-tracking/splits all converge here).

### Pipeline board

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Revenue/target strip | Target vs. Actual with quarter selector, Risk-Weighted Forecast, Won Last Month, Lost Deals | Not present | Demo-visible |
| "Action Required" banner | Aggregate stagnant-deal / overdue-hold counts, click-to-filter | Per-card overdue chip only, no aggregate banner | Demo-visible |
| Priority flag | ⭐ toggle on card, priority-first sort | No `is_priority` concept anywhere | Demo-visible |
| Inline stage change | Change stage directly from kanban card | Click-through only, must open detail → Edit modal | Demo-visible |
| Project/demo-date card badges | Linked project name + demo window shown inline | Card shows name/account/status/value/owner only | Edge-case |
| Shared-contributor badge | "👥 Shared (n)" when >1 contributor | Single owner name only | Edge-case |
| Card → account click-through | Click hospital name to open Customer 360 | Not present | Edge-case |

*Note: `OpportunityPipelineScreen.tsx` was built in MUI from the start (commit `8a3ed70`) — these were never in production at any point, not lost during a later rewrite.*

### Deal Info (Overview tab / Edit modal)

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Lead Source | Captured at creation and editable here | Captured at creation, never shown/editable on this screen | **Elevated** — see note |
| Associated Project | Displayed with "View Project →" link | `project_id` captured but never displayed/linked here | Demo-visible |
| Deal grouping / shared PO | Group multiple deals under one PO, shared reference, computed total | Single `po_number` per opportunity, no cross-opportunity linkage | Demo-visible — needs a data-model decision, not a quick fix |
| Budget Range gate | Fixed brackets required at Qualified stage | Backend already gates Qualified on `indicative_value` (used as a documented proxy for "budget range" — see `validators.py` line 54) | Edge-case — effectively covered, just not labeled "Budget Range" in the UI |
| Per-deal Next Actions widget | Pending reminders tied to deal, inline complete | Not surfaced on this screen | Edge-case |

**Lead Source — elevated, not cosmetic.** `BR-OP-01` makes Lead Source a mandatory gate field for Lead→Qualified, and `backend/app/domains/opportunity/validators.py` line 48 already enforces it server-side. A rep can hit a rejected API call on a required field the demoed screen gives no way to see or set. Included in Milestone 1 scope, see §6.

**Per-stage progressive validation — corrects v1, which was factually wrong.** v1 said "only Hold/Lost/Won gates exist." Not true: `backend/app/domains/opportunity/validators.py::validate_stage_transition` already enforces **5 of `BR-OP-01`'s 6 stage-gate transitions** — Lead→Qualified (Lead Source + Budget Range via `indicative_value` + Products), Qualified→Demo (Demo Start Date), Clinical Eval→Negotiation (Expected Closure Date), Negotiation→Order (Order Value + Products), Order→Delivery (PO Number). This was missed in v1 because the review only checked the frontend; the backend logic was never read. What's genuinely missing — and the code says so in its own comments — is the Demo→Clinical Evaluation gate and half of Order→Delivery. See the new "Demo Outcome / Handover / Delivery" section below, which replaces the old "Handover / Delivery" table with the corrected, code-verified picture.

**Marketing Campaign — corrects v1 ("Edge-case, maybe add").** `Enterprise-Data-Model.md §10` ("Future Extension Points") names "Campaign ROI and Lead Source attribution analysis" as an explicit future-phase item, with the existing `LeadSource` master entity called out as "the Phase 1 foundation" for it. This is a documented scope boundary, not an oversight. **Do not build before the demo, in Opportunity Detail or Quick Lead.**

### Demo Outcome / Handover / Delivery — corrected and elevated from v1

v1 filed "Handover Checklist" and "Delivery/Installation/Commitments" as ordinary prototype-parity gaps. They're more than that: these are **formally mandated `BR-OP-01` stage gates with zero schema support**, confirmed by the validator's own inline comments admitting the deferral (`"gates deferred: demo_outcome / clinical fields not in schema"`, line 18; `"delivery_date and installation_site are not in the current schema"`, line 96).

| Gap | BR-OP-01 requirement | Production | Severity |
|---|---|---|---|
| Demo Outcome | Mandatory to advance Demo→Clinical Evaluation, alongside clinical contact + clinical eval start date | No column on `opportunity`; gate not enforced | **Compliance gap** — needs a migration |
| Handover Information | Mandatory to advance Negotiation→Order | No handover-related column anywhere; gate not enforced | **Compliance gap** — needs a migration |
| Delivery Date + Installation Site | Mandatory to advance Order→Delivery, alongside PO Number (which **is** already enforced) | No columns for either; only the PO Number half of this gate works | **Compliance gap** — needs a migration |

The prototype's "Delivery Notes / Installation Requirements / Special Commitments" free-text fields are *not* the same thing as the BR-OP-01-mandated structured Delivery Date + Installation Site — if this gets built, satisfy the structured fields first; the prototype's free-text elaboration is optional polish on top, not a substitute.

*Not a gap: hold reason/notes/reactivation-date and overdue badge/gate logic are already comparable in production.*

### Products / Splits / Activities tabs

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Products tab detail | Brand, Model, SBU, OEM, Price Range, clickable collateral links | Name/qty/price/discount/extended value only — cascades from Catalog's missing fields (§4) | Demo-visible |
| Split contributor Role | Role field per contributor | User + percentage only | Edge-case |
| Activity search | Live search over notes/owner/purpose/date | No search/filter in `ActivityTimeline.tsx` | Edge-case |

*Not a gap: production's Stakeholders tab (edit-in-place, notes) is already richer than the prototype's.*

---

## 4. Product Catalog

Production: `ProductCatalogScreen.jsx`

> **Regression, confirmed against two independent sources.** The prototype gated "+ Machine" and per-row Edit behind `currentUser === "Manager"`. Production's Add/Edit are open to every user with no role check anywhere in `backend/app/domains/product/router.py`. `API-Catalog.md §4.1` independently states outright: *"Admin-level POST/PATCH is out of scope for the sales UI"* for products — so this isn't just "we regressed from the prototype," it's "current behavior contradicts our own written API design." **Decision (2026-07-10): gate Add/Edit to General Manager + Admin roles.** Sales Executive and Sales Manager get read-only.

**RBAC infrastructure reality check (new in v2):** there is no existing role-gating pattern anywhere in production to "restore" or "reuse" — v1 incorrectly claimed one existed on Customer 360's stakeholder edit; verified false, zero role-based conditional rendering exists in any production file, frontend or backend. What *does* exist: a `role` table with four seeded roles (`Sales Executive`, `Sales Manager`, `General Manager`, `Admin`) and `user_profile.role_id` — the identity groundwork is ready. What doesn't exist: `get_current_user()` in `dependencies.py` only authenticates, never checks role; no endpoint anywhere does authorization. There's a much bigger, **approved-but-fully-unbuilt** initiative for this — `docs/Phase-2E-Security-Architecture.md`, a full PostgreSQL RLS system — whose own `set_rls_context()` hook is currently a literal no-op (`pass`) in `db/session.py`. That's real, but multi-day, and not needed here: Phase 2E's own design explicitly assigns *"can this user perform this action"* to the **service layer**, separate from RLS's *"which rows can this user see."* So the Catalog fix is a small, standalone service-layer role check, buildable now, independent of the Phase 2E rollout.

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Price Range field | Column + editable field (e.g. "₹25L–₹35L") | No price field anywhere | Demo-visible |
| Collateral links | Array of labeled URLs (brochures/videos/clinical images), clickable | `Product.documents` relationship already wired to the generic `Document` entity (ADR-025) at the model layer — no UI built on top of it | Demo-visible — cheaper than "no data model support" implies, see §6 |
| Role-gated edit access | Manager-only Add/Edit | Open to all users | **Regression — decision made, see above** |
| Enumerated OEM/Category | Curated OEM `<select>` enforcing consistent naming | Free-text `oem_name`/`category_name`, no consistency guard | Edge-case |

*Not a gap: name, SBU, model number, search, pagination, detail view are equal or stronger in production. Delete-product is absent in both — not a regression.*

---

## 5. Next Actions, Log Activity & Quick Lead

Production: `NextActionsScreen.tsx`, `LogActivityModal.tsx`, `QuickLeadModal.tsx`

### Next Actions

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Click-through to record | Clicking hospital name opens linked deal/account | Plain text, no navigation | Demo-visible |
| Manager grouping | Manager view groups reminders per rep with pending counts | One flat list for everyone | Demo-visible — note: no `manager_id`/reporting-line field exists on `user_profile`; grouping would need to be SBU/Zone-scoped, not a true org-chart rollup, unless that's added separately |

### Log Activity

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Purpose taxonomy | 12 business-specific purposes (Demo Feedback, PO Follow-up, Payment Follow-up, Installation, Application Support, …) | 6 generic channel types (Visit/Call/Email/Meeting/Note/Manager Note) | Demo-visible |
| Auto-suggested follow-up text | Blank follow-up auto-fills from note text | Always manual entry (BR-ACT-04 mandatory, just no smart default) | Edge-case |

### Quick Lead wizard

| Gap | Prototype | Production | Severity |
|---|---|---|---|
| Inline account creation | Create a new hospital/account without leaving the wizard | Flat dropdown of existing accounts only | **Not a gap — deferred for Phase 1, decision 2026-07-10** |
| Campaign field | Free-text Campaign alongside Lead Source | No field anywhere | **Not a gap** — see §3, explicitly deferred per `Enterprise-Data-Model.md §10` |
| Auto-split & zone routing | Splits lead into per-category deals, auto-assigns owner via Zone × Category table | Always single opportunity, owner always manual | Demo-visible |
| Category-tabbed product picker | Ultrasound / Ventilator / Critical Care tabs | Flat SBU-filtered dropdown | Edge-case |
| Account search/scale | Live progressive type-ahead across all accounts | Static select capped at first 100 accounts, no search | Edge-case · scale risk |

**Inline account creation — corrects a claim floated during review that this was deliberately excluded per `BR-ACT-01`/`BR-ACT-03`.** Checked directly: those rules require an Activity to have a valid `account_id` — they say nothing about *how* the account was created. An inline-created account is still a real, persisted row; logging an Activity against it satisfies BR-ACT-01/03 identically to picking one from a dropdown. Also checked `Next-Actions-Implementation-Plan.md` directly for supporting content — none exists. So the BR-ACT-01/03 justification doesn't hold — **but the underlying product decision has now been made on its own, correct grounds.** Basheer's call (2026-07-10): no inline account creation in Quick Lead for Phase 1 — reps create the account via the Account Management screen first, then create the lead/log the activity against it. Rationale is simplicity for Phase 1, not data-governance/BR compliance. Revisit post-Phase-1 if the two-step flow proves to be friction in practice.

---

## 6. Milestone scoping plan

**Timeline update (2026-07-10): the demo has moved from July 13 to July 20.** That extra runway is enough to cover everything in "Gaps to finish — Milestone 1" below, not just the fastest items — so this is no longer a triage list of what's realistic in three days, it's the actual scope for Milestone 1.

### Gaps to finish — Milestone 1
- **Associated Project** link on Opportunity Detail — `project_id` already captured, just not displayed.
- **Lead Source** display on Opportunity Detail — elevated priority: backend already rejects the write path this screen can't reach.
- **Demo end date** on Opportunity Detail — field exists on the type, only start date is wired.
- **Reminder click-through** to account/opportunity on Next Actions — same navigation pattern already used elsewhere in `DemoApp.tsx`.
- **Catalog role gate (General Manager + Admin)** — decision made; this is new service-layer work, not a "restore" (no prior pattern exists to reuse — see §4).
- **Parent Customer display** — needs a small backend read-path addition (children aren't queryable today, see §1) *plus* frontend wiring.
- **`CustomerType` (institution-nature)** — decision made (§1). Unlike the items above, the data doesn't exist yet — needs a migration (new column on `account`), backend schema/API updates, and Directory + Overview UI, i.e. all three layers. Doesn't include `CustomerClass`/`CustomerStatus` — those stay parked, see Milestone 2.
- **Product Catalog collateral links** — cheaper than v1 implied: `Product.documents` is already wired to the generic `Document` entity (ADR-025), so this is "build a documents tab," not "invent storage" — but it's still a new tab/upload UI to build.

### Deferred till Milestone 2
- **Demo Outcome, Handover Information, Delivery Date/Installation Site** — confirmed `BR-OP-01`-mandated compliance gaps (§3), but each needs a migration. Worth a backlog ticket independent of the demo given they're formally documented rules with zero enforcement.
- **BR-OP-06 Stalled Opportunity Detection** — *new finding, not from the prototype comparison.* The 180-day no-activity auto-stall + manager notification rule is 100% unimplemented — no scheduled job exists anywhere in the backend. Found by checking `Business-Rules.md` directly, independent of anything the prototype did.
- **Pipeline revenue/target dashboard strip + Action Required banner** — real aggregation work.
- **Deal grouping / shared PO across opportunities** — a cross-opportunity data model question, needs a design decision before any code.
- **Quick Lead: auto-split/routing** — wizard rework, not a patch. (Campaign field and inline account creation removed from this list — both confirmed not gaps, see below.)
- **Customer 360 Overview summary tiles** (Opportunities + Installed Base rollups) — underlying counts likely already exist per-account; needs aggregation + a card.
- **`CustomerClass` (A/B/C/D) and `CustomerStatus`** (Prospect/Active/Inactive/Blocked) — the two PRD-defined classification fields not yet decided on (see §1). Parked here explicitly rather than left as a footnote, so they don't get quietly built alongside `CustomerType` without a separate decision.
- **Stakeholder "Call" and "WhatsApp" quick-actions** — both are cheap whenever prioritized (`Call` needs only a `tel:` link against the existing `stakeholder.phone` field; `WhatsApp` needs the same, or a new column, pending the reuse-vs-dedicated-field decision in §1) — just not part of Milestone 1 scope.

### Confirmed not gaps — drop from all scope, unless separately revisited
- **Project On-Hold workflow** (§2) — `ON_HOLD` is not a defined `ProjectStatus`; would need an architecture amendment, not a bug fix.
- **Marketing Campaign field** (§3, §5) — explicitly named as a future-phase item in `Enterprise-Data-Model.md §10`.
- **Stakeholder delete** (§1) — never backed by a Business Rule or ADR; matches the deliberate no-DELETE pattern used elsewhere in `API-Catalog.md` (Installed Assets, Reminders, Target Plans) better than it matches "gap to close." Removed from scope 2026-07-10.
- **Quick Lead inline account creation** (§5) — deliberately deferred for Phase 1 (decision 2026-07-10): reps use the Account Management screen to create the customer first, then create the lead/log the activity. Simplicity, not a BR-ACT-01/03 requirement — the rule-based justification floated during review didn't hold up, but the decision stands on its own merits.

---

## 7. Verification changelog (v1 → v3)

| Change | What v1 said | What's actually true |
|---|---|---|
| Project On-Hold | "Demo-visible · High" — top priority | Not a gap. `ON_HOLD` isn't a defined `ProjectStatus` anywhere (EDM, schema, seed data, live model). Needs an architecture decision, not a fix. |
| Marketing Campaign | "Edge-case," listed as maybe-worth-adding | Not a gap. Explicitly named as a future-phase item in `Enterprise-Data-Model.md §10`. |
| "No per-stage progressive validation" | Stated as fact — only Hold/Lost/Won gates exist | Wrong. 5 of 6 `BR-OP-01` stage gates are already enforced server-side (`validators.py`). Only Demo→Clinical-Eval and half of Order→Delivery are genuinely missing. |
| Lead Source display | "Demo-visible," filed as cosmetic | Elevated. `BR-OP-01` mandates it and the backend already enforces it — the gap is a real failure mode, not polish. |
| Catalog role gate | "Restore... reuses the gating pattern already present on Customer 360's stakeholder edit" | No such pattern exists anywhere in production. Corrected — this is new work, and confirmed against `API-Catalog.md §4.1`'s own stated intent, not just prototype nostalgia. |
| Parent Customer link | Filed as "Tier 3, needs a call" | `parent_account_id` is live and structurally supports one-to-many/multi-level hierarchy — but the read-only-one-direction gap (no children query) means this needs a small backend addition too, not pure frontend. |
| Class/Specialty/Customer Type | "Tier 3, needs a call, maybe deliberately scoped out" | The PRD (§1.1, §1.2, §1.3, §B.2.6) defines all of this in detail — never deliberately dropped, just lost between the PRD and the formalized data model. `CustomerType` (institution-nature) is now a decided item to build. |
| Quick Lead inline account creation | "Demo-visible" | Confirmed still a real gap; a claim that `BR-ACT-01`/`BR-ACT-03` deliberately excluded this does not hold up — those rules govern Activity→Account linkage, not account-creation UX. |
| Handover/Delivery fields | Filed as ordinary prototype-parity gaps | Elevated — confirmed as formally mandated `BR-OP-01` gates with zero schema support, admitted in the validator's own code comments. |
| BR-OP-06 Stalled Detection | Not present in v1 at all | New finding — checked `Business-Rules.md` directly, independent of the prototype. 100% unimplemented. |
| Stakeholder delete | v1/v2: "Demo-visible" gap to close | v3 (2026-07-10): removed from scope. Never backed by a Business Rule or ADR — it was a straight prototype-diff finding. On review, its absence matches a deliberate no-DELETE pattern used elsewhere in `API-Catalog.md`, not an oversight. |
| Demo timeline / tiering | Tier 1/2/3, framed around a July 13 checkpoint with 3 working days | Demo moved to July 20 (2026-07-10). Tiers renamed to "Gaps to finish — Milestone 1" / "Deferred till Milestone 2"; former Tier 2 folded into Milestone 1 now that the extra runway covers it. |

---

## Out of scope for this audit

The prototype has four entire modules with no production equivalent yet — Manager Dashboard, Beat Planning, Insights/Reporting, and Admin (Users/Settings). These aren't gaps in existing features, they're unbuilt milestones, and were not included in the counts above.

---

*v1 prepared by comparing `sales-os-app/src/App.jsx` against `DemoApp.tsx` and its seven child screens. v2 verified against `ADR.md`, `Business-Rules.md`, `Enterprise-Data-Model.md`, `API-Catalog.md`, `physical-data-model.md`, `Cabio Sales OS – Phase 1 - PRD.md`, `Next-Actions-Implementation-Plan.md`, and the live backend (`backend/app/domains/{opportunity,project,account,product}/models.py`, `opportunity/validators.py`, `api/dependencies.py`, `docs/Seed-Data.sql`). v3 re-scoped after the demo date moved to July 20 and removed Stakeholder delete from scope. Severity is judged by demo visibility and business-rule compliance, not implementation cost — cross-reference against the Milestone 1 / Milestone 2 plan in §6 before scheduling work.*
