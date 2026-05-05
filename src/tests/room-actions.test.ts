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

  it("uses explicit end requests instead of toggle state", () => {
    const room = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: sampleCards.slice(0, 4),
      deckSize: 4,
      seed: "ordered"
    });

    const hostRequested = applyRoomAction(room, "host", { type: "set_end_request", enabled: true });
    const cancelled = applyRoomAction(hostRequested, "host", { type: "set_end_request", enabled: false });
    const finished = applyRoomAction(cancelled, "host", { type: "set_end_request", enabled: true });
    const mutual = applyRoomAction(finished, "guest", { type: "set_end_request", enabled: true });

    expect(cancelled.host?.wantsToEnd).toBe(false);
    expect(mutual.phase).toBe("finished");
    expect(mutual.result?.reason).toBe("mutual");
  });

  it("keeps an end request active after the other player resolves a round", () => {
    const room = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: sampleCards.slice(0, 4),
      deckSize: 4,
      seed: "ordered"
    });

    const hostRequested = applyRoomAction(room, "host", { type: "set_end_request", enabled: true });
    const activeViewer = hostRequested.activePlayer;
    const revealed = applyRoomAction(hostRequested, activeViewer, {
      type: "choose_stat",
      stat: "sp",
      seed: "round-after-end-request"
    });

    expect(revealed.host?.wantsToEnd).toBe(true);
    expect(revealed.guest?.wantsToEnd).toBe(false);
  });

  it("keeps an end request active into the next round after reveal is advanced", () => {
    const room = createInitialGame({
      code: "1234",
      hostNickname: "Ana",
      guestNickname: "Leo",
      cards: sampleCards.slice(0, 4),
      deckSize: 4,
      seed: "ordered"
    });

    const hostRequested = applyRoomAction(room, "host", { type: "set_end_request", enabled: true });
    const activeViewer = hostRequested.activePlayer;
    const revealed = applyRoomAction(hostRequested, activeViewer, {
      type: "choose_stat",
      stat: "sp",
      seed: "round-advance-after-end-request"
    });
    const nextRound = applyRoomAction(revealed, "guest", { type: "advance_round" });

    expect(nextRound.phase).toBe("playing");
    expect(nextRound.host?.wantsToEnd).toBe(true);
    expect(nextRound.guest?.wantsToEnd).toBe(false);
  });
});
