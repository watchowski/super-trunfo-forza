import { describe, expect, it } from "vitest";
import { deriveSoundCue } from "@/components/sound-effects";
import { createInitialGame, resolveRound, advanceAfterReveal, setMutualEndRequest } from "@/domain/game-engine";
import type { Card } from "@/domain/cards";
import { createRoom, joinRoom } from "@/lib/room-store";
import { sampleCards } from "@/data/sample-cards";

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

describe("sound effects", () => {
  it("plays a start cue when the match begins", () => {
    const lobby = joinRoom(createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards }), "Leo");
    const playing = createInitialGame({
      code: lobby.code,
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: sampleCards,
      deckSize: lobby.selectedDeckSize,
      seed: "sound-start"
    });

    expect(deriveSoundCue(lobby, playing)).toBe("match-start");
  });

  it("plays a win cue on a non-tie reveal", () => {
    const playing = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: sampleCards.slice(0, 4),
      deckSize: 4,
      seed: "ordered"
    });
    const revealed = resolveRound({ ...playing, activePlayer: "host" }, "sp", "sound-win");

    expect(deriveSoundCue(playing, revealed)).toBe("round-win");
  });

  it("plays a tie cue on a tied reveal", () => {
    const playing = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: [card("h1", 5), card("g1", 5), card("h2", 9), card("g2", 1)],
      deckSize: 4,
      seed: "ordered"
    });
    const revealed = resolveRound({ ...playing, activePlayer: "host" }, "sp", "sound-tie");

    expect(deriveSoundCue(playing, revealed)).toBe("round-tie");
  });

  it("plays an advance cue when the next round starts", () => {
    const playing = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: sampleCards.slice(0, 4),
      deckSize: 4,
      seed: "ordered"
    });
    const revealed = resolveRound({ ...playing, activePlayer: "host" }, "sp", "advance-cue");
    const nextRound = advanceAfterReveal(revealed);

    expect(deriveSoundCue(revealed, nextRound)).toBe("next-round");
  });

  it("plays an end cue when the match finishes", () => {
    const playing = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: sampleCards.slice(0, 4),
      deckSize: 4,
      seed: "ordered"
    });
    const hostRequested = setMutualEndRequest(playing, "host", true);
    const finished = setMutualEndRequest(hostRequested, "guest", true);

    expect(deriveSoundCue(hostRequested, finished)).toBe("match-end");
  });
});
