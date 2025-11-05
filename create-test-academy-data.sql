-- Create Test Academy Data for Staging
-- Run this in your Supabase SQL editor (staging environment)
-- This will create test upload and participant progress records

-- STAP 1: Vind je workspace ID (voer dit eerst uit)
SELECT id, name FROM workspaces WHERE name ILIKE '%timewax%';

-- STAP 2: Vervang WORKSPACE_ID met je workspace ID en voer dit script uit
DO $$
DECLARE
  v_workspace_id uuid := '410c952c-761f-42a8-9900-c7629f6a367d'; -- VERVANG MET JE WORKSPACE ID
  v_user_id uuid;
  v_upload_id uuid;
BEGIN
  -- Haal je user ID op (eerste admin user)
  SELECT id INTO v_user_id FROM auth.users 
  WHERE email ILIKE '%admin%' OR email = 'luuk@revimpact.nl' OR email = 'admin@revimpact.nl'
  LIMIT 1;
  
  -- Als geen admin, gebruik eerste user
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  END IF;
  
  -- Maak test upload record
  INSERT INTO academy_data_uploads (
    workspace_id,
    filename,
    file_type,
    file_size,
    status,
    created_by
  ) VALUES (
    v_workspace_id,
    'test-academy-data.xlsx',
    'xlsx',
    10240,
    'processed',
    v_user_id
  )
  RETURNING id INTO v_upload_id;
  
  -- Maak test participant progress records
  INSERT INTO academy_participant_progress (
    workspace_id,
    upload_id,
    participant_name,
    participant_email,
    customer_name,
    lesson_module,
    start_date,
    completed_on,
    score,
    pass_threshold,
    progress_percentage,
    duration_seconds,
    is_external_user,
    user_groups,
    raw_data
  ) VALUES
  -- Test data 1: Wim Hiensch - Persoonlijke instellingen
  (
    v_workspace_id,
    v_upload_id,
    'Wim Hiensch',
    'wimhiensch@innax.nl',
    'Innax',
    'Persoonlijke instellingen',
    '2025-10-27',
    NULL,
    NULL,
    NULL,
    25,
    0,
    false,
    ARRAY['Projectmanager', 'Management (NL)', 'Timewax', 'Medewerker'],
    '{"Gebruiker": "Wim Hiensch", "E-mail": "wimhiensch@innax.nl", "Lesmodule": "Persoonlijke instellingen"}'::jsonb
  ),
  -- Test data 2: Wim Hiensch - Analytics
  (
    v_workspace_id,
    v_upload_id,
    'Wim Hiensch',
    'wimhiensch@innax.nl',
    'Innax',
    'Analytics',
    '2025-10-27',
    NULL,
    NULL,
    NULL,
    12,
    0,
    false,
    ARRAY['Medewerker', 'Management (NL)', 'Projectmanager', 'Timewax'],
    '{"Gebruiker": "Wim Hiensch", "E-mail": "wimhiensch@innax.nl", "Lesmodule": "Analytics"}'::jsonb
  ),
  -- Test data 3: Test gebruiker - andere klant
  (
    v_workspace_id,
    v_upload_id,
    'Jan Jansen',
    'jan.jansen@example.com',
    'Example',
    'Basis Training',
    '2025-11-01',
    '2025-11-15',
    85,
    70,
    100,
    3600,
    false,
    ARRAY['Medewerker'],
    '{"Gebruiker": "Jan Jansen", "E-mail": "jan.jansen@example.com", "Lesmodule": "Basis Training"}'::jsonb
  ),
  -- Test data 4: Test gebruiker - zelfde klant, andere module
  (
    v_workspace_id,
    v_upload_id,
    'Piet Pietersen',
    'piet@example.com',
    'Example',
    'Geavanceerde Training',
    '2025-11-05',
    NULL,
    NULL,
    NULL,
    50,
    1800,
    false,
    ARRAY['Manager', 'Medewerker'],
    '{"Gebruiker": "Piet Pietersen", "E-mail": "piet@example.com", "Lesmodule": "Geavanceerde Training"}'::jsonb
  ),
  -- Test data 5: Externe gebruiker
  (
    v_workspace_id,
    v_upload_id,
    'Externe Test',
    'externe@external.com',
    'External',
    'Introductie',
    '2025-10-20',
    NULL,
    NULL,
    NULL,
    30,
    900,
    true,
    ARRAY['Extern'],
    '{"Gebruiker": "Externe Test", "E-mail": "externe@external.com", "Lesmodule": "Introductie"}'::jsonb
  );
  
  RAISE NOTICE 'Test data aangemaakt!';
  RAISE NOTICE 'Upload ID: %', v_upload_id;
  RAISE NOTICE 'Ga naar: /workspace/%/academy', v_workspace_id;
END $$;

-- STAP 3: Verifieer de test data
SELECT 
  ap.id,
  ap.participant_name,
  ap.participant_email,
  ap.customer_name,
  ap.lesson_module,
  ap.progress_percentage,
  ap.duration_seconds,
  ap.is_external_user
FROM academy_participant_progress ap
JOIN workspaces w ON ap.workspace_id = w.id
WHERE w.name ILIKE '%timewax%'
ORDER BY ap.participant_name, ap.lesson_module;

