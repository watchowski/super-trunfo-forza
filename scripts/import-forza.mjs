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

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePowerLevel(value) {
  const match = normalizeWhitespace(value).match(/^(D|C|B|A|S1|S2|X|R)\s+(\d{3,4})$/);
  if (!match) return null;
  return { class: match[1], pi: Number(match[2]), label: `${match[1]} ${Number(match[2])}` };
}

function createDom(html) {
  return new JSDOM(html).window.document;
}

async function fetchDocument(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "super-trunfo-importer/0.1"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return createDom(await response.text());
}

function extractListEntries(document, game) {
  const rows = [...document.querySelectorAll("tr")];
  const entries = [];

  for (const row of rows) {
    const link = row.querySelector('a[href^="/wiki/"]');
    if (!link) continue;
    const rowText = normalizeWhitespace(row.textContent ?? "");
    if (!/\b(19|20)\d{2}\b/.test(rowText)) continue;
    const matches = [...rowText.matchAll(/\b\d+(?:\.\d+)?\b/g)].map((match) => Number(match[0]));
    const plMatch = rowText.match(/\b(D|C|B|A|S1|S2|X|R)\s+\d{3,4}\b/);
    if (matches.length < 5 || !plMatch) continue;

    const yearMatch = rowText.match(/\b(19|20)\d{2}\b/);
    if (!yearMatch) continue;

    entries.push({
      game,
      href: new URL(link.getAttribute("href"), "https://forza.fandom.com").toString(),
      listText: rowText,
      listName: normalizeWhitespace(link.textContent ?? ""),
      year: Number(yearMatch[0]),
      stats: {
        sp: matches[matches.length - 7],
        ha: matches[matches.length - 6],
        ac: matches[matches.length - 5],
        ls: matches[matches.length - 4],
        br: matches[matches.length - 3],
        pl: parsePowerLevel(plMatch[0])
      }
    });
  }

  return entries.filter((entry) => entry.stats.pl);
}

function extractMeta(document) {
  const infobox = document.querySelector(".portable-infobox")?.textContent ?? "";
  const lines = infobox
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const title = normalizeWhitespace(
    document.querySelector(".mw-page-title-main")?.textContent ??
      document.querySelector("h1")?.textContent ??
      ""
  );
  const manufacturer = lines[0] ?? title.split(" ").slice(0, 1).join(" ");
  const yearMatch = infobox.match(/\b(19|20)\d{2}\b/);
  const country = lines.find((line) => /^[A-Z][A-Za-z .'-]+$/.test(line) && line !== manufacturer && !line.includes("Car")) ?? "";
  const image =
    document.querySelector(".portable-infobox img")?.getAttribute("src") ??
    document.querySelector('meta[property="og:image"]')?.getAttribute("content") ??
    "";

  return {
    title,
    manufacturer,
    year: yearMatch ? Number(yearMatch[0]) : null,
    country,
    imageUrl: image
  };
}

async function downloadImage(url, targetBaseName) {
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

function normalizeName(year, title) {
  const cleanTitle = normalizeWhitespace(title.replace(/^['"]|['"]$/g, ""));
  return normalizeWhitespace(`${year} ${cleanTitle}`).toLowerCase();
}

async function buildCatalog() {
  await mkdir(catalogDir, { recursive: true });
  await mkdir(imageDir, { recursive: true });

  const cards = [];
  const failures = [];

  for (const listPage of LIST_PAGES) {
    const listDocument = await fetchDocument(listPage.url);
    const entries = extractListEntries(listDocument, listPage.game);

    for (const entry of entries) {
      try {
        const detailDocument = await fetchDocument(entry.href);
        const meta = extractMeta(detailDocument);
        if (!meta.year || !entry.stats.pl) {
          failures.push({ game: listPage.game, href: entry.href, reason: "missing meta or PL" });
          continue;
        }

        const normalizedName = normalizeName(meta.year, meta.title);
        const imagePath = await downloadImage(meta.imageUrl, slugify(normalizedName));

        cards.push({
          id: slugify(normalizedName),
          normalizedName,
          name: `${meta.year} ${meta.title}`,
          manufacturer: meta.manufacturer,
          year: meta.year,
          country: meta.country || undefined,
          imageUrl: imagePath ? `/${imagePath.replace(/^data\//, "")}` : "",
          stats: entry.stats,
          source: {
            game: listPage.game,
            carPageUrl: entry.href,
            imageSourceUrl: meta.imageUrl
          },
          isSuperTrunfo: Object.values(COVER_CARS).includes(normalizedName)
        });
      } catch (error) {
        failures.push({
          game: listPage.game,
          href: entry.href,
          reason: error instanceof Error ? error.message : "unknown failure"
        });
      }
    }
  }

  return {
    cards,
    failures,
    requiredSuperTrunfos: COVER_CARS
  };
}

async function main() {
  const result = await buildCatalog();
  const target = process.argv.includes("--write") ? finalPath : previewPath;
  await writeFile(target, `${JSON.stringify(result.cards, null, 2)}\n`);
  await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`);

  console.log(`Wrote ${result.cards.length} cards to ${target}`);
  console.log(`Logged ${result.failures.length} failures to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
