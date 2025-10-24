-- Step 6: Final optimizations and cleanup
-- Run this in your Supabase SQL editor

-- Step 6: All policies are now in place and working
-- Let's add a final policy for workspace owners to manage their workspace members
-- This allows workspace owners to see all members of their workspaces

-- Step 6: Workspace owners can read all members of their workspaces
-- This is safe because it doesn't reference workspace_members in the condition
CREATE POLICY "member_workspace_owner_read" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE created_by = auth.uid()
    )
  );

-- Note: This policy might overlap with member_user_read_workspace
-- but that's okay - multiple policies can grant access
-- The most restrictive policy will apply

-- Final security summary:
-- 1. Admin users: Full access to all workspace members (member_admin_full_access)
-- 2. Regular users: Can read their own memberships (member_user_read_own)
-- 3. Workspace owners: Can read all members of their workspaces (member_workspace_owner_read)
-- 4. Regular users: Can create their own memberships (member_user_create_own)
-- 5. Regular users: Can update their own memberships (member_user_update_own)
-- 6. Only admins: Can delete memberships (via member_admin_full_access)
