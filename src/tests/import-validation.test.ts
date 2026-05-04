import { describe, expect, it } from "vitest";
import type { Card } from "@/domain/cards";
import {
  dedupeNewestByName,
  parsePowerLevel,
  validateCompleteCard,
  validateRequiredSuperTrunfos
} from "@/domain/import-validation";
import { sampleCards } from "@/data/sample-cards";

describe("import validation", () => {
  it("parses class and PI from expected PL labels", () => {
    expect(parsePowerLevel("S1 900")).toEqual({ class: "S1", pi: 900, label: "S1 900" });
    expect(parsePowerLevel("A 718")).toEqual({ class: "A", pi: 718, label: "A 718" });
  });

  it("rejects invalid PL labels", () => {
    expect(parsePowerLevel("900")).toBeNull();
    expect(parsePowerLevel("S3 900")).toBeNull();
  });

  it("validates complete cards", () => {
    expect(validateCompleteCard(sampleCards[0]).ok).toBe(true);
  });

  it("rejects cards without a usable PL", () => {
    const broken: Card = {
      ...sampleCards[0],
      stats: { ...sampleCards[0].stats, pl: { class: "S1", pi: Number.NaN, label: "bad" } }
    };
    expect(validateCompleteCard(broken)).toEqual({ ok: false, reason: "Invalid PL" });
  });

  it("keeps variants with different normalized names", () => {
    const focus = sampleCards.find((card) => card.id === "2017-ford-focus-rs")!;
    const rx = sampleCards.find((card) => card.id === "2016-ford-focus-rs-rx")!;
    const deduped = dedupeNewestByName([focus, rx]);
    expect(deduped.map((card) => card.id).sort()).toEqual(["2016-ford-focus-rs-rx", "2017-ford-focus-rs"]);
  });

  it("uses newest game for exact normalized duplicate", () => {
    const oldCard: Card = { ...sampleCards[0], source: { ...sampleCards[0].source, game: "FH3" } };
    const newCard: Card = { ...sampleCards[0], id: "newer", source: { ...sampleCards[0].source, game: "FH5" } };
    expect(dedupeNewestByName([oldCard, newCard])[0].id).toBe("newer");
  });

  it("fails when a required Super Trunfo is incomplete", () => {
    const broken = { ...sampleCards[0], imageUrl: "" };
    expect(() => validateRequiredSuperTrunfos([broken], [broken.normalizedName])).toThrow("Required Super Trunfo is incomplete");
  });
});
