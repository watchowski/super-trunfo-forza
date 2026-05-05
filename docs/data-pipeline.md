# Data Pipeline

This project keeps the game app and the catalog pipeline separate on purpose.

The app can run with:

- `data/catalog/cards.sample.json` for lightweight local work
- `public.catalog_cards` in Supabase for realtime and deployed play

The full Forza catalog is generated locally, reviewed locally, and then synced to Supabase.

## Source Of Truth

Use these layers as the working model:

1. Forza Wiki / Fandom pages are the external source.
2. Local generated files are the review stage.
3. Supabase `public.catalog_cards` is the runtime source for the live app.

Important generated artifacts:

- `data/catalog/cards.preview.json`
- `data/catalog/import-report.json`
- `data/catalog/cards.json`
- `data/images/`

Those files are intentionally gitignored. They are generated working assets, not stable source files.

## End-To-End Flow

```text
Forza Wiki/Fandom
  -> import:forza
  -> cards.preview.json + import-report.json + downloaded images
  -> manual review
  -> import:forza:write
  -> cards.json
  -> sync:supabase
  -> Supabase catalog_cards + Storage bucket
  -> live game
```

## 1. Import Preview

Run:

```bash
npm run import:forza
```

This step:

- reads the configured Horizon list pages
- resolves individual car pages
- extracts thumb/infobox image and metadata
- normalizes stats and `PL`
- deduplicates by normalized exact name
- keeps special variants with distinct names
- writes a preview dataset and report

Generated review files:

- `data/catalog/cards.preview.json`
- `data/catalog/import-report.json`

The importer currently uses the Fandom MediaWiki parse path instead of raw page scraping because direct page fetches were returning `403`.

## 2. Review The Preview

Before promoting a preview, check these things:

- card count looks sane
- required Super Trunfos are present for the supported games
- missing or malformed `PL` entries are understood
- obviously wrong duplicates are not slipping through
- image URLs and car page URLs look credible

Useful places to inspect:

- `data/catalog/import-report.json`
- `data/catalog/cards.preview.json`

The report includes counts such as:

- `listCount`
- `uniqueEntryCount`
- `rawCount`
- `dedupedCount`

For this MVP, the preview state that was validated for runtime had:

- `1261` generated cards
- `69` failures still needing cleanup

That preview is good enough to run the game, but it is still a review artifact, not a final frozen catalog.

## 3. Promote The Preview

After review:

```bash
npm run import:forza:write
```

This writes:

- `data/catalog/cards.json`

That file is still gitignored. Promotion means "accept this generated dataset locally", not "commit it to source control".

## 4. Sync To Supabase

After `.env.local` is configured and `supabase/schema.sql` has already been applied:

```bash
npm run sync:supabase
```

This step:

- uploads local files from `data/images/` to the `card-images` bucket
- upserts rows into `public.catalog_cards`
- lets the deployed app use the synced catalog as its runtime deck source

Expected environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=card-images
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the preferred current key name. `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains as a legacy fallback.

## 5. Verify Runtime Data

After sync, verify both storage and database:

1. In Supabase Table Editor, confirm rows exist in `public.catalog_cards`.
2. In Supabase Storage, confirm files exist in `card-images`.
3. Create a room in the app and verify the reported max deck size matches the synced dataset.

The app reads the live catalog from Supabase for realtime play, so a successful room creation is a practical end-to-end check.

## Operational Notes

- `cards.sample.json` stays in git as the lightweight fixture for local UI and tests.
- The full generated catalog stays local or in Supabase, not in git.
- Downloaded source images are treated as generated assets.
- The app can still fall back to demo/sample mode when Supabase env vars are absent.
- FH6 may remain partially incomplete depending on source maturity; that should be treated as data curation work, not app breakage.

## Recommended Routine

For future refreshes, use this order:

1. `npm run import:forza`
2. inspect `data/catalog/import-report.json`
3. inspect a few entries in `data/catalog/cards.preview.json`
4. `npm run import:forza:write`
5. `npm run sync:supabase`
6. verify in Supabase and in the live app

## Related Docs

- [README](C:/Users/JKL/Documents/super-trunfo/.worktrees/vertical-mvp/README.md)
- [Bootstrap Supabase + Vercel](C:/Users/JKL/Documents/super-trunfo/.worktrees/vertical-mvp/docs/bootstrap-supabase-vercel.md)
- [MVP design spec](C:/Users/JKL/Documents/super-trunfo/.worktrees/vertical-mvp/docs/superpowers/specs/2026-05-04-super-trunfo-mvp-design.md)
