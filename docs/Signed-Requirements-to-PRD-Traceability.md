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

**Current tally: 18 Done · 18 Partial · 12 Not started** (48 signed lines
tracked below).

---

## 1. Customer Account Management

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 5.1 | Account types (multi-location corporate, A/B/C/D class, diagnostic centers, clinics, dealers) | 1.1 Account Structure & Hierarchy | Partial | Hospital type and corporate grouping exist; A/B/C/D class field not built — check with Haroon/Latheef Bhai whether this is required |
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
| 1.3 | Stage pipeline (Scanning→Qualified→Demo→Negotiation→Closure) with time-in-stage limits by product category | 3.3 Opportunity Lifecycle + 3.4 Stage Exit Criteria | Partial | Stages and gates fully built; stagnation limit is one global threshold, not per product category. Please check with Haroon if that is fine |
| 1.3 | Systematic + manual win probability | 3.7 Win Probability Management | Done | |
| 1.3 | Mandatory closure date at Negotiation | 3.4 Stage Exit Criteria → Negotiation | Done | Sensibly exempted for repeat orders |
| 1.4 | Lost deal intelligence: messages, loss analysis, competitor tagging | 3.10 Lost Deal Intelligence | Partial | Loss reason and competitor name captured; no competitor-product field or rolled-up loss report |
| 2.2 | Kanban pipeline sorted by probability/priority | 3.8 Pipeline Management | Partial | Stage columns are in a fixed order that loosely tracks probability (each stage has a default win probability), but deal cards within a column aren't sorted by anything — not probability, not priority |
| 2.2 | Manual High Priority toggle | 3.9 Deal Prioritization | Not started | Raised 2026-09-11; a proposal is already with you for leadership |
| 2.2 | Pipeline filters by region, product, salesperson | 3.8 Pipeline Management | Partial | Region (Zone) and salesperson (Owner) filters exist on the Pipeline board itself; product filtering does not — it's only available in the separate Reporting module. Now in `docs/Backlog.md` pending a leadership decision on whether it's needed and where it belongs |
| 2.2 | Manager "Push Logging" | 3.12 Manager Push Logging | Done | |
| 9.2 | Deal-level competitive intelligence | 3.11 Competitive Intelligence | Done | The detailed spec defines this as being "captured as part of the interaction documentation" — a Sales Rep can already record competitor intel as a free-text Activity note on the Opportunity; no separate structured field is required |

## 4. Activity Tracking & Next Actions

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 1.2 | Pre-lead scanning (marketing visits, no active lead) | 3.2 Pre-Lead Scanning | Done | **Placement mismatch** — signed doc files this under Activity Tracking; PRD keeps it under Opportunity Management. Content matches; module placement doesn't. See Open Item below |
| 6.1 | Demo outcome tracking + demo-to-sale conversion | 4.2 Demo Management | Partial | Demo dates and outcome gate exist; no conversion-rate report |
| 6.2 | Field visit logging with purpose/outcome dropdowns | 4.1 Field Visit Management | Partial | Visits are logged, but purpose/outcome are free text, not dropdowns |
| 9.1 | Mandatory interaction summaries for completed deals | 4.3 Interaction Logging (also 4.6 Knowledge Repository) | Done | |
| 13.1 | Automated follow-up reminders | 4.4 Workflow Automation | Done | |
| 13.2 | Automated stagnant-deal alerts | 4.5 Pipeline Aging Alerts | Partial | A stagnant-deals report exists; no automated flip/notification when a deal goes stale — no scheduler exists yet |

## 5. Reporting & Review

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 2.5 | Weighted/unweighted forecasting by month/quarter/product; <3x-target low-pipeline alert | 5.1 Forecasting + 5.2 Pipeline Coverage Monitoring | Partial | Forecast values calculated by team/region, not yet by month/quarter; 3x alert depends on Target Management, which isn't built yet (Module 6) |
| 3.2 | Real-time actual-vs-target via role-specific dashboards | 5.3/5.4/5.5 Salesperson/Manager/GM Dashboard | Partial | Insights Dashboard live with role-based visibility; no GM-specific widgets yet |
| 4.3 | Revenue per product/brand analytics | Appendix A.1 Reporting Principles (also 5.6 Core Reports) | Partial | Product-level revenue/quantity/price built; no brand grouping or margin, since product cost isn't stored |
| 11.1 | Core reports: sales, pipeline, product qty/price/margin | 5.6 Core Reports | Partial | PRD 5.6 asks for four report types (Sales, Pipeline, Product Performance, Margin). Only Product Performance exists as a named report. No standalone Pipeline Report exists — pipeline numbers only live inside the Insights Dashboard's "Pipeline Value" widget, broken down by Stage/Rep/SBU/Zone, not by product. No Sales Report exists as a distinct screen. No Margin Report exists — product cost isn't stored anywhere, so margin can't be calculated at all |
| 11.1 | Exception report: zero lead activity over 3 months | 5.7 Exception Reports | Not started | No such report exists |
| 11.1 | Phase 1 analytics: conversion, pipeline aging, salesperson performance | Appendix A.1 Reporting Principles | Partial | Conversion derivable from won/lost counts; pipeline aging deliberately deferred — no stage-history table. Also missing: a rolled-up loss report — there's no summary screen anywhere that would show, across all lost deals, "we lose most often to Siemens" or "our #1 loss reason is Price"; each loss just sits on its own deal record (see 3.10 Lost Deal Intelligence notes above) |
| 11.1 | Weekly Follow-up Report | 5.8 Weekly Follow-up Report | Not started | Also blocked on the missing High Priority field |
| 11.2 | Region → Team → Individual drill-down | 5.9 Drill-down Reporting | Partial | Reports filter by region/team/person; no dedicated drill-down UI |

## 6. Admin (Power User): Organization & Sales Governance

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| *(untagged)* | Basic Beat Planning, upgradable to Google Maps tracking in Phase 2 | 6.1 Beat Planning | Not started | Database tables exist; no API or screen built |
| 2.1 | Territory & Ownership Mapping; multiple reps owning separate opportunities at one hospital | 6.2 Geographic Coverage & Ownership Mapping | Partial | Nested zone hierarchy acts as territory; multi-rep ownership per account already works; no distinct "Territory" entity |
| *(untagged, optional)* | Account Manager role per customer | 6.3 Account Manager Assignment | Not started | Not yet conceptualized; needs leadership sign-off before design starts, per plan |
| 3.1 | Sales target configuration: individual, team, regional | 6.4 Target Management | Not started | Database table exists; no API or screen built |
| 3.1 | Target splitting by product category, quarterly/annual tracking | 6.5 Product Category Targets | Not started | Same dependency as Target Management |
| 4.2 | Product-team mapping (who's authorized to sell what) | 6.6 Product-Team Mapping | Not started | No mapping table found |
| 13.1 | Automated lead reassignment workflow, manager/admin approval | 6.7 Workflow Rules | Not started | No such workflow logic found |

## 6b. Admin (Power User): User Roles & Access Control

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 4.1 | Collateral access restricted to managers/authorized staff | 7. User Roles & Access Control Module → Collateral Security | Not started | Collateral isn't classified by type yet (Module 2), so there's nothing specific to restrict beyond general business-unit isolation. Same Feature ID (4.1) as the Product Structure requirements in Module 2 — the signed doc treats catalog structure and catalog security as one umbrella feature |
| 12.1, 12.2 | Roles (Salesperson/Manager/GM/Admin); hierarchy-based and cross-region visibility limits | 7. User Roles & Access Control Module → Roles, Access Control | Done (exceeds spec) | Enforced at the database level via Row-Level Security, not just app-level checks — a stronger guarantee than asked for |

## 7. System & Architecture Constraints

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 14.1, 14.2 | Responsive Web App (iOS/Android), simple UI minimizing manual entry | 10. System & Architecture Constraints → Mobility & UX | Done (exceeds spec) | Installable as a Progressive Web App, not just a responsive site |
| 15.1, 15.2, 16.1, 16.2 | Cloud deployment, API-first architecture, multi-region scalability, hybrid database | 10. System & Architecture Constraints → Technical Architecture, Scalability Requirements, Database Design | Partial | Cloud/API-first/scalable foundation is done; the "hybrid database" half is limited — only `jsonb` fields for semi-structured data, no true document/blob store |
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
