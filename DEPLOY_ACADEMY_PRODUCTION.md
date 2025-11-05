# Deploy Academy Feature naar Production

## Stap 1: Database Schema (Production Supabase)

1. **Open je Production Supabase Dashboard**
2. **Ga naar SQL Editor**
3. **Voer deze scripts uit in volgorde:**

### A. Academy Schema
```sql
-- Voer timewax-academy-schema.sql uit
-- Dit maakt de academy_data_uploads en academy_participant_progress tabellen aan
```

### B. Feature Setup
```sql
-- Voer add-academy-feature.sql uit
-- Dit maakt workspace_features tabel aan (als die niet bestaat) en voegt academy_monitoring toe
```

## Stap 2: Code Deployment

### Optie A: Merge naar Main (Aanbevolen)
```bash
# Zorg dat je op staging branch bent
git checkout staging

# Pull latest changes
git pull origin staging

# Merge naar main
git checkout main
git pull origin main
git merge staging
git push origin main
```

### Optie B: Direct naar Main (Als je zeker bent)
```bash
git checkout main
git merge staging
git push origin main
```

Vercel zal automatisch deployen naar production.

## Stap 3: Verificatie

1. **Check database:**
   ```sql
   -- Check of tabellen bestaan
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('academy_data_uploads', 'academy_participant_progress');
   
   -- Check of feature bestaat
   SELECT * FROM workspace_features 
   WHERE feature_name = 'academy_monitoring';
   ```

2. **Test in production:**
   - Ga naar: `https://revimpact-app.vercel.app`
   - Navigeer naar Timewax workspace
   - Check of Academy Monitoring feature zichtbaar is
   - Test de functionaliteit

## Rollback Procedure (Als er iets misgaat)

### Database Rollback
```sql
-- Verwijder feature (als nodig)
DELETE FROM workspace_features WHERE feature_name = 'academy_monitoring';

-- Verwijder tabellen (als nodig - PAS OP!)
-- DROP TABLE IF EXISTS academy_participant_progress CASCADE;
-- DROP TABLE IF EXISTS academy_data_uploads CASCADE;
```

### Code Rollback
```bash
git checkout main
git revert HEAD
git push origin main
```

## Checklist

- [ ] Academy schema uitgevoerd in production database
- [ ] Feature toegevoegd aan Timewax workspace
- [ ] Code gemerged naar main branch
- [ ] Vercel deployment succesvol
- [ ] Feature getest in production
- [ ] Alles werkt correct

