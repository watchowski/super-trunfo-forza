import type { PlayerId } from "@/domain/cards";
import type { GameState } from "@/domain/game";

export interface ScoreboardEntry {
  id: PlayerId;
  label: string;
  wins: number;
  isViewer: boolean;
}

export function getNextRoundController(room: GameState): PlayerId | undefined {
  if (room.phase !== "revealed" || !room.lastRound) return undefined;
  return room.lastRound.winner === "tie" ? room.activePlayer : room.lastRound.winner;
}

export function canViewerAdvanceRound(room: GameState, viewer: PlayerId, isPending = false) {
  if (isPending) return false;
  return getNextRoundController(room) === viewer;
}

export function getScoreboardEntries(room: GameState, viewer: PlayerId): ScoreboardEntry[] {
  const ownId = viewer;
  const opponentId: PlayerId = viewer === "host" ? "guest" : "host";

  return [ownId, opponentId].map((id) => ({
    id,
    label: room[id]?.nickname ?? (id === "host" ? "Host" : "Guest"),
    wins: room.roundWins[id],
    isViewer: id === viewer
  }));
}

export function getCarryOverPileSize(room: GameState) {
  if (!room.lastRound || room.phase !== "revealed") return 0;
  if (room.lastRound.winner === "tie") return room.lastRound.pileSize;
  return Math.max(room.lastRound.pileSize - 2, 0);
}
