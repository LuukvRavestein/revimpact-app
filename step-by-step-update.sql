-- Step-by-step update for workspace_members table
-- Execute these one by one in Supabase SQL editor

-- STEP 1: Add the new columns
ALTER TABLE workspace_members 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- STEP 2: Check if columns were added (optional - just to verify)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workspace_members' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 3: Update existing records (replace with actual email addresses)
-- You can run these one by one and replace the email addresses with real ones

-- Update the first user (b21f6c67-0f25-42b1-9143-438ab7...)
UPDATE workspace_members 
SET user_email = 'luuk@revimpact.nl', user_name = 'Luuk van Ravestein'
WHERE user_id = 'b21f6c67-0f25-42b1-9143-438ab7abbc40';

-- Update the second user (4afcd25a-a419-45a2-be92-0a771d...)
UPDATE workspace_members 
SET user_email = 'test@example.com', user_name = 'Test User'
WHERE user_id = '4afcd25a-a419-45a2-be92-0a771da8546e';

-- Update the third user (64359fa9-7c13-4987-8cbd-add54...)
UPDATE workspace_members 
SET user_email = 'owner@example.com', user_name = 'Owner User'
WHERE user_id = '64359fa9-7c13-4987-8cbd-add54a1b2c3d';

-- STEP 4: Verify the updates
SELECT id, user_id, role, user_email, user_name 
FROM workspace_members 
WHERE user_email IS NOT NULL;
