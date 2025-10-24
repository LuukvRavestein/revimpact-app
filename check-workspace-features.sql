-- Check workspace features for Timewax workspace
-- Run this in your Supabase SQL editor

-- First, let's see what workspaces exist
SELECT id, name, created_at FROM workspaces ORDER BY created_at DESC;

-- Check workspace features for all workspaces
SELECT 
  w.name as workspace_name,
  wf.feature_name,
  wf.enabled,
  wf.created_at
FROM workspaces w
LEFT JOIN workspace_features wf ON w.id = wf.workspace_id
ORDER BY w.name, wf.feature_name;

-- Check if Timewax workspace has any features
SELECT 
  w.name as workspace_name,
  COUNT(wf.id) as feature_count
FROM workspaces w
LEFT JOIN workspace_features wf ON w.id = wf.workspace_id
WHERE w.name ILIKE '%timewax%'
GROUP BY w.id, w.name;

-- If no features exist, let's create them for Timewax
-- First, get the Timewax workspace ID
-- Then run the insert statements below

-- Example insert (replace WORKSPACE_ID with actual ID):
/*
INSERT INTO workspace_features (workspace_id, feature_name, enabled) VALUES
('WORKSPACE_ID', 'Admin Panel', false),
('WORKSPACE_ID', 'Chatbot Analytics', true),
('WORKSPACE_ID', 'Data Upload', false),
('WORKSPACE_ID', 'QBR Generator', false),
('WORKSPACE_ID', 'Workspace Instellingen', false);
*/
