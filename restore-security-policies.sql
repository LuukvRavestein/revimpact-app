-- Restore security policies for workspace_members with simple, non-recursive rules
-- Run this in your Supabase SQL editor

-- First, ensure the admin function exists
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user email contains 'admin' or is specific admin emails
  RETURN (
    auth.jwt() ->> 'email' ILIKE '%admin%' OR
    auth.jwt() ->> 'email' = 'luuk@revimpact.nl' OR
    auth.jwt() ->> 'email' = 'admin@revimpact.nl'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-enable RLS on workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for workspace_members
-- Admin users can do everything
CREATE POLICY "member_admin_all" ON workspace_members
  FOR ALL USING (is_admin_user());

-- Regular users can read their own memberships
CREATE POLICY "member_user_read_own" ON workspace_members
  FOR SELECT USING (user_id = auth.uid());

-- Regular users can create their own memberships (for invitations)
CREATE POLICY "member_user_create_own" ON workspace_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Regular users can read members of workspaces they belong to
-- This is safe because it doesn't reference workspace_members in the condition
CREATE POLICY "member_user_read_workspace" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE created_by = auth.uid()
    )
  );
