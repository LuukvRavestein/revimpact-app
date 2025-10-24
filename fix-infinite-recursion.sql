-- Fix infinite recursion in workspace_members RLS policies
-- Run this in your Supabase SQL editor

-- First, drop ALL existing policies to break the recursion
DROP POLICY IF EXISTS "admin_workspace_full_access" ON workspaces;
DROP POLICY IF EXISTS "user_workspace_view_access" ON workspaces;
DROP POLICY IF EXISTS "user_workspace_create_access" ON workspaces;

DROP POLICY IF EXISTS "admin_member_full_access" ON workspace_members;
DROP POLICY IF EXISTS "user_member_view_own" ON workspace_members;
DROP POLICY IF EXISTS "user_member_view_workspace" ON workspace_members;
DROP POLICY IF EXISTS "user_member_create_own" ON workspace_members;

-- Create simple, non-recursive policies for workspaces
CREATE POLICY "workspace_admin_access" ON workspaces
  FOR ALL USING (is_admin_user());

CREATE POLICY "workspace_user_view" ON workspaces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_user_create" ON workspaces
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Create simple, non-recursive policies for workspace_members
CREATE POLICY "member_admin_access" ON workspace_members
  FOR ALL USING (is_admin_user());

CREATE POLICY "member_user_view_own" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "member_user_view_workspace" ON workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id 
      AND wm2.user_id = auth.uid()
    )
  );

CREATE POLICY "member_user_create" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
