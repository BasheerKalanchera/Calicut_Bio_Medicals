# Phase 1 Delivery Scorecard

**Prepared:** 13 Sep 2026
**Scope:** A line-by-line check of every signed-off Phase 1 requirement against what is actually built today — verified against the live database schema and the actual backend/frontend code, not just documentation — plus everything delivered beyond that original list.

Requirement rows below are pulled directly from `docs/Signed-Requirements-to-PRD-Traceability.md`, which is the working reference if a Signed Feature ID or PRD Section needs to be looked up or updated. This document is the leadership-facing summary of the same data.

## Summary

Of **48** signed requirements: **18 done, 18 partly done, 12 not started** — plus **15 features built that weren't asked for at all** (see "Commitment beyond contract" at the end).

| Done | Partly done | Not started | Built, unasked |
| :---: | :---: | :---: | :---: |
| 18 | 18 | 12 | 15 |

---

## 1. Customer Account Management

Where every hospital, clinic and dealer account is set up, described and tracked.

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

Where every machine Cabio sells is described, organised and backed with sales materials.

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 4.1 | Strict product hierarchy: category → brand → model | 2.1 Product Structure | Partial | SBU → Category → Brand (OEM) → Model are all captured, but Category and Brand are free-text entry — no controlled/enforced pick-list, so inconsistent entries (e.g. "GE" vs "GE Healthcare") aren't prevented |
| 4.1 | Spec/config linking from company website | 2.2 Product Information | Done | A link (URL) to any page, including the company website's spec page, can be attached to a product |
| 4.1 | Collateral attachments (brochures, spec sheets, pricing guides, training videos) | 2.3 Sales Collateral Management | Done | Link-based, not file-upload-based: a URL is pasted in and categorized as Brochure / Video / Image / Other per product |
| 17.5 | Training & enablement URL/resource linking | 2.4 Training & Enablement | Done | Covered by the same product link mechanism (Video type, or Other for general resources) |

## 3. Opportunity Management

Where every sales deal is tracked from first contact through to close.

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 1.1 | Lead source, campaign, region capture | 3.1 Lead Capture | Done | |
| 1.3 | Stage pipeline (Scanning→Qualified→Demo→Negotiation→Closure) with time-in-stage limits by product category | 3.3 Opportunity Lifecycle + 3.4 Stage Exit Criteria | Partial | Stages and gates fully built; stagnation limit is one global threshold, not per product category. Please check with Haroon if that is fine |
| 1.3 | Systematic + manual win probability | 3.7 Win Probability Management | Done | |
| 1.3 | Mandatory closure date at Negotiation | 3.4 Stage Exit Criteria → Negotiation | Done | Sensibly exempted for repeat orders |
| 1.4 | Lost deal intelligence: messages, loss analysis, competitor tagging | 3.10 Lost Deal Intelligence | Partial | Loss reason and competitor name captured; no competitor-product field or rolled-up loss report |
| 2.2 | Kanban pipeline sorted by probability/priority | 3.8 Pipeline Management | Partial | Stage columns are in a fixed order that loosely tracks probability (each stage has a default win probability), but deal cards within a column aren't sorted by anything — not probability, not priority |
| 2.2 | Manual High Priority toggle | 3.9 Deal Prioritization | Not started | Raised 2026-09-11; a proposal is already with Basheer for leadership |
| 2.2 | Pipeline filters by region, product, salesperson | 3.8 Pipeline Management | Partial | Region (Zone) and salesperson (Owner) filters exist on the Pipeline board itself; product filtering does not — it's only available in the separate Reporting module. Now in `docs/Backlog.md` pending a leadership decision on whether it's needed and where it belongs |
| 2.2 | Manager "Push Logging" | 3.12 Manager Push Logging | Done | |
| 9.2 | Deal-level competitive intelligence | 3.11 Competitive Intelligence | Done | The detailed spec defines this as being "captured as part of the interaction documentation" — a Sales Rep can already record competitor intel as a free-text Activity note on the Opportunity; no separate structured field is required |

## 4. Activity Tracking & Next Actions

Where every visit, call and follow-up gets logged.

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 1.2 | Pre-lead scanning (marketing visits, no active lead) | 3.2 Pre-Lead Scanning | Done | **Placement mismatch** — signed doc files this under Activity Tracking; PRD keeps it under Opportunity Management. Content matches; module placement doesn't |
| 6.1 | Demo outcome tracking + demo-to-sale conversion | 4.2 Demo Management | Partial | Demo dates and outcome gate exist; no conversion-rate report |
| 6.2 | Field visit logging with purpose/outcome dropdowns | 4.1 Field Visit Management | Partial | Visits are logged, but purpose/outcome are free text, not dropdowns |
| 9.1 | Mandatory interaction summaries for completed deals | 4.3 Interaction Logging (also 4.6 Knowledge Repository) | Done | |
| 13.1 | Automated follow-up reminders | 4.4 Workflow Automation | Done | |
| 13.2 | Automated stagnant-deal alerts | 4.5 Pipeline Aging Alerts | Partial | A stagnant-deals report exists; no automated flip/notification when a deal goes stale — no scheduler exists yet |

## 5. Reporting & Review

Where leadership and managers see how the business is doing.

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

## 6. Governance & Admin

The management tools behind the scenes — targets, territories, roles, and who's authorised to sell what.

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| *(untagged)* | Basic Beat Planning, upgradable to Google Maps tracking in Phase 2 | 6.1 Beat Planning | Not started | Database tables exist; no API or screen built |
| 2.1 | Territory & Ownership Mapping; multiple reps owning separate opportunities at one hospital | 6.2 Geographic Coverage & Ownership Mapping | Partial | Nested zone hierarchy acts as territory; multi-rep ownership per account already works; no distinct "Territory" entity |
| *(untagged, optional)* | Account Manager role per customer | 6.3 Account Manager Assignment | Not started | Not yet conceptualized; needs leadership sign-off before design starts, per plan |
| 3.1 | Sales target configuration: individual, team, regional | 6.4 Target Management | Not started | Database table exists; no API or screen built |
| 3.1 | Target splitting by product category, quarterly/annual tracking | 6.5 Product Category Targets | Not started | Same dependency as Target Management |
| 4.2 | Product-team mapping (who's authorized to sell what) | 6.6 Product-Team Mapping | Not started | No mapping table found |
| 13.1 | Automated lead reassignment workflow, manager/admin approval | 6.7 Workflow Rules | Not started | No such workflow logic found |

### 6b. User Roles & Access Control

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 4.1 | Collateral access restricted to managers/authorized staff | 7. User Roles & Access Control Module → Collateral Security | Not started | Collateral isn't classified by type yet (Module 2), so there's nothing specific to restrict beyond general business-unit isolation |
| 12.1, 12.2 | Roles (Salesperson/Manager/GM/Admin); hierarchy-based and cross-region visibility limits | 7. User Roles & Access Control Module → Roles, Access Control | Done (exceeds spec) | Enforced at the database level via Row-Level Security, not just app-level checks — a stronger guarantee than asked for |

## 7. Technical Foundation

The plumbing underneath — hosting, security, and disaster recovery.

| Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| 14.1, 14.2 | Responsive Web App (iOS/Android), simple UI minimizing manual entry | 10. System & Architecture Constraints → Mobility & UX | Done (exceeds spec) | Installable as a Progressive Web App, not just a responsive site |
| 15.1, 15.2, 16.1, 16.2 | Cloud deployment, API-first architecture, multi-region scalability, hybrid database | 10. System & Architecture Constraints → Technical Architecture, Scalability Requirements, Database Design | Partial | Cloud/API-first/scalable foundation is done; the "hybrid database" half is limited — only `jsonb` fields for semi-structured data, no true document/blob store |
| 16.1, 16.2, 16.3, 16.4 | Cloud deployment; hybrid DB; role-based access, encryption, backup/DR frequency | 10. System & Architecture Constraints → Database Design, Security & Compliance | Partial | RBAC done thoroughly; encryption relies on the hosting provider's standard protections; a tested backup process exists for UAT only, not yet for the live day-to-day database |

---

## Commitment beyond contract

Following items were not part of the requirements that were signed off by Cabio leadership team.

| # | What we built |
| :---: | :--- |
| 1 | Access rules aren't just checked by the app — they're built into the database itself, so even a bug in the app code can't leak one region's data into another's. |
| 2 | The web app can be added to a phone's home screen and opened like any other app — no App Store needed. |
| 3 | Warns a rep in real time if they're about to create a hospital account that likely already exists — built after two real deals nearly got tangled up in duplicate records. |
| 4 | A manager or teammate can reply directly on a rep's field note, instead of starting a separate conversation about it. |
| 5 | Lets a rep skip a pipeline checkpoint for a documented reason, with a named manager's sign-off automatically recorded and that manager notified. |
| 6 | Recognises when a customer is simply reordering the same equipment at the same price, and skips the redundant demo/negotiation steps — an estimated 4 in 10 real deals. |
| 7 | Records who introduced a deal — a colleague or an outside contact — as its own credit, without touching the revenue split. |
| 8 | Training attended, certifications earned, conferences and seminars can all be logged as their own activity, building a record of the team's growth over time. |
| 9 | A narrow, deliberate exception lets someone outside a deal's own team log a supportive customer contact without breaching that team's data boundary. |
| 10 | A deal's value can already net out a customer's traded-in equipment against the new sale — a real pricing scenario the original ask never covered. |
| 11 | IndiaMART and other marketing-sourced leads get their own review queue before they're promoted into a real sales deal — a whole extra front door onto the pipeline. |
| 12 | Bell-icon notifications for routine updates, and a separate interrupting alert for anything urgent, like a manager's note or a gate-override sign-off. |
| 13 | An audit log screen was added to track every change or deletion made to key records in the system — customer accounts, sales deals, the products/line items on each deal, the product catalog, revenue splits between team members, contact people at each hospital, and staff user accounts. The signed requirement only asked that this history be recorded somewhere; a full screen was built so anyone authorised can search and read it themselves, without needing a developer to dig through the database. *(Covers the `account`, `opportunity`, `opportunity_item`, `product`, `split`, `stakeholder` and `user_profile` tables.)* |
| 14 | The sales team has already started entering real, live deals into the environment used for testing the system before go-live — so when it moves to production, that work carries straight over instead of being re-entered from scratch. Because real business data is at stake there already, it's backed up and its recoverability verified on the same schedule a live system would get, with copies kept on an external hard disk for disaster recovery — not treated as disposable test data. |
| 15 | The catalogue already recognises refurbished equipment and accessories as their own category, not just new machines. |
