import type { GameState } from "@/domain/game";

export type SoundCue = "match-start" | "round-win" | "round-tie" | "next-round" | "match-end";

export function deriveSoundCue(previous: GameState | null | undefined, current: GameState): SoundCue | undefined {
  if (!previous) return undefined;

  if (previous.phase === "lobby" && current.phase === "playing") {
    return "match-start";
  }

  const roundChanged =
    previous.lastRound?.attribute !== current.lastRound?.attribute ||
    previous.lastRound?.hostCard.id !== current.lastRound?.hostCard.id ||
    previous.lastRound?.guestCard.id !== current.lastRound?.guestCard.id;

  if (current.phase === "revealed" && (previous.phase !== "revealed" || roundChanged)) {
    return current.lastRound?.winner === "tie" ? "round-tie" : "round-win";
  }

  if (previous.phase === "revealed" && current.phase === "playing") {
    return "next-round";
  }

  if (previous.phase !== "finished" && current.phase === "finished") {
    return "match-end";
  }

  return undefined;
}
