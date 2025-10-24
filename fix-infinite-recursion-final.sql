-- Final fix for infinite recursion - use very simple policies
-- Run this in your Supabase SQL editor

-- Drop the problematic policy
DROP POLICY IF EXISTS "member_user_read" ON workspace_members;

-- Create a very simple policy that doesn't cause recursion
CREATE POLICY "member_user_read" ON workspace_members
  FOR SELECT USING (true);
