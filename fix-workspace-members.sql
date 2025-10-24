-- Fix workspace_members table structure
-- Run this in your Supabase SQL editor

-- First, check if the table exists and has the right structure
-- If not, recreate it properly

-- Drop and recreate workspace_members table with proper structure
DROP TABLE IF EXISTS workspace_members CASCADE;

CREATE TABLE workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DROP POLICY IF EXISTS "Users can view their workspace memberships" ON workspace_members;
CREATE POLICY "Users can view their workspace memberships" ON workspace_members
  FOR SELECT USING (user_id = auth.uid() OR is_admin_user());

DROP POLICY IF EXISTS "Users can create workspace memberships" ON workspace_members;
CREATE POLICY "Users can create workspace memberships" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin_user());

DROP POLICY IF EXISTS "Admins can manage workspace members" ON workspace_members;
CREATE POLICY "Admins can manage workspace members" ON workspace_members
  FOR ALL USING (is_admin_user());

DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;
CREATE POLICY "Workspace owners can manage members" ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Recreate existing memberships for existing workspaces
-- This will recreate the owner memberships
INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT 
  w.id,
  w.created_by,
  'owner'
FROM workspaces w
WHERE w.created_by IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO NOTHING;
