# Bootstrap Supabase + Vercel

This project already contains:

- Supabase room API routes
- Realtime subscription path for `public.rooms`
- Storage/catalog sync script
- Importer script for the Forza Wiki catalog

What still requires your live infrastructure:

1. Create a Supabase project.
2. Copy its keys into `.env.local`.
3. Run `supabase/schema.sql` in the SQL Editor.
4. Import and review the catalog.
5. Sync the catalog and images to Supabase.
6. Add the same environment variables in Vercel.
7. Deploy the project.

## 1. Create Supabase project

In Supabase, create a project and wait for it to finish provisioning.

You will need:

- Project URL
- Publishable key
- Service role key

References:

- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

## 2. Create `.env.local`

Copy `.env.example` to `.env.local` and fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=card-images
```

For this project:

- prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- keep `NEXT_PUBLIC_SUPABASE_ANON_KEY` empty unless you specifically want the legacy fallback

## 3. Apply schema

Open the Supabase SQL Editor and run:

- [supabase/schema.sql](C:/Users/JKL/Documents/super-trunfo/.worktrees/vertical-mvp/supabase/schema.sql)

That creates:

- `public.rooms`
- `public.catalog_cards`
- public read policies for the current MVP
- `card-images` storage bucket
- `supabase_realtime` publication entry for `public.rooms`

## 4. Import the catalog

Preview import:

```bash
npm run import:forza
```

Current live status from local testing:

- direct page fetches to Fandom returned `403`
- the importer was switched to the MediaWiki `action=parse` API route
- one successful preview run generated `952` cards and `35` failures
- the parser still needs another pass for full normalization across older Horizon pages and required Super Trunfo coverage

Artifacts:

- preview dataset: [data/catalog/cards.preview.json](C:/Users/JKL/Documents/super-trunfo/.worktrees/vertical-mvp/data/catalog/cards.preview.json)
- import report: [data/catalog/import-report.json](C:/Users/JKL/Documents/super-trunfo/.worktrees/vertical-mvp/data/catalog/import-report.json)

If the preview looks acceptable and you want to promote it:

```bash
npm run import:forza:write
```

## 5. Sync to Supabase

After `.env.local` is filled:

```bash
npm run sync:supabase
```

This script:

- uploads files from `data/images/` to `card-images`
- upserts cards into `public.catalog_cards`

Reference:

- [Supabase Storage uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads)

## 6. Add environment variables in Vercel

Create a Vercel project from this repo or folder and add the same four variables for:

- Production
- Preview
- Development

References:

- [Vercel Next.js deployment](https://vercel.com/docs/frameworks/nextjs)
- [Vercel environment variables](https://vercel.com/docs/projects/environment-variables)

## 7. Deploy

Once the variables are set, deploy from the project root.

The app will stop using demo mode automatically when the Supabase env vars are present.

## Notes

- Realtime in this MVP uses Postgres Changes on `public.rooms`, not Broadcast.
- The room/state path is ready for live use once Supabase is configured.
- The importer is operational, but the catalog still needs a cleanup pass before it can be called “complete”.
