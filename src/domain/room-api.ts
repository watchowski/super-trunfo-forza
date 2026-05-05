import type { ComparableStat, PlayerId } from "./cards";
import type { GameState } from "./game";

export interface RoomSession {
  code: string;
  viewer: PlayerId;
  sessionId: string;
  nickname: string;
}

export interface RoomSnapshot {
  room: GameState;
  viewer?: PlayerId;
  canJoin: boolean;
  isRealtime: boolean;
}

export interface CreateRoomRequest {
  nickname: string;
}

export interface JoinRoomRequest {
  code: string;
  nickname: string;
}

export type ActionRequest =
  | { sessionId: string; action: "set_deck_size"; deckSize: number }
  | { sessionId: string; action: "kick_guest" }
  | { sessionId: string; action: "start_match" }
  | { sessionId: string; action: "choose_stat"; stat: ComparableStat }
  | { sessionId: string; action: "advance_round" }
  | { sessionId: string; action: "set_end_request"; enabled: boolean }
  | { sessionId: string; action: "rematch" }
  | { sessionId: string; action: "heartbeat" };

export interface RoomMutationResponse {
  snapshot: RoomSnapshot;
  session?: RoomSession;
}
