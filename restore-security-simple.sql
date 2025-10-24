-- Restore security with very simple policies to avoid recursion
-- Run this in your Supabase SQL editor

-- First, drop the problematic policies
DROP POLICY IF EXISTS "member_admin_all" ON workspace_members;
DROP POLICY IF EXISTS "member_user_read_own" ON workspace_members;
DROP POLICY IF EXISTS "member_user_create_own" ON workspace_members;
DROP POLICY IF EXISTS "member_user_read_workspace" ON workspace_members;

-- Re-enable RLS on workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create very simple policies that don't cause recursion
-- Admin users can do everything
CREATE POLICY "member_admin_all" ON workspace_members
  FOR ALL USING (is_admin_user());

-- All authenticated users can read workspace members (for now)
-- This is safe and doesn't cause recursion
CREATE POLICY "member_authenticated_read" ON workspace_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- All authenticated users can create workspace members (for invitations)
CREATE POLICY "member_authenticated_create" ON workspace_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
