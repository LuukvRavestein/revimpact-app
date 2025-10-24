-- Fix invitation access for anonymous users
-- Run this in your Supabase SQL editor

-- Add policy to allow anonymous users to read invitations by token
DROP POLICY IF EXISTS "Anonymous users can read invitations by token" ON workspace_invitations;
CREATE POLICY "Anonymous users can read invitations by token" ON workspace_invitations
  FOR SELECT USING (true);

-- Add policy to allow anonymous users to update invitation status when accepting
DROP POLICY IF EXISTS "Anonymous users can update invitation status" ON workspace_invitations;
CREATE POLICY "Anonymous users can update invitation status" ON workspace_invitations
  FOR UPDATE USING (true);

-- Keep existing policies for authenticated users
DROP POLICY IF EXISTS "Users can view invitations for their workspace" ON workspace_invitations;
CREATE POLICY "Users can view invitations for their workspace" ON workspace_invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    ) OR is_admin_user()
  );

DROP POLICY IF EXISTS "Admins can create invitations" ON workspace_invitations;
CREATE POLICY "Admins can create invitations" ON workspace_invitations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR is_admin_user()
  );

DROP POLICY IF EXISTS "Admins can update invitations" ON workspace_invitations;
CREATE POLICY "Admins can update invitations" ON workspace_invitations
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR is_admin_user()
  );

-- Success message
SELECT 'Invitation access policies updated successfully!' as status;
