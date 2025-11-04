-- Fix RLS Policies for workspace_features in Production
-- Run this in your Production Supabase SQL editor
-- This fixes the "permission denied for table users" error

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can manage workspace features" ON workspace_features;

-- Update the SELECT policy to be simpler (no auth.users access needed)
DROP POLICY IF EXISTS "Users can view workspace features they belong to" ON workspace_features;
CREATE POLICY "Users can view workspace features they belong to" ON workspace_features
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Keep the owner policy (this is safe)
DROP POLICY IF EXISTS "Workspace owners can manage features" ON workspace_features;
CREATE POLICY "Workspace owners can manage features" ON workspace_features
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Verify policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'workspace_features'
ORDER BY policyname;

