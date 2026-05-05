import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const LIST_PAGES = [
  { game: "FH1", url: "https://forza.fandom.com/wiki/Forza_Horizon/Cars" },
  { game: "FH2", url: "https://forza.fandom.com/wiki/Forza_Horizon_2/Cars" },
  { game: "FH3", url: "https://forza.fandom.com/wiki/Forza_Horizon_3/Cars" },
  { game: "FH4", url: "https://forza.fandom.com/wiki/Forza_Horizon_4/Cars" },
  { game: "FH5", url: "https://forza.fandom.com/wiki/Forza_Horizon_5/Cars" },
  { game: "FH6", url: "https://forza.fandom.com/wiki/Forza_Horizon_6/Cars" }
];

const COVER_CARS = {
  FH1: "2013 dodge srt viper gts",
  FH2: "2014 lamborghini huracan lp 610-4",
  FH3: "2016 lamborghini centenario lp 770-4",
  FH4: "2018 mclaren senna",
  FH5: "2021 mercedes-amg one",
  FH6: "2025 toyota gr gt prototype"
};

const catalogDir = path.join(process.cwd(), "data", "catalog");
const imageDir = path.join(process.cwd(), "data", "images");
const previewPath = path.join(catalogDir, "cards.preview.json");
const reportPath = path.join(catalogDir, "import-report.json");
const finalPath = path.join(catalogDir, "cards.json");
const writeMode = process.argv.includes("--write");
const downloadImages = writeMode;
const gameOrder = { FH1: 1, FH2: 2, FH3: 3, FH4: 4, FH5: 5, FH6: 6 };

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function repairText(value) {
  const normalized = normalizeWhitespace(value);
  if (!/[ÃÂâ€]/.test(normalized)) return normalized;
  return Buffer.from(normalized, "latin1").toString("utf8");
}

function asciiFold(value) {
  return repairText(value)
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return asciiFold(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePowerLevel(value) {
  const match = asciiFold(value).match(/^(E|D|C|B|A|S|S1|S2|X|R1|R2|R3)\s*(\d{3,4})$/);
  if (!match) return null;
  return { class: match[1], pi: Number(match[2]), label: `${match[1]} ${Number(match[2])}` };
}

function createDom(html) {
  return new JSDOM(html).window.document;
}

function wikiTitleFromUrl(url) {
  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/wiki\/(.+)$/);
  if (!match) {
    throw new Error(`Unsupported wiki URL: ${url}`);
  }
  return decodeURIComponent(match[1]);
}

async function fetchApiJson(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "super-trunfo-importer/0.1",
      accept: "application/json"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

async function fetchWikiDocument(url) {
  const title = wikiTitleFromUrl(url);
  const apiUrl = new URL("https://forza.fandom.com/api.php");
  apiUrl.searchParams.set("action", "parse");
  apiUrl.searchParams.set("page", title);
  apiUrl.searchParams.set("prop", "text");
  apiUrl.searchParams.set("formatversion", "2");
  apiUrl.searchParams.set("format", "json");
  const payload = await fetchApiJson(apiUrl.toString());
  const html = payload?.parse?.text;
  if (typeof html !== "string" || !html.length) {
    throw new Error(`Parse API returned no HTML for ${title}`);
  }
  return {
    document: createDom(html),
    pageTitle: payload?.parse?.title ?? title
  };
}

function splitVehicleCell(value) {
  const text = asciiFold(value);
  const yearMatches = [...text.matchAll(/(19|20)\d{2}/g)];
  if (!yearMatches.length) return null;
  const lastMatch = yearMatches[yearMatches.length - 1];
  const year = Number(lastMatch[0]);
  const yearIndex = lastMatch.index ?? 0;
  const name = normalizeWhitespace(text.slice(0, yearIndex));
  return { name, year };
}

function extractListEntries(document, game) {
  const rows = [...document.querySelectorAll("tr")];
  const entries = [];

  for (const row of rows) {
    const link = row.querySelector('a[href^="/wiki/"]');
    if (!link) continue;
    const cells = [...row.querySelectorAll("th,td")]
      .map((cell) => asciiFold(cell.textContent ?? ""))
      .filter(Boolean);

    if (cells.length < 8) continue;
    const vehicle = splitVehicleCell(cells[0]);
    const pl = parsePowerLevel(cells[cells.length - 1]);
    if (!vehicle || !pl) continue;

    const stats = cells.slice(2, 7).map((value) => Number(value));
    if (stats.length !== 5 || stats.some((value) => !Number.isFinite(value))) continue;

    entries.push({
      game,
      href: new URL(link.getAttribute("href"), "https://forza.fandom.com").toString(),
      listName: vehicle.name,
      year: vehicle.year,
      stats: {
        sp: stats[0],
        ha: stats[1],
        ac: stats[2],
        ls: stats[3],
        br: stats[4],
        pl
      }
    });
  }

  return entries.filter((entry) => entry.stats.pl);
}

function extractMeta(document, pageTitle) {
  const infobox = document.querySelector(".portable-infobox")?.textContent ?? "";
  const lines = infobox
    .split("\n")
    .map((line) => asciiFold(line))
    .filter(Boolean);

  const title = asciiFold(pageTitle);
  const productionIndex = lines.findIndex((line) => /\b(19|20)\d{2}\b.+Car/.test(line));
  const productionLine = productionIndex >= 0 ? lines[productionIndex] : "";
  const productionYearMatch = productionLine.match(/(19|20)\d{2}/);
  const manufacturer = productionIndex > 0 ? lines[productionIndex - 1] : title.split(" ")[0] ?? "";
  const country = productionIndex >= 0 ? lines[productionIndex + 1] ?? "" : "";
  const image =
    document.querySelector(".portable-infobox img")?.getAttribute("src") ??
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ??
    "";

  return {
    title,
    manufacturer,
    year: productionYearMatch ? Number(productionYearMatch[0]) : null,
    country: asciiFold(country),
    imageUrl: image
  };
}

async function downloadImage(url, targetBaseName) {
  if (!downloadImages) return "";
  if (!url) return "";
  const parsed = new URL(url);
  const extension = path.extname(parsed.pathname) || ".png";
  const fileName = `${targetBaseName}${extension}`;
  const filePath = path.join(imageDir, fileName);
  const response = await fetch(url);
  if (!response.ok) return "";
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(filePath, buffer);
  return `data/images/${fileName}`;
}

function normalizeName(year, title, manufacturer) {
  let cleanTitle = asciiFold(title.replace(/^['"]|['"]$/g, ""));
  const cleanManufacturer = asciiFold(manufacturer);
  const doubledPrefix = `${cleanManufacturer} ${cleanManufacturer} `;
  if (cleanTitle.toLowerCase().startsWith(doubledPrefix.toLowerCase())) {
    cleanTitle = cleanTitle.slice(cleanManufacturer.length + 1);
  }
  return asciiFold(`${year} ${cleanTitle}`).toLowerCase();
}

function dedupeNewestByName(cards) {
  const byName = new Map();
  for (const card of cards) {
    const existing = byName.get(card.normalizedName);
    if (!existing || gameOrder[card.source.game] > gameOrder[existing.source.game]) {
      byName.set(card.normalizedName, card);
    }
  }
  return [...byName.values()];
}

function dedupeNewestEntriesByHref(entries) {
  const byHref = new Map();
  for (const entry of entries) {
    const existing = byHref.get(entry.href);
    if (!existing || gameOrder[entry.game] > gameOrder[existing.game]) {
      byHref.set(entry.href, entry);
    }
  }
  return [...byHref.values()];
}

async function mapLimit(items, limit, iteratee) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await iteratee(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

function collectMissingSuperTrunfos(cards) {
  return Object.entries(COVER_CARS)
    .filter(([, normalizedName]) => !cards.some((card) => card.normalizedName === normalizedName && card.isSuperTrunfo))
    .map(([game, normalizedName]) => ({ game, normalizedName }));
}

async function buildCatalog() {
  await mkdir(catalogDir, { recursive: true });
  if (downloadImages) {
    await mkdir(imageDir, { recursive: true });
  }

  const allEntries = [];
  const rawCards = [];
  const failures = [];

  for (const listPage of LIST_PAGES) {
    const { document: listDocument } = await fetchWikiDocument(listPage.url);
    const entries = extractListEntries(listDocument, listPage.game);
    allEntries.push(...entries);
  }

  const uniqueEntries = dedupeNewestEntriesByHref(allEntries);
  let completed = 0;

  await mapLimit(uniqueEntries, 12, async (entry) => {
    try {
      const { document: detailDocument, pageTitle } = await fetchWikiDocument(entry.href);
      const meta = extractMeta(detailDocument, pageTitle);
      if (!meta.year || !entry.stats.pl) {
        failures.push({ game: entry.game, href: entry.href, reason: "missing meta or PL" });
        return;
      }

      const normalizedName = normalizeName(meta.year, meta.title, meta.manufacturer);
      const imagePath = await downloadImage(meta.imageUrl, slugify(normalizedName));

      rawCards.push({
        id: slugify(normalizedName),
        normalizedName,
        name: `${meta.year} ${asciiFold(meta.title)}`,
        manufacturer: asciiFold(meta.manufacturer),
        year: meta.year,
        country: meta.country || undefined,
        imageUrl: imagePath ? `/${imagePath.replace(/^data\//, "")}` : meta.imageUrl,
        stats: entry.stats,
        source: {
          game: entry.game,
          carPageUrl: entry.href,
          imageSourceUrl: meta.imageUrl
        },
        isSuperTrunfo: Object.values(COVER_CARS).includes(normalizedName)
      });
    } catch (error) {
      failures.push({
        game: entry.game,
        href: entry.href,
        reason: error instanceof Error ? error.message : "unknown failure"
      });
    } finally {
      completed += 1;
      if (completed % 100 === 0 || completed === uniqueEntries.length) {
        console.log(`Imported ${completed}/${uniqueEntries.length} detail pages...`);
      }
    }
  });

  const cards = dedupeNewestByName(rawCards);
  const missingSuperTrunfos = collectMissingSuperTrunfos(cards);

  return {
    listCount: allEntries.length,
    uniqueEntryCount: uniqueEntries.length,
    rawCount: rawCards.length,
    dedupedCount: cards.length,
    cards,
    failures,
    missingSuperTrunfos,
    requiredSuperTrunfos: COVER_CARS
  };
}

async function main() {
  const result = await buildCatalog();
  if (writeMode && result.missingSuperTrunfos.length > 0) {
    throw new Error(`Missing required Super Trunfo cards: ${result.missingSuperTrunfos.map((entry) => `${entry.game}:${entry.normalizedName}`).join(", ")}`);
  }
  const target = process.argv.includes("--write") ? finalPath : previewPath;
  await writeFile(target, `${JSON.stringify(result.cards, null, 2)}\n`);
  await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`);

  console.log(`Wrote ${result.cards.length} cards to ${target} (${result.rawCount} raw before dedupe)`);
  console.log(`Logged ${result.failures.length} failures to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
