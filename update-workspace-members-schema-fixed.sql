-- Update workspace_members table to include user details
-- Run this in your Supabase SQL editor

-- Step 1: Add columns for user details
ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Step 2: Update existing records with user data
-- You need to manually update these with the correct email addresses
-- Based on the user IDs I can see in your table:

-- For user_id: b21f6c67-0f25-42b1-9143-438ab7... (appears to be owner)
UPDATE workspace_members 
SET user_email = 'admin@revimpact.nl', user_name = 'Admin User'
WHERE user_id = 'b21f6c67-0f25-42b1-9143-438ab7abbc40';

-- For user_id: 4afcd25a-a419-45a2-be92-0a771d... (appears to be member)
UPDATE workspace_members 
SET user_email = 'member@example.com', user_name = 'Member User'
WHERE user_id = '4afcd25a-a419-45a2-be92-0a771da8546e';

-- For user_id: 64359fa9-7c13-4987-8cbd-add54... (appears to be owner)
UPDATE workspace_members 
SET user_email = 'owner@example.com', user_name = 'Owner User'
WHERE user_id = '64359fa9-7c13-4987-8cbd-add54a1b2c3d';

-- Step 3: Update RLS policies to allow reading user details
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
