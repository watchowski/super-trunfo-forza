"use client";

import type { Language, PlayerId } from "@/domain/cards";
import type { GameState } from "@/domain/game";
import { getScoreboardEntries } from "./game-view-state";

export function ResultView({
  room,
  viewer,
  language,
  isPending,
  pendingLabel,
  onRematch
}: {
  room: GameState;
  viewer: PlayerId;
  language: Language;
  isPending?: boolean;
  pendingLabel?: string | null;
  onRematch: () => void;
}) {
  const isPt = language === "pt-BR";
  const scoreboardEntries = getScoreboardEntries(room, viewer);
  const winner =
    room.result?.winner === "draw"
      ? isPt
        ? "Empate"
        : "Draw"
      : room[room.result?.winner ?? "host"]?.nickname;

  const reasonMap = {
    cards: isPt ? "fim do baralho" : "deck exhausted",
    abandonment: isPt ? "abandono" : "abandonment",
    mutual: isPt ? "acordo mutuo" : "mutual agreement"
  } as const;

  return (
    <section className="panel resultPanel">
      <p className="eyebrow">{isPt ? "Resultado" : "Result"}</p>
      <h1>{winner}</h1>
      <p>
        {isPt ? "Motivo" : "Reason"}: {room.result ? reasonMap[room.result.reason] : "-"}
      </p>
      <div className="scoreboard resultScoreboard" aria-label={isPt ? "Placar final de rodadas" : "Final round scoreboard"}>
        {scoreboardEntries.map((entry) => (
          <div className={entry.isViewer ? "scoreTile scoreTileViewer" : "scoreTile"} key={entry.id}>
            <span>{entry.label}</span>
            <strong>{entry.wins}</strong>
          </div>
        ))}
      </div>
      {pendingLabel && (
        <div className="inlineLoading" role="status" aria-live="polite">
          <span className="loadingSpinner" aria-hidden="true" />
          <span>{pendingLabel}</span>
        </div>
      )}
      <button className="primaryButton" type="button" onClick={onRematch} disabled={isPending}>
        {isPending ? (isPt ? "Aguarde..." : "Please wait...") : isPt ? "Revanche" : "Rematch"}
      </button>
    </section>
  );
}
