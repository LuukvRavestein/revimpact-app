-- Fix infinite recursion in workspace_members RLS policies - Version 2
-- Run this in your Supabase SQL editor

-- First, completely disable RLS temporarily to break the recursion
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- Wait a moment for the changes to take effect
-- Then re-enable RLS with simple policies

-- Re-enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create very simple, non-recursive policies for workspaces
CREATE POLICY "workspace_admin_all" ON workspaces
  FOR ALL USING (is_admin_user());

CREATE POLICY "workspace_user_read" ON workspaces
  FOR SELECT USING (true);

CREATE POLICY "workspace_user_create" ON workspaces
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Create very simple, non-recursive policies for workspace_members
CREATE POLICY "member_admin_all" ON workspace_members
  FOR ALL USING (is_admin_user());

CREATE POLICY "member_user_read" ON workspace_members
  FOR SELECT USING (true);

CREATE POLICY "member_user_create" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
