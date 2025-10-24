-- Update workspace_members table to include user details
-- Run this in your Supabase SQL editor

-- Add columns for user details
ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Update existing records with user data
-- You'll need to manually update these with the correct email addresses
-- Example:
-- UPDATE workspace_members 
-- SET user_email = 'user@example.com', user_name = 'User Name'
-- WHERE user_id = 'b21f6c67-0f25-42b1-9143-438ab7abbc40';

-- Update RLS policies to allow reading user details
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
CREATE POLICY "Users can view workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Allow admins to view all workspace members
DROP POLICY IF EXISTS "Admins can view all workspace members" ON workspace_members;
CREATE POLICY "Admins can view all workspace members" ON workspace_members
  FOR SELECT USING (is_admin_user());
