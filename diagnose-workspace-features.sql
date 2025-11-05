-- Diagnose Workspace Features Issue
-- Run this in your Production Supabase SQL editor

-- 1. Check if workspace_features table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'workspace_features'
) as table_exists;

-- 2. Check Timewax workspace
SELECT id, name, created_at 
FROM workspaces 
WHERE name ILIKE '%timewax%'
ORDER BY created_at DESC;

-- 3. Check if workspace_features has any data
SELECT COUNT(*) as total_features 
FROM workspace_features;

-- 4. Check features for Timewax workspace
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  wf.id as feature_id,
  wf.feature_name,
  wf.enabled,
  wf.created_at
FROM workspaces w
LEFT JOIN workspace_features wf ON w.id = wf.workspace_id
WHERE w.name ILIKE '%timewax%'
ORDER BY wf.feature_name;

-- 5. Check RLS policies on workspace_features
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'workspace_features';

-- 6. Check if current user can access workspace_features
-- (Run this as the logged in user)
SELECT * FROM workspace_features LIMIT 1;

-- SOLUTION: If table doesn't exist, run add-academy-feature.sql
-- This will create the table and add the academy_monitoring feature

