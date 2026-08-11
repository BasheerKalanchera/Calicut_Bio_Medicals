-- ==============================================================================
-- CABIO SALES OS - PHYSICAL SCHEMA
-- Target: PostgreSQL 17 / Supabase
-- ==============================================================================
--
-- THIS FILE IS MACHINE-GENERATED. DO NOT HAND-EDIT.
--
-- Source of truth for the schema is the Alembic migration chain
-- (backend/alembic/versions/). This file is a read-only reference snapshot,
-- regenerated from a fully-migrated database via `pg_dump --schema-only` —
-- it is not consumed by Alembic or the application at runtime, and cannot be
-- used as an `alembic stamp <rev>` checkpoint.
--
-- Regenerated 2026-08-11 from the Dev database (Postgres 17.6), after
-- migration 0017 (opportunity_item.description added, opportunity_item.product_id
-- made nullable, ck_opportunity_item_product_id_or_buyback added — Buyback
-- Free-Text build). See docs/Buyback-Freetext-Implementation-Plan.md and
-- docs/Backend-Implementation-Standards.md's migration workflow for the
-- regen step required on every migration.
--
-- Regenerate with (any fully-migrated environment, Dev or UAT, is equivalent
-- since both run the same Alembic chain):
--
--   docker run --rm postgres:17 pg_dump "<ADMIN_DATABASE_URL>" \
--     --schema-only --no-owner --no-privileges --schema=public \
--     > docs/Physical-Schema.sql
--
-- (Use a postgres:<major> image matching the target server's actual version
-- — `SELECT version();` — pg_dump refuses to run against a newer server.)
-- ==============================================================================

--
-- PostgreSQL database dump
--

\restrict 6cHq1oT1wy7HBaZ1XXmshPWYbbbeiR90c47bCJSOPjgmwC2F8MCch2VbyrBefGc

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: cabio_app_assigned_reminder(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cabio_app_assigned_reminder(p_opportunity_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
            SELECT EXISTS (
                SELECT 1 FROM reminder r
                JOIN activity a ON a.id = r.activity_id
                WHERE a.opportunity_id = p_opportunity_id
                  AND r.assigned_to_user_id = cabio_app_uid()
            )
        $$;


--
-- Name: cabio_app_has_split(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cabio_app_has_split(p_opportunity_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
            SELECT EXISTS (
                SELECT 1 FROM split
                WHERE opportunity_id = p_opportunity_id
                  AND user_id = cabio_app_uid()
            )
        $$;


--
-- Name: cabio_app_role_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cabio_app_role_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT NULLIF(current_setting('app.current_role_id', true), '')::uuid $$;


--
-- Name: cabio_app_role_name(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cabio_app_role_name() RETURNS text
    LANGUAGE sql STABLE
    AS $$ SELECT role_name FROM role WHERE id = cabio_app_role_id() $$;


--
-- Name: cabio_app_sbu_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cabio_app_sbu_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT NULLIF(current_setting('app.current_sbu_id', true), '')::uuid $$;


--
-- Name: cabio_app_uid(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cabio_app_uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid $$;


--
-- Name: cabio_app_zone_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cabio_app_zone_id() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$ SELECT NULLIF(current_setting('app.current_zone_id', true), '')::uuid $$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_account_id uuid,
    name character varying(255) NOT NULL,
    payer_behavior character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    zone_id uuid NOT NULL,
    customer_type character varying(50),
    CONSTRAINT account_payer_behavior_check CHECK (((payer_behavior)::text = ANY ((ARRAY['GOOD'::character varying, 'AVERAGE'::character varying, 'PROBLEMATIC'::character varying, 'UNKNOWN'::character varying])::text[]))),
    CONSTRAINT ck_account_customer_type CHECK (((customer_type)::text = ANY ((ARRAY['MULTISPECIALITY_HOSPITAL'::character varying, 'SPECIALTY_HOSPITAL'::character varying, 'DIAGNOSTIC_CENTER'::character varying, 'CLINIC'::character varying, 'DEALER'::character varying, 'MEDICAL_COLLEGE_HOSPITAL'::character varying, 'GOVERNMENT_HOSPITAL'::character varying, 'OTHER'::character varying])::text[])))
);


--
-- Name: activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    project_id uuid,
    opportunity_id uuid,
    user_id uuid NOT NULL,
    activity_type character varying(50) NOT NULL,
    activity_date timestamp with time zone NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


--
-- Name: coverage_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coverage_plan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    target_plan_id uuid NOT NULL,
    planning_period character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT coverage_plan_planning_period_check CHECK (((planning_period)::text ~ '^\d{4}-Q[1-4]$'::text))
);


--
-- Name: coverage_plan_entry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coverage_plan_entry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coverage_plan_id uuid NOT NULL,
    account_id uuid NOT NULL,
    strategic_objective text NOT NULL,
    target_revenue_lakhs numeric(15,2) NOT NULL,
    coverage_frequency character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);


--
-- Name: document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(100) NOT NULL,
    file_size_bytes integer,
    storage_path character varying(500) NOT NULL,
    account_id uuid,
    project_id uuid,
    opportunity_id uuid,
    product_id uuid,
    uploaded_by_user_id uuid NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_document_context CHECK (((account_id IS NOT NULL) OR (project_id IS NOT NULL) OR (opportunity_id IS NOT NULL) OR (product_id IS NOT NULL)))
);


--
-- Name: hold_reason; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hold_reason (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reason_code character varying(50) NOT NULL,
    reason_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: installed_asset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.installed_asset (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    product_id uuid,
    is_competitor_equipment boolean DEFAULT false NOT NULL,
    competitor_product_name character varying(255),
    installation_date date,
    department character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT chk_competitor_equipment CHECK ((((is_competitor_equipment = false) AND (product_id IS NOT NULL)) OR (is_competitor_equipment = true)))
);


--
-- Name: lead_source; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lead_source (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true
);


--
-- Name: loss_reason; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.loss_reason (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reason_code character varying(50) NOT NULL,
    reason_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: opportunity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    account_id uuid NOT NULL,
    project_id uuid,
    owner_id uuid NOT NULL,
    stage_id uuid NOT NULL,
    status_id uuid NOT NULL,
    win_probability numeric(5,2) NOT NULL,
    lead_source_id uuid,
    indicative_value numeric(15,2),
    expected_closure_date date,
    loss_reason_id uuid,
    loss_notes text,
    competitor_name character varying(255),
    hold_reason_id uuid,
    reactivation_date date,
    demo_start_date date,
    demo_end_date date,
    po_number character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    sbu_id uuid NOT NULL,
    CONSTRAINT opportunity_win_probability_check CHECK (((win_probability >= (0)::numeric) AND (win_probability <= (100)::numeric)))
);


--
-- Name: opportunity_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    opportunity_id uuid NOT NULL,
    product_id uuid,
    quantity integer NOT NULL,
    unit_price_lakhs numeric(15,2) NOT NULL,
    discount_lakhs numeric(15,2) DEFAULT 0 NOT NULL,
    extended_value_lakhs numeric(15,2) GENERATED ALWAYS AS ((((quantity)::numeric * unit_price_lakhs) - discount_lakhs)) STORED,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    line_type character varying(20) DEFAULT 'PRODUCT'::character varying NOT NULL,
    description text,
    CONSTRAINT ck_opportunity_item_line_type CHECK (((line_type)::text = ANY ((ARRAY['PRODUCT'::character varying, 'BUYBACK'::character varying])::text[]))),
    CONSTRAINT ck_opportunity_item_product_id_or_buyback CHECK (((product_id IS NOT NULL) OR ((line_type)::text = 'BUYBACK'::text))),
    CONSTRAINT opportunity_item_quantity_check CHECK ((quantity > 0))
);


--
-- Name: opportunity_stage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_stage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stage_code character varying(50) NOT NULL,
    stage_name character varying(100) NOT NULL,
    display_order integer NOT NULL,
    default_win_probability numeric(5,2) NOT NULL,
    is_active boolean DEFAULT true,
    CONSTRAINT opportunity_stage_default_win_probability_check CHECK (((default_win_probability >= (0)::numeric) AND (default_win_probability <= (100)::numeric)))
);


--
-- Name: opportunity_stakeholder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_stakeholder (
    opportunity_id uuid NOT NULL,
    stakeholder_id uuid NOT NULL,
    influence_level character varying(50),
    decision_role character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT opportunity_stakeholder_influence_level_check CHECK (((influence_level)::text = ANY ((ARRAY['HIGH'::character varying, 'MEDIUM'::character varying, 'LOW'::character varying])::text[])))
);


--
-- Name: opportunity_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunity_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status_code character varying(50) NOT NULL,
    status_name character varying(100) NOT NULL,
    is_terminal boolean DEFAULT false NOT NULL,
    is_system_generated boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sbu_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    oem_name character varying(255),
    model_number character varying(100),
    category_name character varying(100),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    product_type character varying(20) DEFAULT 'NEW_EQUIPMENT'::character varying NOT NULL,
    CONSTRAINT ck_product_product_type CHECK (((product_type)::text = ANY ((ARRAY['NEW_EQUIPMENT'::character varying, 'REFURBISHED'::character varying, 'ACCESSORY'::character varying])::text[])))
);


--
-- Name: project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    status_id uuid NOT NULL,
    bid_submission_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);


--
-- Name: project_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_status (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    status_code character varying(50) NOT NULL,
    status_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: reminder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    assigned_to_user_id uuid NOT NULL,
    due_date timestamp with time zone NOT NULL,
    reminder_text text NOT NULL,
    is_completed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    closing_activity_id uuid
);


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_name character varying(50) NOT NULL,
    description text
);


--
-- Name: sbu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sbu (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true
);


--
-- Name: split; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.split (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    opportunity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    split_percentage numeric(5,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT split_split_percentage_check CHECK (((split_percentage >= (0)::numeric) AND (split_percentage <= (100)::numeric)))
);


--
-- Name: stakeholder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stakeholder (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    account_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    nps_score integer,
    sentiment character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    designation character varying(100),
    email character varying(255),
    phone character varying(50),
    whatsapp_number character varying(50),
    CONSTRAINT stakeholder_nps_score_check CHECK (((nps_score >= '-100'::integer) AND (nps_score <= 100)))
);


--
-- Name: target_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.target_plan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sbu_id uuid NOT NULL,
    planning_period character varying(10) NOT NULL,
    target_amount_lakhs numeric(15,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT target_plan_planning_period_check CHECK (((planning_period)::text ~ '^\d{4}-Q[1-4]$'::text))
);


--
-- Name: user_profile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profile (
    id uuid NOT NULL,
    sbu_id uuid NOT NULL,
    zone_id uuid,
    role_id uuid NOT NULL,
    display_name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    manager_id uuid
);


--
-- Name: vw_opportunities_with_value; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_opportunities_with_value AS
 SELECT id,
    name,
    account_id,
    project_id,
    owner_id,
    stage_id,
    status_id,
    win_probability,
    lead_source_id,
    indicative_value,
    expected_closure_date,
    loss_reason_id,
    loss_notes,
    competitor_name,
    hold_reason_id,
    reactivation_date,
    demo_start_date,
    demo_end_date,
    po_number,
    created_at,
    updated_at,
    created_by,
    updated_by,
    COALESCE(( SELECT sum(opportunity_item.extended_value_lakhs) AS sum
           FROM public.opportunity_item
          WHERE (opportunity_item.opportunity_id = o.id)), indicative_value, (0)::numeric) AS effective_value_lakhs
   FROM public.opportunity o;


--
-- Name: zone; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zone (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true
);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: activity activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: coverage_plan_entry coverage_plan_entry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan_entry
    ADD CONSTRAINT coverage_plan_entry_pkey PRIMARY KEY (id);


--
-- Name: coverage_plan_entry coverage_plan_entry_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan_entry
    ADD CONSTRAINT coverage_plan_entry_unique UNIQUE (coverage_plan_id, account_id);


--
-- Name: coverage_plan coverage_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan
    ADD CONSTRAINT coverage_plan_pkey PRIMARY KEY (id);


--
-- Name: coverage_plan coverage_plan_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan
    ADD CONSTRAINT coverage_plan_unique UNIQUE (user_id, planning_period);


--
-- Name: document document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);


--
-- Name: hold_reason hold_reason_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hold_reason
    ADD CONSTRAINT hold_reason_pkey PRIMARY KEY (id);


--
-- Name: hold_reason hold_reason_reason_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hold_reason
    ADD CONSTRAINT hold_reason_reason_code_key UNIQUE (reason_code);


--
-- Name: installed_asset installed_asset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installed_asset
    ADD CONSTRAINT installed_asset_pkey PRIMARY KEY (id);


--
-- Name: lead_source lead_source_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_source
    ADD CONSTRAINT lead_source_name_key UNIQUE (name);


--
-- Name: lead_source lead_source_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lead_source
    ADD CONSTRAINT lead_source_pkey PRIMARY KEY (id);


--
-- Name: loss_reason loss_reason_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loss_reason
    ADD CONSTRAINT loss_reason_pkey PRIMARY KEY (id);


--
-- Name: loss_reason loss_reason_reason_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.loss_reason
    ADD CONSTRAINT loss_reason_reason_code_key UNIQUE (reason_code);


--
-- Name: opportunity_item opportunity_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_item
    ADD CONSTRAINT opportunity_item_pkey PRIMARY KEY (id);


--
-- Name: opportunity_item opportunity_item_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_item
    ADD CONSTRAINT opportunity_item_unique UNIQUE (opportunity_id, product_id, line_type);


--
-- Name: opportunity opportunity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_pkey PRIMARY KEY (id);


--
-- Name: opportunity_stage opportunity_stage_display_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_stage
    ADD CONSTRAINT opportunity_stage_display_order_key UNIQUE (display_order);


--
-- Name: opportunity_stage opportunity_stage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_stage
    ADD CONSTRAINT opportunity_stage_pkey PRIMARY KEY (id);


--
-- Name: opportunity_stage opportunity_stage_stage_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_stage
    ADD CONSTRAINT opportunity_stage_stage_code_key UNIQUE (stage_code);


--
-- Name: opportunity_stakeholder opportunity_stakeholder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_stakeholder
    ADD CONSTRAINT opportunity_stakeholder_pkey PRIMARY KEY (opportunity_id, stakeholder_id);


--
-- Name: opportunity_status opportunity_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_status
    ADD CONSTRAINT opportunity_status_pkey PRIMARY KEY (id);


--
-- Name: opportunity_status opportunity_status_status_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_status
    ADD CONSTRAINT opportunity_status_status_code_key UNIQUE (status_code);


--
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: project_status project_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status
    ADD CONSTRAINT project_status_pkey PRIMARY KEY (id);


--
-- Name: project_status project_status_status_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status
    ADD CONSTRAINT project_status_status_code_key UNIQUE (status_code);


--
-- Name: reminder reminder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder
    ADD CONSTRAINT reminder_pkey PRIMARY KEY (id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: role role_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_role_name_key UNIQUE (role_name);


--
-- Name: sbu sbu_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sbu
    ADD CONSTRAINT sbu_name_key UNIQUE (name);


--
-- Name: sbu sbu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sbu
    ADD CONSTRAINT sbu_pkey PRIMARY KEY (id);


--
-- Name: split split_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split
    ADD CONSTRAINT split_pkey PRIMARY KEY (id);


--
-- Name: split split_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split
    ADD CONSTRAINT split_unique UNIQUE (opportunity_id, user_id);


--
-- Name: stakeholder stakeholder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stakeholder
    ADD CONSTRAINT stakeholder_pkey PRIMARY KEY (id);


--
-- Name: target_plan target_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_plan
    ADD CONSTRAINT target_plan_pkey PRIMARY KEY (id);


--
-- Name: target_plan target_plan_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_plan
    ADD CONSTRAINT target_plan_unique UNIQUE (user_id, sbu_id, planning_period);


--
-- Name: user_profile user_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_pkey PRIMARY KEY (id);


--
-- Name: zone zone_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zone
    ADD CONSTRAINT zone_name_key UNIQUE (name);


--
-- Name: zone zone_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zone
    ADD CONSTRAINT zone_pkey PRIMARY KEY (id);


--
-- Name: idx_account_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_name_trgm ON public.account USING gin (name public.gin_trgm_ops);


--
-- Name: idx_account_zone_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_account_zone_id ON public.account USING btree (zone_id);


--
-- Name: idx_activity_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_account_id ON public.activity USING btree (account_id);


--
-- Name: idx_activity_activity_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_activity_date ON public.activity USING btree (activity_date);


--
-- Name: idx_activity_opportunity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_opportunity_id ON public.activity USING btree (opportunity_id);


--
-- Name: idx_activity_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_user_id ON public.activity USING btree (user_id);


--
-- Name: idx_document_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_account_id ON public.document USING btree (account_id);


--
-- Name: idx_document_opportunity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_document_opportunity_id ON public.document USING btree (opportunity_id);


--
-- Name: idx_installed_asset_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_installed_asset_account_id ON public.installed_asset USING btree (account_id);


--
-- Name: idx_opportunity_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunity_account_id ON public.opportunity USING btree (account_id);


--
-- Name: idx_opportunity_expected_closure_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunity_expected_closure_date ON public.opportunity USING btree (expected_closure_date);


--
-- Name: idx_opportunity_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunity_name_trgm ON public.opportunity USING gin (name public.gin_trgm_ops);


--
-- Name: idx_opportunity_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunity_owner_id ON public.opportunity USING btree (owner_id);


--
-- Name: idx_opportunity_sbu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunity_sbu_id ON public.opportunity USING btree (sbu_id);


--
-- Name: idx_opportunity_stage_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunity_stage_id ON public.opportunity USING btree (stage_id);


--
-- Name: idx_opportunity_stakeholder_stakeholder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunity_stakeholder_stakeholder_id ON public.opportunity_stakeholder USING btree (stakeholder_id);


--
-- Name: idx_opportunity_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunity_status_id ON public.opportunity USING btree (status_id);


--
-- Name: idx_product_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_name_trgm ON public.product USING gin (name public.gin_trgm_ops);


--
-- Name: idx_project_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_account_id ON public.project USING btree (account_id);


--
-- Name: idx_project_name_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_name_trgm ON public.project USING gin (name public.gin_trgm_ops);


--
-- Name: idx_project_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_project_owner_id ON public.project USING btree (owner_id);


--
-- Name: idx_reminder_activity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminder_activity_id ON public.reminder USING btree (activity_id);


--
-- Name: idx_reminder_assigned_to_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminder_assigned_to_user_id ON public.reminder USING btree (assigned_to_user_id);


--
-- Name: idx_reminder_closing_activity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminder_closing_activity_id ON public.reminder USING btree (closing_activity_id);


--
-- Name: idx_reminder_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminder_due_date ON public.reminder USING btree (due_date);


--
-- Name: idx_stakeholder_account_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stakeholder_account_id ON public.stakeholder USING btree (account_id);


--
-- Name: idx_user_profile_manager_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profile_manager_id ON public.user_profile USING btree (manager_id);


--
-- Name: ix_product_oem_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_product_oem_name ON public.product USING btree (oem_name);


--
-- Name: ix_product_sbu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_product_sbu_id ON public.product USING btree (sbu_id);


--
-- Name: account trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.account FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: coverage_plan trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.coverage_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: coverage_plan_entry trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.coverage_plan_entry FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: installed_asset trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.installed_asset FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: opportunity trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.opportunity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: opportunity_item trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.opportunity_item FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: opportunity_stakeholder trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.opportunity_stakeholder FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: product trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.product FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: project trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.project FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: reminder trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.reminder FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: split trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.split FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: stakeholder trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.stakeholder FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: target_plan trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.target_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: user_profile trg_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.user_profile FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: account account_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: account account_parent_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_parent_account_id_fkey FOREIGN KEY (parent_account_id) REFERENCES public.account(id);


--
-- Name: account account_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: account account_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account
    ADD CONSTRAINT account_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(id);


--
-- Name: activity activity_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- Name: activity activity_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: activity activity_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunity(id);


--
-- Name: activity activity_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- Name: activity activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity
    ADD CONSTRAINT activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: coverage_plan coverage_plan_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan
    ADD CONSTRAINT coverage_plan_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: coverage_plan_entry coverage_plan_entry_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan_entry
    ADD CONSTRAINT coverage_plan_entry_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- Name: coverage_plan_entry coverage_plan_entry_coverage_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan_entry
    ADD CONSTRAINT coverage_plan_entry_coverage_plan_id_fkey FOREIGN KEY (coverage_plan_id) REFERENCES public.coverage_plan(id);


--
-- Name: coverage_plan_entry coverage_plan_entry_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan_entry
    ADD CONSTRAINT coverage_plan_entry_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: coverage_plan_entry coverage_plan_entry_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan_entry
    ADD CONSTRAINT coverage_plan_entry_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: coverage_plan coverage_plan_target_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan
    ADD CONSTRAINT coverage_plan_target_plan_id_fkey FOREIGN KEY (target_plan_id) REFERENCES public.target_plan(id);


--
-- Name: coverage_plan coverage_plan_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan
    ADD CONSTRAINT coverage_plan_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: coverage_plan coverage_plan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coverage_plan
    ADD CONSTRAINT coverage_plan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: document document_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- Name: document document_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunity(id);


--
-- Name: document document_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: document document_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- Name: document document_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.user_profile(id);


--
-- Name: installed_asset installed_asset_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installed_asset
    ADD CONSTRAINT installed_asset_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- Name: installed_asset installed_asset_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installed_asset
    ADD CONSTRAINT installed_asset_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: installed_asset installed_asset_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installed_asset
    ADD CONSTRAINT installed_asset_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: installed_asset installed_asset_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.installed_asset
    ADD CONSTRAINT installed_asset_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: opportunity opportunity_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- Name: opportunity opportunity_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: opportunity opportunity_hold_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_hold_reason_id_fkey FOREIGN KEY (hold_reason_id) REFERENCES public.hold_reason(id);


--
-- Name: opportunity_item opportunity_item_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_item
    ADD CONSTRAINT opportunity_item_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: opportunity_item opportunity_item_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_item
    ADD CONSTRAINT opportunity_item_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunity(id);


--
-- Name: opportunity_item opportunity_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_item
    ADD CONSTRAINT opportunity_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- Name: opportunity_item opportunity_item_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_item
    ADD CONSTRAINT opportunity_item_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: opportunity opportunity_lead_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_lead_source_id_fkey FOREIGN KEY (lead_source_id) REFERENCES public.lead_source(id);


--
-- Name: opportunity opportunity_loss_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_loss_reason_id_fkey FOREIGN KEY (loss_reason_id) REFERENCES public.loss_reason(id);


--
-- Name: opportunity opportunity_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.user_profile(id);


--
-- Name: opportunity opportunity_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- Name: opportunity opportunity_sbu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_sbu_id_fkey FOREIGN KEY (sbu_id) REFERENCES public.sbu(id);


--
-- Name: opportunity opportunity_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.opportunity_stage(id);


--
-- Name: opportunity_stakeholder opportunity_stakeholder_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_stakeholder
    ADD CONSTRAINT opportunity_stakeholder_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: opportunity_stakeholder opportunity_stakeholder_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_stakeholder
    ADD CONSTRAINT opportunity_stakeholder_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunity(id);


--
-- Name: opportunity_stakeholder opportunity_stakeholder_stakeholder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_stakeholder
    ADD CONSTRAINT opportunity_stakeholder_stakeholder_id_fkey FOREIGN KEY (stakeholder_id) REFERENCES public.stakeholder(id);


--
-- Name: opportunity_stakeholder opportunity_stakeholder_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity_stakeholder
    ADD CONSTRAINT opportunity_stakeholder_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: opportunity opportunity_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.opportunity_status(id);


--
-- Name: opportunity opportunity_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunity
    ADD CONSTRAINT opportunity_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: product product_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: product product_sbu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_sbu_id_fkey FOREIGN KEY (sbu_id) REFERENCES public.sbu(id);


--
-- Name: product product_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: project project_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- Name: project project_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: project project_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.user_profile(id);


--
-- Name: project project_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.project_status(id);


--
-- Name: project project_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: reminder reminder_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder
    ADD CONSTRAINT reminder_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activity(id);


--
-- Name: reminder reminder_assigned_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder
    ADD CONSTRAINT reminder_assigned_to_user_id_fkey FOREIGN KEY (assigned_to_user_id) REFERENCES public.user_profile(id);


--
-- Name: reminder reminder_closing_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder
    ADD CONSTRAINT reminder_closing_activity_id_fkey FOREIGN KEY (closing_activity_id) REFERENCES public.activity(id);


--
-- Name: reminder reminder_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder
    ADD CONSTRAINT reminder_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: reminder reminder_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder
    ADD CONSTRAINT reminder_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: split split_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split
    ADD CONSTRAINT split_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: split split_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split
    ADD CONSTRAINT split_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunity(id);


--
-- Name: split split_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split
    ADD CONSTRAINT split_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: split split_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.split
    ADD CONSTRAINT split_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: stakeholder stakeholder_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stakeholder
    ADD CONSTRAINT stakeholder_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.account(id);


--
-- Name: stakeholder stakeholder_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stakeholder
    ADD CONSTRAINT stakeholder_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: stakeholder stakeholder_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stakeholder
    ADD CONSTRAINT stakeholder_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: target_plan target_plan_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_plan
    ADD CONSTRAINT target_plan_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: target_plan target_plan_sbu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_plan
    ADD CONSTRAINT target_plan_sbu_id_fkey FOREIGN KEY (sbu_id) REFERENCES public.sbu(id);


--
-- Name: target_plan target_plan_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_plan
    ADD CONSTRAINT target_plan_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: target_plan target_plan_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.target_plan
    ADD CONSTRAINT target_plan_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profile(id);


--
-- Name: user_profile user_profile_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profile(id);


--
-- Name: user_profile user_profile_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.user_profile(id);


--
-- Name: user_profile user_profile_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(id);


--
-- Name: user_profile user_profile_sbu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_sbu_id_fkey FOREIGN KEY (sbu_id) REFERENCES public.sbu(id);


--
-- Name: user_profile user_profile_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profile(id);


--
-- Name: user_profile user_profile_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profile
    ADD CONSTRAINT user_profile_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(id);


--
-- Name: activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

--
-- Name: activity activity_tier_visibility; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY activity_tier_visibility ON public.activity USING (((opportunity_id IS NULL) OR (opportunity_id IN ( SELECT opportunity.id
   FROM public.opportunity))));


--
-- Name: document; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.document ENABLE ROW LEVEL SECURITY;

--
-- Name: document document_tier_visibility; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY document_tier_visibility ON public.document USING (((opportunity_id IS NULL) OR (opportunity_id IN ( SELECT opportunity.id
   FROM public.opportunity))));


--
-- Name: opportunity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunity ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunity_item; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunity_item ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunity_item opportunity_item_via_opportunity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY opportunity_item_via_opportunity ON public.opportunity_item USING ((opportunity_id IN ( SELECT opportunity.id
   FROM public.opportunity)));


--
-- Name: opportunity_stakeholder; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunity_stakeholder ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunity_stakeholder opportunity_stakeholder_via_opportunity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY opportunity_stakeholder_via_opportunity ON public.opportunity_stakeholder USING ((opportunity_id IN ( SELECT opportunity.id
   FROM public.opportunity)));


--
-- Name: opportunity opportunity_tier_visibility; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY opportunity_tier_visibility ON public.opportunity USING (((public.cabio_app_role_name() = ANY (ARRAY['Admin'::text, 'General Manager'::text])) OR ((public.cabio_app_role_name() = 'SBU Manager'::text) AND (sbu_id = public.cabio_app_sbu_id())) OR ((public.cabio_app_role_name() = 'Area Manager'::text) AND (sbu_id = public.cabio_app_sbu_id()) AND (account_id IN ( SELECT account.id
   FROM public.account
  WHERE (account.zone_id = public.cabio_app_zone_id())))) OR ((public.cabio_app_role_name() = 'Sales Manager'::text) AND (owner_id IN ( SELECT user_profile.id
   FROM public.user_profile
  WHERE (user_profile.manager_id = public.cabio_app_uid())))) OR (owner_id = public.cabio_app_uid()) OR public.cabio_app_has_split(id) OR public.cabio_app_assigned_reminder(id)));


--
-- Name: product; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

--
-- Name: product product_delete_sbu_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_delete_sbu_scoped ON public.product FOR DELETE USING (((public.cabio_app_role_name() = ANY (ARRAY['Admin'::text, 'General Manager'::text])) OR (sbu_id = public.cabio_app_sbu_id())));


--
-- Name: product product_insert_sbu_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_insert_sbu_scoped ON public.product FOR INSERT WITH CHECK (((public.cabio_app_role_name() = ANY (ARRAY['Admin'::text, 'General Manager'::text])) OR (sbu_id = public.cabio_app_sbu_id())));


--
-- Name: product product_read_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_read_all ON public.product FOR SELECT USING (true);


--
-- Name: product product_update_sbu_scoped; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY product_update_sbu_scoped ON public.product FOR UPDATE USING (((public.cabio_app_role_name() = ANY (ARRAY['Admin'::text, 'General Manager'::text])) OR (sbu_id = public.cabio_app_sbu_id()))) WITH CHECK (((public.cabio_app_role_name() = ANY (ARRAY['Admin'::text, 'General Manager'::text])) OR (sbu_id = public.cabio_app_sbu_id())));


--
-- Name: reminder; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reminder ENABLE ROW LEVEL SECURITY;

--
-- Name: reminder reminder_via_activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY reminder_via_activity ON public.reminder USING ((activity_id IN ( SELECT activity.id
   FROM public.activity)));


--
-- Name: split; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.split ENABLE ROW LEVEL SECURITY;

--
-- Name: split split_via_opportunity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY split_via_opportunity ON public.split USING ((opportunity_id IN ( SELECT opportunity.id
   FROM public.opportunity)));


--
-- PostgreSQL database dump complete
--

\unrestrict 6cHq1oT1wy7HBaZ1XXmshPWYbbbeiR90c47bCJSOPjgmwC2F8MCch2VbyrBefGc

