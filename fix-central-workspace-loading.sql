-- Fix RevImpact Central workspace loading issue
-- Run this in your Supabase SQL editor

-- First, ensure the admin function exists and works correctly
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user email contains 'admin' or is specific admin emails
  RETURN (
    auth.jwt() ->> 'email' ILIKE '%admin%' OR
    auth.jwt() ->> 'email' = 'luuk@revimpact.nl' OR
    auth.jwt() ->> 'email' = 'admin@revimpact.nl'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all workspaces" ON workspaces;
DROP POLICY IF EXISTS "Admins can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Admins can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Admins can delete workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;

DROP POLICY IF EXISTS "Admins can view all workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can create workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can update workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Admins can delete workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view their workspace memberships" ON workspace_members;
DROP POLICY IF EXISTS "Users can create workspace memberships" ON workspace_members;

-- Create comprehensive policies for workspaces
CREATE POLICY "Admin full access to workspaces" ON workspaces
  FOR ALL USING (is_admin_user());

CREATE POLICY "Users can view their workspaces" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Create comprehensive policies for workspace_members
CREATE POLICY "Admin full access to workspace members" ON workspace_members
  FOR ALL USING (is_admin_user());

CREATE POLICY "Users can view their workspace memberships" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view workspace members of their workspaces" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspace memberships" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
