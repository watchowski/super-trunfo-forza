import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { Card } from "@/domain/cards";
import { validateCompleteCard } from "@/domain/import-validation";
import { hasSupabaseConfig } from "@/lib/env";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

const generatedCatalogPath = path.join(process.cwd(), "data", "catalog", "cards.json");
const previewCatalogPath = path.join(process.cwd(), "data", "catalog", "cards.preview.json");
const sampleCatalogPath = path.join(process.cwd(), "data", "catalog", "cards.sample.json");
const CATALOG_CACHE_MS = 30_000;

type CatalogCardRow = {
  id: string;
  normalized_name: string;
  name: string;
  manufacturer: string;
  year: number;
  country: string | null;
  image_url: string;
  source_game: Card["source"]["game"];
  car_page_url: string;
  image_source_url: string;
  stats_sp: number;
  stats_ha: number;
  stats_ac: number;
  stats_ls: number;
  stats_br: number;
  pl_class: Card["stats"]["pl"]["class"];
  pl_pi: number;
  pl_label: string;
  is_super_trunfo: boolean;
};

let cachedCatalog: Card[] | null = null;
let cachedAt = 0;

async function readCatalogFile(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as Card[];
}

async function tryReadCatalogFile(filePath: string) {
  try {
    await access(filePath);
    return await readCatalogFile(filePath);
  } catch {
    return null;
  }
}

function assertCatalog(cards: Card[]) {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error("Catalog is empty");
  }

  for (const card of cards) {
    const result = validateCompleteCard(card);
    if (!result.ok) {
      throw new Error(`Catalog contains invalid card ${card.id}: ${result.reason}`);
    }
  }

  return cards;
}

function mapRowToCard(row: CatalogCardRow): Card {
  return {
    id: row.id,
    normalizedName: row.normalized_name,
    name: row.name,
    manufacturer: row.manufacturer,
    year: row.year,
    country: row.country ?? undefined,
    imageUrl: row.image_url,
    stats: {
      sp: row.stats_sp,
      ha: row.stats_ha,
      ac: row.stats_ac,
      ls: row.stats_ls,
      br: row.stats_br,
      pl: {
        class: row.pl_class,
        pi: row.pl_pi,
        label: row.pl_label
      }
    },
    source: {
      game: row.source_game,
      carPageUrl: row.car_page_url,
      imageSourceUrl: row.image_source_url
    },
    isSuperTrunfo: row.is_super_trunfo
  };
}

async function readSupabaseCatalog() {
  const supabase = getServiceSupabaseClient();
  const pageSize = 1000;
  const rows: CatalogCardRow[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const response = await supabase.from("catalog_cards").select("*").order("name").range(from, to);
    if (response.error) {
      throw response.error;
    }

    const batch = (response.data ?? []) as CatalogCardRow[];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }
  }

  return rows.map(mapRowToCard);
}

async function readLocalCatalog() {
  const generated = await tryReadCatalogFile(generatedCatalogPath);
  if (generated) return generated;

  const preview = await tryReadCatalogFile(previewCatalogPath);
  if (preview) return preview;

  return readCatalogFile(sampleCatalogPath);
}

export async function loadCatalogCards(options?: { fresh?: boolean }) {
  const useCache = !options?.fresh;
  if (useCache && cachedCatalog && Date.now() - cachedAt < CATALOG_CACHE_MS) {
    return cachedCatalog;
  }

  if (hasSupabaseConfig()) {
    try {
      const cards = assertCatalog(await readSupabaseCatalog());
      cachedCatalog = cards;
      cachedAt = Date.now();
      return cards;
    } catch {
      // Fall back to local files when the remote catalog is unavailable.
    }
  }

  const cards = assertCatalog(await readLocalCatalog());
  cachedCatalog = cards;
  cachedAt = Date.now();
  return cards;
}
