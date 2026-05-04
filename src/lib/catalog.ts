import { access, readFile } from "node:fs/promises";
import path from "node:path";
import type { Card } from "@/domain/cards";
import { validateCompleteCard } from "@/domain/import-validation";

const generatedCatalogPath = path.join(process.cwd(), "data", "catalog", "cards.json");
const sampleCatalogPath = path.join(process.cwd(), "data", "catalog", "cards.sample.json");

async function readCatalogFile(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as Card[];
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

export async function loadCatalogCards() {
  try {
    await access(generatedCatalogPath);
    return assertCatalog(await readCatalogFile(generatedCatalogPath));
  } catch {
    return assertCatalog(await readCatalogFile(sampleCatalogPath));
  }
}
