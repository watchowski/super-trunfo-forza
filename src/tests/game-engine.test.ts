import { describe, expect, it } from "vitest";
import type { Card } from "@/domain/cards";
import {
  advanceAfterReveal,
  createInitialGame,
  requestMutualEnd,
  resolveRound
} from "@/domain/game-engine";

const card = (id: string, sp: number, superTrunfo = false): Card => ({
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
  isSuperTrunfo: superTrunfo
});

describe("game engine", () => {
  it("creates an even split and random active player from a seed", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("a", 1), card("b", 2), card("c", 3), card("d", 4)],
      deckSize: 4,
      seed: "seed-a"
    });

    expect(game.phase).toBe("playing");
    expect(game.decks.host).toHaveLength(2);
    expect(game.decks.guest).toHaveLength(2);
    expect(["host", "guest"]).toContain(game.activePlayer);
  });

  it("rejects odd deck sizes", () => {
    expect(() =>
      createInitialGame({
        code: "1234",
        hostNickname: "Ana",
        guestNickname: "Leo",
        cards: [card("a", 1), card("b", 2), card("c", 3)],
        deckSize: 3,
        seed: "seed-a"
      })
    ).toThrow("Deck size must be even");
  });

  it("resolves a normal attribute win", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("host-top", 9), card("guest-top", 4), card("h2", 1), card("g2", 2)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "win-seed");

    expect(revealed.phase).toBe("revealed");
    expect(revealed.lastRound?.winner).toBe("host");
    expect(revealed.lastRound?.reason).toBe("attribute");
  });

  it("lets Super Trunfo beat a common card regardless of stat", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("super", 1, true), card("common", 10), card("h2", 1), card("g2", 2)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "super-seed");

    expect(revealed.lastRound?.winner).toBe("host");
    expect(revealed.lastRound?.reason).toBe("super-trunfo");
  });

  it("compares attribute when both cards are Super Trunfo", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("super-low", 1, true), card("super-high", 10, true), card("h2", 1), card("g2", 2)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "super-both");

    expect(revealed.lastRound?.winner).toBe("guest");
    expect(revealed.lastRound?.reason).toBe("super-trunfo-attribute");
  });

  it("keeps active player and accumulates pile on tie", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("h1", 5), card("g1", 5), card("h2", 9), card("g2", 1)],
      deckSize: 4,
      seed: "ordered"
    });

    const revealed = resolveRound({ ...game, activePlayer: "host" }, "sp", "tie-seed");
    const next = advanceAfterReveal(revealed);

    expect(revealed.lastRound?.winner).toBe("tie");
    expect(next.phase).toBe("playing");
    expect(next.activePlayer).toBe("host");
    expect(next.tiePile).toHaveLength(2);
  });

  it("ends by mutual agreement with draw on equal card counts", () => {
    const game = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("a", 1), card("b", 2), card("c", 3), card("d", 4)],
      deckSize: 4,
      seed: "ordered"
    });

    const hostRequested = requestMutualEnd(game, "host");
    const finished = requestMutualEnd(hostRequested, "guest");

    expect(finished.phase).toBe("finished");
    expect(finished.result).toEqual({ winner: "draw", reason: "mutual" });
  });
});
