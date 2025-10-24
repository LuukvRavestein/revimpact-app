-- Step 5: Add update and delete restrictions
-- Run this in your Supabase SQL editor

-- Step 5: Admin users keep full access (unchanged)
-- member_admin_full_access policy remains

-- Step 5: Regular users can read their own memberships (unchanged)
-- member_user_read_own policy remains

-- Step 5: Regular users can read members of workspaces they created (unchanged)
-- member_user_read_workspace policy remains

-- Step 5: Regular users can create their own memberships (unchanged)
-- member_user_create_own policy remains

-- Step 5: Regular users can update their own memberships
CREATE POLICY "member_user_update_own" ON workspace_members
  FOR UPDATE USING (user_id = auth.uid());

-- Step 5: Regular users can delete their own memberships
CREATE POLICY "member_user_delete_own" ON workspace_members
  FOR DELETE USING (user_id = auth.uid());
