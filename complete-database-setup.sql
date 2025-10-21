-- Complete Database Setup for RevImpact
-- Run this entire script in your Supabase SQL editor

-- First, create the basic workspace tables (from README)
-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS on basic tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for workspaces
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON workspaces;
CREATE POLICY "Users can view workspaces they belong to" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Basic RLS policies for workspace_members
DROP POLICY IF EXISTS "Users can view their workspace memberships" ON workspace_members;
CREATE POLICY "Users can view their workspace memberships" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create workspace memberships" ON workspace_members;
CREATE POLICY "Users can create workspace memberships" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Now create the customer data tables
-- Customer data uploads table
CREATE TABLE IF NOT EXISTS customer_data_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL, -- 'csv' or 'xlsx'
  file_size integer NOT NULL,
  upload_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text DEFAULT 'uploaded' NOT NULL, -- 'uploaded', 'processed', 'mapped', 'error'
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Column mappings for uploaded files
CREATE TABLE IF NOT EXISTS column_mappings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id uuid REFERENCES customer_data_uploads(id) ON DELETE CASCADE,
  original_column_name text NOT NULL,
  mapped_field text NOT NULL, -- 'customer_name', 'mrr', 'churn_risk', etc.
  data_type text DEFAULT 'text', -- 'text', 'number', 'date', 'boolean'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customer records from uploaded data
CREATE TABLE IF NOT EXISTS customer_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES customer_data_uploads(id) ON DELETE CASCADE,
  customer_name text,
  customer_email text,
  company text,
  mrr numeric,
  churn_risk text, -- 'Low', 'Medium', 'High'
  last_activity text,
  support_tickets text,
  feature_usage text,
  industry text,
  company_size text,
  contract_value numeric,
  renewal_date date,
  raw_data jsonb, -- Store all original data as JSON
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- QBR reports generated from customer data
CREATE TABLE IF NOT EXISTS qbr_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_record_id uuid REFERENCES customer_records(id) ON DELETE CASCADE,
  report_title text NOT NULL,
  report_content text NOT NULL,
  generated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on customer data tables
ALTER TABLE customer_data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qbr_reports ENABLE ROW LEVEL SECURITY;

-- Policies for customer_data_uploads
DROP POLICY IF EXISTS "Users can view uploads in their workspace" ON customer_data_uploads;
CREATE POLICY "Users can view uploads in their workspace" ON customer_data_uploads
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create uploads in their workspace" ON customer_data_uploads;
CREATE POLICY "Users can create uploads in their workspace" ON customer_data_uploads
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policies for column_mappings
DROP POLICY IF EXISTS "Users can view mappings for their uploads" ON column_mappings;
CREATE POLICY "Users can view mappings for their uploads" ON column_mappings
  FOR SELECT USING (
    upload_id IN (
      SELECT id FROM customer_data_uploads 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create mappings for their uploads" ON column_mappings;
CREATE POLICY "Users can create mappings for their uploads" ON column_mappings
  FOR INSERT WITH CHECK (
    upload_id IN (
      SELECT id FROM customer_data_uploads 
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policies for customer_records
DROP POLICY IF EXISTS "Users can view customer records in their workspace" ON customer_records;
CREATE POLICY "Users can view customer records in their workspace" ON customer_records
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create customer records in their workspace" ON customer_records;
CREATE POLICY "Users can create customer records in their workspace" ON customer_records
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policies for qbr_reports
DROP POLICY IF EXISTS "Users can view QBR reports in their workspace" ON qbr_reports;
CREATE POLICY "Users can view QBR reports in their workspace" ON qbr_reports
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create QBR reports in their workspace" ON qbr_reports;
CREATE POLICY "Users can create QBR reports in their workspace" ON qbr_reports
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_data_uploads_workspace ON customer_data_uploads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customer_data_uploads_created_by ON customer_data_uploads(created_by);
CREATE INDEX IF NOT EXISTS idx_column_mappings_upload_id ON column_mappings(upload_id);
CREATE INDEX IF NOT EXISTS idx_customer_records_workspace ON customer_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_customer_records_upload ON customer_records(upload_id);
CREATE INDEX IF NOT EXISTS idx_qbr_reports_workspace ON qbr_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_qbr_reports_customer ON qbr_reports(customer_record_id);

-- Success message
SELECT 'Database setup completed successfully! All tables and policies created.' as status;
