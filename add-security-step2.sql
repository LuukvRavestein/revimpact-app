-- Step 2: Add admin full access
-- Run this in your Supabase SQL editor

-- Drop the current policies
DROP POLICY IF EXISTS "member_authenticated_read" ON workspace_members;
DROP POLICY IF EXISTS "member_authenticated_create" ON workspace_members;

-- Step 2: Admin users get full access to all workspace members
CREATE POLICY "member_admin_full_access" ON workspace_members
  FOR ALL USING (is_admin_user());

-- Step 2: Regular authenticated users can read workspace members
CREATE POLICY "member_user_read" ON workspace_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Step 2: Regular authenticated users can create workspace members
CREATE POLICY "member_user_create" ON workspace_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
