-- ==============================================================================
-- CABIO SALES OS - PHYSICAL SCHEMA (v1.0)
-- Target: PostgreSQL 16 / Supabase
-- Based on Architecture Freeze v1.0 (Commit 8fe6385)
-- ==============================================================================

-- ==========================================
-- 1. SECURITY & IDENTITY
-- ==========================================

CREATE TABLE role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- ==========================================
-- 2. MASTER & REFERENCE DATA
-- ==========================================

CREATE TABLE sbu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE zone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE lead_source (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE opportunity_stage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_code VARCHAR(50) NOT NULL UNIQUE,
    stage_name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL UNIQUE,
    default_win_probability NUMERIC(5,2) NOT NULL CHECK (default_win_probability >= 0 AND default_win_probability <= 100),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE opportunity_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_code VARCHAR(50) NOT NULL UNIQUE,
    status_name VARCHAR(100) NOT NULL,
    is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_generated BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE project_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_code VARCHAR(50) NOT NULL UNIQUE,
    status_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE loss_reason (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE hold_reason (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- ==========================================
-- 3. USERS
-- ==========================================

-- Assumes auth.users is managed by Supabase.
CREATE TABLE user_profile (
    id UUID PRIMARY KEY, -- FK intended for auth.users.id
    sbu_id UUID NOT NULL REFERENCES sbu(id),
    zone_id UUID REFERENCES zone(id),
    role_id UUID NOT NULL REFERENCES role(id),
    display_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circular references for standard metadata applied post-creation
ALTER TABLE user_profile ADD COLUMN created_by UUID REFERENCES user_profile(id);
ALTER TABLE user_profile ADD COLUMN updated_by UUID REFERENCES user_profile(id);

-- ==========================================
-- 4. PLANNING DOMAIN
-- ==========================================

CREATE TABLE target_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profile(id),
    sbu_id UUID NOT NULL REFERENCES sbu(id),
    planning_period VARCHAR(10) NOT NULL CHECK (planning_period ~ '^\d{4}-Q[1-4]$'),
    target_amount_lakhs NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id),
    CONSTRAINT target_plan_unique UNIQUE (user_id, sbu_id, planning_period)
);

CREATE TABLE coverage_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profile(id),
    target_plan_id UUID NOT NULL REFERENCES target_plan(id),
    planning_period VARCHAR(10) NOT NULL CHECK (planning_period ~ '^\d{4}-Q[1-4]$'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id),
    CONSTRAINT coverage_plan_unique UNIQUE (user_id, planning_period)
);

-- ==========================================
-- 5. EXECUTION DOMAIN (CORE ENTITIES)
-- ==========================================

CREATE TABLE product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sbu_id UUID NOT NULL REFERENCES sbu(id),
    name VARCHAR(255) NOT NULL,
    oem_name VARCHAR(255),
    model_number VARCHAR(100),
    category_name VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id)
);

-- managing_sbu_id was dropped and zone_id added (NOT NULL) in migration 0001
-- (2026-06-26) — this table definition was never updated to match until now.
CREATE TABLE account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_account_id UUID REFERENCES account(id),
    zone_id UUID NOT NULL REFERENCES zone(id),
    name VARCHAR(255) NOT NULL,
    payer_behavior VARCHAR(50) CHECK (payer_behavior IN ('GOOD', 'AVERAGE', 'PROBLEMATIC', 'UNKNOWN')),
    customer_type VARCHAR(50) CHECK (customer_type IN ('MULTISPECIALITY_HOSPITAL', 'SPECIALTY_HOSPITAL', 'DIAGNOSTIC_CENTER', 'CLINIC', 'DEALER', 'MEDICAL_COLLEGE_HOSPITAL', 'GOVERNMENT_HOSPITAL', 'OTHER')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id)
);

CREATE TABLE stakeholder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(id),
    name VARCHAR(255) NOT NULL,
    nps_score INTEGER CHECK (nps_score >= -100 AND nps_score <= 100),
    sentiment VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id)
);

CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(id),
    owner_id UUID NOT NULL REFERENCES user_profile(id),
    name VARCHAR(255) NOT NULL,
    status_id UUID NOT NULL REFERENCES project_status(id),
    bid_submission_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id)
);

CREATE TABLE opportunity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    account_id UUID NOT NULL REFERENCES account(id),
    project_id UUID REFERENCES project(id),
    owner_id UUID NOT NULL REFERENCES user_profile(id),
    stage_id UUID NOT NULL REFERENCES opportunity_stage(id),
    status_id UUID NOT NULL REFERENCES opportunity_status(id),
    win_probability NUMERIC(5,2) NOT NULL CHECK (win_probability >= 0 AND win_probability <= 100),
    lead_source_id UUID REFERENCES lead_source(id),
    indicative_value NUMERIC(15,2),
    expected_closure_date DATE,
    loss_reason_id UUID REFERENCES loss_reason(id),
    loss_notes TEXT,
    competitor_name VARCHAR(255),
    hold_reason_id UUID REFERENCES hold_reason(id),
    reactivation_date DATE,
    demo_start_date DATE,
    demo_end_date DATE,
    po_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id)
);

-- ==========================================
-- 6. EXECUTION DOMAIN (CHILD & JUNCTION ENTITIES)
-- ==========================================

CREATE TABLE coverage_plan_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coverage_plan_id UUID NOT NULL REFERENCES coverage_plan(id),
    account_id UUID NOT NULL REFERENCES account(id),
    strategic_objective TEXT NOT NULL,
    target_revenue_lakhs NUMERIC(15,2) NOT NULL,
    coverage_frequency VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id),
    CONSTRAINT coverage_plan_entry_unique UNIQUE (coverage_plan_id, account_id)
);

CREATE TABLE opportunity_stakeholder (
    opportunity_id UUID NOT NULL REFERENCES opportunity(id),
    stakeholder_id UUID NOT NULL REFERENCES stakeholder(id),
    influence_level VARCHAR(50) CHECK (influence_level IN ('HIGH', 'MEDIUM', 'LOW')),
    decision_role VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id),
    PRIMARY KEY (opportunity_id, stakeholder_id)
);

CREATE TABLE split (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunity(id),
    user_id UUID NOT NULL REFERENCES user_profile(id),
    split_percentage NUMERIC(5,2) NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id),
    CONSTRAINT split_unique UNIQUE (opportunity_id, user_id)
);

CREATE TABLE opportunity_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunity(id),
    product_id UUID NOT NULL REFERENCES product(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_lakhs NUMERIC(15,2) NOT NULL,
    discount_lakhs NUMERIC(15,2) NOT NULL DEFAULT 0,
    extended_value_lakhs NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price_lakhs - discount_lakhs) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id),
    CONSTRAINT opportunity_item_unique UNIQUE (opportunity_id, product_id)
);

CREATE TABLE activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(id),
    project_id UUID REFERENCES project(id),
    opportunity_id UUID REFERENCES opportunity(id),
    user_id UUID NOT NULL REFERENCES user_profile(id),
    activity_type VARCHAR(50) NOT NULL,
    activity_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id)
    -- Intentionally omitting updated_at and deleted_at to satisfy Activity Immutability (BR-ACT-01).
);

CREATE TABLE reminder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES activity(id),
    assigned_to_user_id UUID NOT NULL REFERENCES user_profile(id),
    due_date TIMESTAMPTZ NOT NULL,
    reminder_text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id)
);

CREATE TABLE installed_asset (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account(id),
    product_id UUID REFERENCES product(id),
    is_competitor_equipment BOOLEAN NOT NULL DEFAULT FALSE,
    competitor_product_name VARCHAR(255),
    installation_date DATE,
    department VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES user_profile(id),
    updated_by UUID REFERENCES user_profile(id),
    CONSTRAINT chk_competitor_equipment CHECK (
        (is_competitor_equipment = false AND product_id IS NOT NULL) OR 
        (is_competitor_equipment = true)
    )
);

CREATE TABLE document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER, -- nullable: URL-only collateral links have no real file (migration 0006)
    storage_path VARCHAR(500) NOT NULL,
    account_id UUID REFERENCES account(id),
    project_id UUID REFERENCES project(id),
    opportunity_id UUID REFERENCES opportunity(id),
    product_id UUID REFERENCES product(id),
    uploaded_by_user_id UUID NOT NULL REFERENCES user_profile(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_document_context CHECK (
        account_id IS NOT NULL OR 
        project_id IS NOT NULL OR 
        opportunity_id IS NOT NULL OR 
        product_id IS NOT NULL
    )
);

-- ==========================================
-- 7. AUDIT & REPORTING VIEWS
-- ==========================================

-- Exposes Opportunity value dynamically to prevent redundant storage synchronization.
CREATE OR REPLACE VIEW vw_opportunities_with_value AS
SELECT 
    o.*,
    COALESCE(
        (SELECT SUM(extended_value_lakhs) FROM opportunity_item WHERE opportunity_id = o.id),
        o.indicative_value,
        0
    ) as effective_value_lakhs
FROM opportunity o;

-- ==========================================
-- 8. TRIGGER FUNCTION & TRIGGERS
-- ==========================================

CREATE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON user_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON target_plan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON coverage_plan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON product
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON account
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON stakeholder
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON project
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON opportunity
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON coverage_plan_entry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON opportunity_stakeholder
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON split
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON opportunity_item
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON reminder
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON installed_asset
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 9. PERFORMANCE INDEXES
-- ==========================================

-- Text search (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_account_name_trgm ON account USING GIN (name gin_trgm_ops);
CREATE INDEX idx_opportunity_name_trgm ON opportunity USING GIN (name gin_trgm_ops);

-- Date filtering (B-Tree)
CREATE INDEX idx_activity_activity_date ON activity (activity_date);
CREATE INDEX idx_opportunity_expected_closure_date ON opportunity (expected_closure_date);
CREATE INDEX idx_reminder_due_date ON reminder (due_date);

-- Foreign key indexes (high-value join paths)
CREATE INDEX idx_opportunity_account_id ON opportunity (account_id);
CREATE INDEX idx_opportunity_owner_id ON opportunity (owner_id);
CREATE INDEX idx_opportunity_stage_id ON opportunity (stage_id);
CREATE INDEX idx_opportunity_status_id ON opportunity (status_id);
CREATE INDEX idx_activity_account_id ON activity (account_id);
CREATE INDEX idx_activity_user_id ON activity (user_id);
CREATE INDEX idx_activity_opportunity_id ON activity (opportunity_id);
CREATE INDEX idx_stakeholder_account_id ON stakeholder (account_id);
CREATE INDEX idx_project_account_id ON project (account_id);
CREATE INDEX idx_project_owner_id ON project (owner_id);
CREATE INDEX idx_reminder_activity_id ON reminder (activity_id);
CREATE INDEX idx_reminder_assigned_to_user_id ON reminder (assigned_to_user_id);
CREATE INDEX idx_installed_asset_account_id ON installed_asset (account_id);
CREATE INDEX idx_document_account_id ON document (account_id);
CREATE INDEX idx_document_opportunity_id ON document (opportunity_id);
