# Super Trunfo Forza Horizon

Two-player online Super Trunfo inspired by Forza Horizon cars.

## Current State

This repository currently implements the first vertical slice:

- Next.js + TypeScript app.
- Tested Super Trunfo game engine.
- Sample complete car cards.
- Local room/lobby/match flow.
- Premium collectible card UI.
- PT-BR and English UI helpers.

The full MVP still requires the Forza Wiki scraper, image download/storage, Supabase realtime sync, full catalog import, and Vercel deployment.

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

## Supabase Environment For Later Phases

The next implementation phase will add Supabase sync. Expected local variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=card-images
```

Do not commit `.env` files.

## Data Source Notes

The target catalog comes from Forza Wiki/Fandom pages listed in `docs/superpowers/specs/2026-05-04-super-trunfo-mvp-design.md`. Images should be downloaded from each car page thumb/infobox and source URLs preserved in the dataset.

## Follow-Up Implementation Plans

After this vertical slice:

1. Build the Forza Wiki scraper, normalization, image download, and diff approval workflow.
2. Add Supabase schema, Storage sync, Realtime room sync, and opportunistic cleanup.
3. Import the complete eligible catalog and deploy to Vercel.
