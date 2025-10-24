-- Fix infinite recursion in workspace_members RLS policies - Version 3
-- Run this in your Supabase SQL editor

-- First, drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "workspace_admin_all" ON workspaces;
DROP POLICY IF EXISTS "workspace_user_read" ON workspaces;
DROP POLICY IF EXISTS "workspace_user_create" ON workspaces;
DROP POLICY IF EXISTS "workspace_admin_access" ON workspaces;
DROP POLICY IF EXISTS "workspace_user_view" ON workspaces;
DROP POLICY IF EXISTS "workspace_user_create_access" ON workspaces;
DROP POLICY IF EXISTS "admin_workspace_full_access" ON workspaces;
DROP POLICY IF EXISTS "user_workspace_view_access" ON workspaces;
DROP POLICY IF EXISTS "user_workspace_create_access" ON workspaces;

DROP POLICY IF EXISTS "member_admin_all" ON workspace_members;
DROP POLICY IF EXISTS "member_user_read" ON workspace_members;
DROP POLICY IF EXISTS "member_user_create" ON workspace_members;
DROP POLICY IF EXISTS "member_admin_access" ON workspace_members;
DROP POLICY IF EXISTS "member_user_view_own" ON workspace_members;
DROP POLICY IF EXISTS "member_user_view_workspace" ON workspace_members;
DROP POLICY IF EXISTS "member_user_create_own" ON workspace_members;
DROP POLICY IF EXISTS "admin_member_full_access" ON workspace_members;
DROP POLICY IF EXISTS "user_member_view_own" ON workspace_members;
DROP POLICY IF EXISTS "user_member_view_workspace" ON workspace_members;
DROP POLICY IF EXISTS "user_member_create_own" ON workspace_members;

-- Now completely disable RLS temporarily to break the recursion
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

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
