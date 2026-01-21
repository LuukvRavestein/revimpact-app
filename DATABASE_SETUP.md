# Database Setup Instructies - CSM Agent NPS Automation

## 🎯 Doel
Deze instructies helpen je het database schema voor de CSM Agent NPS Automation uit te voeren in Supabase.

## 📋 Opties

### **Optie 1: Via Supabase Dashboard (Aanbevolen - Simpel)** ✨

1. **Open Supabase Dashboard**
   - Ga naar [https://app.supabase.com](https://app.supabase.com)
   - Login met je account
   - Selecteer je RevImpact project

2. **Open SQL Editor**
   - Klik in de sidebar op "SQL Editor"
   - Klik op "New query"

3. **Kopieer het Schema**
   - Open het bestand `nps-automation-schema.sql` in deze repository
   - Kopieer de volledige inhoud (Ctrl+A, Ctrl+C)

4. **Voer het Schema Uit**
   - Plak de SQL code in de SQL Editor
   - Klik op "Run" (of Ctrl+Enter)
   - Wacht tot alle statements succesvol zijn uitgevoerd

5. **Verificatie**
   Je zou nu de volgende tabellen moeten zien in je database:
   - ✅ `nps_responses`
   - ✅ `nps_outreach`
   - ✅ `csm_tasks`
   - ✅ `email_templates`

   En views:
   - ✅ `detractors_overview`
   - ✅ `nps_dashboard_stats`

---

### **Optie 2: Via Supabase CLI (Voor Developers)**

Als je de Supabase CLI hebt geïnstalleerd:

```bash
# Login bij Supabase
supabase login

# Link je lokale project
supabase link --project-ref YOUR_PROJECT_REF

# Voer het schema uit
supabase db push --db-url YOUR_DATABASE_URL < nps-automation-schema.sql
```

---

### **Optie 3: Via Node.js Script (Automatisch)**

We hebben een helper script gemaakt dat het schema automatisch uitvoert:

```bash
# Zorg dat je .env.local file bestaat met Supabase credentials
# Voer dan uit:
node scripts/setup-nps-database.js
```

Zie `scripts/setup-nps-database.js` voor details.

---

## ✅ Verificatie na Setup

Nadat je het schema hebt uitgevoerd, check het volgende:

### 1. **Tabellen Check**
```sql
-- Voer uit in SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'nps_%' OR table_name = 'csm_tasks' OR table_name = 'email_templates';
```

Je zou moeten zien:
- nps_responses
- nps_outreach
- csm_tasks
- email_templates

### 2. **Views Check**
```sql
-- Voer uit in SQL Editor
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';
```

Je zou moeten zien:
- detractors_overview
- nps_dashboard_stats

### 3. **Default Template Check**
```sql
-- Voer uit in SQL Editor
SELECT name, subject FROM email_templates;
```

Je zou moeten zien:
- "Detractor Response" template met subject "Oeps... volgens ons verdienen jullie beter!"

### 4. **RLS Policies Check**
```sql
-- Voer uit in SQL Editor
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

Je zou policies moeten zien voor alle nieuwe tabellen.

---

## 🐛 Troubleshooting

### **Fout: "relation already exists"**
Dit betekent dat de tabel al bestaat. Je kunt de tabellen droppen en opnieuw aanmaken:

```sql
-- LET OP: Dit verwijdert alle data!
DROP TABLE IF EXISTS csm_tasks CASCADE;
DROP TABLE IF EXISTS nps_outreach CASCADE;
DROP TABLE IF EXISTS nps_responses CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP VIEW IF EXISTS detractors_overview;
DROP VIEW IF EXISTS nps_dashboard_stats;

-- Voer daarna het volledige schema opnieuw uit
```

### **Fout: "permission denied"**
Zorg dat je de juiste permissions hebt in Supabase. Je moet minimaal "Service Role" permissions hebben.

### **Fout: "function does not exist"**
Sommige functies zijn mogelijk al aanwezig. Je kunt de `CREATE OR REPLACE FUNCTION` statements individueel uitvoeren.

---

## 🎉 Klaar!

Als alles succesvol is:

1. **Test de app lokaal:**
   ```bash
   npm run dev
   ```

2. **Ga naar:**
   ```
   http://localhost:3000/csm-agent
   ```

3. **Probeer een CSV te importeren:**
   - Ga naar "Import CSV"
   - Upload een test CSV met NPS data
   - Check of het werkt!

---

## 📞 Hulp Nodig?

Als je problemen hebt:
1. Check de Supabase logs in de Dashboard
2. Kijk naar de browser console voor frontend errors
3. Check de API logs in Vercel (als deployed)

**Common Issues:**
- ❌ Tabellen bestaan al → Drop en recreate
- ❌ Permissions error → Check RLS policies
- ❌ View errors → Drop views eerst, dan opnieuw aanmaken
