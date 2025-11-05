# Test Academy Feature in Staging

## Stap 1: Log in op Staging

1. Ga naar: `https://revimpact-app-staging.vercel.app`
2. Log in met je account (of maak een account aan als je nog geen account hebt)

## Stap 2: Timewax Workspace Aanmaken

### Optie A: Via Supabase SQL Editor (Aanbevolen)

1. Open je **Staging Supabase Dashboard**
2. Ga naar **SQL Editor**
3. Voer het volgende script uit (pas je email aan):

```sql
-- Vind je user ID
SELECT id, email FROM auth.users WHERE email = 'jouw-email@example.com';

-- Maak Timewax workspace aan (vervang USER_ID met je user ID van bovenstaande query)
INSERT INTO workspaces (name, created_by, created_at)
VALUES ('Timewax', 'USER_ID_HIER', NOW())
RETURNING id, name;

-- Voeg jezelf toe als owner (vervang USER_ID met je user ID)
INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
SELECT 
  w.id,
  'USER_ID_HIER', -- Je user ID
  'owner',
  NOW()
FROM workspaces w
WHERE w.name ILIKE '%timewax%'
  AND NOT EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = w.id 
    AND wm.user_id = 'USER_ID_HIER'
  );

-- Voeg academy_monitoring feature toe
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
```

### Optie B: Via de Applicatie (Als je admin bent)

1. Log in op staging
2. Ga naar `/revimpact-central` (als je admin bent)
3. Maak een nieuwe workspace aan met de naam "Timewax"
4. Je wordt automatisch owner van de workspace

## Stap 3: Test de Academy Feature

1. Ga naar `/workspace/[workspace-id]` (vervang `[workspace-id]` met je Timewax workspace ID)
   - Je kunt de workspace ID vinden door naar de workspace management pagina te gaan
   - Of via Supabase: `SELECT id, name FROM workspaces WHERE name ILIKE '%timewax%';`

2. Je zou de "Academy Monitoring" feature moeten zien in de features lijst

3. Klik op "Open" bij de Academy Monitoring feature, of ga direct naar:
   `/workspace/[workspace-id]/academy`

## Stap 4: Test Excel Upload

1. Maak een test Excel bestand met de volgende kolommen:
   - Gebruiker
   - E-mail
   - Lesmodule
   - Startdatum
   - Voltooid op
   - Score
   - Slaagdrempel voor score
   - Voortgang
   - Tijdsduur
   - Externe gebruiker
   - Gebruikersgroepen

2. Upload het bestand via de Academy pagina

3. Test de zoekfunctionaliteit:
   - Zoek op klantnaam (afgeleid van e-maildomein)
   - Zoek op persoon (naam of e-mail)

## Troubleshooting

### "Deze functionaliteit is alleen beschikbaar voor Timewax workspaces"
- Zorg dat je workspace naam "Timewax" bevat (case-insensitive)
- Check of je lid bent van de workspace

### Feature verschijnt niet
- Voer `add-academy-feature.sql` uit in Supabase
- Check of de feature enabled is: `SELECT * FROM workspace_features WHERE feature_name = 'academy_monitoring';`

### Geen toegang tot workspace
- Check of je lid bent: `SELECT * FROM workspace_members WHERE workspace_id = 'YOUR_WORKSPACE_ID';`
- Voeg jezelf toe als owner als dat nodig is

