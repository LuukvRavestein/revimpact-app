-- Fix workspace members loading issue
-- Run this in your Supabase SQL editor

-- Update the member_user_read policy to be more permissive for workspace management
DROP POLICY IF EXISTS "member_user_read" ON workspace_members;

-- Create a more permissive policy that allows reading workspace members
-- for users who are members of any workspace (needed for admin functionality)
CREATE POLICY "member_user_read" ON workspace_members
  FOR SELECT USING (
    -- Allow if user is admin
    is_admin_user() OR
    -- Allow if user is a member of this workspace
    user_id = auth.uid() OR
    -- Allow if user is a member of any workspace (for admin views)
    EXISTS (
      SELECT 1 FROM workspace_members wm2 
      WHERE wm2.user_id = auth.uid()
    )
  );
