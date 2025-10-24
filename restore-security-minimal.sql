-- Restore minimal security - remove ALL policies and create only basic ones
-- Run this in your Supabase SQL editor

-- Drop ALL existing policies on workspace_members table
DROP POLICY IF EXISTS "member_admin_all" ON workspace_members;
DROP POLICY IF EXISTS "member_user_read_own" ON workspace_members;
DROP POLICY IF EXISTS "member_user_create_own" ON workspace_members;
DROP POLICY IF EXISTS "member_user_read_workspace" ON workspace_members;
DROP POLICY IF EXISTS "member_authenticated_read" ON workspace_members;
DROP POLICY IF EXISTS "member_authenticated_create" ON workspace_members;
DROP POLICY IF EXISTS "member_simple_read" ON workspace_members;
DROP POLICY IF EXISTS "member_simple_create" ON workspace_members;

-- Temporarily disable RLS to clear any cached policies
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create only ONE very basic policy for reading
CREATE POLICY "member_basic_read" ON workspace_members
  FOR SELECT USING (true);

-- Create only ONE very basic policy for creating
CREATE POLICY "member_basic_create" ON workspace_members
  FOR INSERT WITH CHECK (true);
