import type { ComparableStat, PlayerId } from "./cards";
import type { GameState } from "./game";
import { advanceAfterReveal, createInitialGame, setMutualEndRequest, resolveRound } from "./game-engine";
import type { Card } from "./cards";
import { kickGuest } from "@/lib/room-store";

export type RoomAction =
  | { type: "set_deck_size"; deckSize: number }
  | { type: "kick_guest" }
  | { type: "start_match"; seed: string; cards: Card[] }
  | { type: "choose_stat"; stat: ComparableStat; seed: string }
  | { type: "advance_round" }
  | { type: "set_end_request"; enabled: boolean }
  | { type: "rematch"; seed: string; cards: Card[] };

function assertHost(viewer: PlayerId) {
  if (viewer !== "host") {
    throw new Error("Only the host can perform this action");
  }
}

export function applyRoomAction(room: GameState, viewer: PlayerId, action: RoomAction): GameState {
  switch (action.type) {
    case "set_deck_size":
      assertHost(viewer);
      if (room.phase !== "lobby") throw new Error("Deck size can only be changed in the lobby");
      if (action.deckSize % 2 !== 0) throw new Error("Deck size must be even");
      if (action.deckSize < 2 || action.deckSize > room.maxDeckSize) {
        throw new Error("Deck size is out of range");
      }
      return { ...room, selectedDeckSize: action.deckSize, updatedAt: Date.now() };
    case "kick_guest":
      assertHost(viewer);
      return kickGuest(room);
    case "start_match":
      assertHost(viewer);
      if (!room.host || !room.guest) throw new Error("Two players are required to start");
      return createInitialGame({
        code: room.code,
        hostNickname: room.host.nickname,
        guestNickname: room.guest.nickname,
        cards: action.cards,
        deckSize: room.selectedDeckSize,
        seed: action.seed
      });
    case "choose_stat":
      if (room.activePlayer !== viewer) throw new Error("Only the active player can choose an attribute");
      return resolveRound(room, action.stat, action.seed);
    case "advance_round":
      return advanceAfterReveal(room);
    case "set_end_request":
      return setMutualEndRequest(room, viewer, action.enabled);
    case "rematch":
      assertHost(viewer);
      if (!room.host || !room.guest) throw new Error("Two players are required to start a rematch");
      return createInitialGame({
        code: room.code,
        hostNickname: room.host.nickname,
        guestNickname: room.guest.nickname,
        cards: action.cards,
        deckSize: room.selectedDeckSize,
        seed: action.seed
      });
    default:
      return room;
  }
}
