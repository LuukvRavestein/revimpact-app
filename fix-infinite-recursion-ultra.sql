-- Ultra fix for infinite recursion - remove ALL policies from workspace_members
-- Run this in your Supabase SQL editor

-- Drop ALL existing policies on workspace_members table
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

-- Temporarily disable RLS on workspace_members to break all recursion
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create only ONE simple policy for workspace_members
CREATE POLICY "member_simple_read" ON workspace_members
  FOR SELECT USING (true);

CREATE POLICY "member_simple_create" ON workspace_members
  FOR INSERT WITH CHECK (true);
