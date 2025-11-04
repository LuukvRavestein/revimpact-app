-- Check Academy Feature in Staging
-- Run this in your Supabase SQL editor (staging environment)

-- Check if workspace_features table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'workspace_features'
) as table_exists;

-- Check all workspaces
SELECT id, name, created_at FROM workspaces ORDER BY created_at DESC;

-- Check workspace features for Timewax workspace
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  wf.feature_name,
  wf.enabled,
  wf.created_at
FROM workspaces w
LEFT JOIN workspace_features wf ON w.id = wf.workspace_id
WHERE w.name ILIKE '%timewax%'
ORDER BY wf.feature_name;

-- Check if academy_monitoring feature exists
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  wf.id as feature_id,
  wf.feature_name,
  wf.enabled
FROM workspaces w
LEFT JOIN workspace_features wf ON w.id = wf.workspace_id AND wf.feature_name = 'academy_monitoring'
WHERE w.name ILIKE '%timewax%';

-- If academy_monitoring doesn't exist, add it manually
-- Replace WORKSPACE_ID with the actual workspace ID from above
/*
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
*/

