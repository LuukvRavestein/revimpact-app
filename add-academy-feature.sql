-- Add Timewax Academy feature to workspace_features table
-- Run this script in your Supabase SQL editor
-- This script will create the workspace_features table if it doesn't exist

-- First, create workspace_features table if it doesn't exist
CREATE TABLE IF NOT EXISTS workspace_features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(workspace_id, feature_name)
);

-- Enable RLS if not already enabled
ALTER TABLE workspace_features ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DROP POLICY IF EXISTS "Users can view workspace features they belong to" ON workspace_features;
CREATE POLICY "Users can view workspace features they belong to" ON workspace_features
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage workspace features" ON workspace_features;
CREATE POLICY "Admins can manage workspace features" ON workspace_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (email ILIKE '%admin%' OR email = 'luuk@revimpact.nl' OR email = 'admin@revimpact.nl')
    )
  );

DROP POLICY IF EXISTS "Workspace owners can manage features" ON workspace_features;
CREATE POLICY "Workspace owners can manage features" ON workspace_features
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Add academy_monitoring feature for Timewax workspaces
INSERT INTO workspace_features (workspace_id, feature_name, enabled)
SELECT 
  w.id,
  'academy_monitoring',
  true
FROM workspaces w
WHERE w.name ILIKE '%timewax%'
  AND NOT EXISTS (
    SELECT 1 FROM workspace_features wf 
    WHERE wf.workspace_id = w.id 
    AND wf.feature_name = 'academy_monitoring'
  );

-- Success message
SELECT 'Academy monitoring feature added to Timewax workspaces!' as status;

