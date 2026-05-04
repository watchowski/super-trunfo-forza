import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const catalogPath = path.join(process.cwd(), "data", "catalog", "cards.json");
const sampleCatalogPath = path.join(process.cwd(), "data", "catalog", "cards.sample.json");
const imageDir = path.join(process.cwd(), "data", "images");
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "card-images";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

async function loadCards() {
  try {
    return JSON.parse(await readFile(catalogPath, "utf8"));
  } catch {
    return JSON.parse(await readFile(sampleCatalogPath, "utf8"));
  }
}

async function uploadImages(supabase) {
  let files = [];
  try {
    files = await readdir(imageDir);
  } catch {
    return;
  }

  for (const fileName of files) {
    const filePath = path.join(imageDir, fileName);
    const contents = await readFile(filePath);
    const storagePath = `cars/${fileName}`;
    const { error } = await supabase.storage.from(bucket).upload(storagePath, contents, {
      upsert: true,
      contentType: fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") ? "image/jpeg" : "image/png"
    });
    if (error) {
      throw error;
    }
  }
}

async function upsertCards(supabase, cards) {
  const rows = cards.map((card) => {
    const localImagePath = card.imageUrl?.startsWith("/images/") ? `cars/${path.basename(card.imageUrl)}` : "";
    const publicUrl = localImagePath ? supabase.storage.from(bucket).getPublicUrl(localImagePath).data.publicUrl : card.imageUrl;
    return {
      id: card.id,
      normalized_name: card.normalizedName,
      name: card.name,
      manufacturer: card.manufacturer,
      year: card.year,
      country: card.country ?? null,
      image_path: localImagePath,
      image_url: publicUrl,
      source_game: card.source.game,
      car_page_url: card.source.carPageUrl,
      image_source_url: card.source.imageSourceUrl,
      stats_sp: card.stats.sp,
      stats_ha: card.stats.ha,
      stats_ac: card.stats.ac,
      stats_ls: card.stats.ls,
      stats_br: card.stats.br,
      pl_class: card.stats.pl.class,
      pl_pi: card.stats.pl.pi,
      pl_label: card.stats.pl.label,
      is_super_trunfo: card.isSuperTrunfo,
      raw_json: card
    };
  });

  const { error } = await supabase.from("catalog_cards").upsert(rows);
  if (error) {
    throw error;
  }
}

async function main() {
  const supabase = createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const cards = await loadCards();
  await uploadImages(supabase);
  await upsertCards(supabase, cards);
  console.log(`Synced ${cards.length} cards to Supabase`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
