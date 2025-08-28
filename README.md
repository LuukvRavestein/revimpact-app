# RevImpact — Next.js App Router Skeleton

Production-ready Next.js (App Router, TypeScript) skeleton configured for Vercel.

## Tech stack
- Next.js App Router + TypeScript
- Tailwind CSS + PostCSS + Autoprefixer
- shadcn-style UI primitives (local files in `components/ui`)
- Supabase client (no auth wired yet)

## Structure
```
/app
  /api/ping/route.ts
  /layout.tsx
  /page.tsx
/components/ui
  button.tsx, card.tsx, input.tsx, textarea.tsx
/lib
  supabaseClient.ts
/styles
  globals.css
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

No server-side keys required for this skeleton.

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
