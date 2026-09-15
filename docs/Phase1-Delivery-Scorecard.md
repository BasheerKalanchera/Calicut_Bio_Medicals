# Phase 1 Delivery Scorecard

**Prepared:** 13 Sep 2026 · **Generated from `docs/Signed-Requirements-to-PRD-Traceability.md`** by `scripts/generate_scorecard.py` — do not hand-edit this file.
**Scope:** A line-by-line check of every signed-off Phase 1 requirement against what is actually built today — verified against the live database schema and the actual backend/frontend code, not just documentation — plus everything delivered beyond that original list.

## Summary

Of **50** signed requirements: **26 done, 14 partly done, 10 not started** — plus **15 features built that weren't asked for at all** (see "Commitment beyond contract" at the end).

| Done | Partly done | Not started | New Features Added |
| :---: | :---: | :---: | :---: |
| 26 | 14 | 10 | 15 |

**Real progress, two honest ways to read it:**
- **Strictly done:** 26 of 50 = **52.0%**
- **Counting partly-done items as half-credit** (the fairer "real progress" number, since 14 items aren't zero — they're mid-flight): (26 + 14×0.5) ÷ 50 = **66.0%**

---

## 1. Customer Account Management

Where every hospital, clinic and dealer account is set up, described and tracked.

| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | 5.1 | Account types (multi-location corporate, A/B/C/D class, diagnostic centers, clinics, dealers) | 1.1 Account Structure & Hierarchy | Partial | Hospital records capture type and corporate grouping today; the A/B/C/D classification tier is parked for a later phase. |
| 2 | 5.1 | Account segmentation by size, specialty, revenue potential | 1.2 Account Segmentation | Not started |  |
| 3 | 5.1 | Tier 1 / Tier 2 dropdown | 1.3 Customer Tiering | Not started |  |
| 4 | 5.2 | Stakeholder phone, WhatsApp, email | 1.4 Customer Profile Management → Stakeholder Management | Done |  |
| 5 | 5.2 | Good Paymaster / Problematic Payer flag | 1.5 Financial Categorization | Done (exceeds spec) |  |
| 6 | 5.2 | Promoter / Neutral / Detractor sentiment tagging | 1.6 Customer Health & Sentiment | Done |  |
| 7 | 5.2 | Unified purchase history + installed equipment view | 1.7 Customer Intelligence View | Done |  |
| 8 | 10.1 | Post-install / post-service feedback capture | 1.8 Feedback Collection | Done |  |

## 2. Product Catalog Management

Where every machine Cabio sells is described, organised and backed with sales materials.

| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 9 | 4.1 | Strict product hierarchy: category → brand → model | 2.1 Product Structure | Partial | Product categories and brands are captured today as free text rather than a fixed list, so naming can vary slightly between entries. |
| 10 | 4.1 | Spec/config linking from company website | 2.2 Product Information | Done |  |
| 11 | 4.1 | Collateral attachments (brochures, spec sheets, pricing guides, training videos) | 2.3 Sales Collateral Management | Done |  |
| 12 | 17.5 | Training & enablement URL/resource linking | 2.4 Training & Enablement | Done |  |

## 3. Opportunity Management

Where every sales deal is tracked from first contact through to close.

| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 13 | 1.1 | Lead source, campaign, region capture | 3.1 Lead Capture | Done |  |
| 14 | 1.3 | Stage pipeline (Scanning→Qualified→Demo→Negotiation→Closure) with time-in-stage limits by product category | 3.3 Opportunity Lifecycle + 3.4 Stage Exit Criteria | Partial | Deal stages and approval checkpoints are fully in place. Stage-specific time limits, so a stalled deal gets flagged sooner, are defined and scheduled to go live shortly. |
| 15 | 1.3 | Systematic + manual win probability | 3.7 Win Probability Management | Done |  |
| 16 | 1.3 | Mandatory closure date at Negotiation | 3.4 Stage Exit Criteria → Negotiation | Done |  |
| 17 | 1.4 | Lost deal intelligence: messages, loss analysis, competitor tagging | 3.10 Lost Deal Intelligence | Partial | Reasons and competitors are captured for every lost deal; a field for the specific competing product is still to be added. |
| 18 | 2.2 | Kanban pipeline sorted by probability/priority | 3.8 Pipeline Management | Done |  |
| 19 | 2.2 | Manual High Priority toggle | 3.9 Deal Prioritization | Done |  |
| 20 | 2.2 | Pipeline filters by region, product, salesperson | 3.8 Pipeline Management | Partial | Region and salesperson filtering are live on the pipeline board today. Product filtering will be available on the upcoming Pipeline Report instead. |
| 21 | 2.2 | Manager "Push Logging" | 3.12 Manager Push Logging | Done |  |
| 22 | 9.2 | Deal-level competitive intelligence | 3.11 Competitive Intelligence | Done |  |

## 4. Activity Tracking & Next Actions

Where every visit, call and follow-up gets logged.

| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 23 | 1.2 | Pre-lead scanning (marketing visits, no active lead) | 3.2 Pre-Lead Scanning | Done |  |
| 24 | 6.1 | Demo outcome tracking + demo-to-sale conversion | 4.2 Demo Management | Partial | Demo scheduling is fully tracked. Recording each demo's outcome is optional today rather than required, and there's no report yet showing what share of demos convert to a sale. |
| 25 | 6.2 | Field visit logging with purpose/outcome dropdowns | 4.1 Field Visit Management | Done |  |
| 26 | 9.1 | Mandatory interaction summaries for completed deals | 4.3 Interaction Logging (also 4.6 Knowledge Repository) | Done |  |
| 27 | 13.1 | Automated follow-up reminders | 4.4 Workflow Automation | Done |  |
| 28 | 13.2 | Automated stagnant-deal alerts | 4.5 Pipeline Aging Alerts | Partial | A report already shows deals that have gone quiet. Automatic alerts to reps and managers the moment a deal stalls aren't live yet — scheduled shortly. |

## 5. Reporting & Review

Where leadership and managers see how the business is doing.

| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 29 | 2.5 | Weighted/unweighted forecasting by month/quarter/product; <3x-target low-pipeline alert | 5.1 Forecasting + 5.2 Pipeline Coverage Monitoring | Partial | Forecasting broken down by product is live today. Forecasting by month/quarter, and an early-warning alert for a thin pipeline, are pending until Target Management is built. |
| 30 | 3.2 | Real-time actual-vs-target via role-specific dashboards | 5.3/5.4/5.5 Salesperson/Manager/GM Dashboard | Partial | Role-based dashboards are live today; a dedicated top-level leadership view is still to be added. |
| 31 | 4.3 | Revenue per product/brand analytics | Appendix A.1 Reporting Principles (also 5.6 Core Reports) | Partial | Revenue and brand-level reporting is live today. Margin reporting (cost versus price) is approved and scheduled, restricted to senior roles only. |
| 32 | 6.1 | Demo-to-sale conversion report | 4.2 Demo Management | Not started |  |
| 33 | 11.1 | Core reports: sales, pipeline, product qty/price/margin | 5.6 Core Reports | Partial | Product performance reporting is live today. Standalone Sales, Pipeline, and Margin reports are still to be built. |
| 34 | 11.1 | Exception report: zero lead activity over 3 months | 5.7 Exception Reports | Not started |  |
| 35 | 11.1 | Phase 1 analytics: conversion, pipeline aging, salesperson performance | Appendix A.1 Reporting Principles | Partial | Conversion figures are available today; pipeline-aging analysis (how long deals linger at each stage over time) is deferred to a later phase. |
| 36 | 1.4 | Competitive Loss Report | Appendix A.3.5 Competitive Loss Report (also 5.5 GM Dashboard) | Not started |  |
| 37 | 11.1 | Weekly Follow-up Report | 5.8 Weekly Follow-up Report | Not started |  |
| 38 | 11.2 | Region → Team → Individual drill-down | 5.9 Drill-down Reporting | Partial | Reports can already be filtered by region, team, or person; a dedicated click-through drill-down view is not yet built. |

## 6. Governance & Admin

The management tools behind the scenes — targets, territories, roles, and who's authorised to sell what.

| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 39 | *(untagged)* | Basic Beat Planning, upgradable to Google Maps tracking in Phase 2 | 6.1 Beat Planning | Not started |  |
| 40 | 2.1 | Territory & Ownership Mapping; multiple reps owning separate opportunities at one hospital | 6.2 Geographic Coverage & Ownership Mapping | Done |  |
| 41 | *(untagged, optional)* | Account Manager role per customer | 6.3 Account Manager Assignment | Not started |  |
| 42 | 3.1 | Sales target configuration: individual, team, regional | 6.4 Target Management | Not started |  |
| 43 | 3.1 | Target splitting by product category, quarterly/annual tracking | 6.5 Product Category Targets | Not started |  |
| 44 | 4.2 | Product-team mapping (who's authorized to sell what) | 6.6 Product-Team Mapping | Done |  |
| 45 | 13.1 | Automated lead reassignment workflow, manager/admin approval | 6.7 Workflow Rules | Done |  |

### 6b. User Roles & Access Control

| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 46 | 4.1 | Collateral access restricted to managers/authorized staff | 7. User Roles & Access Control Module → Collateral Security | Done |  |
| 47 | 12.1, 12.2 | Roles (Salesperson/Manager/GM/Admin); hierarchy-based and cross-region visibility limits | 7. User Roles & Access Control Module → Roles, Access Control | Done (exceeds spec) |  |

## 7. Technical Foundation

The plumbing underneath — hosting, security, and disaster recovery.

| # | Signed Feature ID | Requirement | PRD Section | Status | Notes |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 48 | 14.1, 14.2 | Responsive Web App (iOS/Android), simple UI minimizing manual entry | 10. System & Architecture Constraints → Mobility & UX | Done (exceeds spec) |  |
| 49 | 15.1, 15.2, 16.1, 16.2 | Cloud deployment, API-first architecture, multi-region scalability, hybrid database | 10. System & Architecture Constraints → Technical Architecture, Scalability Requirements, Database Design | Done |  |
| 50 | 16.1, 16.2, 16.3, 16.4 | Cloud deployment; hybrid DB; role-based access, encryption, backup/DR frequency | 10. System & Architecture Constraints → Database Design, Security & Compliance | Partial | Access control is fully enforced today. Data encryption relies on the hosting provider's standard protections. A tested backup process is in place for the test environment; the live environment's backup process is still to be finalized. |

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
