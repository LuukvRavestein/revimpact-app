-- Step 1: Add basic authentication check
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

-- Drop the current basic policies
DROP POLICY IF EXISTS "member_read_only" ON workspace_members;
DROP POLICY IF EXISTS "member_create_only" ON workspace_members;

-- Step 1: Only allow authenticated users to read workspace members
CREATE POLICY "member_authenticated_read" ON workspace_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Step 1: Only allow authenticated users to create workspace members
CREATE POLICY "member_authenticated_create" ON workspace_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
