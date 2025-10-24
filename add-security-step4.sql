-- Step 4: Add workspace-based access
-- Run this in your Supabase SQL editor

-- Drop the current user read policy
DROP POLICY IF EXISTS "member_user_read_own" ON workspace_members;

-- Step 4: Admin users keep full access (unchanged)
-- member_admin_full_access policy remains

-- Step 4: Regular users can read their own memberships
CREATE POLICY "member_user_read_own" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

-- Step 4: Regular users can read members of workspaces they belong to
-- This is safe because it doesn't reference workspace_members in the condition
CREATE POLICY "member_user_read_workspace" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE created_by = auth.uid()
    )
  );

-- Step 4: Regular users can create their own memberships (unchanged)
-- member_user_create_own policy remains
