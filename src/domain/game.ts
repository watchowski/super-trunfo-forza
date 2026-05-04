import type { Card, ComparableStat, Language, PlayerId } from "./cards";

export type RoomPhase = "lobby" | "playing" | "revealed" | "finished";
export type FinishReason = "cards" | "abandonment" | "mutual";

export interface Player {
  id: PlayerId;
  nickname: string;
  language: Language;
  connectedAt: number;
  disconnectedAt?: number;
  wantsToEnd: boolean;
}

export interface RoundResult {
  attribute: ComparableStat;
  hostCard: Card;
  guestCard: Card;
  winner: PlayerId | "tie";
  reason: "attribute" | "super-trunfo" | "super-trunfo-attribute";
  pileSize: number;
}

export interface MatchResult {
  winner: PlayerId | "draw";
  reason: FinishReason;
}

export interface GameState {
  phase: RoomPhase;
  code: string;
  host?: Player;
  guest?: Player;
  activePlayer: PlayerId;
  decks: Record<PlayerId, Card[]>;
  tiePile: Card[];
  lastRound?: RoundResult;
  result?: MatchResult;
  maxDeckSize: number;
  selectedDeckSize: number;
  createdAt: number;
  updatedAt: number;
}
