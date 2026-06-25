-- ==============================================================================
-- CABIO SALES OS — DEMO SEED DATA (June 29)
-- Target: PostgreSQL 16 / Supabase
-- Prerequisite: Seed-Data.sql (reference/master data) must be loaded first
-- Prerequisite: Supabase auth user must exist before inserting user_profile
-- ==============================================================================
-- UUID scheme: DDDDDDDD-DDDD-DDDD-DDDD-<table><seq>
--   D = demo marker
--   table prefix: 01=user, 02=account, 03=stakeholder, 04=project, 05=product, 06=asset

-- ==========================================
-- IMPORTANT: Before running this script
-- ==========================================
-- 1. Run Seed-Data.sql first (reference data: roles, SBUs, zones, statuses)
-- 2. Create a Supabase auth user via dashboard or CLI:
--      Email:    <your-demo-email>
--      Password: <your-demo-password>
-- 3. Copy the auth user's UUID and replace the placeholder below:

-- >>> REPLACE THIS with the actual Supabase auth.users UUID <<<
-- The user_profile.id MUST match the Supabase auth user's id exactly.
-- Example: If Supabase auth user id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
-- then set user_profile.id to the same value.

-- ==========================================
-- 1. USER PROFILES (Demo users)
-- ==========================================
-- Demo login user — Sales Executive, Imaging, North Kerala
INSERT INTO user_profile (id, sbu_id, zone_id, role_id, display_name, is_active)
VALUES (
  'dddddddd-dddd-dddd-dddd-010000000001',  -- REPLACE with actual Supabase auth user UUID
  '88888888-8888-8888-8888-800000000001',   -- Imaging SBU
  '99999999-9999-9999-9999-900000000001',   -- North Kerala Zone
  '77777777-7777-7777-7777-700000000001',   -- Sales Executive role
  'Basheer K',
  true
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  sbu_id = EXCLUDED.sbu_id,
  zone_id = EXCLUDED.zone_id,
  role_id = EXCLUDED.role_id;

-- Second user — project owner for cross-SBU projects
INSERT INTO user_profile (id, sbu_id, zone_id, role_id, display_name, is_active)
VALUES (
  'dddddddd-dddd-dddd-dddd-010000000002',
  '88888888-8888-8888-8888-800000000002',   -- Critical Care SBU
  '99999999-9999-9999-9999-900000000002',   -- South Kerala Zone
  '77777777-7777-7777-7777-700000000001',   -- Sales Executive role
  'Amit R',
  true
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name;


-- ==========================================
-- 2. ACCOUNTS (Hospitals / Medical Facilities)
-- ==========================================
-- 5 accounts across both SBUs, varied payer behaviors

INSERT INTO account (id, name, managing_sbu_id, payer_behavior, parent_account_id) VALUES
-- Imaging SBU accounts
(
  'dddddddd-dddd-dddd-dddd-020000000001',
  'Government Medical College Kozhikode',
  '88888888-8888-8888-8888-800000000001',  -- Imaging
  'GOOD',
  NULL
),
(
  'dddddddd-dddd-dddd-dddd-020000000002',
  'Aster MIMS Calicut',
  '88888888-8888-8888-8888-800000000001',  -- Imaging
  'GOOD',
  NULL
),
(
  'dddddddd-dddd-dddd-dddd-020000000003',
  'Baby Memorial Hospital',
  '88888888-8888-8888-8888-800000000001',  -- Imaging
  'AVERAGE',
  NULL
),
-- Critical Care SBU accounts
(
  'dddddddd-dddd-dddd-dddd-020000000004',
  'KIMS Hospital Trivandrum',
  '88888888-8888-8888-8888-800000000002',  -- Critical Care
  'GOOD',
  NULL
),
(
  'dddddddd-dddd-dddd-dddd-020000000005',
  'Meitra Hospital Kozhikode',
  '88888888-8888-8888-8888-800000000002',  -- Critical Care
  'PROBLEMATIC',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  managing_sbu_id = EXCLUDED.managing_sbu_id,
  payer_behavior = EXCLUDED.payer_behavior;


-- ==========================================
-- 3. STAKEHOLDERS (Key contacts at accounts)
-- ==========================================
-- Primary demo account: Govt Medical College Kozhikode (3 stakeholders)
-- Varied NPS + sentiment to show color coding

INSERT INTO stakeholder (id, account_id, name, nps_score, sentiment) VALUES
(
  'dddddddd-dddd-dddd-dddd-030000000001',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  'Dr. Rajesh Nair',
  72,           -- NPS >= 50 → green
  'POSITIVE'
),
(
  'dddddddd-dddd-dddd-dddd-030000000002',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  'Dr. Priya Menon',
  35,           -- NPS 0-49 → amber
  'NEUTRAL'
),
(
  'dddddddd-dddd-dddd-dddd-030000000003',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  'Mr. Suresh Kumar',
  -15,          -- NPS < 0 → red
  'NEGATIVE'
),
-- Secondary account: Aster MIMS (2 stakeholders)
(
  'dddddddd-dddd-dddd-dddd-030000000004',
  'dddddddd-dddd-dddd-dddd-020000000002',  -- Aster MIMS
  'Dr. Arun Mohan',
  60,
  'POSITIVE'
),
(
  'dddddddd-dddd-dddd-dddd-030000000005',
  'dddddddd-dddd-dddd-dddd-020000000002',  -- Aster MIMS
  'Ms. Lakshmi Devi',
  10,
  'NEUTRAL'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  nps_score = EXCLUDED.nps_score,
  sentiment = EXCLUDED.sentiment;


-- ==========================================
-- 4. PROJECTS (Sales projects under accounts)
-- ==========================================
-- Uses project_status IDs from Seed-Data.sql
-- Uses user_profile IDs from section 1 above

INSERT INTO project (id, account_id, owner_id, name, status_id, bid_submission_date) VALUES
-- Govt Medical College projects (2)
(
  'dddddddd-dddd-dddd-dddd-040000000001',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  'dddddddd-dddd-dddd-dddd-010000000001',  -- Basheer K
  'CT Scanner Replacement — Phase 1',
  '55555555-5555-5555-5555-500000000002',  -- ACTIVE
  '2026-07-15'
),
(
  'dddddddd-dddd-dddd-dddd-040000000002',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  'dddddddd-dddd-dddd-dddd-010000000002',  -- Amit R
  'MRI Suite Upgrade',
  '55555555-5555-5555-5555-500000000003',  -- BID_SUBMITTED
  '2026-08-01'
),
-- Aster MIMS project (1)
(
  'dddddddd-dddd-dddd-dddd-040000000003',
  'dddddddd-dddd-dddd-dddd-020000000002',  -- Aster MIMS
  'dddddddd-dddd-dddd-dddd-010000000001',  -- Basheer K
  'New Cath Lab Installation',
  '55555555-5555-5555-5555-500000000004',  -- AWARDED
  '2026-06-20'
),
-- KIMS project (1)
(
  'dddddddd-dddd-dddd-dddd-040000000004',
  'dddddddd-dddd-dddd-dddd-020000000004',  -- KIMS Trivandrum
  'dddddddd-dddd-dddd-dddd-010000000002',  -- Amit R
  'ICU Monitoring System Upgrade',
  '55555555-5555-5555-5555-500000000002',  -- ACTIVE
  '2026-09-10'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status_id = EXCLUDED.status_id,
  bid_submission_date = EXCLUDED.bid_submission_date;


-- ==========================================
-- 5. PRODUCTS (Equipment catalog)
-- ==========================================
-- 8 products across both SBUs, real OEM names

INSERT INTO product (id, sbu_id, name, oem_name, model_number, category_name, description) VALUES
-- Imaging products (5)
(
  'dddddddd-dddd-dddd-dddd-050000000001',
  '88888888-8888-8888-8888-800000000001',  -- Imaging
  '128-Slice CT Scanner',
  'GE Healthcare',
  'Revolution Maxima',
  'CT',
  'High-performance 128-slice computed tomography system with AI-assisted reconstruction. Ideal for emergency and routine diagnostics.'
),
(
  'dddddddd-dddd-dddd-dddd-050000000002',
  '88888888-8888-8888-8888-800000000001',  -- Imaging
  '1.5T MRI System',
  'Siemens Healthineers',
  'MAGNETOM Sola',
  'MRI',
  'Wide-bore 1.5 Tesla MRI with BioMatrix technology for high-quality imaging across all patient types.'
),
(
  'dddddddd-dddd-dddd-dddd-050000000003',
  '88888888-8888-8888-8888-800000000001',  -- Imaging
  'Digital X-Ray System',
  'Fujifilm',
  'FDR Go PLUS',
  'X-Ray',
  'Lightweight wireless digital radiography system with portable flat panel detector for bedside imaging.'
),
(
  'dddddddd-dddd-dddd-dddd-050000000004',
  '88888888-8888-8888-8888-800000000001',  -- Imaging
  'Premium Ultrasound',
  'GE Healthcare',
  'LOGIQ E10s',
  'Ultrasound',
  'Premium shared-service ultrasound with AI-based measurement tools and advanced cardiac imaging capabilities.'
),
(
  'dddddddd-dddd-dddd-dddd-050000000005',
  '88888888-8888-8888-8888-800000000001',  -- Imaging
  'C-Arm Fluoroscopy System',
  'Siemens Healthineers',
  'Cios Spin',
  'Fluoroscopy',
  'Mobile 3D C-arm for intraoperative imaging with flat detector technology.'
),
-- Critical Care products (3)
(
  'dddddddd-dddd-dddd-dddd-050000000006',
  '88888888-8888-8888-8888-800000000002',  -- Critical Care
  'Multi-Parameter Patient Monitor',
  'Mindray',
  'BeneVision N22',
  'Monitoring',
  'Advanced 22-inch patient monitor with integrated gas analysis and hemodynamic monitoring.'
),
(
  'dddddddd-dddd-dddd-dddd-050000000007',
  '88888888-8888-8888-8888-800000000002',  -- Critical Care
  'ICU Ventilator',
  'Draeger',
  'Evita V800',
  'Ventilation',
  'High-end ICU ventilator with automated weaning, lung-protective strategies, and neonatal to adult range.'
),
(
  'dddddddd-dddd-dddd-dddd-050000000008',
  '88888888-8888-8888-8888-800000000002',  -- Critical Care
  'Infusion Pump System',
  'B. Braun',
  'Space Plus',
  'Infusion',
  'Modular infusion workstation with dose error reduction software and EMR integration.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  oem_name = EXCLUDED.oem_name,
  model_number = EXCLUDED.model_number,
  category_name = EXCLUDED.category_name,
  description = EXCLUDED.description;


-- ==========================================
-- 6. INSTALLED ASSETS (Equipment at accounts)
-- ==========================================
-- Mix of own equipment + competitor equipment to show red highlighting

INSERT INTO installed_asset (id, account_id, product_id, is_competitor_equipment, competitor_product_name, installation_date, department) VALUES
-- Govt Medical College — 3 own assets + 2 competitor
(
  'dddddddd-dddd-dddd-dddd-060000000001',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  'dddddddd-dddd-dddd-dddd-050000000001',  -- 128-Slice CT Scanner
  false,
  NULL,
  '2024-03-15',
  'Radiology'
),
(
  'dddddddd-dddd-dddd-dddd-060000000002',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  'dddddddd-dddd-dddd-dddd-050000000003',  -- Digital X-Ray
  false,
  NULL,
  '2023-11-20',
  'Emergency'
),
(
  'dddddddd-dddd-dddd-dddd-060000000003',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  'dddddddd-dddd-dddd-dddd-050000000004',  -- Premium Ultrasound
  false,
  NULL,
  '2025-01-10',
  'Cardiology'
),
(
  'dddddddd-dddd-dddd-dddd-060000000004',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  NULL,
  true,
  'Philips Ingenia Ambition 1.5T',          -- Competitor MRI
  '2022-06-01',
  'Radiology'
),
(
  'dddddddd-dddd-dddd-dddd-060000000005',
  'dddddddd-dddd-dddd-dddd-020000000001',  -- Govt Medical College
  NULL,
  true,
  'Canon Aquilion ONE PRISM',               -- Competitor CT
  '2021-09-15',
  'Radiology'
),
-- Aster MIMS — 2 own + 1 competitor
(
  'dddddddd-dddd-dddd-dddd-060000000006',
  'dddddddd-dddd-dddd-dddd-020000000002',  -- Aster MIMS
  'dddddddd-dddd-dddd-dddd-050000000002',  -- 1.5T MRI
  false,
  NULL,
  '2024-08-01',
  'Radiology'
),
(
  'dddddddd-dddd-dddd-dddd-060000000007',
  'dddddddd-dddd-dddd-dddd-020000000002',  -- Aster MIMS
  'dddddddd-dddd-dddd-dddd-050000000006',  -- Patient Monitor
  false,
  NULL,
  '2025-02-15',
  'ICU'
),
(
  'dddddddd-dddd-dddd-dddd-060000000008',
  'dddddddd-dddd-dddd-dddd-020000000002',  -- Aster MIMS
  NULL,
  true,
  'Nihon Kohden WEP-5208',                 -- Competitor monitor
  '2023-04-10',
  'NICU'
),
-- KIMS Trivandrum — 2 own
(
  'dddddddd-dddd-dddd-dddd-060000000009',
  'dddddddd-dddd-dddd-dddd-020000000004',  -- KIMS Trivandrum
  'dddddddd-dddd-dddd-dddd-050000000007',  -- ICU Ventilator
  false,
  NULL,
  '2024-12-01',
  'ICU'
),
(
  'dddddddd-dddd-dddd-dddd-060000000010',
  'dddddddd-dddd-dddd-dddd-020000000004',  -- KIMS Trivandrum
  'dddddddd-dddd-dddd-dddd-050000000008',  -- Infusion Pump
  false,
  NULL,
  '2025-03-20',
  'ICU'
)
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  is_competitor_equipment = EXCLUDED.is_competitor_equipment,
  competitor_product_name = EXCLUDED.competitor_product_name,
  department = EXCLUDED.department;


-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these after loading to confirm all data is present.

-- Quick count check (all must be >= 1)
SELECT 'user_profiles' AS entity, count(*) FROM user_profile WHERE id::text LIKE 'dddddddd%'
UNION ALL SELECT 'accounts', count(*) FROM account WHERE id::text LIKE 'dddddddd%'
UNION ALL SELECT 'stakeholders', count(*) FROM stakeholder WHERE id::text LIKE 'dddddddd%'
UNION ALL SELECT 'projects', count(*) FROM project WHERE id::text LIKE 'dddddddd%'
UNION ALL SELECT 'products', count(*) FROM product WHERE id::text LIKE 'dddddddd%'
UNION ALL SELECT 'installed_assets', count(*) FROM installed_asset WHERE id::text LIKE 'dddddddd%';

-- Expected:
--   user_profiles      = 2
--   accounts           = 5
--   stakeholders       = 5
--   projects           = 4
--   products           = 8
--   installed_assets   = 10

-- Primary demo account workspace check (Govt Medical College Kozhikode)
SELECT
  (SELECT count(*) FROM stakeholder WHERE account_id = 'dddddddd-dddd-dddd-dddd-020000000001') AS stakeholders,
  (SELECT count(*) FROM project WHERE account_id = 'dddddddd-dddd-dddd-dddd-020000000001') AS projects,
  (SELECT count(*) FROM installed_asset WHERE account_id = 'dddddddd-dddd-dddd-dddd-020000000001') AS installed_assets,
  (SELECT count(*) FROM installed_asset WHERE account_id = 'dddddddd-dddd-dddd-dddd-020000000001' AND is_competitor_equipment = true) AS competitor_assets;

-- Expected: stakeholders=3, projects=2, installed_assets=5, competitor_assets=2
