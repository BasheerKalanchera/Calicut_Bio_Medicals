-- ==============================================================================
-- CABIO SALES OS - SEED DATA (v1.0)
-- Target: PostgreSQL 16 / Supabase
-- Based on Architecture Freeze v1.0 (Commit 8fe6385)
-- ==============================================================================

-- ==========================================
-- 1. OPPORTUNITY STAGES (Approved Values)
-- ==========================================
INSERT INTO opportunity_stage (id, stage_code, stage_name, display_order, default_win_probability) VALUES 
('11111111-1111-1111-1111-100000000001', 'LEAD', 'Lead', 10, 5.00),
('11111111-1111-1111-1111-100000000002', 'QUALIFIED', 'Qualified', 20, 20.00),
('11111111-1111-1111-1111-100000000003', 'DEMO', 'Demo', 30, 35.00),
('11111111-1111-1111-1111-100000000004', 'CLINICAL_EVALUATION', 'Clinical Evaluation', 40, 55.00),
('11111111-1111-1111-1111-100000000005', 'NEGOTIATION', 'Negotiation', 50, 70.00),
('11111111-1111-1111-1111-100000000006', 'ORDER', 'Order', 60, 90.00),
('11111111-1111-1111-1111-100000000007', 'DELIVERY_INSTALLATION', 'Delivery & Installation', 70, 95.00)
ON CONFLICT (stage_code) DO NOTHING;

-- ==========================================
-- 2. OPPORTUNITY STATUSES (Approved Values)
-- ==========================================
INSERT INTO opportunity_status (id, status_code, status_name, is_terminal, is_system_generated) VALUES 
('22222222-2222-2222-2222-200000000001', 'ACTIVE', 'Active', FALSE, FALSE),
('22222222-2222-2222-2222-200000000002', 'ON_HOLD', 'On-Hold', FALSE, FALSE),
('22222222-2222-2222-2222-200000000003', 'STALLED', 'Stalled', FALSE, TRUE),
('22222222-2222-2222-2222-200000000004', 'WON', 'Won', TRUE, FALSE),
('22222222-2222-2222-2222-200000000005', 'LOST', 'Lost', TRUE, FALSE)
ON CONFLICT (status_code) DO NOTHING;

-- ==========================================
-- 3. HOLD REASONS (Approved Values)
-- ==========================================
INSERT INTO hold_reason (id, reason_code, reason_name) VALUES 
('33333333-3333-3333-3333-300000000001', 'CUSTOMER_DELAY', 'Customer Delay'),
('33333333-3333-3333-3333-300000000002', 'BUDGET_PENDING', 'Budget Pending'),
('33333333-3333-3333-3333-300000000003', 'PROCUREMENT_DELAY', 'Procurement Delay'),
('33333333-3333-3333-3333-300000000004', 'REGULATORY_APPROVAL_PENDING', 'Regulatory Approval Pending'),
('33333333-3333-3333-3333-300000000005', 'COMPETITOR_EVALUATION', 'Competitor Evaluation'),
('33333333-3333-3333-3333-300000000006', 'INTERNAL_RESOURCE_CONSTRAINT', 'Internal Resource Constraint'),
('33333333-3333-3333-3333-300000000007', 'OTHER', 'Other')
ON CONFLICT (reason_code) DO NOTHING;

-- ==========================================
-- 4. LOSS REASONS (Approved Values)
-- ==========================================
INSERT INTO loss_reason (id, reason_code, reason_name) VALUES 
('44444444-4444-4444-4444-400000000001', 'PRICE', 'Price'),
('44444444-4444-4444-4444-400000000002', 'COMPETITOR_WON', 'Competitor Won'),
('44444444-4444-4444-4444-400000000003', 'BUDGET_CANCELLED', 'Budget Cancelled'),
('44444444-4444-4444-4444-400000000004', 'REQUIREMENT_CHANGED', 'Requirement Changed'),
('44444444-4444-4444-4444-400000000005', 'TECHNICAL_MISMATCH', 'Technical Mismatch'),
('44444444-4444-4444-4444-400000000006', 'TIMING_DELAY', 'Timing Delay'),
('44444444-4444-4444-4444-400000000007', 'NO_DECISION', 'No Decision'),
('44444444-4444-4444-4444-400000000008', 'OTHER', 'Other')
ON CONFLICT (reason_code) DO NOTHING;

-- ==========================================
-- 5. PROJECT STATUSES (Approved Values)
-- ==========================================
INSERT INTO project_status (id, status_code, status_name) VALUES 
('55555555-5555-5555-5555-500000000001', 'DRAFT', 'Draft'),
('55555555-5555-5555-5555-500000000002', 'ACTIVE', 'Active'),
('55555555-5555-5555-5555-500000000003', 'BID_SUBMITTED', 'Bid Submitted'),
('55555555-5555-5555-5555-500000000004', 'AWARDED', 'Awarded'),
('55555555-5555-5555-5555-500000000005', 'LOST', 'Lost'),
('55555555-5555-5555-5555-500000000006', 'CLOSED', 'Closed')
ON CONFLICT (status_code) DO NOTHING;

-- ==========================================
-- 6. LEAD SOURCES (Approved Values)
-- ==========================================
INSERT INTO lead_source (id, name, description) VALUES 
('66666666-6666-6666-6666-600000000001', 'COVERAGE_PLAN', 'Coverage Plan'),
('66666666-6666-6666-6666-600000000002', 'REFERRAL', 'Referral'),
('66666666-6666-6666-6666-600000000003', 'EXISTING_CUSTOMER', 'Existing Customer'),
('66666666-6666-6666-6666-600000000004', 'TENDER', 'Tender'),
('66666666-6666-6666-6666-600000000005', 'OEM_REFERRAL', 'OEM Referral'),
('66666666-6666-6666-6666-600000000006', 'WEBSITE', 'Website'),
('66666666-6666-6666-6666-600000000007', 'COLD_CALL', 'Cold Call'),
('66666666-6666-6666-6666-600000000008', 'WALK_IN', 'Walk In'),
('66666666-6666-6666-6666-600000000009', 'OTHER', 'Other'),
-- BR-OP-13: customer reordering the exact same equipment, price pre-negotiated
-- off a prior PO -- distinct from EXISTING_CUSTOMER, which only describes how
-- the lead was sourced, not whether this deal is a repeat order.
('66666666-6666-6666-6666-600000000010', 'REPEAT_ORDER', 'REPEAT_ORDER')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 7. ROLES (Approved Values)
-- ==========================================
INSERT INTO role (id, role_name) VALUES
('77777777-7777-7777-7777-700000000001', 'Sales Executive'),
('77777777-7777-7777-7777-700000000003', 'General Manager'),
('77777777-7777-7777-7777-700000000004', 'Admin')
ON CONFLICT (role_name) DO NOTHING;

-- ==========================================
-- 8. STRATEGIC BUSINESS UNITS (Approved Values)
-- ==========================================
INSERT INTO sbu (id, name, description) VALUES
('88888888-8888-8888-8888-800000000001', 'Imaging', 'Imaging Division'),
('88888888-8888-8888-8888-800000000002', 'Critical Care', 'Critical Care Division')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 9. ZONES (Approved Values)
-- ==========================================
INSERT INTO zone (id, name, description) VALUES
('99999999-9999-9999-9999-900000000001', 'North Kerala', 'North Kerala Zone'),
('99999999-9999-9999-9999-900000000002', 'South Kerala', 'South Kerala Zone'),
('99999999-9999-9999-9999-900000000003', 'Central Kerala', 'Central Kerala Zone'),
('99999999-9999-9999-9999-900000000004', 'Bangalore', 'Bangalore Zone'),
('99999999-9999-9999-9999-900000000005', 'Mangalore', 'Mangalore Zone')
ON CONFLICT (name) DO NOTHING;
