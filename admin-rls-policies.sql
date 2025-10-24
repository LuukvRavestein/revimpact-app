-- Admin RLS Policies for RevImpact Central
-- Run this in your Supabase SQL editor to allow admin workspace management

-- First, create a function to check if user is admin
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

-- Admin policies for workspaces table
DROP POLICY IF EXISTS "Admins can view all workspaces" ON workspaces;
CREATE POLICY "Admins can view all workspaces" ON workspaces
  FOR SELECT USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can create workspaces" ON workspaces;
CREATE POLICY "Admins can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "Admins can update workspaces" ON workspaces;
CREATE POLICY "Admins can update workspaces" ON workspaces
  FOR UPDATE USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can delete workspaces" ON workspaces;
CREATE POLICY "Admins can delete workspaces" ON workspaces
  FOR DELETE USING (is_admin_user());

-- Admin policies for workspace_members table
DROP POLICY IF EXISTS "Admins can view all workspace members" ON workspace_members;
CREATE POLICY "Admins can view all workspace members" ON workspace_members
  FOR SELECT USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can create workspace members" ON workspace_members;
CREATE POLICY "Admins can create workspace members" ON workspace_members
  FOR INSERT WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "Admins can update workspace members" ON workspace_members;
CREATE POLICY "Admins can update workspace members" ON workspace_members
  FOR UPDATE USING (is_admin_user());

DROP POLICY IF EXISTS "Admins can delete workspace members" ON workspace_members;
CREATE POLICY "Admins can delete workspace members" ON workspace_members
  FOR DELETE USING (is_admin_user());

-- Keep existing user policies but make them more permissive
-- Users can still view workspaces they belong to
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON workspaces;
CREATE POLICY "Users can view workspaces they belong to" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    ) OR is_admin_user()
  );

-- Users can still create workspaces (for normal users)
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT WITH CHECK (created_by = auth.uid() OR is_admin_user());

-- Users can still view their workspace memberships
DROP POLICY IF EXISTS "Users can view their workspace memberships" ON workspace_members;
CREATE POLICY "Users can view their workspace memberships" ON workspace_members
  FOR SELECT USING (user_id = auth.uid() OR is_admin_user());

-- Users can still create workspace memberships
DROP POLICY IF EXISTS "Users can create workspace memberships" ON workspace_members;
CREATE POLICY "Users can create workspace memberships" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin_user());
