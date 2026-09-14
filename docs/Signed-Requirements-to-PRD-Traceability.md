# Cabio Sales OS — Signed Requirements ↔ PRD Traceability Matrix

## Purpose

The requirements document Cabio's leadership signed off on numbers every
requirement with a flat **Feature ID** (Feature 1.1 through Feature 17.5,
running straight through the whole scope, not restarting per module). The
PRD in this repo (`docs/Cabio Sales OS – Phase 1 - PRD.md`) reorganizes the
same requirements into seven modules for readability, with each module's
subsections restarting at `.1` (Module 1 → 1.1, 1.2…, Module 2 → 2.1,
2.2…). That reorganization happened in a single commit
(`aeb70da "Finalized PRD reviews and prototype completion backlog v2"`)
outside this repo's history, so the two numbering schemes no longer line
up on paper — even though, with one flagged exception below, the actual
*content* already lives in the right place.

This document is the missing link: for every signed Feature ID, which PRD
section covers it today, and whether it's actually been built. Use it to
answer "does the signed scope say X" without needing both documents open
side by side, and to confirm nothing signed off was quietly dropped
during the PRD's reorganization.

This is a mapping reference, not a standing decision — if the PRD is
restructured again, the signed scope changes, or a pending item gets
built, update this file to match rather than letting it go stale. It does
not replace `docs/Traceability-Matrix.md`, which maps PRD sections
forward to the old prototype code (`App.jsx`) instead of back to the
signed Feature IDs.

**Status column key** — checked against the live database schema and the
actual backend/frontend code, not just documentation:
- **Done** — fully built and matches the signed requirement.
- **Partial** — something real is built, but part of the requirement is
  missing or works differently than specified (see the Notes column).
- **Not started** — no evidence of this in the schema or code yet.

**Current tally: 23 Done · 15 Partial · 12 Not started** (50 signed lines
tracked below).

---

## 1. Customer Account Management

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 5.1 | Account types (multi-location corporate, A/B/C/D class, diagnostic centers, clinics, dealers) | 1.1 Account Structure & Hierarchy | Partial | Hospital type and corporate grouping exist; A/B/C/D class field not built. **Resolved, Haroon confirmed 2026-09-14: parked for Phase 2**, not required for Phase 1 |
| 5.1 | Account segmentation by size, specialty, revenue potential | 1.2 Account Segmentation | Not started | Check with Haroon/Latheef Bhai whether this is required |
| 5.1 | Tier 1 / Tier 2 dropdown | 1.3 Customer Tiering | Not started | Check with Haroon/Latheef Bhai whether this is required |
| 5.2 | Stakeholder phone, WhatsApp, email | 1.4 Customer Profile Management → Stakeholder Management | Done | |
| 5.2 | Good Paymaster / Problematic Payer flag | 1.5 Financial Categorization | Done (exceeds spec) | Includes an extra "Average" middle rating not asked for |
| 5.2 | Promoter / Neutral / Detractor sentiment tagging | 1.6 Customer Health & Sentiment | Done | Sentiment is marked at Stakeholder level |
| 5.2 | Unified purchase history + installed equipment view | 1.7 Customer Intelligence View | Done | Customer 360 screen |
| 10.1 | Post-install / post-service feedback capture | 1.8 Feedback Collection | Done | Sales Rep can add an Activity at Account level or Opportunity level to document post-install / post-service feedback. Signed doc's own note says this was "moved from Activity Tracking" — PRD already places it here too |

## 2. Product Catalog Management

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 4.1 | Strict product hierarchy: category → brand → model | 2.1 Product Structure | Partial | SBU → Category → Brand (OEM) → Model are all captured, but Category and Brand are free-text entry — no controlled/enforced pick-list, so inconsistent entries (e.g. "GE" vs "GE Healthcare") aren't prevented |
| 4.1 | Spec/config linking from company website | 2.2 Product Information | Done | A link (URL) to any page, including the company website's spec page, can be attached to a product |
| 4.1 | Collateral attachments (brochures, spec sheets, pricing guides, training videos) | 2.3 Sales Collateral Management | Done | Link-based, not file-upload-based: a URL is pasted in and categorized as Brochure / Video / Image / Other per product |
| 17.5 | Training & enablement URL/resource linking | 2.4 Training & Enablement | Done | Covered by the same product link mechanism (Video type, or Other for general resources) |

## 3. Opportunity Management

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 1.1 | Lead source, campaign, region capture | 3.1 Lead Capture | Done | |
| 1.3 | Stage pipeline (Scanning→Qualified→Demo→Negotiation→Closure) with time-in-stage limits by product category | 3.3 Opportunity Lifecycle + 3.4 Stage Exit Criteria | Partial | Stages and gates fully built; today's stagnation limit is still one flat 180-day global number. **Resolved, Haroon confirmed 2026-09-14:** real per-stage thresholds (Lead 14d, Qualified 7d, Demo 7d, Negotiation 5d, Order 2d, Delivery & Installation 30d — see `Business-Rules.md`'s BR-OP-06), configurable per SBU, seeded the same for Imaging and Critical Care today. Not built yet — scheduled this week, see `docs/Phase1-Completion-Sprint-Plan.md` |
| 1.3 | Systematic + manual win probability | 3.7 Win Probability Management | Done | |
| 1.3 | Mandatory closure date at Negotiation | 3.4 Stage Exit Criteria → Negotiation | Done | Sensibly exempted for repeat orders |
| 1.4 | Lost deal intelligence: messages, loss analysis, competitor tagging | 3.10 Lost Deal Intelligence | Partial | Loss reason and competitor name captured; competitor-product field still missing. The rolled-up loss report gap is now tracked as its own row in Module 5 (Competitive Loss Report) |
| 2.2 | Kanban pipeline sorted by probability/priority | 3.8 Pipeline Management | Partial | Stage columns are in a fixed order that loosely tracks probability (each stage has a default win probability), but deal cards within a column aren't sorted by anything — not probability, not priority |
| 2.2 | Manual High Priority toggle | 3.9 Deal Prioritization | Not started | Raised 2026-09-11, resolved 2026-09-14 — Haroon confirmed the rule (see `Business-Rules.md`'s BR-OP-15): any deal past Demo stage is automatically High Priority; a manual flag covers Lead/Qualified/Demo deals that don't qualify yet. Not built, scheduled this week |
| 2.2 | Pipeline filters by region, product, salesperson | 3.8 Pipeline Management | Partial | Region (Zone) and salesperson (Owner) filters exist on the Pipeline board itself. Product filtering deliberately won't be added to the board — Basheer's decision, 2026-09-14: it belongs on the standalone Pipeline Report (PRD 5.6 Core Reports, scheduled to build) instead of the Kanban filter bar |
| 2.2 | Manager "Push Logging" | 3.12 Manager Push Logging | Done | |
| 9.2 | Deal-level competitive intelligence | 3.11 Competitive Intelligence | Done | The detailed spec defines this as being "captured as part of the interaction documentation" — a Sales Rep can already record competitor intel as a free-text Activity note on the Opportunity; no separate structured field is required |

## 4. Activity Tracking & Next Actions

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 1.2 | Pre-lead scanning (marketing visits, no active lead) | 3.2 Pre-Lead Scanning | Done | **Placement mismatch** — signed doc files this under Activity Tracking; PRD keeps it under Opportunity Management. Content matches; module placement doesn't. See Open Item below |
| 6.1 | Demo outcome tracking + demo-to-sale conversion | 4.2 Demo Management | Partial | Demo Start/End Date is a proper field; outcome is only captured if the rep chooses to write it into the Activity note tied to the deal — no dedicated outcome field, and nothing blocks the deal from advancing if it's skipped. Conversion-rate reporting is now tracked separately in Module 5 (Reporting & Review) |
| 6.2 | Field visit logging with purpose/outcome dropdowns | 4.1 Field Visit Management | Done | Rep picks the activity type (Visit, Call, Email, Meeting...) from a dropdown, then records purpose/outcome as free text within that entry — satisfies the PRD's "capture visit purpose, outcome, notes" ask without a second dropdown specifically for purpose/outcome |
| 9.1 | Mandatory interaction summaries for completed deals | 4.3 Interaction Logging (also 4.6 Knowledge Repository) | Done | |
| 13.1 | Automated follow-up reminders | 4.4 Workflow Automation | Done | |
| 13.2 | Automated stagnant-deal alerts | 4.5 Pipeline Aging Alerts | Partial | A stagnant-deals report exists; no automated flip/notification when a deal goes stale — no scheduler exists yet. Exact rule now fully specified (BR-OP-06: per-stage/SBU thresholds, auto-flip to Stalled, notify the rep + their immediate manager) — ready to build, scheduled this week |

## 5. Reporting & Review

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 2.5 | Weighted/unweighted forecasting by month/quarter/product; <3x-target low-pipeline alert | 5.1 Forecasting + 5.2 Pipeline Coverage Monitoring | Partial | Forecast values are calculated by stage, rep, SBU, and zone — never by month/quarter or by product, both of which the requirement asked for. The month/quarter gap also needs Target Management (Module 6), which isn't built yet |
| 3.2 | Real-time actual-vs-target via role-specific dashboards | 5.3/5.4/5.5 Salesperson/Manager/GM Dashboard | Partial | Insights Dashboard live with role-based visibility; no GM-specific widgets yet |
| 4.3 | Revenue per product/brand analytics | Appendix A.1 Reporting Principles (also 5.6 Core Reports) | Partial | Product-level revenue/quantity/price and brand grouping are both built and were verified live 2026-09-11 (Product Performance report's By-Brand option, `product.oem_name` used as brand); Margin is still missing but no longer blocked — **Haroon confirmed 2026-09-14 that product cost can be added**, restricted strictly to Admin/GM (see `Business-Rules.md`'s BR-CAT-04), and Margin itself carries the same restriction wherever it's shown. Not built yet |
| 6.1 | Demo-to-sale conversion report | 4.2 Demo Management | Not started | No report exists showing what share of demos actually convert to a sale. See 4.2 Demo Management (Module 4) for demo outcome capture status |
| 11.1 | Core reports: sales, pipeline, product qty/price/margin | 5.6 Core Reports | Partial | PRD 5.6 asks for four report types (Sales, Pipeline, Product Performance, Margin). Only Product Performance exists as a named report. No standalone Pipeline Report exists — pipeline numbers only live inside the Insights Dashboard's "Pipeline Value" widget, broken down by Stage/Rep/SBU/Zone, not by product; product breakdown now scheduled via this report, see Feature 2.2's Pipeline filter row. No Sales Report exists as a distinct screen. No Margin Report exists yet, but the blocker is resolved — Haroon confirmed 2026-09-14 that product cost can be captured, Admin/GM-only (BR-CAT-04), and the Margin Report inherits that same restriction |
| 11.1 | Exception report: zero lead activity over 3 months | 5.7 Exception Reports | Not started | No such report exists |
| 11.1 | Phase 1 analytics: conversion, pipeline aging, salesperson performance | Appendix A.1 Reporting Principles | Partial | Conversion derivable from won/lost counts; pipeline aging deliberately deferred — no stage-history table. The rolled-up loss report gap is now tracked as its own row below (Competitive Loss Report) |
| 1.4 | Competitive Loss Report | Appendix A.3.5 Competitive Loss Report (also 5.5 GM Dashboard) | Not started | No summary exists across all lost deals — no way to see, e.g., "we lose most often to Siemens" or "our #1 loss reason is Price"; each loss just sits on its own deal record. See 3.10 Lost Deal Intelligence (Module 3) for the underlying data already captured |
| 11.1 | Weekly Follow-up Report | 5.8 Weekly Follow-up Report | Not started | Also blocked on the missing High Priority field |
| 11.2 | Region → Team → Individual drill-down | 5.9 Drill-down Reporting | Partial | Reports filter by region/team/person; no dedicated drill-down UI |

## 6. Admin (Power User): Organization & Sales Governance

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| *(untagged)* | Basic Beat Planning, upgradable to Google Maps tracking in Phase 2 | 6.1 Beat Planning | Not started | This is the same feature as "Coverage Planning" internally — PRD 6.1's ask (hospitals to cover, planned visits, strategic objective, expected revenue) matches `docs/Coverage-Planning-Implementation-Plan.md` field-for-field. Not a separate gap: already fully scoped, all decisions resolved 2026-09-11 (`docs/Backlog.md`, Milestone 2), just not built yet — queued behind Target Planning |
| 2.1 | Territory & Ownership Mapping; multiple reps owning separate opportunities at one hospital | 6.2 Geographic Coverage & Ownership Mapping | Done | Zone Management, User-to-Zone Assignment, Zone-based Reporting and Zone-based Visibility (all five things PRD 6.2 actually lists) are all built; multi-rep ownership per account already works too. PRD 6.2 itself defers a full "Territory" entity to a future phase, so its absence isn't a gap. One thing PRD 6.2 does ask for and isn't built — a hospital's Zone being derived automatically from its PIN code, rather than picked by hand — is a deliberate Phase 1 call (Basheer, 2026-09-14): minimal data entry over automation, and would need Kerala/Karnataka's full postal code table replicated in the system. Parked as a Phase 2 idea in `docs/Backlog.md` |
| *(untagged, optional)* | Account Manager role per customer | 6.3 Account Manager Assignment | Not started | Not yet conceptualized; needs leadership sign-off before design starts, per plan |
| 3.1 | Sales target configuration: individual, team, regional | 6.4 Target Management | Not started | Database table exists; no API or screen built |
| 3.1 | Target splitting by product category, quarterly/annual tracking | 6.5 Product Category Targets | Not started | Same dependency as Target Management |
| 4.2 | Product-team mapping (who's authorized to sell what) | 6.6 Product-Team Mapping | Done | Enforced end-to-end at the business-rule layer (BR-OP-11/BR-OP-12): a rep's Opportunity is created in their own SBU by default, and a Product can only be added to an Opportunity if the product's own SBU matches — an Imaging rep's deal genuinely cannot take a Critical Care product, rejected server-side, not just hidden in the UI |
| 13.1 | Automated lead reassignment workflow, manager/admin approval | 6.7 Workflow Rules | Done | A manager can already reassign an Opportunity's owner to anyone in their own visible team (the owner picker is tier-visibility-scoped, same restriction as Split participants) — covers the actual ask. The "Admin/GM approval" half was flagged as optional/"future phases" in Cabio's own signed requirement text, so its absence isn't counted as a gap |

## 6b. Admin (Power User): User Roles & Access Control

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 4.1 | Collateral access restricted to managers/authorized staff | 7. User Roles & Access Control Module → Collateral Security | Not started | Today, any logged-in user of any role can view and edit the Product Catalog — nothing restricts it beyond general business-unit isolation, so there's no partial progress to credit yet. **Planned (Basheer, 2026-09-14): restrict Product Catalog access to Admin/GM only** — a clean on/off gate, will flip straight to Done once shipped. Same Feature ID (4.1) as the Product Structure requirements in Module 2 — the signed doc treats catalog structure and catalog security as one umbrella feature |
| 12.1, 12.2 | Roles (Salesperson/Manager/GM/Admin); hierarchy-based and cross-region visibility limits | 7. User Roles & Access Control Module → Roles, Access Control | Done (exceeds spec) | Enforced at the database level via Row-Level Security, not just app-level checks — a stronger guarantee than asked for |

## 7. System & Architecture Constraints

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 14.1, 14.2 | Responsive Web App (iOS/Android), simple UI minimizing manual entry | 10. System & Architecture Constraints → Mobility & UX | Done (exceeds spec) | Installable as a Progressive Web App, not just a responsive site |
| 15.1, 15.2, 16.1, 16.2 | Cloud deployment, API-first architecture, multi-region scalability, hybrid database | 10. System & Architecture Constraints → Technical Architecture, Scalability Requirements, Database Design | Done | Cloud/API-first/scalable foundation is done. The "hybrid database" half is also done — real PDF/JPEG/PNG files are uploaded into Supabase Storage at the Opportunity level (`document.storage_path`, 4MB limit, signed download URLs), not just pasted links, sitting alongside the structured Postgres tables — exactly what PRD 10's "Database Design: Structured data / Unstructured data" asks for |
| 16.1, 16.2, 16.3, 16.4 | Cloud deployment; hybrid DB; role-based access, encryption, backup/DR frequency | 10. System & Architecture Constraints → Database Design, Security & Compliance | Partial | RBAC done thoroughly; encryption relies on the hosting provider's standard protections; a tested backup process exists for UAT only, not yet for the live day-to-day database |

---

## Open item to resolve

**Pre-Lead Scanning (Feature 1.2)** is the one place content and module
placement disagree, not just numbering: the signed scope groups it under
Activity Tracking, the PRD keeps it under Opportunity Management (as
`3.2`). Two ways to close this out:

1. Leave it in the PRD's Opportunity Management module (it fits the
   surrounding lifecycle narrative there) and just note the placement
   difference — no document change needed beyond this matrix entry.
2. Move `3.2 Pre-Lead Scanning` into the PRD's Activity Tracking module to
   match the signed document exactly, renumbering it into that module's
   sequence.

Recommend option 1 unless the signed document's structure itself needs to
be presentable section-for-section to Cabio leadership — in which case
option 2 keeps the two documents fully parallel.

## PRD sections without a corresponding signed Feature ID

These exist in the PRD as implementation detail or elaboration on a
signed feature, not as separate signed line items — listed here so they
don't get mistaken for untracked scope creep when reconciling the two
documents:

- 3.5 Opportunity Ownership, 3.6 Project Opportunity Management, 3.13
  Closed-Won Handover — detail under the signed Opportunity Lifecycle
  requirement (1.3)
- 6.3A Customer Ownership Management — detail under Account Manager
  Assignment (untagged, optional in the signed scope)
- 5.10–5.14 (Installed Base Summary, Warranty Expiry, Customer Portfolio,
  Opportunity Hold, Revenue Attribution reports) — elaboration beyond the
  signed Core Reports requirement (11.1)
- Module 8 (Business Rules & Governance) and Module 9 (Audit & History)
  — cross-cutting rules supporting multiple signed features, not
  standalone signed line items themselves
- Appendix B (Enterprise Data Model) — the underlying data design, not a
  user-facing requirement
