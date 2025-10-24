-- Fix RLS policies for workspaces table to allow users to read their workspace
-- Run this in your Supabase SQL editor

-- Check current RLS policies on workspaces table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'workspaces';

-- Add policy to allow users to read workspaces they are members of
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
CREATE POLICY "Users can view their workspaces" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Also ensure admins can view all workspaces
DROP POLICY IF EXISTS "Admins can view all workspaces" ON workspaces;
CREATE POLICY "Admins can view all workspaces" ON workspaces
  FOR SELECT USING (is_admin_user());

-- Check if the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'workspaces';
