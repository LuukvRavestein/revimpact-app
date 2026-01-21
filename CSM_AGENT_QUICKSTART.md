# 🚀 CSM Agent - Quick Start Guide

## Wat is dit?

**CSM Agent - NPS Detractor Automation** is een systeem dat automatisch:
- ✅ NPS data importeert uit Beamer CSV exports
- ✅ Detractors detecteert (score ≤ 6)
- ✅ Automatisch emails verstuurt naar detractors
- ✅ Responses tracked en analyseert met AI
- ✅ Taken aanmaakt voor opvolging

---

## 📦 Wat is er gebouwd?

### ✅ Klaar voor gebruik:
- **Dashboard** - Statistieken en overzicht
- **CSV Import** - Upload Beamer exports met preview
- **Detractors Lijst** - Overzicht van alle detractors
- **Email Automation** - Automatische emails via Resend
- **Database Schema** - Volledig schema met RLS policies

### 🚧 Komt binnenkort:
- **Detail View** - Per detractor detail pagina
- **AI Analyse** - Automatische response analyse met OpenAI
- **Taakbeheer** - Volledige task management
- **Templates** - Email template editor

---

## ⚡ Snelle Setup (5 minuten)

### **Stap 1: Database Schema Uitvoeren**

**Optie A - Via Supabase Dashboard (Makkelijkst):**

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Ga naar je RevImpact project
3. Klik op "SQL Editor" → "New query"
4. Open `nps-automation-schema.sql` in deze repo
5. Kopieer + plak de hele inhoud
6. Klik "Run"
7. Klaar! ✅

**Optie B - Via Script (Automatisch):**

```bash
# Zorg dat .env.local bestaat met Supabase credentials
node scripts/setup-nps-database.js
```

**Optie C - Via Supabase CLI:**

```bash
supabase db push < nps-automation-schema.sql
```

### **Stap 2: Verificatie**

Check of alles werkt:

```bash
node scripts/verify-nps-database.js
```

Je zou moeten zien:
```
✅ nps_responses
✅ nps_outreach
✅ csm_tasks
✅ email_templates
✅ detractors_overview
✅ nps_dashboard_stats
```

### **Stap 3: Environment Variables**

Zorg dat je `.env.local` deze variabelen heeft:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (Required voor email verzending)
RESEND_API_KEY=your_resend_key

# AI Analyse (Optioneel, komt later)
OPENAI_API_KEY=your_openai_key
```

### **Stap 4: Start de App**

```bash
npm run dev
```

Open: [http://localhost:3000/csm-agent](http://localhost:3000/csm-agent)

---

## 🎯 Eerste Gebruik

### 1. **Import NPS Data**

1. Ga naar "Import CSV"
2. Export CSV uit Beamer/Looker Studio
3. Upload het bestand
4. Preview checkt automatisch:
   - Aantal rows
   - Aantal detractors
   - Data validatie
5. Klik "Importeer & Verstuur Emails"

**Verwachte CSV format:**
```csv
cli_name,date,week,user_email,user_first_name,user_last_name,feedback,score
KlantX,20 Oct 2025,202543,john@klantx.nl,John,Doe,Product werkt niet,3
```

### 2. **Check Dashboard**

Na import zie je automatisch:
- 📊 Totaal detractors
- 📧 Hoeveel emails verzonden
- 💬 Hoeveel responses
- ✅ Hoeveel resolved

### 3. **Bekijk Detractors**

- Ga naar "Detractors" tab
- Zie alle detractors met status:
  - 🔴 Niet verzonden
  - 📧 Verzonden
  - 💬 Response ontvangen
- Klik op een detractor voor details (komt binnenkort)

---

## 📧 Email Automation

### Hoe werkt het?

1. **Import:** CSV upload detecteert detractors (score ≤ 6)
2. **Email:** Systeem verstuurt automatisch email via Resend
3. **Template:** Gebruikt standaard template:

```
Onderwerp: Oeps... volgens ons verdienen jullie beter!

Beste {{first_name}},

We zagen jouw tevredenheidsscore en moesten even slikken.
Oeps… blijkbaar hebben we iets gemist.
En daar balen we van.

Kun je ons in 1 zin vertellen wat we écht beter moeten doen?
Geen lange vragenlijst, gewoon recht voor z'n raap.

Wij beloven: we doen er iets mee.

Met vriendelijke groet,

Luuk van Ravestein
Customer Success Manager
Timewax
```

4. **Tracking:** Email status wordt gelogd in database
5. **Response:** Wanneer klant antwoordt, kan je dit invoeren (binnenkort AI analyse)

### Email Configuration

Emails worden verzonden via **Resend** vanuit:
- **From:** luuk.van.ravestein@timewax.com
- **To:** user_email uit CSV

Zorg dat dit email adres is geverifieerd in Resend!

---

## 🎨 UI Overview

### **Dashboard** (`/csm-agent`)
- Quick stats cards
- Recent detractors
- Urgent tasks
- Quick actions

### **Import CSV** (`/csm-agent/import`)
- Drag & drop upload
- Live preview met validatie
- Detractor highlighting
- One-click import + email

### **Detractors** (`/csm-agent/detractors`)
- Sortable table
- Status filters
- Quick stats
- Bulk actions (toekomstig)

---

## 🔧 Troubleshooting

### "Failed to fetch" errors
- Check `.env.local` voor correcte Supabase credentials
- Verificeer dat database schema is uitgevoerd
- Run `node scripts/verify-nps-database.js`

### Email niet verzonden
- Check `RESEND_API_KEY` in `.env.local`
- Verificeer email adres in Resend dashboard
- Check error logs in Supabase

### CSV import faalt
- Check CSV format (zie voorbeeld hierboven)
- Zorg dat score kolom een getal is (0-10)
- Check required fields: `cli_name`, `user_email`, `score`

### Database errors
- Run verification: `node scripts/verify-nps-database.js`
- Check Supabase logs in dashboard
- Recreate schema indien nodig

---

## 📊 Database Schema

Het systeem gebruikt 4 tabellen:

1. **nps_responses** - Alle NPS responses
   - Automatisch `is_detractor` flag voor scores ≤ 6
   - Duplicate detection op email + date + klant

2. **nps_outreach** - Email tracking
   - Sent status, timestamps
   - Response tracking
   - AI analyse results (toekomstig)

3. **csm_tasks** - Taakbeheer
   - Priority, status, due dates
   - Linked aan outreach

4. **email_templates** - Templates
   - Variable support ({{first_name}}, etc.)
   - Active/inactive templates

En 2 views:
- **detractors_overview** - Combined view voor dashboard
- **nps_dashboard_stats** - Aggregated statistics

---

## 🚀 Wat komt er nog?

### **Phase 2: AI & Detail View** (Volgende sprint)
- [  ] Detractor detail page per response
- [  ] Response invoer interface
- [  ] OpenAI integratie voor analyse
  - Sentiment detection
  - Urgency scoring
  - Category classification
  - Action items extraction
- [  ] Suggested response generation

### **Phase 3: Advanced Features**
- [  ] Task management systeem
- [  ] Email template editor
- [  ] Bulk operations
- [  ] Analytics & reporting
- [  ] Email response monitoring (IMAP)
- [  ] Notifications (Slack/email)

### **Phase 4: Automation**
- [  ] Auto-response suggestions
- [  ] Workflow automation
- [  ] Integration met Pipedrive
- [  ] Scheduled imports
- [  ] Custom playbooks

---

## 📚 Meer Informatie

- **Database Setup:** Zie `DATABASE_SETUP.md`
- **Database Schema:** Zie `nps-automation-schema.sql`
- **TypeScript Types:** Zie `lib/types/nps.ts`

---

## ✅ Checklist voor Launch

Voordat je het systeem in productie zet:

- [ ] Database schema uitgevoerd in Supabase
- [ ] Environment variables ingesteld
- [ ] Resend email adres geverifieerd
- [ ] Test CSV import gedaan
- [ ] Test email ontvangen
- [ ] Dashboard statistieken gecontroleerd
- [ ] RLS policies getest
- [ ] Error handling getest

---

## 💡 Tips

1. **Start Klein:** Begin met een test CSV met 2-3 detractors
2. **Check Spam:** Eerste emails kunnen in spam landen
3. **Monitor Resend:** Check Resend dashboard voor delivery status
4. **Database Logs:** Gebruik Supabase logs voor debugging
5. **Backups:** Maak regelmatig database backups

---

## 🎉 Klaar om te Starten!

1. Run database setup
2. Verificeer met script
3. Start dev server
4. Import test CSV
5. Check of emails verzonden worden

**Veel success met je CSM automation!** 🚀

Voor vragen of problemen, check de troubleshooting sectie of open een issue.
