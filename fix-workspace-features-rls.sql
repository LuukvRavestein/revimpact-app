-- Fix RLS policies for workspace_features table
-- Run this in your Supabase SQL editor

-- Check current RLS policies on workspace_features table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'workspace_features';

-- Add policy to allow users to read features for workspaces they are members of
DROP POLICY IF EXISTS "Users can view workspace features" ON workspace_features;
CREATE POLICY "Users can view workspace features" ON workspace_features
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Also ensure admins can view all workspace features
DROP POLICY IF EXISTS "Admins can view all workspace features" ON workspace_features;
CREATE POLICY "Admins can view all workspace features" ON workspace_features
  FOR SELECT USING (is_admin_user());

-- Check if the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'workspace_features';
