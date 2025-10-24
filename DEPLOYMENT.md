# 🚀 Deployment Guide

## Environment Overview

- **Production (main branch)**: Live environment - `https://revimpact-app.vercel.app`
- **Staging (staging branch)**: Development environment - `https://revimpact-app-staging.vercel.app`

## 🏗️ Staging Environment Setup

### 1. Supabase Staging Project

1. **Create New Project:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Name: `revimpact-staging`
   - Region: Same as production
   - Password: Generate strong password

2. **Copy Database Schema:**
   ```bash
   # Run the complete database setup on staging
   # Use the SQL files in the project root
   ```

3. **Get Staging Credentials:**
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: From Settings → API
   - Service Role Key: From Settings → API

### 2. Vercel Staging Deployment

1. **Connect Staging Branch:**
   - Go to Vercel Dashboard
   - Import project if not already imported
   - Go to Settings → Git
   - Add staging branch as deployment branch

2. **Environment Variables:**
   - Go to Settings → Environment Variables
   - Add staging-specific variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key
     NEXT_PUBLIC_APP_URL=https://revimpact-app-staging.vercel.app
     NEXT_PUBLIC_APP_ENV=staging
     ```

### 3. Database Setup for Staging

Run these SQL files in order on your staging Supabase project:

1. `database-schema.sql` - Basic tables
2. `workspace-invitations-schema.sql` - Invitation system
3. `complete-database-setup.sql` - Complete setup with policies

## 🔄 Development Workflow

### Working on Staging

1. **Switch to staging branch:**
   ```bash
   git checkout staging
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin staging
   ```

3. **Vercel automatically deploys staging**
4. **Test on staging URL**
5. **When ready, merge to production**

### Deploying to Production

1. **Merge staging to main:**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

2. **Vercel automatically deploys production**

## 🧪 Testing Checklist

### Before Deploying to Production

- [ ] All features work on staging
- [ ] Database migrations tested
- [ ] Authentication flows work
- [ ] Admin functions work
- [ ] No console errors
- [ ] Performance is acceptable

## 🚨 Rollback Procedure

If production deployment fails:

1. **Revert main branch:**
   ```bash
   git checkout main
   git revert HEAD
   git push origin main
   ```

2. **Vercel will automatically redeploy**

## 📝 Environment Variables Reference

### Production
- `NEXT_PUBLIC_SUPABASE_URL`: Production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Production anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Production service role key
- `NEXT_PUBLIC_APP_URL`: https://revimpact-app.vercel.app
- `NEXT_PUBLIC_APP_ENV`: production

### Staging
- `NEXT_PUBLIC_SUPABASE_URL`: Staging Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Staging anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Staging service role key
- `NEXT_PUBLIC_APP_URL`: https://revimpact-app-staging.vercel.app
- `NEXT_PUBLIC_APP_ENV`: staging
