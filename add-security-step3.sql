-- Step 3: Add user-specific restrictions
-- Run this in your Supabase SQL editor

-- Drop the current user policies
DROP POLICY IF EXISTS "member_user_read" ON workspace_members;
DROP POLICY IF EXISTS "member_user_create" ON workspace_members;

-- Step 3: Admin users keep full access (unchanged)
-- member_admin_full_access policy remains

-- Step 3: Regular users can only read their own memberships
CREATE POLICY "member_user_read_own" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

-- Step 3: Regular users can create their own memberships (for invitations)
CREATE POLICY "member_user_create_own" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
