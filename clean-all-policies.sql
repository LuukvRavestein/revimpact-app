-- Clean ALL policies from workspace_members table
-- Run this in your Supabase SQL editor

-- Drop ALL existing policies on workspace_members table (including old ones)
DROP POLICY IF EXISTS "Admins can create any membership" ON workspace_members;
DROP POLICY IF EXISTS "Admins can delete any membership" ON workspace_members;
DROP POLICY IF EXISTS "Admins can update any membership" ON workspace_members;
DROP POLICY IF EXISTS "Admins can view all memberships" ON workspace_members;
DROP POLICY IF EXISTS "Admins can view all workspace members" ON workspace_members;
DROP POLICY IF EXISTS "member_admin_all" ON workspace_members;
DROP POLICY IF EXISTS "member_authenticated_create" ON workspace_members;
DROP POLICY IF EXISTS "member_authenticated_read" ON workspace_members;
DROP POLICY IF EXISTS "Users can create their own memberships" ON workspace_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "member_user_read_own" ON workspace_members;
DROP POLICY IF EXISTS "member_user_create_own" ON workspace_members;
DROP POLICY IF EXISTS "member_user_read_workspace" ON workspace_members;
DROP POLICY IF EXISTS "member_simple_read" ON workspace_members;
DROP POLICY IF EXISTS "member_simple_create" ON workspace_members;
DROP POLICY IF EXISTS "member_basic_read" ON workspace_members;
DROP POLICY IF EXISTS "member_basic_create" ON workspace_members;

-- Temporarily disable RLS to clear any cached policies
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create only ONE very basic policy for reading
CREATE POLICY "member_read_only" ON workspace_members
  FOR SELECT USING (true);

-- Create only ONE very basic policy for creating
CREATE POLICY "member_create_only" ON workspace_members
  FOR INSERT WITH CHECK (true);
