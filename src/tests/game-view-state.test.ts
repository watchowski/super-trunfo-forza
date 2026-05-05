import { describe, expect, it } from "vitest";
import { getScoreboardEntries, getNextRoundController, canViewerAdvanceRound, getCarryOverPileSize } from "@/components/game-view-state";
import { advanceAfterReveal, createInitialGame, resolveRound } from "@/domain/game-engine";
import type { Card } from "@/domain/cards";

const card = (id: string, sp: number): Card => ({
  id,
  normalizedName: id,
  name: id,
  manufacturer: "Test",
  year: 2024,
  imageUrl: "/test.png",
  stats: {
    sp,
    ha: sp,
    ac: sp,
    ls: sp,
    br: sp,
    pl: { class: "A", pi: 700, label: "A 700" }
  },
  source: { game: "FH5", carPageUrl: "https://example.com/car", imageSourceUrl: "https://example.com/image.png" },
  isSuperTrunfo: false
});

describe("game view state", () => {
  it("lets only the round winner advance after a normal reveal", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("host-top", 9), card("guest-top", 4), card("h2", 1), card("g2", 2)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "winner-advance");

    expect(getNextRoundController(revealed)).toBe("host");
    expect(canViewerAdvanceRound(revealed, "host")).toBe(true);
    expect(canViewerAdvanceRound(revealed, "guest")).toBe(false);
  });

  it("keeps the chooser as the next-round controller after a tie", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("h1", 5), card("g1", 5), card("h2", 9), card("g2", 1)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "tie-advance");

    expect(getNextRoundController(revealed)).toBe("host");
    expect(canViewerAdvanceRound(revealed, "host")).toBe(true);
    expect(canViewerAdvanceRound(revealed, "guest")).toBe(false);
  });

  it("orders the scoreboard with the viewer first", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("a", 1), card("b", 2), card("c", 3), card("d", 4)],
      deckSize: 4,
      seed: "ordered"
    });

    const hostEntries = getScoreboardEntries(game, "host");
    const guestEntries = getScoreboardEntries(game, "guest");

    expect(hostEntries.map((entry) => entry.id)).toEqual(["host", "guest"]);
    expect(guestEntries.map((entry) => entry.id)).toEqual(["guest", "host"]);
    expect(guestEntries[0]?.label).toBe("Leo");
  });

  it("shows zero carry-over on a winning round without previous ties", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("host-top", 9), card("guest-top", 4), card("h2", 1), card("g2", 2)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "carryover-none");

    expect(getCarryOverPileSize(revealed)).toBe(0);
  });

  it("shows only the carried-over pile on a winning round after a tie", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("h1", 5), card("g1", 5), card("h2", 9), card("g2", 1)],
      deckSize: 4,
      seed: "ordered"
    });

    const tied = resolveRound({ ...game, activePlayer: "host" }, "sp", "carryover-tie");
    const nextRound = advanceAfterReveal(tied);
    const winning = resolveRound(nextRound, "sp", "carryover-win");

    expect(winning.lastRound?.pileSize).toBe(4);
    expect(getCarryOverPileSize(winning)).toBe(2);
  });
});
