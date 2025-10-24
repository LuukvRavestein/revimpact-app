-- Fix infinite recursion in RLS policies
-- Run this in your Supabase SQL editor

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their workspace memberships" ON workspace_members;
DROP POLICY IF EXISTS "Users can create workspace memberships" ON workspace_members;
DROP POLICY IF EXISTS "Admins can manage workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

-- Create simplified, non-recursive policies
CREATE POLICY "Users can view their own memberships" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all memberships" ON workspace_members
  FOR SELECT USING (is_admin_user());

CREATE POLICY "Users can create their own memberships" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can create any membership" ON workspace_members
  FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update any membership" ON workspace_members
  FOR UPDATE USING (is_admin_user());

CREATE POLICY "Admins can delete any membership" ON workspace_members
  FOR DELETE USING (is_admin_user());
