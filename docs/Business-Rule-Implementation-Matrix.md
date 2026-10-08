# Business Rule Implementation Matrix

Where in the code each rule in `docs/Business-Rules.md` is enforced — nothing
else. What a rule says, why, and open business questions live in
`Business-Rules.md`. Every rule there has exactly one row here; when a rule is
added, changed or removed, this file changes in the same commit (a
`commit-msg` hook in `.githooks/` refuses the commit otherwise).

Checked against the code 2026-10-08. Paths are under `backend/app/` unless
they start with `sales-os-app/`. "Not built" means the rule is decided but
nothing enforces it yet.

| Rule | Name | Where it's enforced | Notes |
| :--- | :--- | :--- | :--- |
| BR-PL-01 | Quota Hierarchy | `target_plan` table: `target_plan_unique (user_id, sbu_id, planning_period)`, `target_plan_planning_period_check` | |
| BR-PL-02 | Coverage Plan Strategy | — | Replaced by BR-PL-07 (2026-09); `coverage_plan_entry` dropped in migration 0055. |
| BR-PL-03 | Coverage Plan Traceability | — | Replaced by BR-PL-07 (2026-09); `coverage_plan` dropped in migration 0055. |
| BR-PL-04 | Opportunity Origination Classification | `lead_source` reference data only | No code checks it; Coverage Plans no longer exist (BR-PL-02/03). |
| BR-PL-05 | Revised Plan Below Approved Target | `TargetPlanService.update_target_plan` (keeps `previous_approved_total_lakhs`); `sales-os-app/` `TargetPlanDialog` | Warn only. |
| BR-PL-06 | Hospital at ₹0 Warning by Rating | `TargetPlanService._build_warnings` (`HIGH_POTENTIAL_ZERO` / `RATED_POTENTIAL_ZERO`); `TargetPlanDialog` | Warn only. |
| BR-PL-07 | Target Built From Hospitals | `TargetPlanService._validate_accounts` and submit checks (`domains/planning/service.py`); `target_plan_account` CHECKs (amount ≥ 0, visit frequency) | |
| BR-PL-08 | Revision Needs a Reason and Fresh Approval | `TargetPlanService.update_target_plan` (change note once submitted; any revision → pending approval); approve/reject latest-version check in the same service | |
| BR-PL-09 | Same-SBU Hospital Overlap Warning | `cabio_app_plan_overlap()` (SECURITY DEFINER); `TargetPlanService` | Warn only. |
| BR-OP-00 | Opportunity Creation Flexibility | `OpportunityService.create_opportunity` → `validate_stage_transition(current_stage_order=0)` (`domains/opportunity/validators.py`) | |
| BR-OP-01 | Stage Transition Exit Criteria | `validate_stage_transition` (`domains/opportunity/validators.py`) | Demo → Clinical Evaluation gate, Delivery Date and Installation Site not built (no fields yet). |
| BR-OP-02 | "On-Hold" Status Discipline | `validate_status_transition` (hold reason, future reactivation date); audit via `trg_audit_opportunity` | "Reactivation Overdue" flag not built. |
| BR-OP-03 | Lost Status Validation | `validate_status_transition` (loss reason; competitor name when `COMPETITOR_WON`) | |
| BR-OP-04 | Opportunity Project Association | `opportunity.project_id` nullable FK | |
| BR-OP-05 | Status Transition Rules | `validate_status_transition` (Won needs PO Number, PO Date, products) | |
| BR-OP-06 | Stalled Opportunity Detection | Not built | No scheduler; nothing sets Stalled. The Pipeline Report's stagnation view (`domains/reporting/repository.py`) only lists overdue Opportunities. |
| BR-OP-07 | Forecasting & Pipeline Inclusion | `domains/reporting/repository.py` (open pipeline = non-terminal statuses; On Hold listed separately); `domains/planning/repository.py` (Target vs Actuals) | Stalled exclusion moot until BR-OP-06 is built. |
| BR-OP-08 | Win Probability Rules | Range: `OpportunityCreate`/`OpportunityUpdate` (0–100) and `ck_opportunity_win_probability`. Stage default: filled in by the screens (`OpportunityDetailScreen.tsx`, `QuickLeadModal.tsx`, `Customer360Screen.tsx`) | Not enforced: "a manual value survives a stage change" — the edit form resets it to the stage default when the stage is changed. |
| BR-OP-09 | Terminal Status Governance | `validate_status_transition` (no leaving Won/Lost); `OpportunityService.update_opportunity` (stage frozen on Won/Lost); audit via `trg_audit_opportunity` | |
| BR-OP-10 | Default Opportunity Status | `OpportunityService.create_opportunity` (refuses Won; Lost/On Hold fail `validate_status_transition` without their reasons) | No server-side default — the screens send Active. |
| BR-OP-11 | Opportunity Item Product SBU Eligibility | `OpportunityService._validate_item_sbus` (create, `add_item`, `replace_items`) | |
| BR-OP-12 | Opportunity Creation SBU Override | `OpportunityService.create_opportunity` (`_SBU_OVERRIDE_ROLES`); `sbu_id` absent from `OpportunityUpdate` | |
| BR-OP-13 | REPEAT_ORDER Fast-Track | `validate_stage_transition` (`lead_source_name == "REPEAT_ORDER"`) | |
| BR-OP-14 | Manager-Attested Gate Override | `validate_stage_transition`; `OpportunityService._validate_gate_override`; stamping and `GATE_OVERRIDE_NAMED` in create/update; `ck_opportunity_gate_override_reason_required` | |
| BR-OP-15 | High Priority Opportunity Flag | `opportunity.high_priority_manual` (migration 0042); `PipelineOpportunity.is_high_priority` (`domains/opportunity/schemas.py`) | |
| BR-OP-16 | Closing Date Passed | `TargetVsActualRepository.late_opportunities` (`domains/planning/repository.py`) | Built on Dev (`cc4eb91`, split-aware `2e2e4c0`); E2E pending. Flag only. |
| BR-OP-17 | Payment Confirmation Before Won | `validate_status_transition` (saved at Payment Pending before and after, `confirm_full_payment`; fails closed); `OpportunityService.create_opportunity` refuses Won; `update_opportunity` stamps `full_payment_confirmed_at/_by` and the note. Migrations 0057, 0058 | |
| BR-OP-18 | Open Opportunities Stay With an Owner in Their SBU | Not built | Planned: `UserService.update_user`, `OpportunityService.update_opportunity`. Backlog "Block an SBU change while the user owns open Opportunities in another SBU". |
| BR-CAT-01 | Catalog Visibility Is Company-Wide | `product_read_all` RLS policy (migration 0014); writes: `product_*_sbu_scoped` policies | |
| BR-CAT-02 | Product Classification | `ck_product_product_type` (migration 0016) | |
| BR-CAT-03 | Buyback Line Items Are Free-Text | `OpportunityItemCreate._check_product_or_description`; `ck_opportunity_item_product_id_or_buyback` (migration 0017) | |
| BR-CAT-04 | Product Cost — Admin/GM Only | Not built | No cost field yet. |
| BR-PROJ-01 | Project Lifecycle | `project.status_id` (FK to `project_status`, NOT NULL); audit via `trg_audit_project` | Bid-submission-date check before BID_SUBMITTED not built (`ProjectService` has no status checks). |
| BR-FIN-01 | Contributor Split Validation | `OpportunityService.replace_splits` (total = 100) | |
| BR-FIN-02 | Value Representation | `NUMERIC(15,2)` on the money columns (`docs/Physical-Schema.sql`) | |
| BR-FIN-03 | Opportunity Value Calculation | `sales-os-app/` `OpportunityDetailScreen.tsx` Products tab (client-side) | No backend value; `vw_opportunities_with_value` is unused. |
| BR-FIN-04 | Split Governance | `OpportunityService._split_edit_refusal` (via BR-FIN-08); audit via `trg_audit_split` | |
| BR-FIN-05 | Default Opportunity Split Assignment | Not built as written | No split row is created. Reports treat "no split rows" as the owner at 100 % (BR-FIN-09). |
| BR-FIN-06 | Split Participant Eligibility | `OpportunityService.replace_splits` (new participants only; Admin/GM self-add); picker: `organization/repository.py` `scope="sbu"`; `SPLIT_ADDED` notification | |
| BR-FIN-07 | Referral Credit | `OpportunityCreate`/`OpportunityUpdate._check_referral_not_both`; `ck_opportunity_referral_not_both`; clearing on Lead Source change is in the screens | |
| BR-FIN-08 | Split Editing Authority | `OpportunityService._split_edit_refusal` (used by `replace_splits` and `can_edit_splits`) | |
| BR-FIN-09 | Credit on Shared Opportunities | `TargetVsActualRepository._credit` and its won / expected / late queries (`domains/planning/repository.py`) | Target vs Actuals only so far; built on Dev `2e2e4c0`, E2E pending. Other reports follow with their own plan. |
| BR-ACC-01 | Stakeholder Sentiment | `stakeholder.nps_score` (`ck_stakeholder_nps_score`), `stakeholder.sentiment` | "Account Health" aggregate not built. |
| BR-ACC-02 | Payer Behavior | `ck_account_payer_behavior` | |
| BR-ACC-03 | Near-Duplicate Hospital Warning | `AccountRepository.find_similar_by_name`, `account/duplicate_matching.py`; `AccountService.create_account` (`force_create`, `PossibleDuplicateError` → 409); `sales-os-app/` `CustomerDirectoryScreen.tsx` | |
| BR-ACC-04 | Hospital Business Potential Rating | `AccountService.set_business_potential`; `redact_business_potential_notes` (`account/schemas.py`) | |
| BR-ORG-01 | Manager Assignment SBU Eligibility | `UserService.create_user` / `update_user` (`domains/organization/service.py`) | |
| BR-ORG-02 | Multi-Zone User Assignment | `user_zone` table (migration 0018); `UserService` (primary zone in `zone_ids`); `opportunity_tier_visibility`; `TEAM_SCOPE_BUILDERS["Area Manager"]` | |
| BR-ACT-01 | Activity Account Requirement | `ActivityCreate._require_account_unless_sales_development`; `chk_activity_account_required` | |
| BR-ACT-02 | Manager Push (Logging) | No update or delete path for any Activity (no endpoint, no UPDATE/DELETE RLS policy on `activity`) | Any role can choose Manager Note (no role check). |
| BR-ACT-03 | Activity Account Database Enforcement | `chk_activity_account_required` (migration 0028) | |
| BR-ACT-04 | Mandatory Next Action Capture | `ActivityCreate._require_next_action_unless_exempt` (`NOT_CUSTOMER_FACING_TYPES`); Reminder created in `ActivityService.log_activity` | |
| BR-ACT-05 | Closing Activity on Reminder Completion | `ReminderUpdate._require_closing_activity_when_completing`; `ReminderService.patch_reminder` | |
| BR-ACT-06 | Next Action Assignee Eligibility | `GET /users?scope=all` → `UserRepository.list_active`; `cabio_app_assigned_reminder()` RLS | |
| BR-ACT-07 | Document Visibility Follows Parent | `document_select` RLS; `DocumentService.list_by_product` (`product_exists`) | Since `product_read_all` (BR-CAT-01) every product is visible, so product-only documents are reachable from any SBU — the rule's own text predates that. |
| BR-ACT-08 | Opportunity Document Upload Limits | `DocumentService.upload_document` (PNG/JPEG/PDF, 4 MB); signed URL 300 s (`core/storage.py`) | |
| BR-ACT-09 | Sales Development Activities | `SALES_DEVELOPMENT_ACTIVITY_TYPES` and its validators (`domains/activity/schemas.py`); `chk_activity_account_required` | |
| BR-ACT-10 | Relationship-Support Activity | `ActivityCreate` validators (Opportunity and notes required); `cabio_app_opportunity_in_account()`, `cabio_app_account_opportunities()` (migration 0029); `activity_select` | |
| BR-AUD-01 | Business Auditability | `audit_log_row_change()` triggers (`trg_audit_*`, `docs/Physical-Schema.sql`) on Opportunity, items, splits, stakeholders, accounts, users, products, projects and target plans, among others | |
