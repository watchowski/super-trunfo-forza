import { describe, expect, it } from "vitest";
import { sampleCards } from "@/data/sample-cards";
import { applyRoomAction } from "@/domain/room-actions";
import { createInitialGame } from "@/domain/game-engine";
import { createRoom, joinRoom } from "@/lib/room-store";

describe("room actions", () => {
  it("only lets the host change deck size", () => {
    const room = joinRoom(createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards }), "Leo");
    expect(() => applyRoomAction(room, "guest", { type: "set_deck_size", deckSize: 2 })).toThrow(
      "Only the host can perform this action"
    );
  });

  it("starts a match from the lobby", () => {
    const room = joinRoom(createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards }), "Leo");
    const next = applyRoomAction(room, "host", {
      type: "start_match",
      seed: "test-seed",
      cards: sampleCards
    });
    expect(next.phase).toBe("playing");
    expect(next.decks.host.length + next.decks.guest.length).toBe(room.selectedDeckSize);
  });

  it("requires the active player to choose a stat", () => {
    const room = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: sampleCards.slice(0, 4),
      deckSize: 4,
      seed: "ordered"
    });
    const inactiveViewer = room.activePlayer === "host" ? "guest" : "host";
    expect(() =>
      applyRoomAction(room, inactiveViewer, {
        type: "choose_stat",
        stat: "sp",
        seed: "round-seed"
      })
    ).toThrow("Only the active player can choose an attribute");
  });
});
