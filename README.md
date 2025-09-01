# RevImpact — Next.js App Router Skeleton

Production-ready Next.js (App Router, TypeScript) skeleton configured for Vercel with Supabase Auth.

## Tech stack
- Next.js App Router + TypeScript
- Tailwind CSS + PostCSS + Autoprefixer
- shadcn-style UI primitives (local files in `components/ui`)
- Supabase Auth (magic link) with automatic workspace creation

## Structure
```
/app
  /api/ping/route.ts
  /auth/callback/route.ts
  /dashboard/page.tsx
  /signin/page.tsx
  /layout.tsx
  /page.tsx
/components
  SignOutButton.tsx
  /ui
    button.tsx, card.tsx, input.tsx, textarea.tsx
/lib
  supabaseClient.ts
  supabaseServer.ts
/styles
  globals.css
middleware.ts
next.config.mjs
package.json
tsconfig.json
postcss.config.js
tailwind.config.ts
```

## Environment variables

Set these in Vercel Project Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Supabase Setup

1. **Auth Configuration**: In Supabase → Auth → URL Configuration:
   - Site URL: `https://app.revimpact.nl` (or your domain)
   - Redirect URLs: Add your preview URLs

2. **Database Tables**: Create these tables in Supabase:
   ```sql
   -- Workspaces table
   create table workspaces (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     created_by uuid references auth.users(id),
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Workspace members table
   create table workspace_members (
     id uuid default gen_random_uuid() primary key,
     workspace_id uuid references workspaces(id) on delete cascade,
     user_id uuid references auth.users(id) on delete cascade,
     role text not null default 'member',
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     unique(workspace_id, user_id)
   );
   ```

3. **RLS Policies**: Enable Row Level Security and create policies as needed.

## Auth Flow

- `/signin` → Magic link authentication
- `/auth/callback` → OAuth callback handler
- `/dashboard` → Protected route with automatic workspace creation
- Middleware protects `/dashboard/*` routes

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Set the env vars above for all environments.
4. Hit Deploy. No build flags needed.

Build command: `next build` (default)
Output: Default (Next.js)

## Local development (optional)

```bash
pnpm i # or npm i / yarn
pnpm dev
```

## API health check

`GET /api/ping` → `{ ok: true, ts: <timestamp> }`

## Styling

- Primary: Impact blue `#3A6FF8`
- Accent: Lime green `#8AE34C`
- Neutral dark: Anthracite `#1E1E1E`
- Neutral light: Light gray `#F4F5F7`

Tailwind color tokens available at `theme.extend.colors.impact.*`.

## Lint/format

```bash
pnpm lint
pnpm format
```
