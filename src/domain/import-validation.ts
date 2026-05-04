import type { Card, PerformanceClass, PowerLevel } from "./cards";

const gameOrder: Record<Card["source"]["game"], number> = {
  FH1: 1,
  FH2: 2,
  FH3: 3,
  FH4: 4,
  FH5: 5,
  FH6: 6
};

const validClasses = new Set<PerformanceClass>(["D", "C", "B", "A", "S1", "S2", "X"]);

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function parsePowerLevel(value: string): PowerLevel | null {
  const match = value.trim().match(/^(D|C|B|A|S1|S2|X)\s+(\d{3,4})$/);
  if (!match) return null;
  const performanceClass = match[1] as PerformanceClass;
  const pi = Number(match[2]);
  if (!validClasses.has(performanceClass) || !Number.isFinite(pi)) return null;
  return { class: performanceClass, pi, label: `${performanceClass} ${pi}` };
}

export function validateCompleteCard(card: Card): ValidationResult {
  if (!card.name.trim()) return { ok: false, reason: "Missing name" };
  if (!card.normalizedName.trim()) return { ok: false, reason: "Missing normalized name" };
  if (!card.imageUrl.trim()) return { ok: false, reason: "Missing image" };
  if (!card.manufacturer.trim()) return { ok: false, reason: "Missing manufacturer" };
  if (!Number.isInteger(card.year)) return { ok: false, reason: "Missing year" };
  for (const key of ["sp", "ha", "ac", "ls", "br"] as const) {
    if (!Number.isFinite(card.stats[key])) return { ok: false, reason: `Invalid ${key.toUpperCase()}` };
  }
  const pl = card.stats.pl;
  if (!validClasses.has(pl.class) || !Number.isFinite(pl.pi) || parsePowerLevel(pl.label) === null) {
    return { ok: false, reason: "Invalid PL" };
  }
  if (!card.source.carPageUrl.trim() || !card.source.imageSourceUrl.trim()) {
    return { ok: false, reason: "Missing source" };
  }
  return { ok: true };
}

export function dedupeNewestByName(cards: Card[]): Card[] {
  const byName = new Map<string, Card>();
  for (const card of cards) {
    const existing = byName.get(card.normalizedName);
    if (!existing || gameOrder[card.source.game] > gameOrder[existing.source.game]) {
      byName.set(card.normalizedName, card);
    }
  }
  return [...byName.values()];
}

export function validateRequiredSuperTrunfos(cards: Card[], requiredNormalizedNames: string[]) {
  for (const name of requiredNormalizedNames) {
    const card = cards.find((candidate) => candidate.normalizedName === name && candidate.isSuperTrunfo);
    if (!card) throw new Error(`Required Super Trunfo is missing: ${name}`);
    const result = validateCompleteCard(card);
    if (!result.ok) throw new Error(`Required Super Trunfo is incomplete: ${name} (${result.reason})`);
  }
}
