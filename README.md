# Super Trunfo Forza Horizon

Two-player online Super Trunfo inspired by Forza Horizon cars.

## Current State

This repository now implements:

- Next.js + TypeScript app.
- Tested Super Trunfo game engine.
- Realtime-ready room APIs and Supabase-backed room sync path.
- Versioned sample catalog file and importer/sync scripts.
- Local demo fallback when Supabase env is missing.
- Premium collectible card UI.
- PT-BR and English UI helpers.

What still depends on your own infrastructure:

- Filling `.env` with Supabase project credentials.
- Running the Supabase SQL in `supabase/schema.sql`.
- Running the importer against the live Forza Wiki pages.
- Syncing the generated dataset and images to Supabase Storage.
- Deploying to Vercel with those environment variables.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Import The Catalog

```bash
npm run import:forza
```

That writes a preview dataset to `data/catalog/cards.preview.json` and an import report to `data/catalog/import-report.json`.

Those files are intentionally gitignored because they are generated review artifacts, not stable source files.

After reviewing the diff:

```bash
npm run import:forza:write
```

That promotes the generated dataset to `data/catalog/cards.json`.

`data/catalog/cards.json` is also gitignored. The repository keeps `data/catalog/cards.sample.json` as the lightweight versioned fixture, while full generated catalogs stay local or move to Supabase.

## Supabase Environment

Create a local `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=card-images
```

Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` if you are following the newer Supabase dashboard naming. The app also still accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` as a legacy fallback.

Do not commit `.env` files.

Then apply the schema in `supabase/schema.sql`.

## Sync Catalog To Supabase

```bash
npm run sync:supabase
```

That uploads local images from `data/images/` to the `card-images` bucket and upserts catalog rows into `public.catalog_cards`.

Downloaded source images in `data/images/` are treated as generated local assets and are not versioned in git.

## Data Source Notes

The target catalog comes from Forza Wiki/Fandom pages listed in `docs/superpowers/specs/2026-05-04-super-trunfo-mvp-design.md`. Images should be downloaded from each car page thumb/infobox and source URLs preserved in the dataset.

## Deployment Notes

- Frontend and API routes are intended for Vercel.
- Realtime subscriptions use the `rooms` table through Supabase Postgres Changes.
- The app automatically falls back to demo mode if Supabase env vars are absent, so local UI work can continue without blocking on infra.
