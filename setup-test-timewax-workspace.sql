-- Setup Test Timewax Workspace for Staging
-- Run this in your Supabase SQL editor (staging environment)
-- 
-- STAP 1: Vind je user ID (vervang met je email)
-- Kopieer je user ID uit de resultaten
SELECT id, email FROM auth.users WHERE email = 'jouw-email@example.com';

-- STAP 2: Voer dit script uit (vervang USER_ID_HIER met je user ID van STAP 1)
-- Dit script doet alles in één keer:
DO $$
DECLARE
  v_user_id uuid := 'USER_ID_HIER'; -- VERVANG DIT MET JE USER ID VAN STAP 1
  v_workspace_id uuid;
BEGIN
  -- Maak Timewax workspace aan (als die nog niet bestaat)
  INSERT INTO workspaces (name, created_by, created_at)
  SELECT 'Timewax', v_user_id, NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM workspaces WHERE name ILIKE '%timewax%'
  )
  RETURNING id INTO v_workspace_id;
  
  -- Haal workspace ID op als die al bestaat
  IF v_workspace_id IS NULL THEN
    SELECT id INTO v_workspace_id FROM workspaces WHERE name ILIKE '%timewax%' LIMIT 1;
  END IF;
  
  -- Voeg jezelf toe als owner (als je nog niet lid bent)
  INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
  SELECT v_workspace_id, v_user_id, 'owner', NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM workspace_members 
    WHERE workspace_id = v_workspace_id AND user_id = v_user_id
  );
  
  -- Voeg academy_monitoring feature toe
  INSERT INTO workspace_features (workspace_id, feature_name, enabled)
  SELECT v_workspace_id, 'academy_monitoring', true
  WHERE NOT EXISTS (
    SELECT 1 FROM workspace_features 
    WHERE workspace_id = v_workspace_id AND feature_name = 'academy_monitoring'
  );
  
  -- Toon resultaat
  RAISE NOTICE 'Workspace ID: %', v_workspace_id;
  RAISE NOTICE 'Ga naar: /workspace/%/academy', v_workspace_id;
END $$;

-- STAP 3: Verifieer setup en krijg de workspace URL
SELECT 
  w.id as workspace_id,
  w.name as workspace_name,
  wm.user_id,
  wm.role,
  wf.feature_name,
  wf.enabled,
  'https://revimpact-app-staging.vercel.app/workspace/' || w.id || '/academy' as academy_url
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
LEFT JOIN workspace_features wf ON w.id = wf.workspace_id AND wf.feature_name = 'academy_monitoring'
WHERE w.name ILIKE '%timewax%'
ORDER BY w.name;

