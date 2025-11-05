# Test Academy Monitoring Feature

## Snelle Test Instructies

### Optie 1: Test met Voorbeeld Data (Snelste)

1. **Open Supabase SQL Editor** (staging)
2. **Voer `create-test-academy-data.sql` uit**
   - Dit maakt automatisch test data aan
   - Vervang de workspace ID in het script met je eigen workspace ID
3. **Ga naar de Academy pagina:**
   - Klik op "Open" bij Academy Monitoring in workspace management
   - Of ga direct naar: `/workspace/[workspace-id]/academy`
4. **Test de functionaliteit:**
   - Je zou 5 test records moeten zien
   - Test zoeken op klantnaam (bijv. "Innax", "Example")
   - Test zoeken op persoon (bijv. "Wim Hiensch", "Jan Jansen")
   - Check de statistieken bovenaan

### Optie 2: Test met Excel Upload

1. **Maak een test Excel bestand** met deze kolommen:
   ```
   Gebruiker | E-mail | Lesmodule | Startdatum | Voltooid op | Score | Slaagdrempel voor score | Voortgang | Tijdsduur | Externe gebruiker | Gebruikersgroepen
   ```

2. **Voorbeeld data:**
   ```
   Wim Hiensch | wimhiensch@innax.nl | Persoonlijke instellingen | 27-10-2025 | | | | 25 | 0:00:00 | Nee | Projectmanager, Management (NL)
   Jan Jansen | jan.jansen@example.com | Basis Training | 01-11-2025 | 15-11-2025 | 85 | 70 | 100 | 1:00:00 | Nee | Medewerker
   ```

3. **Upload het bestand** via de Academy pagina
4. **Verifieer:**
   - Data wordt correct geïmporteerd
   - Klantnaam wordt correct geëxtraheerd uit e-maildomein
   - Zoekfunctionaliteit werkt
   - Statistieken worden bijgewerkt

## Test Checklist

### Basis Functionaliteit
- [ ] Academy Monitoring feature is zichtbaar in workspace management
- [ ] "Open" knop werkt en navigeert naar Academy pagina
- [ ] Academy pagina laadt zonder errors
- [ ] Statistieken worden correct getoond (totaal modules, deelnemers, klanten)

### Excel Upload
- [ ] Excel bestand kan worden geüpload (.xlsx, .xls)
- [ ] Upload status wordt getoond (processing, processed)
- [ ] Data wordt correct geparsed
- [ ] Records worden opgeslagen in database
- [ ] Error handling werkt bij verkeerde bestanden

### Klantnaam Extractie
- [ ] Klantnaam wordt geëxtraheerd uit e-maildomein
  - `wimhiensch@innax.nl` → `Innax`
  - `jan@example.com` → `Example`
- [ ] Edge cases werken (complexe domeinen, subdomains)

### Zoekfunctionaliteit
- [ ] Zoeken op klantnaam werkt (bijv. "Innax")
- [ ] Zoeken op persoon werkt (naam of e-mail)
- [ ] Zoekresultaten worden gefilterd
- [ ] Lege zoektermen tonen alle records

### Data Weergave
- [ ] Tabel toont alle relevante velden
- [ ] Voortgangsbalk werkt correct
- [ ] Datums worden correct geformatteerd (DD-MM-YYYY)
- [ ] Tijdsduur wordt correct geformatteerd (H:MM:SS)
- [ ] Scores worden correct getoond

### Edge Cases
- [ ] Lege velden worden correct afgehandeld
- [ ] Externe gebruikers worden correct gemarkeerd
- [ ] User groups worden correct geparsed
- [ ] Meerdere modules per persoon werken
- [ ] Meerdere personen per klant werken

## Handige SQL Queries voor Testing

### Verwijder alle test data
```sql
DELETE FROM academy_participant_progress 
WHERE upload_id IN (
  SELECT id FROM academy_data_uploads 
  WHERE filename LIKE 'test%'
);

DELETE FROM academy_data_uploads WHERE filename LIKE 'test%';
```

### Bekijk alle data
```sql
SELECT 
  ap.participant_name,
  ap.participant_email,
  ap.customer_name,
  ap.lesson_module,
  ap.progress_percentage,
  ap.start_date,
  COUNT(*) OVER (PARTITION BY ap.customer_name) as klant_modules
FROM academy_participant_progress ap
ORDER BY ap.customer_name, ap.participant_name;
```

### Check klantnaam extractie
```sql
SELECT DISTINCT
  participant_email,
  customer_name,
  SPLIT_PART(participant_email, '@', 2) as domain
FROM academy_participant_progress
ORDER BY customer_name;
```

## Troubleshooting

### Feature verschijnt niet
- Check of workspace naam "Timewax" bevat (case-insensitive)
- Ververs de pagina (hard refresh: Cmd+Shift+R)
- Check database: `SELECT * FROM workspace_features WHERE feature_name = 'academy_monitoring';`

### Upload werkt niet
- Check browser console voor errors
- Check of bestand correct formaat heeft (.xlsx of .xls)
- Check of kolommen correcte namen hebben (case-insensitive)
- Check Supabase logs voor database errors

### Data verschijnt niet
- Check upload status in database: `SELECT * FROM academy_data_uploads;`
- Check participant data: `SELECT * FROM academy_participant_progress;`
- Check RLS policies: `SELECT * FROM academy_participant_progress WHERE workspace_id = 'YOUR_WORKSPACE_ID';`

